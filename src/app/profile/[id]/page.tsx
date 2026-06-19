"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicProfilePage({ params }: PageProps) {
  const router = useRouter();
  const supabase = createClient();
  const { id: targetUserId } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [targetSkills, setTargetSkills] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

      setIsLoading(false);
    };

    loadProfileData();
  }, [targetUserId]);

  const handleMessageUser = async () => {
    if (!currentUserId || !currentUserProfile) {
      router.push("/login");
      return;
    }

    // Insert an initial simulated greeting in messages so they appear in conversation history
    const { error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: targetUserId,
      content: `Hello! I viewed your public profile and would like to connect.`,
    });

    // Redirect to respective workspace messaging with chat partner preset
    if (currentUserProfile.is_freelancer) {
      router.push(`/freelancer/dashboard?chat=${targetUserId}`);
    } else {
      router.push(`/client/dashboard?chat=${targetUserId}`);
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
      <header className="header">
        <div className="container header-container">
          <Link href="/" className="logo">
            <div className="logo-icon">C</div>
            Cala
          </Link>
          <nav className="nav-links">
            {currentUserId ? (
              <Link href="/profile/view" className="nav-link">My Profile</Link>
            ) : (
              <>
                <Link href="/login" className="nav-link">Log in</Link>
                <Link href="/signup" className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "13px" }}>Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Profile Detail View */}
      <main style={{ padding: "48px 24px", flex: 1, display: "flex", justifyContent: "center" }}>
        <div className="card" style={{ width: "100%", maxWidth: "700px", padding: "40px" }}>
          
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
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

            {currentUserId && (
              <button onClick={handleMessageUser} className="btn btn-primary" style={{ padding: "8px 16px" }}>
                Send Message
              </button>
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
            <div>
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
