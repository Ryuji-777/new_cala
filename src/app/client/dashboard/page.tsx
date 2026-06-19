"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Predefined categories and skills from user spec
const skillsCategories: Record<string, string[]> = {
  "Programming & Development": [
    "Web Developers", "Software Developers", "PHP Developers", "WordPress Experts", 
    "JavaScript Developers", "HTML Developers", "Designers", "CSS Developers", 
    "Web Designers", "MySQL Developers", "Java Developers", "jQuery Developers", 
    "SQL Developers", "Computer Programmers", "App Developers", "Front End Developers", 
    "Python Developers", "C# Developers", "Management Experts", "C Developers"
  ],
  "Writing & Translation": [
    "Freelance Writers", "Data Entry Experts", "English Language Experts", "Typists", 
    "Content Writers", "Article Writers", "Translators", "Blog Writing Services", 
    "Editors", "Data Managers", "Proofreaders", "Researchers", "Microsoft Word Experts", 
    "Copywriters", "Creative Writers", "Microsoft Developers", "Marketers", "News Writers", 
    "Newsletters", "Journalists"
  ],
  "Design & Art": [
    "Designers", "Graphic Designers", "Logo Designers", "Adobe Photoshop Designers", 
    "Editors", "Business Card Designers", "Illustrators", "Poster Designers", 
    "Creative Designers", "Banner Ad Designers", "Brochure Designers", "Adobe Illustrator Experts", 
    "Photo Editors", "Flyer Designers", "Artists", "3D Designers", "Video Editors", 
    "Web Designers", "Photographers", "Animators"
  ],
  "Administrative & Secretarial": [
    "Data Entry Experts", "Data Managers", "Microsoft Developers", "Virtual Assistants", 
    "Typists", "Microsoft Word Experts", "Researchers", "Microsoft Excel Experts", 
    "Management Experts", "Customer Service Representatives", "Administrative Assistant", 
    "Copy and Paste Experts", "Freelance Writers", "Office Assistants", "PowerPoint Experts", 
    "Transcriptionists", "Marketers", "English Language Experts", "Accountants", "Editors"
  ]
};

export default function ClientDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Tabs: "overview", "post-job", "manage-jobs", "contracts", "messages", "wallet"
  const [activeTab, setActiveTab] = useState("overview");

  // Database lists
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Messaging state
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChatPartner, setSelectedChatPartner] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMsgContent, setNewMsgContent] = useState("");

  // Post a Job Form State
  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState("Programming & Development");
  const [jobDescription, setJobDescription] = useState("");
  const [jobBudget, setJobBudget] = useState("");
  const [jobSkills, setJobSkills] = useState<string[]>([]);
  const [postError, setPostError] = useState<string | null>(null);

  // Form Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validatedFields, setValidatedFields] = useState<Record<string, boolean>>({});
  const [activeField, setActiveField] = useState<string | null>(null);

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

  const loadClientData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: prof, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !prof) {
      router.push("/profile/setup");
      return;
    }

    if (!prof.is_client) {
      alert("Please activate Client Mode in your profile settings first.");
      router.push("/profile/view");
      return;
    }

    setProfile(prof);
    await loadNotifications(user.id);

    // 1. Fetch Client's posted jobs
    const { data: jobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });
    if (jobs) setMyJobs(jobs);

    // 2. Fetch applications for Client's jobs
    if (jobs && jobs.length > 0) {
      const jobIds = jobs.map((j) => j.id);
      const { data: apps } = await supabase
        .from("applications")
        .select("*, job:jobs(*), freelancer:profiles(*)")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });
      if (apps) setApplications(apps);
    } else {
      setApplications([]);
    }

    // 3. Fetch Client's contracts
    const { data: myContracts } = await supabase
      .from("contracts")
      .select("*, job:jobs(*), freelancer:profiles(*)")
      .eq("client_id", user.id);
    if (myContracts) setContracts(myContracts);

    // 4. Fetch payments made
    const { data: myPayments } = await supabase
      .from("payments")
      .select("*, receiver:profiles(*), contract:contracts(job:jobs(*))")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false });
    if (myPayments) setPayments(myPayments);

    // 5. Load active chat conversations list
    const { data: msgList } = await supabase
      .from("messages")
      .select("*, sender:profiles(*), receiver:profiles(*)")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });

    if (msgList) {
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
    loadClientData();
  }, []);

  // Validation function for job post fields
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case "jobTitle":
        if (!value.trim()) return "Job title is required.";
        if (value.trim().length < 5) return "Title must be at least 5 characters.";
        return "";
      case "jobDescription":
        if (!value) return "Job description is required.";
        if (value.length < 150) return `Description must be at least 150 characters. (Current: ${value.length}/600)`;
        if (value.length > 600) return `Description cannot exceed 600 characters. (Current: ${value.length}/600)`;
        return "";
      case "jobBudget":
        if (!value) return "Budget is required.";
        const budgetNum = Number(value);
        if (isNaN(budgetNum) || budgetNum <= 0) return "Budget must be a numeric amount greater than $0.";
        return "";
      default:
        return "";
    }
  };

  // Run validation on inputs change
  useEffect(() => {
    if (activeTab !== "post-job") return;

    const newErrors: Record<string, string> = {};
    const fields = { jobTitle, jobDescription, jobBudget };
    
    Object.keys(fields).forEach((key) => {
      const val = fields[key as keyof typeof fields];
      const errorMsg = validateField(key, val);
      if (errorMsg) newErrors[key] = errorMsg;
    });

    setErrors(newErrors);
  }, [jobTitle, jobDescription, jobBudget, activeTab]);

  const getInputClass = (name: string) => {
    const base = "form-input";
    if (activeField === name) return base;
    if (validatedFields[name]) {
      return errors[name] ? `${base} is-invalid` : `${base} is-valid`;
    }
    return base;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setActiveField(null);
    setValidatedFields((prev) => ({ ...prev, [name]: true }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setActiveField(name);
  };

  const handleSkillToggle = (skill: string) => {
    setJobSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

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

  // Submit Job Post Handler
  const handlePostJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);

    const allValidated = { jobTitle: true, jobDescription: true, jobBudget: true };
    setValidatedFields(allValidated);

    if (Object.keys(errors).length > 0) return;
    if (!profile) return;

    // Check verification status requirement
    if (!profile.is_verified) {
      setPostError("You must attach a valid ID and wait for admin approval before you can post jobs.");
      return;
    }

    const budgetVal = Number(jobBudget);

    // Verify client has enough funds in wallet to post & secure hiring
    if (profile.wallet_balance < budgetVal) {
      setPostError(`Insufficient wallet balance. You need at least $${budgetVal.toFixed(2)} to post this job.`);
      return;
    }

    const { error } = await supabase.from("jobs").insert({
      client_id: profile.id,
      title: jobTitle,
      description: jobDescription,
      budget: budgetVal,
      category: jobCategory,
      skills_required: jobSkills,
    });

    if (error) {
      setPostError("Failed to post job: " + error.message);
    } else {
      alert("Job posted successfully!");
      // Reset form
      setJobTitle("");
      setJobDescription("");
      setJobBudget("");
      setJobSkills([]);
      setValidatedFields({});
      setActiveTab("manage-jobs");
      loadClientData();
    }
  };

  // HIRE FREELANCER (duducts funds, starts contract, updates job status)
  const handleHireFreelancer = async (application: any) => {
    if (!profile) return;
    const confirmHire = window.confirm(`Are you sure you want to hire @${application.freelancer.screen_name} for $${Number(application.job.budget).toFixed(2)}?`);
    if (!confirmHire) return;

    const hireBudget = Number(application.job.budget);

    // Re-verify client has enough funds
    if (profile.wallet_balance < hireBudget) {
      alert(`Insufficient funds. Your wallet balance is $${Number(profile.wallet_balance).toFixed(2)}, but you need $${hireBudget.toFixed(2)}.`);
      return;
    }

    // 1. Deduct funds from client's wallet balance
    const nextClientBalance = Number(profile.wallet_balance) - hireBudget;
    const { error: walletError } = await supabase
      .from("profiles")
      .update({ wallet_balance: nextClientBalance })
      .eq("id", profile.id);

    if (walletError) {
      alert("Hiring failed during wallet checkout: " + walletError.message);
      return;
    }

    // 2. Create contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        job_id: application.job_id,
        freelancer_id: application.freelancer_id,
        client_id: profile.id,
        budget: hireBudget,
        status: "ongoing",
      })
      .select("*")
      .single();

    if (contractError) {
      alert("Hiring failed during contract creation: " + contractError.message);
      // Refund client
      await supabase
        .from("profiles")
        .update({ wallet_balance: profile.wallet_balance })
        .eq("id", profile.id);
      return;
    }

    // 3. Update job status to ongoing
    await supabase
      .from("jobs")
      .update({ status: "ongoing" })
      .eq("id", application.job_id);

    // 4. Update application status
    await supabase
      .from("applications")
      .update({ status: "accepted" })
      .eq("id", application.id);

    // Reject other applications for this job
    await supabase
      .from("applications")
      .update({ status: "rejected" })
      .eq("job_id", application.job_id)
      .neq("id", application.id);

    // Send automated notification/message to freelancer
    await supabase.from("messages").insert({
      sender_id: profile.id,
      receiver_id: application.freelancer_id,
      content: `Hello! I have hired you for the job "${application.job.title}". The contract budget of $${hireBudget.toFixed(2)} is secured. Let's begin working.`,
    });

    // Notify freelancer about hiring
    await supabase.from("notifications").insert({
      user_id: application.freelancer_id,
      title: "You Have Been Hired! 🎉",
      content: `Client @${profile.screen_name} hired you for "${application.job.title}". Budget: $${hireBudget.toFixed(2)}.`,
    });

    alert(`Successfully hired @${application.freelancer.screen_name}! Funds are held in contract escrow.`);
    loadClientData();
  };

  // MARK CONTRACT AS COMPLETED (transfers funds to freelancer, closes contract, opens review modal)
  const handleMarkContractCompleted = async (contract: any) => {
    if (!profile) return;
    const confirmComplete = window.confirm(`Confirm contract completion for "${contract.job.title}". This will transfer the contract budget of $${Number(contract.budget).toFixed(2)} to @${contract.freelancer.screen_name}.`);
    if (!confirmComplete) return;

    // 1. Load freelancer profile to add funds
    const { data: freeProf } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", contract.freelancer_id)
      .single();

    if (!freeProf) {
      alert("Failed to find freelancer profile.");
      return;
    }

    const nextFreelancerBalance = Number(freeProf.wallet_balance) + Number(contract.budget);

    // 2. Transfer funds to freelancer's wallet balance
    const { error: transError } = await supabase
      .from("profiles")
      .update({ wallet_balance: nextFreelancerBalance })
      .eq("id", contract.freelancer_id);

    if (transError) {
      alert("Funds transfer failed: " + transError.message);
      return;
    }

    // 3. Create payment record
    await supabase.from("payments").insert({
      contract_id: contract.id,
      sender_id: profile.id,
      receiver_id: contract.freelancer_id,
      amount: contract.budget,
    });

    // 4. Update contract status
    await supabase
      .from("contracts")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", contract.id);

    // 5. Update job status
    await supabase
      .from("jobs")
      .update({ status: "completed" })
      .eq("id", contract.job_id);

    // Notify freelancer about completion
    await supabase.from("notifications").insert({
      user_id: contract.freelancer_id,
      title: "Contract Completed & Paid! 💰",
      content: `Client @${profile.screen_name} marked the contract for "${contract.job.title}" as completed. $${Number(contract.budget).toFixed(2)} has been transferred to your wallet.`,
    });

    alert("Contract completed and freelancer paid! Please leave feedback for them.");
    setReviewContract(contract);
    loadClientData();
  };

  // CANCEL CONTRACT (refunds budget to client)
  const handleCancelContract = async (contract: any) => {
    if (!profile) return;
    const confirmCancel = window.confirm(`Cancel contract for "${contract.job.title}"? The contract budget of $${Number(contract.budget).toFixed(2)} will be refunded back to your client wallet.`);
    if (!confirmCancel) return;

    // 1. Refund client's wallet balance
    const nextClientBalance = Number(profile.wallet_balance) + Number(contract.budget);
    const { error: refundError } = await supabase
      .from("profiles")
      .update({ wallet_balance: nextClientBalance })
      .eq("id", profile.id);

    if (refundError) {
      alert("Refund failed: " + refundError.message);
      return;
    }

    // 2. Update contract status
    await supabase
      .from("contracts")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", contract.id);

    // 3. Reset job status to open
    await supabase
      .from("jobs")
      .update({ status: "cancelled" })
      .eq("id", contract.job_id);

    // Notify freelancer about cancellation
    await supabase.from("notifications").insert({
      user_id: contract.freelancer_id,
      title: "Contract Cancelled ❌",
      content: `Client @${profile.screen_name} has cancelled the contract for "${contract.job.title}".`,
    });

    alert("Contract cancelled and funds refunded to your wallet.");
    loadClientData();
  };

  // Submit Freelancer Review Handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !reviewContract || !comment.trim()) return;

    const { error } = await supabase.from("reviews").insert({
      contract_id: reviewContract.id,
      reviewer_id: profile.id,
      reviewee_id: reviewContract.freelancer_id,
      rating: rating,
      comment: comment.trim(),
    });

    if (error) {
      alert("Failed to submit review: " + error.message);
    } else {
      alert("Review submitted successfully! Thank you.");
      setReviewContract(null);
      setComment("");
      loadClientData();
    }
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
            Cala Client Workspace
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

      {/* Main Client Panel Layout */}
      <main style={{ padding: "40px 24px", flex: 1 }}>
        <div className="container">
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "800" }}>Client Dashboard</h2>
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

          {/* TAB BUTTONS */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "24px", marginBottom: "32px" }}>
            <button 
              onClick={() => setActiveTab("overview")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "overview" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "overview" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              Overview Summaries
            </button>
            <button 
              onClick={() => setActiveTab("post-job")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "post-job" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "post-job" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              Post a Job
            </button>
            <button 
              onClick={() => setActiveTab("manage-jobs")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "manage-jobs" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "manage-jobs" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              Manage Postings ({myJobs.filter(j => j.status === "open").length})
            </button>
            <button 
              onClick={() => setActiveTab("contracts")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "contracts" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "contracts" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              My Contracts ({contracts.filter(c => c.status === "ongoing").length})
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
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Total Payments Spent</p>
                  <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px", color: "var(--error-color)" }}>
                    ${payments.reduce((acc, curr) => acc + Number(curr.amount), 0).toFixed(2)}
                  </h3>
                </div>
                <div className="card">
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Active Hires</p>
                  <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>
                    {contracts.filter(c => c.status === "ongoing").length}
                  </h3>
                </div>
                <div className="card">
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Jobs Posted</p>
                  <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>
                    {myJobs.length}
                  </h3>
                </div>
              </div>

              {/* RECENT PAYMENTS */}
              <div className="card">
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Recent Transactions</h3>
                {payments.slice(0, 5).map((pay, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", padding: "12px 0", fontSize: "14px" }}>
                    <div>
                      <strong>Payment for: {pay.contract.job.title}</strong>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Freelancer: @{pay.receiver.screen_name}</p>
                    </div>
                    <span style={{ color: "var(--error-color)", fontWeight: "700" }}>
                      -${Number(pay.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No payment history logged yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: POST A JOB */}
          {activeTab === "post-job" && (
            <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px" }}>Post a New Project</h3>

              {postError && (
                <div style={{ backgroundColor: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error-color)", padding: "12px", borderRadius: "var(--radius-sm)", fontSize: "14px", marginBottom: "20px" }}>
                  {postError}
                </div>
              )}

              <form onSubmit={handlePostJobSubmit} noValidate>
                
                {/* Title */}
                <div className="form-group">
                  <label className="form-label" htmlFor="jobTitle">Job Title</label>
                  <input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    className={getInputClass("jobTitle")}
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder="e.g. Build React Component Library"
                    required
                  />
                  {validatedFields.jobTitle && errors.jobTitle && (
                    <span className="form-error">{errors.jobTitle}</span>
                  )}
                </div>

                {/* Category select */}
                <div className="form-group">
                  <label className="form-label" htmlFor="jobCategory">Category</label>
                  <select 
                    id="jobCategory"
                    value={jobCategory} 
                    onChange={(e) => {
                      setJobCategory(e.target.value);
                      setJobSkills([]); // Reset skills when category changes
                    }}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid #cbd5e1" }}
                  >
                    {Object.keys(skillsCategories).map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Description with live character count */}
                <div className="form-group">
                  <label className="form-label" htmlFor="jobDescription">Job Description</label>
                  <div className="textarea-container">
                    <textarea
                      id="jobDescription"
                      name="jobDescription"
                      className={getInputClass("jobDescription")}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      style={{ minHeight: "120px", resize: "vertical", width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius-sm)", fontSize: "14px", outline: "none" }}
                      placeholder="Describe the scope of work, timeline, and requirements. Min 150, max 600 characters."
                      required
                    />
                    <span className="textarea-counter">
                      {jobDescription.length}/600
                    </span>
                  </div>
                  {validatedFields.jobDescription && errors.jobDescription && (
                    <span className="form-error">{errors.jobDescription}</span>
                  )}
                </div>

                {/* Budget */}
                <div className="form-group">
                  <label className="form-label" htmlFor="jobBudget">Budget ($ USD)</label>
                  <input
                    id="jobBudget"
                    name="jobBudget"
                    type="text"
                    className={getInputClass("jobBudget")}
                    value={jobBudget}
                    onChange={(e) => setJobBudget(e.target.value)}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder="e.g. 500"
                    required
                  />
                  {validatedFields.jobBudget && errors.jobBudget && (
                    <span className="form-error">{errors.jobBudget}</span>
                  )}
                </div>

                {/* Skills configuration checklist */}
                <div className="form-group" style={{ border: "1px solid var(--border-color)", padding: "16px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--bg-main)" }}>
                  <label className="form-label" style={{ marginBottom: "8px" }}>Required Skills</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxHeight: "150px", overflowY: "auto", padding: "8px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "#ffffff" }}>
                    {skillsCategories[jobCategory]?.map((skill, idx) => (
                      <label key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={jobSkills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                        />
                        {skill}
                      </label>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: "700" }}
                >
                  Post Job Posting
                </button>

              </form>
            </div>
          )}

          {/* TAB 3: MANAGE POSTINGS & CANDIDATES */}
          {activeTab === "manage-jobs" && (
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px" }}>My Posted Jobs</h3>
              {myJobs.map((job, idx) => {
                const jobApps = applications.filter((app) => app.job_id === job.id);
                return (
                  <div key={idx} className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                      <div>
                        <span className="tag">{job.category}</span>
                        <h4 style={{ fontSize: "18px", fontWeight: "700", marginTop: "6px" }}>{job.title}</h4>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          Budget: ${Number(job.budget).toFixed(2)} &bull; Status:{" "}
                          <span style={{ fontWeight: "700", color: job.status === "open" ? "var(--primary-color)" : "var(--text-secondary)" }}>
                            {job.status.toUpperCase()}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Applications candidates section */}
                    {job.status === "open" && (
                      <div>
                        <h5 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Applicants ({jobApps.length})</h5>
                        
                        {jobApps.map((app, aIdx) => (
                          <div key={aIdx} style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "16px", marginBottom: "12px", display: "grid", gridTemplateColumns: "3fr 1fr", gap: "24px", alignItems: "center" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <strong style={{ fontSize: "14px" }}>{app.freelancer.first_name} {app.freelancer.last_name}</strong>
                                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>@{app.freelancer.screen_name}</span>
                                {app.freelancer.is_verified ? (
                                  <span style={{ fontSize: "10px", backgroundColor: "var(--success-bg)", color: "var(--success-color)", border: "1px solid var(--success-border)", padding: "1px 6px", borderRadius: "50px" }}>Verified</span>
                                ) : (
                                  <span style={{ fontSize: "10px", backgroundColor: "var(--error-bg)", color: "var(--error-color)", border: "1px solid var(--error-border)", padding: "1px 6px", borderRadius: "50px" }}>Unverified</span>
                                )}
                              </div>
                              <p style={{ fontSize: "13px", marginTop: "8px", fontStyle: "italic", color: "#444" }}>
                                "{app.cover_letter}"
                              </p>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <button onClick={() => handleHireFreelancer(app)} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "13px" }}>
                                Hire Freelancer
                              </button>
                              <button onClick={() => handleOpenChat(app.freelancer)} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "13px" }}>
                                Message Candidate
                              </button>
                            </div>
                          </div>
                        ))}
                        {jobApps.length === 0 && (
                          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No proposals received yet.</p>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
              {myJobs.length === 0 && (
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No jobs posted yet.</p>
              )}
            </div>
          )}

          {/* TAB 4: MY CONTRACTS */}
          {activeTab === "contracts" && (
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Freelancer Contracts</h3>
              {contracts.map((c, idx) => (
                <div key={idx} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: "700" }}>{c.job.title}</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Freelancer: @{c.freelancer.screen_name} &bull; Budget: ${Number(c.budget).toFixed(2)} &bull; Status:{" "}
                      <span style={{ fontWeight: "700", color: c.status === "completed" ? "var(--success-color)" : c.status === "ongoing" ? "var(--primary-color)" : "var(--error-color)" }}>
                        {c.status.toUpperCase()}
                      </span>
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    {c.status === "ongoing" && (
                      <>
                        <button onClick={() => handleMarkContractCompleted(c)} className="btn btn-primary" style={{ backgroundColor: "var(--success-color)" }}>
                          Mark as Completed & Pay
                        </button>
                        <button onClick={() => handleCancelContract(c)} className="btn btn-outline" style={{ color: "var(--error-color)", borderColor: "var(--error-border)" }}>
                          Cancel Contract
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {contracts.length === 0 && (
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No active contracts found.</p>
              )}

              {/* REVIEW FREELANCER MODAL */}
              {reviewContract && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
                  <div className="card" style={{ width: "100%", maxWidth: "500px", backgroundColor: "#fff", padding: "32px", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Review Freelancer for: {reviewContract.job.title}</h3>
                    
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
                          placeholder="Provide a review of the freelancer's performance."
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

          {/* TAB 5: MESSAGES */}
          {activeTab === "messages" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2.8fr", gap: "24px", height: "450px" }}>
              {/* CHAT PARTNERS */}
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

              {/* CHAT BOX */}
              <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "#fff", display: "flex", flexDirection: "column" }}>
                {selectedChatPartner ? (
                  <>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "14px" }}>{selectedChatPartner.first_name} {selectedChatPartner.last_name}</strong>
                        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>@{selectedChatPartner.screen_name}</p>
                      </div>
                    </div>

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

          {/* TAB 6: WALLET & PAYMENTS */}
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
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Spending History</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                        <th style={{ padding: "10px 12px" }}>Contract / Job</th>
                        <th style={{ padding: "10px 12px" }}>Receiver (Freelancer)</th>
                        <th style={{ padding: "10px 12px" }}>Amount Spent</th>
                        <th style={{ padding: "10px 12px" }}>Transaction Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: "600" }}>{p.contract.job.title}</td>
                          <td style={{ padding: "10px 12px" }}>@{p.receiver.screen_name} ({p.receiver.first_name} {p.receiver.last_name})</td>
                          <td style={{ padding: "10px 12px", color: "var(--error-color)", fontWeight: "700" }}>-${Number(p.amount).toFixed(2)}</td>
                          <td style={{ padding: "10px 12px" }}>{new Date(p.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: "16px", textAlign: "center", color: "var(--text-secondary)" }}>No spending history found.</td>
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
