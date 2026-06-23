"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Header from "@/components/Header";

export default function AboutPage() {
  const supabase = createClient();
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (prof) setCurrentUserProfile(prof);
      }
    };
    fetchSession();
  }, [supabase]);

  return (
    <>
      <style>{`
        .about-hero {
          background: linear-gradient(135deg, var(--primary-light) 0%, #e0f2fe 100%);
          padding: 80px 24px;
          text-align: center;
          border-bottom: 1px solid var(--border-color);
        }
        .about-section {
          padding: 64px 24px;
        }
        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        @media (max-width: 768px) {
          .about-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }
        }
        .feature-card {
          padding: 32px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
      `}</style>

      {/* Header */}
      <Header profile={currentUserProfile} activeWorkspace="info" workspaceTitle="About Cala" />

      {/* Hero Section */}
      <section className="about-hero">
        <div className="container" style={{ maxWidth: "800px" }}>
          <h1 style={{ fontSize: "40px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-1px", lineHeight: "1.2", marginBottom: "20px" }}>
            The Escrow-Secured Marketplace for Global <span>Talent</span>
          </h1>
          <p style={{ fontSize: "18px", color: "var(--text-secondary)", lineHeight: "1.6", maxWidth: "600px", margin: "0 auto" }}>
            Cala bridges the gap between top-tier freelancers and ambitious businesses through structured collaboration and instant, risk-free escrow contracts.
          </p>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="about-section" style={{ backgroundColor: "#ffffff" }}>
        <div className="container" style={{ maxWidth: "1000px" }}>
          <div className="about-grid">
            <div>
              <h2 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "20px" }}>
                Our Mission & Vision
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: "1.7", marginBottom: "16px" }}>
                At Cala, we believe that the future of work is remote, specialized, and built on trust. Traditional marketplaces often penalize users with excessive transaction fees, complex payout rules, and opaque communication.
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: "1.7" }}>
                We are building a clean, straightforward platform where clients can post jobs or purchase pre-packaged freelancer services. Funds are secured instantly in escrow at contract kickoff, protecting both parties and ensuring peace of mind.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="feature-card">
                <h4 style={{ fontSize: "16px", fontWeight: "700", color: "var(--primary-color)", marginBottom: "8px" }}>🔐 Trust & Escrow Guarantee</h4>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Payments are secured inside contracts and released only when deliverables are approved by the client.</p>
              </div>
              <div className="feature-card">
                <h4 style={{ fontSize: "16px", fontWeight: "700", color: "var(--success-color)", marginBottom: "8px" }}>⭐ Verified Professionals</h4>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>All members must complete ID verification by administrators before initiating applications or contracts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick links to help directories */}
      <section className="about-section" style={{ backgroundColor: "var(--bg-main)", borderTop: "1px solid var(--border-color)" }}>
        <div className="container" style={{ maxWidth: "800px", textAlign: "center" }}>
          <h2 style={{ fontSize: "26px", fontWeight: "800", marginBottom: "16px" }}>Ready to Start Your Journey?</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "32px" }}>
            Explore listings, verify your account, and scale your operations with Cala today.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <Link href="/browse/jobs" className="btn btn-primary" style={{ padding: "12px 24px" }}>
              Browse Jobs
            </Link>
            <Link href="/browse/services" className="btn btn-outline" style={{ padding: "12px 24px", backgroundColor: "#fff" }}>
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <p>&copy; {new Date().getFullYear()} Cala Freelance Marketplace. All rights reserved.</p>
          <div style={{ display: "flex", gap: "16px" }}>
            <Link href="/faq" className="nav-link">FAQ Support</Link>
            <Link href="/contact" className="nav-link">Contact Us</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
