"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validatedFields, setValidatedFields] = useState<Record<string, boolean>>({});
  const [activeField, setActiveField] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation Logic
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "email":
        if (!value.trim()) return "Email is required.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email address.";
        return "";
      case "password":
        if (!value) return "Password is required.";
        return "";
      default:
        return "";
    }
  };

  // Run validation on value change to update error messages silently
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      if (key !== "rememberMe") {
        const val = formData[key as keyof typeof formData] as string;
        const errorMsg = validateField(key, val);
        if (errorMsg) {
          newErrors[key] = errorMsg;
        }
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
      if (key !== "rememberMe") {
        allValidated[key] = true;
        const val = formData[key as keyof typeof formData] as string;
        const errorMsg = validateField(key, val);
        if (errorMsg) {
          finalErrors[key] = errorMsg;
        }
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
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        setSubmitError(authError.message);
        setIsSubmitting(false);
        return;
      }

      if (authData.user) {
        // Fetch profile to check if setup is completed
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("screen_name, is_freelancer, is_client, is_admin, is_super_admin")
          .eq("id", authData.user.id)
          .single();

        if (profileError || !profileData) {
          router.push("/profile/setup");
        } else if (profileData.is_admin || profileData.is_super_admin) {
          // Admins and Super Admins bypass onboarding
          router.push("/admin/dashboard");
        } else if (!profileData.screen_name) {
          // Regular members must set up profile screen name first
          router.push("/profile/setup");
        } else {
          // Redirect to appropriate workspace
          if (profileData.is_freelancer) {
            router.push("/freelancer/dashboard");
          } else {
            router.push("/client/dashboard");
          }
        }
        router.refresh();
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

      {/* Main Login Form Container */}
      <main style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px 24px", flex: 1 }}>
        <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "32px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)" }}>
          
          <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px", textAlign: "center" }}>Log in to Cala</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px", textAlign: "center" }}>
            Welcome back! Please enter your details.
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

          <form onSubmit={handleSubmit} noValidate>
            
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
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className={getInputClass("password")}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                required
              />
              {validatedFields.password && errors.password && (
                <span className="form-error">{errors.password}</span>
              )}
            </div>

            {/* Remember Me checkbox */}
            <div className="form-group" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", color: "var(--text-primary)", cursor: "pointer" }}>
                <input
                  name="rememberMe"
                  type="checkbox"
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Log In"}
            </button>

            <div style={{ textAlign: "center", marginTop: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
              New to Cala?{" "}
              <Link href="/signup" style={{ color: "var(--primary-color)", fontWeight: "600" }}>
                Sign up
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
