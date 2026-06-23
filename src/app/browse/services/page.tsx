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

export default function BrowseServicesPage() {
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest", "price_desc", "price_asc"

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

        // Fetch services with freelancer profile join
        const { data: allServs, error } = await supabase
          .from("services")
          .select("*, freelancer:profiles(*)")
          .order("created_at", { ascending: false });

        if (!error && allServs) {
          setServices(allServs);
        }
      } catch (err) {
        console.error("Error loading services browse page:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, [supabase]);

  // Client-side filtering logic
  const filteredServices = services
    .filter((service) => {
      const matchCategory = selectedCategory === "All" || service.category === selectedCategory;
      const matchSearch =
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.freelancer?.first_name && service.freelancer.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (service.freelancer?.last_name && service.freelancer.last_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const priceVal = Number(service.price);
      const matchMinPrice = minPrice === "" || priceVal >= Number(minPrice);
      const matchMaxPrice = maxPrice === "" || priceVal <= Number(maxPrice);

      return matchCategory && matchSearch && matchMinPrice && matchMaxPrice;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "price_desc") {
        return Number(b.price) - Number(a.price);
      }
      if (sortBy === "price_asc") {
        return Number(a.price) - Number(b.price);
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
      <Header profile={currentUserProfile} activeWorkspace="browse" workspaceTitle="Browse Services" />

      <main style={{ padding: "48px 24px", flex: 1 }}>
        <div className="container" style={{ maxWidth: "1200px" }}>
          
          {/* Headline */}
          <div style={{ marginBottom: "32px", textAlign: "center" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "8px" }}>
              Professional Services Catalog
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
              Explore and buy expert freelancer services directly with fixed rates and fast delivery.
            </p>
          </div>

          {/* Search & Inputs Bar */}
          <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              
              {/* Text Search */}
              <div style={{ flex: "1 1 300px" }}>
                <input
                  type="text"
                  placeholder="Search services by title, description or freelancer name..."
                  className="form-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Price Range Min/Max */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: "0 1 260px" }}>
                <input
                  type="number"
                  placeholder="Min Price ($)"
                  className="form-input"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>to</span>
                <input
                  type="number"
                  placeholder="Max Price ($)"
                  className="form-input"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
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
                  <option value="price_desc">Highest Price</option>
                  <option value="price_asc">Lowest Price</option>
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

          {/* Services Listing Grid */}
          {isLoading ? (
            // Pulsing skeletons
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="card pulse" style={{ padding: "24px", minHeight: "220px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div className="skeleton" style={{ width: "80px", height: "18px", backgroundColor: "#e2e8f0" }}></div>
                      <div className="skeleton" style={{ width: "60px", height: "18px", backgroundColor: "#e2e8f0" }}></div>
                    </div>
                    <div className="skeleton" style={{ width: "70%", height: "22px", backgroundColor: "#e2e8f0", marginBottom: "10px" }}></div>
                    <div className="skeleton" style={{ width: "100%", height: "40px", backgroundColor: "#e2e8f0", marginBottom: "12px" }}></div>
                  </div>
                  <div className="skeleton" style={{ width: "90px", height: "28px", backgroundColor: "#e2e8f0", alignSelf: "flex-end" }}></div>
                </div>
              ))}
            </div>
          ) : filteredServices.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="card browse-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    margin: 0,
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <span className="tag" style={{ marginBottom: "8px", backgroundColor: "var(--primary-light)", color: "var(--primary-color)", fontWeight: "600" }}>
                        {service.category}
                      </span>
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--primary-color)" }}>
                        ${Number(service.price).toFixed(2)}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginTop: "4px" }}>{service.title}</h3>
                    
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      By:{" "}
                      <Link href={`/profile/${service.freelancer_id}`} style={{ color: "var(--primary-color)", fontWeight: "600", textDecoration: "underline" }}>
                        {service.freelancer?.first_name} {service.freelancer?.last_name}
                      </Link>{" "}
                      (@{service.freelancer?.screen_name})
                    </p>

                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Delivery Time: {service.delivery_days} day{service.delivery_days > 1 ? "s" : ""}
                    </p>

                    <p style={{ fontSize: "13px", color: "#555", marginTop: "12px", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "1.6" }}>
                      {service.description}
                    </p>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "16px", paddingTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                    <Link href={`/services/${service.id}`} className="btn btn-primary" style={{ padding: "6px 16px", fontSize: "13px" }}>
                      View Details & Hire
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: "32px", textAlign: "center" }}>
              <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
                No services match your current search and filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setMinPrice("");
                  setMaxPrice("");
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
