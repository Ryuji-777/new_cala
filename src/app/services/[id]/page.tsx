"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Popup from "@/components/Popup";
import ConfirmPopup from "@/components/ConfirmPopup";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ServiceDetailPage({ params }: PageProps) {
  const router = useRouter();
  const supabase = createClient();
  const { id: serviceId } = use(params);

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
  
  const [service, setService] = useState<any>(null);
  const [freelancer, setFreelancer] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [allTimeEarnings, setAllTimeEarnings] = useState(0);
  const [completedTransactions, setCompletedTransactions] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [serviceWorks, setServiceWorks] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHiring, setIsHiring] = useState(false);

  // Popup modal state
  const [popup, setPopup] = useState<{ message: string; type: "success" | "error" | "info"; onClose?: () => void } | null>(null);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // Reporting state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);

  const loadServiceData = async () => {
    setIsLoading(true);
    
    // 1. Get current logged in user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: cProf } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (cProf) setCurrentUserProfile(cProf);
    }

    // 2. Fetch service detail with freelancer profile join
    const { data: serviceData, error } = await supabase
      .from("services")
      .select("*, freelancer:profiles(*)")
      .eq("id", serviceId)
      .single();

    if (error || !serviceData) {
      setErrorMsg("The requested service was not found or does not exist.");
      setIsLoading(false);
      return;
    }

    setService(serviceData);
    setFreelancer(serviceData.freelancer);

    const fId = serviceData.freelancer_id;

    // 3. Fetch freelancer skills
    const { data: skillsData } = await supabase
      .from("freelancer_skills")
      .select("skill_name")
      .eq("freelancer_id", fId);
    if (skillsData) {
      setSkills(skillsData.map((s) => s.skill_name));
    }

    // 4. Fetch all time earnings (sum of payments where receiver is freelancer)
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("amount")
      .eq("receiver_id", fId);
    if (paymentsData) {
      const total = paymentsData.reduce((acc, curr) => acc + Number(curr.amount), 0);
      setAllTimeEarnings(total);
    }

    // 5. Fetch completed transactions (completed contracts count)
    const { data: contractsData } = await supabase
      .from("contracts")
      .select("id")
      .eq("freelancer_id", fId)
      .eq("status", "completed");
    if (contractsData) {
      setCompletedTransactions(contractsData.length);
    }

    // 6. Fetch reviews for freelancer
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*, reviewer:profiles!reviewer_id(first_name, last_name, screen_name)")
      .eq("reviewee_id", fId);
    if (reviewsData && reviewsData.length > 0) {
      setReviews(reviewsData);
      const sum = reviewsData.reduce((acc, curr) => acc + curr.rating, 0);
      setAvgRating(sum / reviewsData.length);
    }

    // 7. Fetch service work samples
    const { data: worksData } = await supabase
      .from("service_works")
      .select("*")
      .eq("service_id", serviceId);
    if (worksData) {
      setServiceWorks(worksData);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadServiceData();
  }, [serviceId]);

  // Checkout and Hire logic (Phase 5)
  const handleHireService = async () => {
    if (!currentUserProfile) {
      router.push("/login");
      return;
    }

    if (!currentUserProfile.is_verified) {
      setPopup({
        message: "You must attach a valid ID and wait for admin approval before you can hire freelancers.",
        type: "error"
      });
      return;
    }

    const price = Number(service.price);
    const walletBalance = Number(currentUserProfile.wallet_balance);

    if (walletBalance < price) {
      setPopup({
        message: `Insufficient funds. Your wallet balance is $${walletBalance.toFixed(2)}, but you need $${price.toFixed(2)}.`,
        type: "error"
      });
      return;
    }

    setConfirmState({
      message: `Confirm direct hire for "${service.title}" at $${price.toFixed(2)}? This will lock funds in contract escrow.`,
      onConfirm: async () => {
        setConfirmState(null);
        await executeHireService(price, walletBalance);
      }
    });
  };

  const executeHireService = async (price: number, walletBalance: number) => {
    setIsHiring(true);

    // 1. Deduct funds from Client
    const nextClientBalance = walletBalance - price;
    const { error: walletError } = await supabase
      .from("profiles")
      .update({ wallet_balance: nextClientBalance })
      .eq("id", currentUserProfile.id);

    if (walletError) {
      setPopup({
        message: "Hiring checkout failed: " + walletError.message,
        type: "error"
      });
      setIsHiring(false);
      return;
    }

    // 2. Create ongoing contract linked to service
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        service_id: service.id,
        job_id: null,
        freelancer_id: freelancer.id,
        client_id: currentUserProfile.id,
        budget: price,
        status: "ongoing",
      })
      .select("*")
      .single();

    if (contractError) {
      setPopup({
        message: "Contract creation failed: " + contractError.message,
        type: "error"
      });
      // Refund client
      await supabase
        .from("profiles")
        .update({ wallet_balance: walletBalance })
        .eq("id", currentUserProfile.id);
      setIsHiring(false);
      return;
    }

    // 3. Insert simulated direct message
    await supabase.from("messages").insert({
      sender_id: currentUserProfile.id,
      receiver_id: freelancer.id,
      content: `Hello! I have hired you directly for your service "${service.title}". The contract budget of $${price.toFixed(2)} is secured. Let's begin working.`,
    });

    // 4. Insert notification for freelancer
    await supabase.from("notifications").insert({
      user_id: freelancer.id,
      title: "Direct Service Hire Received! 💼",
      content: `Client @${currentUserProfile.screen_name} hired you directly for your service "${service.title}". Budget: $${price.toFixed(2)}.`,
    });

    setPopup({
      message: "Direct service hire completed successfully! Funds are held in escrow.",
      type: "success",
      onClose: () => router.push("/client/dashboard")
    });
    setIsHiring(false);
  };

  const handleReportService = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError(null);

    if (!reportReason.trim()) {
      setReportError("Please enter a reason for reporting this service posting.");
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
        target_type: "service",
        target_id: serviceId,
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
        <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>Loading service details...</p>
      </div>
    );
  }

  if (errorMsg || !service) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", gap: "16px" }}>
        <p style={{ fontSize: "16px", color: "var(--error-color)", fontWeight: "600" }}>{errorMsg || "Error loading service."}</p>
        <Link href="/" className="btn btn-primary">Go to Homepage</Link>
      </div>
    );
  }

  const isClient = currentUserProfile?.is_client;
  const isOwnService = currentUserProfile?.id === freelancer.id;

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
            {currentUserProfile ? (
              <>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
                  Logged in as: {currentUserProfile.first_name} {currentUserProfile.last_name}
                </span>
                <Link href="/profile/view" className="nav-link">My Profile</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link">Log in</Link>
                <Link href="/signup" className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "13px" }}>Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

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
          
          {/* LEFT COLUMN: FREELANCER PROFILE CARD (35% width on desktop) */}
          <div style={{ flex: "1 1 350px", maxWidth: "420px" }}>
            <div className="card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: "800" }}>
                      {freelancer.first_name} {freelancer.last_name}
                    </h3>
                    {freelancer.is_verified ? (
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
                    @{freelancer.screen_name} &bull; {freelancer.city || "N/A"}, {freelancer.country || "N/A"}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "16px 0", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", marginBottom: "20px" }}>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>All-Time Earnings</p>
                  <strong style={{ fontSize: "18px", color: "var(--success-color)" }}>
                    ${allTimeEarnings.toFixed(2)}
                  </strong>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Transactions Completed</p>
                  <strong style={{ fontSize: "18px" }}>
                    {completedTransactions}
                  </strong>
                </div>
              </div>

              {/* Skills Section */}
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Freelancer Skills</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {skills.map((s, idx) => (
                    <span key={idx} className="tag" style={{ fontSize: "11px" }}>{s}</span>
                  ))}
                  {skills.length === 0 && <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No skills listed.</span>}
                </div>
              </div>

              {/* Reviews & Average Rating */}
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Freelancer Feedback</h4>
                
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
                        <strong>@{r.reviewer?.screen_name || "Client"}</strong>
                        {renderStars(r.rating)}
                      </div>
                      <p style={{ color: "#444", fontStyle: "italic" }}>&quot;{r.comment}&quot;</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SERVICE DETAIL CARD (Remaining width) */}
          <div style={{ flex: "1 1 500px" }}>
            <div className="card" style={{ padding: "36px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span className="tag" style={{ marginBottom: "12px", fontSize: "12px" }}>{service.category}</span>
                
                <h2 style={{ fontSize: "26px", fontWeight: "800", marginTop: "4px", lineHeight: "1.25" }}>
                  {service.title}
                </h2>
                
                {/* Price and Deliverables banner */}
                <div style={{ display: "flex", gap: "24px", margin: "24px 0", padding: "16px 20px", backgroundColor: "var(--primary-light)", border: "1px solid #bfdbfe", borderRadius: "var(--radius-sm)" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Price</span>
                    <h3 style={{ fontSize: "28px", fontWeight: "800", color: "var(--primary-color)", margin: 0 }}>
                      ${Number(service.price).toFixed(2)}
                    </h3>
                  </div>
                  <div style={{ borderLeft: "1px solid #bfdbfe", paddingLeft: "24px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Delivery Time</span>
                    <h3 style={{ fontSize: "20px", fontWeight: "700", marginTop: "6px" }}>
                      {service.delivery_days} Day{service.delivery_days > 1 ? "s" : ""}
                    </h3>
                  </div>
                </div>

                <div style={{ marginBottom: "32px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "10px" }}>Service Offering Details</h4>
                  <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                    {service.description}
                  </p>
                </div>

                {/* Service Work Gallery */}
                {serviceWorks.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "24px", marginTop: "24px", marginBottom: "32px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px" }}>Work Showcase / Deliverables</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {serviceWorks.map((work, idx) => (
                        <div key={idx} style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", backgroundColor: "#fff" }}>
                          <img 
                            src={work.image_url} 
                            alt="Work sample deliverable" 
                            style={{ width: "100%", maxHeight: "300px", objectFit: "contain", backgroundColor: "#f8fafc" }} 
                          />
                          <div style={{ padding: "16px" }}>
                            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>{work.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout / Hires triggers */}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "24px", marginTop: "24px" }}>
                {isOwnService ? (
                  <div style={{ backgroundColor: "#faf5ff", border: "1px solid #e9d5ff", padding: "12px 16px", borderRadius: "var(--radius-sm)", color: "#6b21a8", fontSize: "13px", fontWeight: "600", textAlign: "center" }}>
                    This is your own service offering. Clients can view and hire you from this page.
                  </div>
                ) : isClient ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {currentUserProfile.is_verified ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
                          <span>Your Wallet Balance:</span>
                          <strong style={{ color: Number(currentUserProfile.wallet_balance) >= Number(service.price) ? "var(--success-color)" : "var(--error-color)", fontWeight: "700" }}>
                            ${Number(currentUserProfile.wallet_balance).toFixed(2)}
                          </strong>
                        </div>
                        {Number(currentUserProfile.wallet_balance) >= Number(service.price) ? (
                          <button 
                            onClick={handleHireService} 
                            disabled={isHiring}
                            className="btn btn-primary"
                            style={{ padding: "14px 28px", fontSize: "15px", width: "100%", fontWeight: "700" }}
                          >
                            {isHiring ? "Processing Direct Hire..." : `Buy Now - Hire for $${Number(service.price).toFixed(2)}`}
                          </button>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <button 
                              disabled
                              className="btn btn-primary"
                              style={{ padding: "14px 28px", fontSize: "15px", width: "100%", fontWeight: "700", cursor: "not-allowed", opacity: 0.5 }}
                            >
                              Hire for ${Number(service.price).toFixed(2)}
                            </button>
                            <p style={{ fontSize: "12px", color: "var(--error-color)", textAlign: "center", fontWeight: "600" }}>
                              ⚠️ Insufficient wallet balance to hire this freelancer. Please top up in profile manager.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ backgroundColor: "var(--error-bg)", border: "1px solid var(--error-border)", padding: "12px 16px", borderRadius: "var(--radius-sm)", color: "var(--error-color)", fontSize: "13px", textAlign: "center", fontWeight: "600" }}>
                        ⚠️ You must attach a valid ID and wait for admin approval before you can hire freelancers.
                      </div>
                    )}
                  </div>
                ) : currentUserProfile ? (
                  <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a", padding: "12px 16px", borderRadius: "var(--radius-sm)", color: "#92400e", fontSize: "13px", fontWeight: "600", textAlign: "center" }}>
                    To hire this service, please toggle Client Mode in your profile settings.
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <Link href="/login" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "14px" }}>
                      Log In as Client to Hire Freelancer
                    </Link>
                  </div>
                )}
                {currentUserId && !isOwnService && (
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

      {/* REPORT POSTING MODAL */}
      {showReportModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", backgroundColor: "#fff", padding: "32px", borderRadius: "var(--radius-md)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Report Service Posting: {service.title}</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>Please explain why you are reporting this service posting to the site moderators.</p>
            
            {reportError && (
              <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)", padding: "10px", fontSize: "13px", borderRadius: "var(--radius-sm)", marginBottom: "12px" }}>
                {reportError}
              </div>
            )}

            <form onSubmit={handleReportService} noValidate>
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

      {confirmState && (
        <ConfirmPopup
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </>
  );
}
