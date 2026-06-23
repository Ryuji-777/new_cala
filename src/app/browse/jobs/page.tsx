"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Header from "@/components/Header";

// Predefined categories
const categories = [
  "All",
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

export default function BrowseJobsPage() {
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest", "budget_desc", "budget_asc"

  useEffect(() => {
    const initPage = async () => {
      setIsLoading(true);
      try {
        // Get user session if logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (prof) setCurrentUserProfile(prof);
        }

        // Fetch open jobs
        const { data: openJobs, error } = await supabase
          .from("jobs")
          .select("*, client:profiles(first_name, last_name, screen_name, id)")
          .eq("status", "open")
          .order("created_at", { ascending: false });

        if (!error && openJobs) {
          setJobs(openJobs);
        }
      } catch (err) {
        console.error("Error loading browse page:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, [supabase]);

  // Client-side filtering logic
  const filteredJobs = jobs
    .filter((job) => {
      const matchCategory = selectedCategory === "All" || job.category === selectedCategory;
      const matchSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.client?.first_name && job.client.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.client?.last_name && job.client.last_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const budgetVal = Number(job.budget);
      const matchMinBudget = minBudget === "" || budgetVal >= Number(minBudget);
      const matchMaxBudget = maxBudget === "" || budgetVal <= Number(maxBudget);

      return matchCategory && matchSearch && matchMinBudget && matchMaxBudget;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "budget_desc") {
        return Number(b.budget) - Number(a.budget);
      }
      if (sortBy === "budget_asc") {
        return Number(a.budget) - Number(b.budget);
      }
      return 0;
    });

  return (
    <>
      <style>{`
        .pulse {
          animation: pulse-animation 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-animation {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .browse-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .browse-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg) !important;
        }
        .filter-btn {
          padding: 8px 16px;
          border-radius: 50px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-card);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .filter-btn.active {
          background-color: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
        .filter-btn:hover:not(.active) {
          background-color: var(--primary-light);
          color: var(--primary-color);
          border-color: var(--primary-color);
        }
      `}</style>

      {/* Header */}
      <Header profile={currentUserProfile} activeWorkspace="browse" workspaceTitle="Browse Jobs" />

      <main style={{ padding: "48px 24px", flex: 1 }}>
        <div className="container" style={{ maxWidth: "1000px" }}>
          
          {/* Headline */}
          <div style={{ marginBottom: "32px", textAlign: "center" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "8px" }}>
              Explore Open Projects
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
              Discover freelance opportunities posted by verified clients and submit your proposals.
            </p>
          </div>

          {/* Search & Inputs Bar */}
          <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              
              {/* Text Search */}
              <div style={{ flex: "1 1 300px", position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search jobs by title, description or client name..."
                  className="form-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Budget Min/Max */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: "0 1 260px" }}>
                <input
                  type="number"
                  placeholder="Min Budget ($)"
                  className="form-input"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                />
                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>to</span>
                <input
                  type="number"
                  placeholder="Max Budget ($)"
                  className="form-input"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                />
              </div>

              {/* Sort Dropdown */}
              <div style={{ flex: "0 1 180px" }}>
                <select
                  className="form-input"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  <option value="newest">Newest First</option>
                  <option value="budget_desc">Highest Budget</option>
                  <option value="budget_asc">Lowest Budget</option>
                </select>
              </div>

            </div>

            {/* Category horizontal scrolling bar */}
            <div>
              <label className="form-label" style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>
                Category Filter
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", overflowX: "auto", paddingBottom: "4px" }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Jobs Listing Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {isLoading ? (
              // Pulsing skeletons
              [1, 2, 3].map((num) => (
                <div key={num} className="card pulse" style={{ padding: "24px", minHeight: "150px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div className="skeleton" style={{ width: "120px", height: "20px", backgroundColor: "#e2e8f0" }}></div>
                    <div className="skeleton" style={{ width: "80px", height: "20px", backgroundColor: "#e2e8f0" }}></div>
                  </div>
                  <div className="skeleton" style={{ width: "60%", height: "24px", backgroundColor: "#e2e8f0", marginBottom: "12px" }}></div>
                  <div className="skeleton" style={{ width: "90%", height: "16px", backgroundColor: "#e2e8f0", marginBottom: "8px" }}></div>
                  <div className="skeleton" style={{ width: "40%", height: "16px", backgroundColor: "#e2e8f0" }}></div>
                </div>
              ))
            ) : filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="card browse-card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "24px",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span className="tag" style={{ marginBottom: "8px", backgroundColor: "var(--primary-light)", color: "var(--primary-color)", fontWeight: "600" }}>
                      {job.category}
                    </span>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginTop: "4px" }}>
                      <Link href={`/jobs/${job.id}`} style={{ color: "var(--primary-color)", textDecoration: "underline" }}>
                        {job.title}
                      </Link>
                    </h3>
                    
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Posted by:{" "}
                      <Link href={`/profile/${job.client_id}`} style={{ color: "var(--primary-color)", fontWeight: "600", textDecoration: "underline" }}>
                        {job.client?.first_name} {job.client?.last_name}
                      </Link>{" "}
                      (@{job.client?.screen_name}) &bull; Budget: ${Number(job.budget).toFixed(2)} &bull; Date: {new Date(job.created_at).toLocaleDateString()}
                    </p>

                    <p style={{ fontSize: "14px", color: "#555", marginTop: "12px", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                      {job.description}
                    </p>

                    {job.skills_required && job.skills_required.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                        {job.skills_required.map((s: string, sIdx: number) => (
                          <span key={sIdx} className="tag" style={{ fontSize: "11px" }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Link href={`/jobs/${job.id}`} className="btn btn-primary" style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>
                      Apply to Job
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="card" style={{ padding: "32px", textAlign: "center" }}>
                <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
                  No open jobs match your current search and filter criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setMinBudget("");
                    setMaxBudget("");
                    setSortBy("newest");
                  }}
                  className="btn btn-outline"
                  style={{ marginTop: "16px" }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

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
