"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface HeaderProps {
  profile?: any;
  onProfileUpdate?: () => void;
  activeWorkspace?: "client" | "freelancer" | "admin" | "home" | "profile" | "browse" | "info";
  workspaceTitle?: string;
}

export default function Header({
  profile: propProfile,
  onProfileUpdate,
  activeWorkspace = "home",
  workspaceTitle,
}: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(propProfile || null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(!propProfile);

  const notifRef = useRef<HTMLDivElement>(null);

  // Sync profile when propProfile changes
  useEffect(() => {
    if (propProfile) {
      setProfile(propProfile);
      setLoading(false);
    }
  }, [propProfile]);

  // Fetch session & profile if not passed as prop
  useEffect(() => {
    if (propProfile) return;

    const fetchSessionAndProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (!error && prof) {
            setProfile(prof);
          }
        }
      } catch (err) {
        console.error("Error fetching header profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndProfile();
  }, [propProfile, supabase]);

  // Load Notifications
  const loadNotifications = async (uId: string) => {
    try {
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uId)
        .order("created_at", { ascending: false });

      if (notifs) {
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      loadNotifications(profile.id);

      // Setup polling or database real-time subscription for notifications
      const channel = supabase
        .channel(`public:notifications:user_id=${profile.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${profile.id}`,
          },
          () => {
            loadNotifications(profile.id);
            if (onProfileUpdate) {
              onProfileUpdate();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id, supabase]);

  // Handle Mark All Read
  const handleMarkAllRead = async () => {
    if (!profile?.id) return;
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", profile.id);
      
      loadNotifications(profile.id);
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Dynamic Workspace display text
  const displayTitle = workspaceTitle || (
    activeWorkspace === "client" ? "Cala Client Workspace" :
    activeWorkspace === "freelancer" ? "Cala Freelancer Workspace" :
    activeWorkspace === "admin" ? "Cala Admin Workspace" : "Cala"
  );

  return (
    <header className="header">
      <div className="container header-container">
        <Link href="/" className="logo" id="nav-logo">
          <div className="logo-icon">C</div>
          {displayTitle}
        </Link>

        <nav className="nav-links">
          {/* Guest Navigation */}
          {!loading && !profile && (
            <>
              <Link href="/browse/jobs" className="nav-link" id="nav-browse-jobs">
                Browse Jobs
              </Link>
              <Link href="/browse/services" className="nav-link" id="nav-browse-services">
                Browse Services
              </Link>
              <Link href="/login" className="nav-link" id="nav-login">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary" id="nav-signup">
                Sign up
              </Link>
            </>
          )}

          {/* Authenticated Navigation */}
          {!loading && profile && (
            <>
              {/* Wallet Balance Display */}
              {profile.wallet_balance !== undefined && (
                <span 
                  style={{ 
                    fontSize: "13px", 
                    fontWeight: "700", 
                    color: "var(--success-color)", 
                    backgroundColor: "var(--success-bg)", 
                    border: "1px solid var(--success-border)", 
                    padding: "4px 10px", 
                    borderRadius: "50px" 
                  }}
                  title="Simulated Wallet Balance"
                >
                  Balance: ${Number(profile.wallet_balance).toFixed(2)}
                </span>
              )}

              {/* Client / Freelancer Switchers */}
              {profile.is_client && profile.is_freelancer && (
                <>
                  {activeWorkspace === "freelancer" ? (
                    <Link href="/client/dashboard" className="btn btn-blue-outline" style={{ padding: "6px 12px", fontSize: "12px" }}>
                      Switch to Client
                    </Link>
                  ) : activeWorkspace === "client" ? (
                    <Link href="/freelancer/dashboard" className="btn btn-blue-outline" style={{ padding: "6px 12px", fontSize: "12px" }}>
                      Switch to Freelancer
                    </Link>
                  ) : (
                    // On other pages (home, view profile etc), show quick links to both
                    <>
                      <Link href="/client/dashboard" className="nav-link" style={{ fontSize: "13px" }}>
                        Client Workspace
                      </Link>
                      <Link href="/freelancer/dashboard" className="nav-link" style={{ fontSize: "13px" }}>
                        Freelancer Workspace
                      </Link>
                    </>
                  )}
                </>
              )}

              {/* If user is only client, show shortcut to client dashboard */}
              {profile.is_client && !profile.is_freelancer && activeWorkspace !== "client" && (
                <Link href="/client/dashboard" className="nav-link" style={{ fontSize: "13px" }}>
                  Client Workspace
                </Link>
              )}

              {/* If user is only freelancer, show shortcut to freelancer dashboard */}
              {profile.is_freelancer && !profile.is_client && activeWorkspace !== "freelancer" && (
                <Link href="/freelancer/dashboard" className="nav-link" style={{ fontSize: "13px" }}>
                  Freelancer Workspace
                </Link>
              )}

              {/* Admin Dashboard shortcut if authorized */}
              {(profile.is_admin || profile.is_super_admin) && activeWorkspace !== "admin" && (
                <Link href="/admin/dashboard" className="nav-link" style={{ fontSize: "13px", color: "var(--primary-hover)" }}>
                  Admin Dashboard
                </Link>
              )}

              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
                Logged in as: {profile.first_name} {profile.last_name}
              </span>

              <Link href="/profile/view" className="nav-link" id="nav-my-profile">
                My Profile
              </Link>

              {/* Notifications Dropdown Bell */}
              <div className="notif-container" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="notif-bell-btn"
                  title="Notifications"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>

                {showNotifications && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span className="notif-title">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="notif-mark-read" type="button">
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

              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "13px" }} type="button">
                Log Out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
