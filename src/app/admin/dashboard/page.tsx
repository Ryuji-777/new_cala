"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentAdminProfile, setCurrentAdminProfile] = useState<any>(null);

  // Tabs: "overview", "approvals", "users", "super-admin"
  const [activeTab, setActiveTab] = useState("overview");

  // Data lists
  const [profiles, setProfiles] = useState<any[]>([]);
  const [unverifiedProfiles, setUnverifiedProfiles] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);

  // Health stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    freelancers: 0,
    clients: 0,
    admins: 0,
  });

  // User creation form
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "both", // 'freelancer', 'client', or 'both'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formActiveField, setFormActiveField] = useState<string | null>(null);
  const [formValidated, setFormValidated] = useState<Record<string, boolean>>({});
  const [newUserError, setNewUserError] = useState<string | null>(null);

  // Promote admin search query
  const [promoteSearch, setPromoteSearch] = useState("");

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const verifyAdminAccess = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile || (!profile.is_admin && !profile.is_super_admin)) {
      alert("Access Denied: You are not authorized to view the Admin Dashboard.");
      router.push("/profile/view");
      return;
    }

    setCurrentAdminProfile(profile);
    setIsAdmin(profile.is_admin);
    setIsSuperAdmin(profile.is_super_admin);

    await loadStats();
    await loadDataLists();
    await loadNotifications(user.id);
    setIsLoading(false);
  };

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
    if (!currentAdminProfile) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", currentAdminProfile.id);
    loadNotifications(currentAdminProfile.id);
  };

  const loadStats = async () => {
    const { data: allProfiles } = await supabase.from("profiles").select("id, is_verified, is_freelancer, is_client, is_admin");
    if (allProfiles) {
      setStats({
        totalUsers: allProfiles.length,
        verifiedUsers: allProfiles.filter((p) => p.is_verified).length,
        freelancers: allProfiles.filter((p) => p.is_freelancer).length,
        clients: allProfiles.filter((p) => p.is_client).length,
        admins: allProfiles.filter((p) => p.is_admin).length,
      });
    }
  };

  const loadDataLists = async () => {
    // Fetch all profiles
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (allProfiles) {
      setProfiles(allProfiles);
      setUnverifiedProfiles(allProfiles.filter((p) => !p.is_verified && p.id_attachment_url));
    }

    // Fetch logs (only for super admin, but fetch anyway)
    const { data: logs } = await supabase
      .from("system_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (logs) setSystemLogs(logs);

    // Fetch archives
    const { data: archs } = await supabase
      .from("archives")
      .select("*")
      .order("deleted_at", { ascending: false });
    if (archs) setArchives(archs);
  };

  useEffect(() => {
    verifyAdminAccess();
  }, []);

  // Approve ID Handler
  const handleApproveId = async (profileId: string, screenName: string) => {
    if (!currentAdminProfile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: true })
      .eq("id", profileId);

    if (error) {
      alert("Error approving ID: " + error.message);
      return;
    }

    // Log action
    await supabase.from("system_logs").insert({
      actor_id: currentAdminProfile.id,
      actor_email: currentAdminProfile.email,
      action: "approve_user_id",
      details: { target_id: profileId, screen_name: screenName },
    });

    // Notify user
    await supabase.from("notifications").insert({
      user_id: profileId,
      title: "ID Verification Approved! 🎉",
      content: "Administrator has successfully approved your ID. You are now verified on Cala.",
    });

    alert(`Successfully approved ID for @${screenName}`);
    loadStats();
    loadDataLists();
  };

  // Reject ID Handler (resets ID attachment to null)
  const handleRejectId = async (profileId: string, screenName: string) => {
    if (!currentAdminProfile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ id_attachment_url: null, is_verified: false })
      .eq("id", profileId);

    if (error) {
      alert("Error rejecting ID: " + error.message);
      return;
    }

    // Log action
    await supabase.from("system_logs").insert({
      actor_id: currentAdminProfile.id,
      actor_email: currentAdminProfile.email,
      action: "reject_user_id",
      details: { target_id: profileId, screen_name: screenName },
    });

    // Notify user
    await supabase.from("notifications").insert({
      user_id: profileId,
      title: "ID Verification Rejected ⚠️",
      content: "Your ID document was rejected by the administrator. Please update and re-upload in your profile edit view.",
    });

    alert(`Rejected ID attachment for @${screenName}. They will need to re-upload.`);
    loadStats();
    loadDataLists();
  };

  // Promote / Demote Admin
  const handleToggleAdminStatus = async (targetId: string, screenName: string, makeAdmin: boolean) => {
    if (!currentAdminProfile || !isSuperAdmin) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: makeAdmin })
      .eq("id", targetId);

    if (error) {
      alert("Failed to update admin role: " + error.message);
      return;
    }

    // Log Action
    await supabase.from("system_logs").insert({
      actor_id: currentAdminProfile.id,
      actor_email: currentAdminProfile.email,
      action: makeAdmin ? "promote_admin" : "demote_admin",
      details: { target_id: targetId, screen_name: screenName },
    });

    alert(`Updated admin status for @${screenName}`);
    loadStats();
    loadDataLists();
  };

  // Delete User Handler (stages to archives first, then deletes profile)
  const handleDeleteUser = async (targetProfile: any) => {
    if (!currentAdminProfile) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete user @${targetProfile.screen_name || targetProfile.first_name}? This action will archive and delete their public profile.`);
    
    if (!confirmDelete) return;

    // 1. Insert into archives
    const { error: archiveError } = await supabase.from("archives").insert({
      resource_type: "user",
      original_id: targetProfile.id,
      data: targetProfile,
      deleted_by: currentAdminProfile.id,
      deleted_by_email: currentAdminProfile.email,
    });

    if (archiveError) {
      alert("Failed to archive user details: " + archiveError.message);
      return;
    }

    // 2. Delete profile
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", targetProfile.id);

    if (deleteError) {
      alert("Failed to delete user profile: " + deleteError.message);
      return;
    }

    // 3. Log Action
    await supabase.from("system_logs").insert({
      actor_id: currentAdminProfile.id,
      actor_email: currentAdminProfile.email,
      action: "delete_user",
      details: { target_id: targetProfile.id, screen_name: targetProfile.screen_name, first_name: targetProfile.first_name },
    });

    alert("User deleted and archived successfully.");
    loadStats();
    loadDataLists();
  };

  // Validate Add User field
  const validateForm = (name: string, value: string): string => {
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
        if (!emailRegex.test(value)) return "Please enter a valid email.";
        return "";
      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        return "";
      default:
        return "";
    }
  };

  // Form validator trigger
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    Object.keys(newUserForm).forEach((key) => {
      if (key !== "role") {
        const val = newUserForm[key as keyof typeof newUserForm];
        const errorMsg = validateForm(key, val);
        if (errorMsg) newErrors[key] = errorMsg;
      }
    });
    setFormErrors(newErrors);
  }, [newUserForm]);

  const getFormInputClass = (name: string) => {
    const base = "form-input";
    if (formActiveField === name) return base;
    if (formValidated[name]) {
      return formErrors[name] ? `${base} is-invalid` : `${base} is-valid`;
    }
    return base;
  };

  // Add User Submission
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewUserError(null);

    const allValidated = { firstName: true, lastName: true, email: true, password: true };
    setFormValidated(allValidated);

    if (Object.keys(formErrors).length > 0) return;

    try {
      // Sign up via Supabase (since we don't have Admin API service key in frontend client, we create via normal signUp)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: {
          data: {
            first_name: newUserForm.firstName,
            last_name: newUserForm.lastName,
          }
        }
      });

      if (signUpError) {
        setNewUserError(signUpError.message);
        return;
      }

      if (signUpData.user) {
        // Normal trigger handle_new_user executes. Let's update additional roles if chosen
        const isFree = newUserForm.role === "freelancer" || newUserForm.role === "both";
        const isCli = newUserForm.role === "client" || newUserForm.role === "both";

        await supabase
          .from("profiles")
          .update({
            is_freelancer: isFree,
            is_client: isCli,
            screen_name: `user_${Math.floor(Math.random() * 100000)}`, // Default screen name
            description: "Profile created by system administrator. Needs update.",
            is_verified: true, // Auto-verified since admin created them
          })
          .eq("id", signUpData.user.id);

        // Log Action
        if (currentAdminProfile) {
          await supabase.from("system_logs").insert({
            actor_id: currentAdminProfile.id,
            actor_email: currentAdminProfile.email,
            action: "add_user",
            details: { target_email: newUserForm.email, role: newUserForm.role },
          });
        }

        alert("User created successfully!");
        setShowAddUserModal(false);
        setNewUserForm({ firstName: "", lastName: "", email: "", password: "", role: "both" });
        setFormValidated({});
        loadStats();
        loadDataLists();
      }
    } catch (err: any) {
      setNewUserError("Failed to add user.");
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
        <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>Verifying Administrative Access...</p>
      </div>
    );
  }

  // Filter profiles for Super Admin promote role lookup
  const filteredPromoteList = profiles.filter((p) =>
    (p.screen_name || p.email).toLowerCase().includes(promoteSearch.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="container header-container">
          <Link href="/" className="logo">
            <div className="logo-icon">C</div>
            Cala Admin Portal
          </Link>
          <nav className="nav-links">
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
              Welcome, {currentAdminProfile.first_name} ({isSuperAdmin ? "Super Admin" : "Admin"})
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

      <main style={{ padding: "40px 24px", flex: 1 }}>
        <div className="container">
          
          <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "24px" }}>
            Control Dashboard
          </h2>

          {/* TAB BUTTONS */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "24px", marginBottom: "32px" }}>
            <button 
              onClick={() => setActiveTab("overview")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "overview" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "overview" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              Overview & Health
            </button>
            <button 
              onClick={() => setActiveTab("approvals")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "approvals" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "approvals" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              ID Approvals ({unverifiedProfiles.length})
            </button>
            <button 
              onClick={() => setActiveTab("users")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "users" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "users" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              User Management
            </button>
            {isSuperAdmin && (
              <button 
                onClick={() => setActiveTab("super-admin")} 
                style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "super-admin" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "super-admin" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
              >
                Super Admin Controls
              </button>
            )}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div className="card">
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Total Users</p>
                <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>{stats.totalUsers}</h3>
              </div>
              <div className="card">
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Verified IDs</p>
                <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px", color: "var(--success-color)" }}>
                  {stats.verifiedUsers} <span style={{ fontSize: "14px", fontWeight: "400", color: "var(--text-secondary)" }}>({stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%)</span>
                </h3>
              </div>
              <div className="card">
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Freelancers</p>
                <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>{stats.freelancers}</h3>
              </div>
              <div className="card">
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Clients</p>
                <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>{stats.clients}</h3>
              </div>
              <div className="card">
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>System Admins</p>
                <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px", color: "var(--primary-color)" }}>{stats.admins}</h3>
              </div>
            </div>
          )}

          {/* TAB 2: ID APPROVALS */}
          {activeTab === "approvals" && (
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Pending Document Approvals</h3>
              {unverifiedProfiles.map((user, idx) => (
                <div key={idx} className="card" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "center" }}>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: "700" }}>{user.first_name} {user.last_name}</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      @{user.screen_name} &bull; {user.email} &bull; {user.city}, {user.state}, {user.country}
                    </p>
                    <p style={{ fontSize: "14px", marginTop: "10px", fontStyle: "italic", color: "#555" }}>
                      "{user.description}"
                    </p>
                    
                    {/* Simulated Attached ID display */}
                    <div style={{ marginTop: "14px", display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#f1f5f9", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                      <span style={{ fontSize: "16px" }}>📄</span>
                      <a href={user.id_attachment_url} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "var(--primary-color)", fontWeight: "600" }}>
                        View Attached ID Document
                      </a>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button onClick={() => handleApproveId(user.id, user.screen_name)} className="btn btn-primary" style={{ backgroundColor: "var(--success-color)" }}>
                      Approve ID
                    </button>
                    <button onClick={() => handleRejectId(user.id, user.screen_name)} className="btn btn-outline" style={{ color: "var(--error-color)", borderColor: "var(--error-border)" }}>
                      Reject / Request Re-upload
                    </button>
                  </div>
                </div>
              ))}
              {unverifiedProfiles.length === 0 && (
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No profiles currently pending ID verification.</p>
              )}
            </div>
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {activeTab === "users" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700" }}>All Registered Accounts ({profiles.length})</h3>
                <button onClick={() => setShowAddUserModal(true)} className="btn btn-primary">
                  + Add User
                </button>
              </div>

              {/* LIST USERS */}
              <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "#fff" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ padding: "12px 16px" }}>Name</th>
                      <th style={{ padding: "12px 16px" }}>Username</th>
                      <th style={{ padding: "12px 16px" }}>Email</th>
                      <th style={{ padding: "12px 16px" }}>Role Mode</th>
                      <th style={{ padding: "12px 16px" }}>Verification</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: "600" }}>{p.first_name} {p.last_name}</td>
                        <td style={{ padding: "12px 16px" }}>@{p.screen_name || "unset"}</td>
                        <td style={{ padding: "12px 16px" }}>{p.email}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {p.is_freelancer && <span className="tag" style={{ marginRight: "4px" }}>Freelancer</span>}
                          {p.is_client && <span className="tag">Client</span>}
                          {!p.is_freelancer && !p.is_client && <span style={{ color: "#aaa" }}>none</span>}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {p.is_verified ? (
                            <span style={{ color: "var(--success-color)", fontWeight: "600" }}>Verified</span>
                          ) : (
                            <span style={{ color: "var(--text-secondary)" }}>Pending</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button 
                            onClick={() => handleDeleteUser(p)} 
                            disabled={p.id === currentAdminProfile.id}
                            className="btn btn-outline" 
                            style={{ padding: "4px 8px", fontSize: "12px", color: "var(--error-color)", borderColor: "var(--error-border)" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ADD USER MODAL */}
              {showAddUserModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
                  <div className="card" style={{ width: "100%", maxWidth: "450px", backgroundColor: "#fff", padding: "32px", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Add New Account</h3>
                    
                    {newUserError && (
                      <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)", padding: "10px", fontSize: "13px", borderRadius: "var(--radius-sm)", marginBottom: "12px" }}>
                        {newUserError}
                      </div>
                    )}

                    <form onSubmit={handleAddUser} noValidate>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div className="form-group">
                          <label className="form-label">First Name</label>
                          <input
                            type="text"
                            value={newUserForm.firstName}
                            className={getFormInputClass("firstName")}
                            onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                            onFocus={() => setFormActiveField("firstName")}
                            onBlur={() => { setFormActiveField(null); setFormValidated(p => ({ ...p, firstName: true })); }}
                            required
                          />
                          {formValidated.firstName && formErrors.firstName && (
                            <span className="form-error">{formErrors.firstName}</span>
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Last Name</label>
                          <input
                            type="text"
                            value={newUserForm.lastName}
                            className={getFormInputClass("lastName")}
                            onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                            onFocus={() => setFormActiveField("lastName")}
                            onBlur={() => { setFormActiveField(null); setFormValidated(p => ({ ...p, lastName: true })); }}
                            required
                          />
                          {formValidated.lastName && formErrors.lastName && (
                            <span className="form-error">{formErrors.lastName}</span>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          value={newUserForm.email}
                          className={getFormInputClass("email")}
                          onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                          onFocus={() => setFormActiveField("email")}
                          onBlur={() => { setFormActiveField(null); setFormValidated(p => ({ ...p, email: true })); }}
                          required
                        />
                        {formValidated.email && formErrors.email && (
                          <span className="form-error">{formErrors.email}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          value={newUserForm.password}
                          className={getFormInputClass("password")}
                          onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                          onFocus={() => setFormActiveField("password")}
                          onBlur={() => { setFormActiveField(null); setFormValidated(p => ({ ...p, password: true })); }}
                          required
                        />
                        {formValidated.password && formErrors.password && (
                          <span className="form-error">{formErrors.password}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Role Type</label>
                        <select 
                          value={newUserForm.role}
                          onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid #cbd5e1" }}
                        >
                          <option value="freelancer">Freelancer Mode</option>
                          <option value="client">Client Mode</option>
                          <option value="both">Both Freelancer & Client</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                        <button type="button" onClick={() => setShowAddUserModal(false)} className="btn btn-outline">Cancel</button>
                        <button type="submit" className="btn btn-primary">Create User</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SUPER ADMIN CONTROLS */}
          {activeTab === "super-admin" && isSuperAdmin && (
            <div>
              {/* PROMOTE ADMIN */}
              <div className="card" style={{ marginBottom: "32px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px" }}>Add System Administrators</h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                  Search for any user screen name or email to grant/revoke admin status.
                </p>
                <input
                  type="text"
                  placeholder="Search user..."
                  className="form-input"
                  style={{ marginBottom: "16px" }}
                  value={promoteSearch}
                  onChange={(e) => setPromoteSearch(e.target.value)}
                />
                
                {promoteSearch && (
                  <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", maxHeight: "160px", overflowY: "auto" }}>
                    {filteredPromoteList.map((user, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                        <span>
                          <strong>{user.first_name} {user.last_name}</strong> (@{user.screen_name || "unset"}) &bull; {user.email}
                        </span>
                        
                        {user.id !== currentAdminProfile.id && (
                          <button 
                            onClick={() => handleToggleAdminStatus(user.id, user.screen_name, !user.is_admin)}
                            className="btn btn-outline"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                          >
                            {user.is_admin ? "Demote from Admin" : "Promote to Admin"}
                          </button>
                        )}
                      </div>
                    ))}
                    {filteredPromoteList.length === 0 && (
                      <p style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>No matching users found.</p>
                    )}
                  </div>
                )}
              </div>

              {/* AUDIT LOGS */}
              <div className="card" style={{ marginBottom: "32px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>System Action & Audit Logs</h3>
                <div style={{ maxHeight: "240px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "13px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                        <th style={{ padding: "8px 12px" }}>Admin Actor</th>
                        <th style={{ padding: "8px 12px" }}>Action</th>
                        <th style={{ padding: "8px 12px" }}>Details</th>
                        <th style={{ padding: "8px 12px" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemLogs.map((log, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "8px 12px", fontWeight: "600" }}>{log.actor_email}</td>
                          <td style={{ padding: "8px 12px" }}><span className="tag">{log.action}</span></td>
                          <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{JSON.stringify(log.details)}</td>
                          <td style={{ padding: "8px 12px" }}>{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {systemLogs.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: "12px", textAlign: "center", color: "var(--text-secondary)" }}>No system logs available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ARCHIVES */}
              <div className="card">
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Archived Deleted Entities</h3>
                <div style={{ maxHeight: "240px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "13px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                        <th style={{ padding: "8px 12px" }}>Type</th>
                        <th style={{ padding: "8px 12px" }}>Original ID</th>
                        <th style={{ padding: "8px 12px" }}>Deleted By</th>
                        <th style={{ padding: "8px 12px" }}>Archive Details (JSON)</th>
                        <th style={{ padding: "8px 12px" }}>Deleted Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archives.map((a, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "8px 12px", fontWeight: "600" }}><span className="tag">{a.resource_type}</span></td>
                          <td style={{ padding: "8px 12px" }}>{a.original_id}</td>
                          <td style={{ padding: "8px 12px" }}>{a.deleted_by_email}</td>
                          <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{JSON.stringify(a.data)}</td>
                          <td style={{ padding: "8px 12px" }}>{new Date(a.deleted_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {archives.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: "12px", textAlign: "center", color: "var(--text-secondary)" }}>No archived items found.</td>
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
          <p>&copy; {new Date().getFullYear()} Cala Freelance Marketplace. Admin Portal.</p>
        </div>
      </footer>
    </>
  );
}
