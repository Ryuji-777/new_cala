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

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Show/Hide Password State
  const [showPassword, setShowPassword] = useState(false);

  // Redirect logged-in users away from the login page
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
          router.replace("/profile/setup");
        } else if (profileData.is_admin || profileData.is_super_admin) {
          // Admins and Super Admins bypass onboarding
          router.replace("/admin/dashboard");
        } else if (!profileData.screen_name) {
          // Regular members must set up profile screen name first
          router.replace("/profile/setup");
        } else {
          // Redirect to appropriate workspace
          if (profileData.is_freelancer) {
            router.replace("/freelancer/dashboard");
          } else {
            router.replace("/client/dashboard");
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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(false);

    if (!forgotEmail.trim()) {
      setForgotError("Email address is required.");
      return;
    }

    setForgotSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile/change-password`,
      });
      if (error) {
        setForgotError(error.message);
      } else {
        setForgotSuccess(true);
      }
    } catch (err: any) {
      setForgotError("An unexpected error occurred. Please try again.");
    } finally {
      setForgotSubmitting(false);
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

            {/* Remember Me checkbox & Forgot Password */}
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
              <button
                type="button"
                onClick={() => {
                  setForgotEmail("");
                  setForgotError(null);
                  setForgotSuccess(false);
                  setShowForgotModal(true);
                }}
                style={{ background: "none", border: "none", color: "var(--primary-color)", fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: 0 }}
              >
                Forgot password?
              </button>
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

      {showForgotModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
          <div className="card" style={{ width: "100%", maxWidth: "420px", backgroundColor: "#fff", padding: "32px", borderRadius: "var(--radius-md)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>Reset Password</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Enter the email address linked to your account. We will send you a password reset link to change your password.
            </p>

            {forgotError && (
              <div style={{ backgroundColor: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error-color)", padding: "10px", fontSize: "13px", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
                {forgotError}
              </div>
            )}

            {forgotSuccess ? (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ backgroundColor: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success-color)", padding: "12px", fontSize: "13px", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
                  Please check your email address inbox to change your password.
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowForgotModal(false)} 
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit}>
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label className="form-label" htmlFor="forgotEmail">Email Address</label>
                  <input
                    id="forgotEmail"
                    type="email"
                    className="form-input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotModal(false)} 
                    className="btn btn-outline"
                    disabled={forgotSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={forgotSubmitting}
                  >
                    {forgotSubmitting ? "Sending..." : "Continue"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
