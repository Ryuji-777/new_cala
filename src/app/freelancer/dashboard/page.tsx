"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Predefined categories from user spec
const categories = [
  "Programming & Development",
  "Writing & Translation",
  "Design & Art",
  "Administrative & Secretarial",
  "Sales & Marketing",
  "Engineering & Architecture",
  "Business & Finance",
  "Education & Training",
  "Legal"
];

export default function FreelancerDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Tabs: "overview", "find-work", "jobs", "messages", "wallet"
  const [activeTab, setActiveTab] = useState("overview");

  // Database lists
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  
  // Messaging state
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChatPartner, setSelectedChatPartner] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMsgContent, setNewMsgContent] = useState("");

  // Filters for Find Work
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Application Modal state
  const [applyJob, setApplyJob] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyFieldActive, setApplyFieldActive] = useState(false);
  const [applyFieldValidated, setApplyFieldValidated] = useState(false);
  const [applyFieldError, setApplyFieldError] = useState("");

  // Review Modal state
  const [reviewContract, setReviewContract] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const loadNotifications = async (uId: string) => {
    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uId)
      .order("created_at", { ascending: false });

    if (notifs) {
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.is_read).length);
    }
  };

  const handleMarkAllRead = async () => {
    if (!profile) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id);
    loadNotifications(profile.id);
  };

  const loadFreelancerData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Load profile
    const { data: prof, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !prof) {
      router.push("/profile/setup");
      return;
    }

    if (!prof.is_freelancer) {
      alert("Please activate Freelancer Mode in your profile settings first.");
      router.push("/profile/view");
      return;
    }

    setProfile(prof);
    await loadNotifications(user.id);

    // 1. Fetch Open Jobs (posted by other clients)
    const { data: openJobs } = await supabase
      .from("jobs")
      .select("*, client:profiles(first_name, last_name, screen_name)")
      .eq("status", "open")
      .neq("client_id", user.id)
      .order("created_at", { ascending: false });
    if (openJobs) setJobs(openJobs);

    // 2. Fetch My Applications
    const { data: myApps } = await supabase
      .from("applications")
      .select("*, job:jobs(*, client:profiles(*))")
      .eq("freelancer_id", user.id);
    if (myApps) setApplications(myApps);

    // 3. Fetch My Contracts
    const { data: myContracts } = await supabase
      .from("contracts")
      .select("*, job:jobs(*), client:profiles(*)")
      .eq("freelancer_id", user.id);
    if (myContracts) setContracts(myContracts);

    // 4. Fetch Payments received
    const { data: myPayments } = await supabase
      .from("payments")
      .select("*, sender:profiles(*), contract:contracts(job:jobs(*))")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });
    if (myPayments) setPayments(myPayments);

    // 5. Load active chat list
    const { data: msgList } = await supabase
      .from("messages")
      .select("*, sender:profiles(*), receiver:profiles(*)")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });

    if (msgList) {
      // Group by distinct conversation partner
      const partners: Record<string, any> = {};
      msgList.forEach((m) => {
        const partner = m.sender_id === user.id ? m.receiver : m.sender;
        if (partner) {
          partners[partner.id] = partner;
        }
      });
      setConversations(Object.values(partners));
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadFreelancerData();
  }, []);

  // Validation checker for cover letter
  useEffect(() => {
    if (coverLetter.length < 150) {
      setApplyFieldError(`Cover letter must be at least 150 characters. (Current: ${coverLetter.length}/600)`);
    } else if (coverLetter.length > 600) {
      setApplyFieldError(`Cover letter cannot exceed 600 characters. (Current: ${coverLetter.length}/600)`);
    } else {
      setApplyFieldError("");
    }
  }, [coverLetter]);

  // Open Chat Conversation
  const handleOpenChat = async (partner: any) => {
    if (!profile) return;
    setSelectedChatPartner(partner);
    
    const { data: chatMsgs } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${partner.id}),and(sender_id.eq.${partner.id},receiver_id.eq.${profile.id})`)
      .order("created_at", { ascending: true });

    if (chatMsgs) setChatMessages(chatMsgs);
  };

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedChatPartner || !newMsgContent.trim()) return;

    const { data: newMsg, error } = await supabase
      .from("messages")
      .insert({
        sender_id: profile.id,
        receiver_id: selectedChatPartner.id,
        content: newMsgContent.trim(),
      })
      .select("*")
      .single();

    if (!error && newMsg) {
      setChatMessages((prev) => [...prev, newMsg]);
      setNewMsgContent("");
    }
  };

  // Apply to Job Handler
  const handleApplyToJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);
    setApplyFieldValidated(true);

    if (applyFieldError) return;
    if (!profile || !applyJob) return;

    // Check verification status requirement
    if (!profile.is_verified) {
      setApplyError("You must attach a valid ID and wait for admin approval before you can apply to jobs.");
      return;
    }

    // Check if already applied
    const alreadyApplied = applications.some((app) => app.job_id === applyJob.id);
    if (alreadyApplied) {
      setApplyError("You have already applied to this job posting.");
      return;
    }

    const { error } = await supabase.from("applications").insert({
      job_id: applyJob.id,
      freelancer_id: profile.id,
      cover_letter: coverLetter,
    });

    if (error) {
      setApplyError("Application failed: " + error.message);
    } else {
      // Insert notification for the client
      await supabase.from("notifications").insert({
        user_id: applyJob.client_id,
        title: "New Job Proposal Received! 📩",
        content: `@${profile.screen_name} applied to your job posting "${applyJob.title}".`,
      });

      alert("Application submitted successfully!");
      setApplyJob(null);
      setCoverLetter("");
      setApplyFieldValidated(false);
      loadFreelancerData();
    }
  };

  // Submit Client Review Handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !reviewContract || !comment.trim()) return;

    const { error } = await supabase.from("reviews").insert({
      contract_id: reviewContract.id,
      reviewer_id: profile.id,
      reviewee_id: reviewContract.client_id,
      rating: rating,
      comment: comment.trim(),
    });

    if (error) {
      alert("Failed to submit review: " + error.message);
    } else {
      alert("Thank you for your feedback! Review submitted.");
      setReviewContract(null);
      setComment("");
      loadFreelancerData();
    }
  };

  // Filter open jobs
  const filteredJobs = jobs.filter((job) => {
    const matchCat = selectedCategory === "All" || job.category === selectedCategory;
    const matchQuery =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const getApplyInputClass = () => {
    const base = "form-input";
    if (applyFieldActive) return base;
    if (applyFieldValidated) {
      return applyFieldError ? `${base} is-invalid` : `${base} is-valid`;
    }
    return base;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>Loading Workspace...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="container header-container">
          <Link href="/" className="logo">
            <div className="logo-icon">C</div>
            Cala Freelancer Workspace
          </Link>
          <nav className="nav-links">
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
              Logged in as: {profile.first_name} {profile.last_name}
            </span>
            <Link href="/profile/view" className="nav-link">My Profile</Link>

            {/* Notifications Bell Dropdown */}
            <div className="notif-container">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="notif-bell-btn"
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span className="notif-title">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="notif-mark-read">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="notif-list">
                    {notifications.map((n) => (
                      <div key={n.id} className={`notif-item ${!n.is_read ? "unread" : ""}`}>
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-content">{n.content}</div>
                        <div className="notif-item-time">
                          {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="notif-empty">No notifications yet.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "13px" }}>
              Log Out
            </button>
          </nav>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main style={{ padding: "40px 24px", flex: 1 }}>
        <div className="container">
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "800" }}>Freelancer Dashboard</h2>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {profile.is_verified ? (
                <span style={{ fontSize: "12px", fontWeight: "700", backgroundColor: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success-color)", padding: "4px 10px", borderRadius: "50px" }}>
                  Verified
                </span>
              ) : (
                <span style={{ fontSize: "12px", fontWeight: "700", backgroundColor: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error-color)", padding: "4px 10px", borderRadius: "50px" }}>
                  ID Approval Pending
                </span>
              )}
            </div>
          </div>

          {/* SIDEBAR TABS */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "24px", marginBottom: "32px" }}>
            <button 
              onClick={() => setActiveTab("overview")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "overview" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "overview" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              Overview Summaries
            </button>
            <button 
              onClick={() => setActiveTab("find-work")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "find-work" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "find-work" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              Find Work
            </button>
            <button 
              onClick={() => setActiveTab("jobs")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "jobs" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "jobs" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              My Jobs & Hires ({contracts.filter(c => c.status === "ongoing").length})
            </button>
            <button 
              onClick={() => setActiveTab("messages")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "messages" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "messages" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              Messages
            </button>
            <button 
              onClick={() => setActiveTab("wallet")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "wallet" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "wallet" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              Payments & Wallet
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                <div className="card">
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Wallet Balance</p>
                  <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px", color: "var(--primary-color)" }}>
                    ${Number(profile.wallet_balance).toFixed(2)}
                  </h3>
                </div>
                <div className="card">
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Total Earnings Received</p>
                  <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px", color: "var(--success-color)" }}>
                    ${payments.reduce((acc, curr) => acc + Number(curr.amount), 0).toFixed(2)}
                  </h3>
                </div>
                <div className="card">
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Active Contracts</p>
                  <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>
                    {contracts.filter(c => c.status === "ongoing").length}
                  </h3>
                </div>
                <div className="card">
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Submitted Applications</p>
                  <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>
                    {applications.filter(a => a.status === "pending").length}
                  </h3>
                </div>
              </div>

              {/* RECENT APPLICATIONS */}
              <div className="card">
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>My Submitted Job Applications</h3>
                {applications.map((app, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", padding: "12px 0", fontSize: "14px" }}>
                    <div>
                      <strong style={{ color: "var(--primary-color)" }}>{app.job.title}</strong>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        Client: @{app.job.client.screen_name} &bull; Budget: ${Number(app.job.budget).toFixed(2)}
                      </p>
                    </div>
                    <span className="tag" style={{ textTransform: "capitalize", fontWeight: "600" }}>
                      {app.status}
                    </span>
                  </div>
                ))}
                {applications.length === 0 && (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No applications submitted yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FIND WORK */}
          {activeTab === "find-work" && (
            <div>
              {/* FILTERS */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "14px", outline: "none" }}
                >
                  <option value="All">All Categories</option>
                  {categories.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Search jobs..."
                  className="form-input"
                  style={{ maxWidth: "300px" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* JOB LISTINGS */}
              {filteredJobs.map((job, idx) => {
                const hasApplied = applications.some((app) => app.job_id === job.id);
                return (
                  <div key={idx} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px" }}>
                    <div style={{ flex: 1 }}>
                      <span className="tag" style={{ marginBottom: "8px" }}>{job.category}</span>
                      <h3 style={{ fontSize: "18px", fontWeight: "700", marginTop: "4px" }}>{job.title}</h3>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        Posted by: @{job.client.screen_name} &bull; Budget: ${Number(job.budget).toFixed(2)} &bull; Date: {new Date(job.created_at).toLocaleDateString()}
                      </p>
                      
                      <p style={{ fontSize: "14px", color: "#555", marginTop: "12px", lineHeight: "1.6" }}>
                        {job.description}
                      </p>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                        {job.skills_required.map((s: string, sIdx: number) => (
                          <span key={sIdx} className="tag" style={{ fontSize: "11px" }}>{s}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      {hasApplied ? (
                        <button className="btn btn-outline" disabled style={{ cursor: "not-allowed" }}>
                          Already Applied
                        </button>
                      ) : (
                        <button onClick={() => setApplyJob(job)} className="btn btn-primary" style={{ padding: "8px 16px" }}>
                          Apply to Job
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredJobs.length === 0 && (
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No matching open jobs found.</p>
              )}

              {/* APPLY MODAL */}
              {applyJob && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
                  <div className="card" style={{ width: "100%", maxWidth: "550px", backgroundColor: "#fff", padding: "32px", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Apply for: {applyJob.title}</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>Budget: ${Number(applyJob.budget).toFixed(2)}</p>
                    
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
                            className={getApplyInputClass()}
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            onFocus={() => setApplyFieldActive(true)}
                            onBlur={() => { setApplyFieldActive(false); setApplyFieldValidated(true); }}
                            style={{ minHeight: "150px", width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "14px" }}
                            placeholder="Detail your qualifications and proposed milestones. (Min 150, max 600 characters)."
                            required
                          />
                          <span className="textarea-counter">
                            {coverLetter.length}/600
                          </span>
                        </div>
                        {applyFieldValidated && applyFieldError && (
                          <span className="form-error">{applyFieldError}</span>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                        <button type="button" onClick={() => { setApplyJob(null); setCoverLetter(""); setApplyFieldValidated(false); }} className="btn btn-outline">Cancel</button>
                        <button type="submit" className="btn btn-primary">Submit Proposal</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY JOBS (CONTRACTS) */}
          {activeTab === "jobs" && (
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Contracts History</h3>
              {contracts.map((c, idx) => (
                <div key={idx} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: "700" }}>{c.job.title}</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Client: @{c.client.screen_name} &bull; Budget: ${Number(c.budget).toFixed(2)} &bull; Status:{" "}
                      <span style={{ fontWeight: "700", color: c.status === "completed" ? "var(--success-color)" : c.status === "ongoing" ? "var(--primary-color)" : "var(--error-color)" }}>
                        {c.status.toUpperCase()}
                      </span>
                    </p>
                  </div>

                  <div>
                    {c.status === "completed" && (
                      <button onClick={() => setReviewContract(c)} className="btn btn-outline">
                        Review Client
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {contracts.length === 0 && (
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No contract records found.</p>
              )}

              {/* REVIEW CLIENT MODAL */}
              {reviewContract && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
                  <div className="card" style={{ width: "100%", maxWidth: "500px", backgroundColor: "#fff", padding: "32px", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Review Client for: {reviewContract.job.title}</h3>
                    
                    <form onSubmit={handleSubmitReview}>
                      <div className="form-group">
                        <label className="form-label">Rating (1 to 5 Stars)</label>
                        <select 
                          value={rating} 
                          onChange={(e) => setRating(Number(e.target.value))}
                          style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius-sm)" }}
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                          <option value={4}>⭐⭐⭐⭐ (4 - Good)</option>
                          <option value={3}>⭐⭐⭐ (3 - Average)</option>
                          <option value={2}>⭐⭐ (2 - Poor)</option>
                          <option value={1}>⭐ (1 - Terrible)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Review Comment</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          style={{ minHeight: "100px", width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius-sm)" }}
                          placeholder="Provide a review of your workspace collaboration with this client."
                          required
                        />
                      </div>

                      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                        <button type="button" onClick={() => setReviewContract(null)} className="btn btn-outline">Cancel</button>
                        <button type="submit" className="btn btn-primary">Submit Review</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MESSAGES */}
          {activeTab === "messages" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2.8fr", gap: "24px", height: "450px" }}>
              {/* CHAT PARTNERS LIST */}
              <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "#fff", overflowY: "auto" }}>
                <h4 style={{ padding: "16px", borderBottom: "1px solid var(--border-color)", fontSize: "14px", fontWeight: "700" }}>Conversations</h4>
                {conversations.map((p, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleOpenChat(p)}
                    style={{ 
                      padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", 
                      backgroundColor: selectedChatPartner?.id === p.id ? "var(--primary-light)" : "transparent",
                      color: selectedChatPartner?.id === p.id ? "var(--primary-color)" : "inherit"
                    }}
                  >
                    <strong style={{ fontSize: "13px" }}>{p.first_name} {p.last_name}</strong>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>@{p.screen_name}</p>
                  </div>
                ))}
                {conversations.length === 0 && (
                  <p style={{ padding: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>No active messages found.</p>
                )}
              </div>

              {/* ACTIVE CHAT WINDOW */}
              <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "#fff", display: "flex", flexDirection: "column" }}>
                {selectedChatPartner ? (
                  <>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "14px" }}>{selectedChatPartner.first_name} {selectedChatPartner.last_name}</strong>
                        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>@{selectedChatPartner.screen_name}</p>
                      </div>
                    </div>

                    {/* MESSAGE BOX */}
                    <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {chatMessages.map((msg, idx) => {
                        const isMine = msg.sender_id === profile.id;
                        return (
                          <div 
                            key={idx}
                            style={{ 
                              maxWidth: "70%", padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: "13px",
                              alignSelf: isMine ? "flex-end" : "flex-start",
                              backgroundColor: isMine ? "var(--primary-color)" : "#f1f5f9",
                              color: isMine ? "#fff" : "var(--text-primary)"
                            }}
                          >
                            <p>{msg.content}</p>
                            <span style={{ fontSize: "9px", color: isMine ? "#bfdbfe" : "var(--text-secondary)", display: "block", textAlign: "right", marginTop: "4px" }}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* SEND MESSAGE BAR */}
                    <form onSubmit={handleSendMessage} style={{ padding: "12px 16px", borderTop: "1px solid var(--border-color)", display: "flex", gap: "12px" }}>
                      <input
                        type="text"
                        placeholder="Write a message..."
                        style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "13px" }}
                        value={newMsgContent}
                        onChange={(e) => setNewMsgContent(e.target.value)}
                      />
                      <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                        Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                    Select a conversation partner from the side list to open messages.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: WALLET & PAYMENTS */}
          {activeTab === "wallet" && (
            <div>
              <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--primary-light)", borderColor: "#bfdbfe", marginBottom: "32px" }}>
                <div>
                  <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--primary-color)", fontWeight: "700" }}>Wallet Balance</p>
                  <h3 style={{ fontSize: "28px", fontWeight: "800", color: "var(--primary-color)", margin: "4px 0" }}>
                    ${Number(profile.wallet_balance).toFixed(2)}
                  </h3>
                </div>
                <Link href="/profile/view" className="btn btn-outline" style={{ border: "1px solid var(--primary-color)", color: "var(--primary-color)" }}>
                  Go to Profile to Manage Wallet
                </Link>
              </div>

              {/* PAYMENT LOGS */}
              <div className="card">
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Earnings Payment History</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                        <th style={{ padding: "10px 12px" }}>Contract / Job</th>
                        <th style={{ padding: "10px 12px" }}>Sender (Client)</th>
                        <th style={{ padding: "10px 12px" }}>Amount Received</th>
                        <th style={{ padding: "10px 12px" }}>Transaction Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: "600" }}>{p.contract.job.title}</td>
                          <td style={{ padding: "10px 12px" }}>@{p.sender.screen_name} ({p.sender.first_name} {p.sender.last_name})</td>
                          <td style={{ padding: "10px 12px", color: "var(--success-color)", fontWeight: "700" }}>+${Number(p.amount).toFixed(2)}</td>
                          <td style={{ padding: "10px 12px" }}>{new Date(p.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: "16px", textAlign: "center", color: "var(--text-secondary)" }}>No payment history found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
    </>
  );
}
