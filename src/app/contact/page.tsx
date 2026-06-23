"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Header from "@/components/Header";
import Popup from "@/components/Popup";

export default function ContactPage() {
  const supabase = createClient();
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Form Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validatedFields, setValidatedFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (prof) {
          setCurrentUserProfile(prof);
          setName(`${prof.first_name} ${prof.last_name}`);
          setEmail(prof.email);
        }
      }
    };
    fetchSession();
  }, [supabase]);

  const validateField = (fieldName: string, value: string): string => {
    if (fieldName === "name") {
      if (!value.trim()) return "Please enter your name.";
      if (value.trim().length < 2) return "Name must be at least 2 characters.";
      return "";
    }
    if (fieldName === "email") {
      if (!value.trim()) return "Please enter your email.";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) return "Please enter a valid email address.";
      return "";
    }
    if (fieldName === "subject") {
      if (!value.trim()) return "Please enter a subject.";
      if (value.trim().length < 5) return "Subject must be at least 5 characters.";
      return "";
    }
    if (fieldName === "message") {
      if (!value.trim()) return "Please enter your message.";
      if (value.trim().length < 15) return `Message must be at least 15 characters. (Current: ${value.trim().length}/600)`;
      if (value.trim().length > 600) return `Message cannot exceed 600 characters. (Current: ${value.trim().length}/600)`;
      return "";
    }
    return "";
  };

  const handleInputChange = (fieldName: string, value: string) => {
    if (fieldName === "name") setName(value);
    if (fieldName === "email") setEmail(value);
    if (fieldName === "subject") setSubject(value);
    if (fieldName === "message") setMessage(value);

    if (validatedFields[fieldName]) {
      const err = validateField(fieldName, value);
      setErrors((prev) => ({ ...prev, [fieldName]: err }));
    }
  };

  const handleBlur = (fieldName: string, value: string) => {
    setValidatedFields((prev) => ({ ...prev, [fieldName]: true }));
    const err = validateField(fieldName, value);
    setErrors((prev) => ({ ...prev, [fieldName]: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formFields = ["name", "email", "subject", "message"];
    const formVals = { name, email, subject, message };
    const newErrors: Record<string, string> = {};

    formFields.forEach((field) => {
      const err = validateField(field, (formVals as any)[field]);
      if (err) newErrors[field] = err;
    });

    setValidatedFields({
      name: true,
      email: true,
      subject: true,
      message: true
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Save contact submission inside system_logs table
      const { error } = await supabase.from("system_logs").insert({
        actor_id: currentUserProfile?.id || null,
        actor_email: email.trim(),
        action: "contact_form_submission",
        details: {
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          submitted_at: new Date().toISOString()
        }
      });

      if (error) {
        setPopup({ message: "Failed to submit inquiry: " + error.message, type: "error" });
      } else {
        setPopup({
          message: "Thank you! Your inquiry was sent successfully. Our support team will get in touch shortly.",
          type: "success"
        });
        
        // Reset form except name/email if user is logged in
        setSubject("");
        setMessage("");
        setValidatedFields({});
        setErrors({});
      }
    } catch (err: any) {
      setPopup({ message: "An error occurred: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <Header profile={currentUserProfile} activeWorkspace="info" workspaceTitle="Cala Help Desk" />

      <main style={{ padding: "48px 24px", flex: 1, display: "flex", justifyContent: "center" }}>
        <div className="container" style={{ maxWidth: "600px" }}>
          
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-0.5px" }}>Contact Support</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginTop: "8px" }}>
              Submit an inquiry to the Cala administration and support team.
            </p>
          </div>

          <div className="card" style={{ padding: "36px" }}>
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className={`form-input ${validatedFields.name ? (errors.name ? "is-invalid" : "is-valid") : ""}`}
                  value={name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  onBlur={(e) => handleBlur("name", e.target.value)}
                  required
                />
                {validatedFields.name && errors.name && (
                  <span className="form-error">{errors.name}</span>
                )}
              </div>

              {/* Email */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className={`form-input ${validatedFields.email ? (errors.email ? "is-invalid" : "is-valid") : ""}`}
                  value={email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={(e) => handleBlur("email", e.target.value)}
                  required
                />
                {validatedFields.email && errors.email && (
                  <span className="form-error">{errors.email}</span>
                )}
              </div>

              {/* Subject */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  placeholder="How can we help you?"
                  className={`form-input ${validatedFields.subject ? (errors.subject ? "is-invalid" : "is-valid") : ""}`}
                  value={subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  onBlur={(e) => handleBlur("subject", e.target.value)}
                  required
                />
                {validatedFields.subject && errors.subject && (
                  <span className="form-error">{errors.subject}</span>
                )}
              </div>

              {/* Message */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Message Details</label>
                <div className="textarea-container">
                  <textarea
                    placeholder="Provide clear details about your issue or question (min 15, max 600 characters)..."
                    className={`form-input ${validatedFields.message ? (errors.message ? "is-invalid" : "is-valid") : ""}`}
                    style={{ minHeight: "150px", resize: "vertical", padding: "10px" }}
                    value={message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    onBlur={(e) => handleBlur("message", e.target.value)}
                    maxLength={600}
                    required
                  />
                  <span className="textarea-counter">
                    {message.length}/600
                  </span>
                </div>
                {validatedFields.message && errors.message && (
                  <span className="form-error">{errors.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: "700", marginTop: "12px" }}
              >
                {loading ? "Sending Inquiry..." : "Submit Inquiry"}
              </button>

            </form>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Cala Freelance Marketplace. All rights reserved.</p>
        </div>
      </footer>

      {popup && (
        <Popup
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup(null)}
        />
      )}
    </>
  );
}
