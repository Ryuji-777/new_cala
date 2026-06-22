"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agree: false,
  });

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validatedFields, setValidatedFields] = useState<Record<string, boolean>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Show/Hide Password State
  const [showPassword, setShowPassword] = useState(false);

  // Redirect logged-in users away from the signup page
  useEffect(() => {
    const checkActiveSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("screen_name, is_freelancer, is_client, is_admin, is_super_admin")
          .eq("id", user.id)
          .single();

        if (!profileData || !profileData.screen_name) {
          router.replace("/profile/setup");
        } else if (profileData.is_admin || profileData.is_super_admin) {
          router.replace("/admin/dashboard");
        } else {
          if (profileData.is_freelancer) {
            router.replace("/freelancer/dashboard");
          } else {
            router.replace("/client/dashboard");
          }
        }
      }
    };
    checkActiveSession();
  }, [supabase, router]);

  // Validation Logic
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case "firstName":
        if (!value.trim()) return "First name is required.";
        if (/\d/.test(value)) return "First name cannot contain numbers.";
        return "";
      case "lastName":
        if (!value.trim()) return "Last name is required.";
        if (/\d/.test(value)) return "Last name cannot contain numbers.";
        return "";
      case "email":
        if (!value.trim()) return "Email is required.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email address.";
        return "";
      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter.";
        if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter.";
        // Special characters check
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]]/;
        if (!specialCharRegex.test(value)) return "Password must contain at least one special character.";
        return "";
      case "agree":
        if (!value) return "You must agree to the Terms of Service.";
        return "";
      default:
        return "";
    }
  };

  // Run validation on value change to update error messages silently
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const val = formData[key as keyof typeof formData];
      const errorMsg = validateField(key, val);
      if (errorMsg) {
        newErrors[key] = errorMsg;
      }
    });
    setErrors(newErrors);
  }, [formData]);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Blur Trigger
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setActiveField(null);
    setValidatedFields((prev) => ({ ...prev, [name]: true }));
  };

  // Focus Trigger (neutral outline while typing)
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setActiveField(name);
  };

  // Get input class names based on validation rules
  const getInputClass = (fieldName: string) => {
    const baseClass = "form-input";
    
    // While user is typing (focused), outline is neutral (no color change)
    if (activeField === fieldName) {
      return baseClass;
    }
    
    // If validation has run once for this field
    if (validatedFields[fieldName]) {
      return errors[fieldName] ? `${baseClass} is-invalid` : `${baseClass} is-valid`;
    }
    
    return baseClass;
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Trigger validation for all fields
    const allValidated: Record<string, boolean> = {};
    const finalErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach((key) => {
      allValidated[key] = true;
      const val = formData[key as keyof typeof formData];
      const errorMsg = validateField(key, val);
      if (errorMsg) {
        finalErrors[key] = errorMsg;
      }
    });
    
    setValidatedFields(allValidated);
    setErrors(finalErrors);

    // If there are errors, stop
    if (Object.keys(finalErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setSubmitError(error.message);
      } else {
        setSubmitSuccess(true);
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          agree: false,
        });
        setValidatedFields({});
      }
    } catch (err: any) {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header Navigation */}
      <header className="header">
        <div className="container header-container">
          <Link href="/" className="logo">
            <div className="logo-icon">C</div>
            Cala
          </Link>
        </div>
      </header>

      {/* Main Signup Form Container */}
      <main style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px 24px", flex: 1 }}>
        <div className="card" style={{ width: "100%", maxWidth: "450px", padding: "32px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)" }}>
          
          <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px", textAlign: "center" }}>Create your Account</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px", textAlign: "center" }}>
            Join Cala to collaborate with clients and work with top talent.
          </p>

          {submitError && (
            <div style={{ 
              backgroundColor: "var(--error-bg)", 
              border: "1px solid var(--error-border)", 
              color: "var(--error-color)", 
              padding: "12px", 
              borderRadius: "var(--radius-sm)", 
              fontSize: "14px", 
              marginBottom: "20px" 
            }}>
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div style={{ 
              backgroundColor: "var(--success-bg)", 
              border: "1px solid var(--success-border)", 
              color: "var(--success-color)", 
              padding: "16px", 
              borderRadius: "var(--radius-sm)", 
              fontSize: "14px", 
              marginBottom: "20px" 
            }}>
              <strong>Registration successful!</strong><br />
              Please check your email to verify your account, then log in.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            
            {/* First Name & Last Name in row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className={getInputClass("firstName")}
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  required
                />
                {validatedFields.firstName && errors.firstName && (
                  <span className="form-error">{errors.firstName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className={getInputClass("lastName")}
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  required
                />
                {validatedFields.lastName && errors.lastName && (
                  <span className="form-error">{errors.lastName}</span>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className={getInputClass("email")}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                required
              />
              {validatedFields.email && errors.email && (
                <span className="form-error">{errors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={getInputClass("password")}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  style={{ width: "100%", paddingRight: "40px" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px"
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {validatedFields.password && errors.password && (
                <span className="form-error">{errors.password}</span>
              )}
            </div>

            {/* Checkbox Terms & Conditions */}
            <div className="form-group" style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "24px" }}>
              <input
                id="agree"
                name="agree"
                type="checkbox"
                style={{ width: "16px", height: "16px", marginTop: "3px", cursor: "pointer" }}
                checked={formData.agree}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label htmlFor="agree" style={{ fontSize: "13px", color: "var(--text-primary)", cursor: "pointer" }}>
                  I agree to the Terms of Service and Privacy Policy.
                </label>
                {validatedFields.agree && errors.agree && (
                  <span className="form-error" style={{ marginTop: "2px" }}>{errors.agree}</span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>

            <div style={{ textAlign: "center", marginTop: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--primary-color)", fontWeight: "600" }}>
                Log in
              </Link>
            </div>

          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Cala Freelance Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
