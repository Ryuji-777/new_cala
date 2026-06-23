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

export default function PublicProfilePage({ params }: PageProps) {
  const router = useRouter();
  const supabase = createClient();
  const { id: targetUserId } = use(params);

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
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [targetSkills, setTargetSkills] = useState<string[]>([]);
  const [targetServices, setTargetServices] = useState<any[]>([]);
  const [targetJobs, setTargetJobs] = useState<any[]>([]);
  const [targetPortfolio, setTargetPortfolio] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Reporting state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ message: string; type: "success" | "error" | "info"; onClose?: () => void } | null>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      
      // 1. Get logged in user info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: cProf } = await supabase
          .from("profiles")
          .select("is_freelancer, is_client")
          .eq("id", user.id)
          .single();
        if (cProf) setCurrentUserProfile(cProf);
      }

      // If viewing own profile, redirect to dashboard view
      if (user && user.id === targetUserId) {
        router.push("/profile/view");
        return;
      }

      // 2. Fetch target profile
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (error || !prof) {
        setErrorMsg("The requested profile was not found or does not exist.");
        setIsLoading(false);
        return;
      }

      setTargetProfile(prof);

      // 3. Fetch skills
      const { data: skillsData } = await supabase
        .from("freelancer_skills")
        .select("skill_name")
        .eq("freelancer_id", targetUserId);

      const skillsList = skillsData ? skillsData.map((s) => s.skill_name) : [];
      setTargetSkills(skillsList);

      // 4. Fetch services if freelancer
      if (prof.is_freelancer) {
        const { data: servicesData } = await supabase
          .from("services")
          .select("*")
          .eq("freelancer_id", targetUserId)
          .order("created_at", { ascending: false });
        if (servicesData) setTargetServices(servicesData);
      }

      // 5. Fetch jobs if client
      if (prof.is_client) {
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("*")
          .eq("client_id", targetUserId)
          .order("created_at", { ascending: false });
        if (jobsData) setTargetJobs(jobsData);
      }

      // 6. Fetch portfolio items if freelancer
      if (prof.is_freelancer) {
        const { data: portData } = await supabase
          .from("portfolio_items")
          .select("*")
          .eq("freelancer_id", targetUserId)
          .order("created_at", { ascending: false });
        if (portData) setTargetPortfolio(portData);
      }

      setIsLoading(false);
    };

    loadProfileData();
  }, [targetUserId]);

  const handleMessageUser = async () => {
    if (!currentUserId || !currentUserProfile) {
      router.push("/login");
      return;
    }

    // Check if there is an existing message history between the two users
    const { data: existingMsgs } = await supabase
      .from("messages")
      .select("id")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
      .limit(1);

    if (!existingMsgs || existingMsgs.length === 0) {
      // First time chatting: insert announcement message
      await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: targetUserId,
        content: `You are now chatting with ${targetProfile.first_name} ${targetProfile.last_name}`,
      });
    }

    // Redirect to respective workspace messaging with chat partner preset
    if (currentUserProfile.is_freelancer) {
      router.push(`/freelancer/dashboard?chat=${targetUserId}`);
    } else {
      router.push(`/client/dashboard?chat=${targetUserId}`);
    }
  };

  const handleReportProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError(null);

    if (!reportReason.trim()) {
      setReportError("Please enter a reason for reporting this profile.");
      return;
    }

    if (reportReason.trim().length < 10) {
      setReportError("The reason must be at least 10 characters long.");
      return;
    }

    if (!currentUserId) {
      setReportError("You must be logged in to file a report.");
      return;
    }

    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: currentUserId,
        target_type: "profile",
        target_id: targetUserId,
        reason: reportReason.trim(),
        status: "pending"
      });

      if (error) {
        setReportError("Failed to submit report: " + error.message);
      } else {
        setPopup({
          message: "Report submitted successfully! The administration team will review it shortly.",
          type: "success"
        });
        setShowReportModal(false);
        setReportReason("");
      }
    } catch (err: any) {
      setReportError("An error occurred: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>Loading profile information...</p>
      </div>
    );
  }

  if (errorMsg || !targetProfile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", gap: "16px" }}>
        <p style={{ fontSize: "16px", color: "var(--error-color)", fontWeight: "600" }}>{errorMsg || "Error loading profile."}</p>
        <Link href="/" className="btn btn-primary">Go to Homepage</Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <Header profile={currentUserProfile} activeWorkspace="browse" />

      {/* Profile Detail View */}
      <main style={{ padding: "48px 24px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "700px", marginBottom: "24px" }}>
          <button 
            onClick={handleGoBack} 
            className="btn btn-outline" 
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", fontSize: "14px" }}
          >
            ← Back
          </button>
        </div>
        <div className="card" style={{ width: "100%", maxWidth: "700px", padding: "40px" }}>
          
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {targetProfile.avatar_url ? (
                <img 
                  src={targetProfile.avatar_url} 
                  alt="Avatar" 
                  style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary-color)" }} 
                />
              ) : (
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", color: "#64748b" }}>
                  {targetProfile.first_name[0]}{targetProfile.last_name[0]}
                </div>
              )}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: "800" }}>
                    {targetProfile.first_name} {targetProfile.last_name}
                  </h2>
                  
                  {targetProfile.is_verified ? (
                    <span style={{ fontSize: "11px", fontWeight: "700", backgroundColor: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success-color)", padding: "2px 8px", borderRadius: "50px" }}>
                      Verified ID
                    </span>
                  ) : (
                    <span style={{ fontSize: "11px", fontWeight: "700", backgroundColor: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error-color)", padding: "2px 8px", borderRadius: "50px" }}>
                      Unverified Account
                    </span>
                  )}
                </div>
                
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "2px" }}>
                @{targetProfile.screen_name} &bull; {targetProfile.city}, {targetProfile.state}, {targetProfile.country}
              </p>
            </div>
          </div>

            {currentUserId !== targetUserId && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleMessageUser} className="btn btn-primary" style={{ padding: "8px 16px" }}>
                  Send Message
                </button>
                <button 
                  onClick={() => {
                    if (!currentUserId) {
                      router.push("/login");
                    } else {
                      setShowReportModal(true);
                    }
                  }} 
                  className="btn btn-outline" 
                  style={{ padding: "8px 16px", color: "var(--error-color)", borderColor: "var(--error-border)" }}
                >
                  Report Profile
                </button>
              </div>
            )}
          </div>

          {/* Role Badges */}
          <div style={{ display: "flex", gap: "10px", margin: "16px 0", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)" }}>
            {targetProfile.is_freelancer && (
              <span className="tag" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-color)", border: "1px solid #bfdbfe", fontWeight: "600" }}>
                Freelancer
              </span>
            )}
            {targetProfile.is_client && (
              <span className="tag" style={{ backgroundColor: "#f8fafc", color: "var(--text-primary)", fontWeight: "600" }}>
                Client
              </span>
            )}
          </div>

          {/* Bio Description */}
          <div style={{ marginBottom: "28px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>About</h4>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              {targetProfile.description || "No bio description provided."}
            </p>
          </div>

          {/* Freelancer skills */}
          {targetProfile.is_freelancer && (
            <div style={{ marginBottom: "28px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>Expert Skills</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {targetSkills.map((skill, idx) => (
                  <span key={idx} className="tag">{skill}</span>
                ))}
                {targetSkills.length === 0 && (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No skills listed.</p>
                )}
              </div>
            </div>
          )}

          {/* Portfolio gallery */}
          {targetProfile.is_freelancer && (
            <div style={{ marginBottom: "28px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px" }}>Portfolio Showcase</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                {targetPortfolio.map((item, idx) => (
                  <div key={idx} style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", overflow: "hidden", backgroundColor: "#fff" }}>
                    <img 
                      src={item.image_url} 
                      alt="Portfolio Work" 
                      style={{ width: "100%", height: "130px", objectFit: "cover" }} 
                    />
                    <div style={{ padding: "12px" }}>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>{item.description}</p>
                    </div>
                  </div>
                ))}
                {targetPortfolio.length === 0 && (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No portfolio items uploaded.</p>
                )}
              </div>
            </div>
          )}

          {/* Freelancer Posted Services */}
          {targetProfile.is_freelancer && (
            <div style={{ marginTop: "28px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px" }}>Posted Services</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                {targetServices.map((service, idx) => (
                  <div key={idx} style={{ padding: "16px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "#fafafa" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span className="tag" style={{ fontSize: "11px", marginBottom: "6px" }}>{service.category}</span>
                        <h5 style={{ fontSize: "15px", fontWeight: "700" }}>
                          <Link href={`/services/${service.id}`} style={{ color: "var(--primary-color)", textDecoration: "underline" }}>
                            {service.title}
                          </Link>
                        </h5>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          Delivery Time: {service.delivery_days} day{service.delivery_days > 1 ? "s" : ""}
                        </p>
                      </div>
                      <strong style={{ fontSize: "16px", color: "var(--primary-color)" }}>${Number(service.price).toFixed(2)}</strong>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "10px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "1.5" }}>
                      {service.description}
                    </p>
                  </div>
                ))}
                {targetServices.length === 0 && (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No posted services found.</p>
                )}
              </div>
            </div>
          )}

          {/* Client Posted Jobs */}
          {targetProfile.is_client && (
            <div style={{ marginTop: "28px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px" }}>Posted Jobs</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                {targetJobs.map((job, idx) => (
                  <div key={idx} style={{ padding: "16px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "#fafafa" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span className="tag" style={{ fontSize: "11px", marginBottom: "6px" }}>{job.category}</span>
                        <h5 style={{ fontSize: "15px", fontWeight: "700" }}>
                          <Link href={`/jobs/${job.id}`} style={{ color: "var(--primary-color)", textDecoration: "underline" }}>
                            {job.title}
                          </Link>
                        </h5>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          Status: <span style={{ fontWeight: "700", textTransform: "uppercase" }}>{job.status}</span>
                        </p>
                      </div>
                      <strong style={{ fontSize: "16px", color: "var(--primary-color)" }}>${Number(job.budget).toFixed(2)}</strong>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "10px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "1.5" }}>
                      {job.description}
                    </p>
                  </div>
                ))}
                {targetJobs.length === 0 && (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No posted jobs found.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Cala Freelance Marketplace. All rights reserved.</p>
        </div>
      </footer>

      {/* REPORT PROFILE MODAL */}
      {showReportModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", backgroundColor: "#fff", padding: "32px", borderRadius: "var(--radius-md)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Report Profile: {targetProfile.first_name} {targetProfile.last_name}</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>Please explain why you are reporting this user&apos;s profile to the site moderators.</p>
            
            {reportError && (
              <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)", padding: "10px", fontSize: "13px", borderRadius: "var(--radius-sm)", marginBottom: "12px" }}>
                {reportError}
              </div>
            )}

            <form onSubmit={handleReportProfile} noValidate>
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
