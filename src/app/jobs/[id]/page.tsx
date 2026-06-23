"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Popup from "@/components/Popup";
import Header from "@/components/Header";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: PageProps) {
  const router = useRouter();
  const supabase = createClient();
  const { id: jobId } = use(params);

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  // Popup modal state
  const [popup, setPopup] = useState<{ message: string; type: "success" | "error" | "info"; onClose?: () => void } | null>(null);

  // Reporting state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);

  const [job, setJob] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [completedHires, setCompletedHires] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Application flow state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Proposal input validations (typing outlines neutral, validation red/green on blur/submit)
  const [coverLetterFieldError, setCoverLetterFieldError] = useState("");
  const [coverLetterFieldActive, setCoverLetterFieldActive] = useState(false);
  const [coverLetterFieldValidated, setCoverLetterFieldValidated] = useState(false);

  const loadJobData = async () => {
    setIsLoading(true);

    // 1. Get logged in user info
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: cProf } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (cProf) setCurrentUserProfile(cProf);

      // Check if already applied
      const { data: appData } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("freelancer_id", user.id)
        .maybeSingle();
      if (appData) setHasApplied(true);
    }

    // 2. Fetch job info with client profile join
    const { data: jobData, error } = await supabase
      .from("jobs")
      .select("*, client:profiles(*)")
      .eq("id", jobId)
      .single();

    if (error || !jobData) {
      setErrorMsg("The requested job posting was not found or does not exist.");
      setIsLoading(false);
      return;
    }

    setJob(jobData);
    setClientProfile(jobData.client);

    const cId = jobData.client_id;

    // 3. Fetch client spent (sum of payments where sender is client)
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("amount")
      .eq("sender_id", cId);
    if (paymentsData) {
      const total = paymentsData.reduce((acc, curr) => acc + Number(curr.amount), 0);
      setTotalSpent(total);
    }

    // 4. Fetch client completed hires count
    const { data: contractsData } = await supabase
      .from("contracts")
      .select("id")
      .eq("client_id", cId)
      .eq("status", "completed");
    if (contractsData) {
      setCompletedHires(contractsData.length);
    }

    // 5. Fetch reviews left for this client
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*, reviewer:profiles!reviewer_id(first_name, last_name, screen_name)")
      .eq("reviewee_id", cId);
    if (reviewsData && reviewsData.length > 0) {
      setReviews(reviewsData);
      const sum = reviewsData.reduce((acc, curr) => acc + curr.rating, 0);
      setAvgRating(sum / reviewsData.length);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  // Cover Letter field live character counter validation
  useEffect(() => {
    if (coverLetter.length < 150) {
      setCoverLetterFieldError(`Proposal must be at least 150 characters. (Current: ${coverLetter.length}/600)`);
    } else if (coverLetter.length > 600) {
      setCoverLetterFieldError(`Proposal cannot exceed 600 characters. (Current: ${coverLetter.length}/600)`);
    } else {
      setCoverLetterFieldError("");
    }
  }, [coverLetter]);

  const handleApplyToJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);
    setCoverLetterFieldValidated(true);

    if (coverLetterFieldError) return;
    if (!currentUserProfile) return;

    if (!currentUserProfile.is_verified) {
      setApplyError("You must attach a valid ID and wait for admin approval before you can apply to jobs.");
      return;
    }

    const { error } = await supabase.from("applications").insert({
      job_id: job.id,
      freelancer_id: currentUserProfile.id,
      cover_letter: coverLetter,
    });

    if (error) {
      setApplyError("Application submission failed: " + error.message);
    } else {
      // Send notification to Client
      await supabase.from("notifications").insert({
        user_id: job.client_id,
        title: "New Job Proposal Received! 📩",
        content: `@${currentUserProfile.screen_name} applied to your job posting "${job.title}".`,
      });

      setPopup({
        message: "Proposal submitted successfully!",
        type: "success"
      });
      setHasApplied(true);
      setShowApplyModal(false);
      setCoverLetter("");
      setCoverLetterFieldValidated(false);
      loadJobData();
    }
  };

  const handleReportJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError(null);

    if (!reportReason.trim()) {
      setReportError("Please enter a reason for reporting this job posting.");
      return;
    }

    if (reportReason.trim().length < 10) {
      setReportError("The reason must be at least 10 characters long.");
      return;
    }

    if (!currentUserId) {
      setReportError("You must be logged in to report a posting.");
      return;
    }

    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: currentUserId,
        target_type: "job",
        target_id: jobId,
        reason: reportReason.trim(),
        status: "pending"
      });

      if (error) {
        setReportError("Failed to submit report: " + error.message);
      } else {
        setPopup({
          message: "Report submitted successfully! The administration team will review this posting shortly.",
          type: "success"
        });
        setShowReportModal(false);
        setReportReason("");
      }
    } catch (err: any) {
      setReportError("An error occurred: " + err.message);
    }
  };

  const getCoverLetterInputClass = () => {
    const base = "form-input";
    if (coverLetterFieldActive) return base;
    if (coverLetterFieldValidated) {
      return coverLetterFieldError ? `${base} is-invalid` : `${base} is-valid`;
    }
    return base;
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: "flex", gap: "2px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} style={{ color: star <= rating ? "#fbbf24" : "#cbd5e1", fontSize: "16px" }}>★</span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>Loading job details...</p>
      </div>
    );
  }

  if (errorMsg || !job) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", gap: "16px" }}>
        <p style={{ fontSize: "16px", color: "var(--error-color)", fontWeight: "600" }}>{errorMsg || "Error loading job."}</p>
        <Link href="/" className="btn btn-primary">Go to Homepage</Link>
      </div>
    );
  }

  const isFreelancer = currentUserProfile?.is_freelancer;
  const isOwnJob = currentUserProfile?.id === job.client_id;

  return (
    <>
      {/* Header */}
      <Header profile={currentUserProfile} onProfileUpdate={loadJobData} activeWorkspace="home" />

      {/* Main content with side by side layout */}
      <main style={{ padding: "48px 24px", flex: 1 }}>
        <div className="container">
          <div style={{ marginBottom: "24px" }}>
            <button 
              onClick={handleGoBack} 
              className="btn btn-outline" 
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", fontSize: "14px" }}
            >
              ← Back
            </button>
          </div>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          
          {/* LEFT COLUMN: CLIENT PROFILE CARD (35% width on desktop) */}
          <div style={{ flex: "1 1 350px", maxWidth: "420px" }}>
            <div className="card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: "800" }}>
                      {clientProfile.first_name} {clientProfile.last_name}
                    </h3>
                    {clientProfile.is_verified ? (
                      <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success-color)", padding: "1px 6px", borderRadius: "50px" }}>
                        Verified ID
                      </span>
                    ) : (
                      <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error-color)", padding: "1px 6px", borderRadius: "50px" }}>
                        Unverified
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Client &bull; @{clientProfile.screen_name} &bull; {clientProfile.city || "N/A"}, {clientProfile.country || "N/A"}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "16px 0", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", marginBottom: "20px" }}>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Total Payments Spent</p>
                  <strong style={{ fontSize: "18px", color: "var(--error-color)" }}>
                    ${totalSpent.toFixed(2)}
                  </strong>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Completed Hires</p>
                  <strong style={{ fontSize: "18px" }}>
                    {completedHires}
                  </strong>
                </div>
              </div>

              {/* Reviews & Average Rating */}
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Client Feedback</h4>
                
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  {avgRating !== null ? (
                    <>
                      {renderStars(Math.round(avgRating))}
                      <strong style={{ fontSize: "14px" }}>{avgRating.toFixed(1)} / 5.0</strong>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>({reviews.length} review{reviews.length > 1 ? "s" : ""})</span>
                    </>
                  ) : (
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No feedback reviews yet.</span>
                  )}
                </div>

                {/* Review Comments list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "250px", overflowY: "auto", paddingRight: "4px" }}>
                  {reviews.map((r, idx) => (
                    <div key={idx} style={{ padding: "10px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "12px", backgroundColor: "#fafafa" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <strong>@{r.reviewer?.screen_name || "Freelancer"}</strong>
                        {renderStars(r.rating)}
                      </div>
                      <p style={{ color: "#444", fontStyle: "italic" }}>"{r.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: JOB DETAILS CARD (Remaining width) */}
          <div style={{ flex: "1 1 500px" }}>
            <div className="card" style={{ padding: "36px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span className="tag" style={{ marginBottom: "12px", fontSize: "12px" }}>{job.category}</span>
                
                <h2 style={{ fontSize: "26px", fontWeight: "800", marginTop: "4px", lineHeight: "1.25" }}>
                  {job.title}
                </h2>
                
                {/* Budget banner */}
                <div style={{ display: "inline-block", margin: "24px 0", padding: "16px 24px", backgroundColor: "var(--primary-light)", border: "1px solid #bfdbfe", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Est. Project Budget</span>
                  <h3 style={{ fontSize: "28px", fontWeight: "800", color: "var(--primary-color)", margin: 0 }}>
                    ${Number(job.budget).toFixed(2)}
                  </h3>
                </div>

                {/* Required Skills list */}
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Required Skills</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {job.skills_required.map((s: string, idx: number) => (
                      <span key={idx} className="tag" style={{ fontSize: "11px" }}>{s}</span>
                    ))}
                    {job.skills_required.length === 0 && <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No specific skills specified.</span>}
                  </div>
                </div>

                <div style={{ marginBottom: "32px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "10px" }}>Job Description</h4>
                  <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                    {job.description}
                  </p>
                </div>
              </div>

              {/* Actions and Triggers */}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "24px", marginTop: "24px" }}>
                {isOwnJob ? (
                  <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px 16px", borderRadius: "var(--radius-sm)", color: "var(--primary-color)", fontSize: "13px", fontWeight: "600", textAlign: "center" }}>
                    This is your job posting. Freelancers can view and submit proposals from this page.
                  </div>
                ) : isFreelancer ? (
                  <div>
                    {hasApplied ? (
                      <button 
                        disabled
                        className="btn btn-outline"
                        style={{ padding: "14px 28px", fontSize: "15px", width: "100%", fontWeight: "700", cursor: "not-allowed", backgroundColor: "#f1f5f9" }}
                      >
                        Proposal Already Submitted
                      </button>
                    ) : currentUserProfile.is_verified ? (
                      <button 
                        onClick={() => setShowApplyModal(true)} 
                        className="btn btn-primary"
                        style={{ padding: "14px 28px", fontSize: "15px", width: "100%", fontWeight: "700" }}
                      >
                        Apply to Job - Submit Proposal
                      </button>
                    ) : (
                      <div style={{ backgroundColor: "var(--error-bg)", border: "1px solid var(--error-border)", padding: "12px 16px", borderRadius: "var(--radius-sm)", color: "var(--error-color)", fontSize: "13px", textAlign: "center", fontWeight: "600" }}>
                        ⚠️ You must attach a valid ID and wait for admin approval before you can apply to jobs.
                      </div>
                    )}
                  </div>
                ) : currentUserProfile ? (
                  <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a", padding: "12px 16px", borderRadius: "var(--radius-sm)", color: "#92400e", fontSize: "13px", fontWeight: "600", textAlign: "center" }}>
                    To apply to this job, please toggle Freelancer Mode in your profile settings.
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <Link href="/login" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "14px" }}>
                      Log In as Freelancer to Apply
                    </Link>
                  </div>
                )}
                {currentUserId && !isOwnJob && (
                  <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                    <button 
                      onClick={() => setShowReportModal(true)} 
                      className="btn btn-outline" 
                      style={{ padding: "6px 12px", fontSize: "12px", color: "var(--error-color)", borderColor: "var(--error-border)" }}
                    >
                      Report Posting
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>

      {/* APPLY MODAL */}
      {showApplyModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
          <div className="card" style={{ width: "100%", maxWidth: "550px", backgroundColor: "#fff", padding: "32px", borderRadius: "var(--radius-md)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Apply for: {job.title}</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>Client Budget: ${Number(job.budget).toFixed(2)}</p>
            
            {applyError && (
              <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)", padding: "10px", fontSize: "13px", borderRadius: "var(--radius-sm)", marginBottom: "12px" }}>
                {applyError}
              </div>
            )}

            <form onSubmit={handleApplyToJob} noValidate>
              <div className="form-group">
                <label className="form-label">Cover Letter / Proposal</label>
                <div className="textarea-container">
                  <textarea
                    className={getCoverLetterInputClass()}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    onFocus={() => setCoverLetterFieldActive(true)}
                    onBlur={() => { setCoverLetterFieldActive(false); setCoverLetterFieldValidated(true); }}
                    style={{ minHeight: "150px", width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "14px" }}
                    placeholder="Detail your qualifications and proposed milestones. (Min 150, max 600 characters)."
                    required
                  />
                  <span className="textarea-counter">
                    {coverLetter.length}/600
                  </span>
                </div>
                {coverLetterFieldValidated && coverLetterFieldError && (
                  <span className="form-error">{coverLetterFieldError}</span>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button type="button" onClick={() => { setShowApplyModal(false); setCoverLetter(""); setCoverLetterFieldValidated(false); }} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Proposal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT POSTING MODAL */}
      {showReportModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", backgroundColor: "#fff", padding: "32px", borderRadius: "var(--radius-md)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Report Job Posting: {job.title}</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>Please explain why you are reporting this job posting to the site moderators.</p>
            
            {reportError && (
              <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)", padding: "10px", fontSize: "13px", borderRadius: "var(--radius-sm)", marginBottom: "12px" }}>
                {reportError}
              </div>
            )}

            <form onSubmit={handleReportJob} noValidate>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Reason for Report</label>
                <textarea
                  className="form-input"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ minHeight: "120px", width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "14px" }}
                  placeholder="Provide clear reasons or evidence of guidelines violation (min 10 characters)..."
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button type="button" onClick={() => { setShowReportModal(false); setReportReason(""); setReportError(null); }} className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "14px" }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: "var(--error-color)", borderColor: "var(--error-color)", padding: "8px 16px", fontSize: "14px" }}>Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          onClose={() => {
            popup.onClose?.();
            setPopup(null);
          }}
        />
      )}
    </>
  );
}
