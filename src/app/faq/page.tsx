"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Header from "@/components/Header";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: "General Platform Questions",
    items: [
      {
        question: "What is Cala?",
        answer: "Cala is a premium freelance marketplace that connects professional contractors with clients. It supports full contract escrow tracking, real-time message rooms, and integrated ratings/feedback loops."
      },
      {
        question: "How does role switching work?",
        answer: "Cala allows you to act as both a client and a freelancer. In your profile settings, you can check boxes to enable Client Mode, Freelancer Mode, or both. Once enabled, you can instantly toggle between workspaces using the role switcher button in the global navbar header."
      }
    ]
  },
  {
    title: "Verification & Security",
    items: [
      {
        question: "Why must I verify my ID?",
        answer: "To prevent spam and fraudulent behavior, Cala requires all new users to submit a government-issued ID copy during profile setup. System administrators review and approve attachments before you can apply to jobs, hire freelancers, or request withdrawals."
      },
      {
        question: "How do I upload my ID document?",
        answer: "You can drag and drop your file (PNG, JPG, or PDF under 5MB) into the custom dropzone in the profile setup onboarding workspace."
      }
    ]
  },
  {
    title: "Payments & Wallet Escrow",
    items: [
      {
        question: "How does the wallet system work?",
        answer: "Cala features a built-in simulated wallet. Clients can top up funds via simulated credit card payments under the Wallet & Payments dashboard tab. When hiring a freelancer, the project budget is deducted from the client's balance and held securely in contract escrow."
      },
      {
        question: "When are funds released to the freelancer?",
        answer: "Once a freelancer submits work samples and completes deliverables, the client marks the contract as complete. This triggers an automated release of the escrowed budget, adding it to the freelancer's wallet balance."
      },
      {
        question: "How can freelancers withdraw earnings?",
        answer: "Freelancers can visit the Payments & Wallet tab in their dashboard, enter bank routing and account details, and request simulated payouts. The requested sum is deducted from their balance, and an administrative notification is sent."
      }
    ]
  }
];

export default function FAQPage() {
  const supabase = createClient();
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  // Tracks open accordion items using a composite key categoryIndex-itemIndex
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "0-0": true // Open first item by default
  });

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

  const toggleItem = (catIdx: number, itemIdx: number) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <>
      <style>{`
        .faq-hero {
          background-color: var(--bg-card);
          padding: 64px 24px;
          text-align: center;
          border-bottom: 1px solid var(--border-color);
        }
        .faq-section {
          padding: 48px 24px;
        }
        .accordion-item {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background-color: var(--bg-card);
          margin-bottom: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .accordion-header {
          width: 100%;
          padding: 18px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          font-weight: 700;
          font-size: 15px;
          color: var(--text-primary);
          transition: background-color 0.15s ease;
        }
        .accordion-header:hover {
          background-color: var(--bg-main);
        }
        .accordion-arrow {
          font-size: 12px;
          color: var(--text-secondary);
          transition: transform 0.2s ease;
        }
        .accordion-arrow.open {
          transform: rotate(180deg);
        }
        .accordion-body {
          max-height: 0;
          opacity: 0;
          padding: 0 24px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.6;
        }
        .accordion-body.open {
          max-height: 200px;
          opacity: 1;
          padding: 0 24px 18px 24px;
        }
      `}</style>

      {/* Header */}
      <Header profile={currentUserProfile} activeWorkspace="info" workspaceTitle="Cala Help Desk" />

      {/* Hero */}
      <section className="faq-hero">
        <div className="container" style={{ maxWidth: "600px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-0.5px" }}>Frequently Asked Questions</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginTop: "8px" }}>
            Got questions about verification, payment security, or role swapping? We have answers.
          </p>
        </div>
      </section>

      {/* Accordion list */}
      <main className="faq-section" style={{ flex: 1 }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          {faqData.map((cat, catIdx) => (
            <div key={catIdx} style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {cat.title}
              </h2>
              <div>
                {cat.items.map((item, itemIdx) => {
                  const isOpen = !!openItems[`${catIdx}-${itemIdx}`];
                  return (
                    <div key={itemIdx} className="accordion-item" style={{ boxShadow: isOpen ? "var(--shadow-sm)" : "none" }}>
                      <button
                        onClick={() => toggleItem(catIdx, itemIdx)}
                        className="accordion-header"
                        type="button"
                      >
                        <span>{item.question}</span>
                        <span className={`accordion-arrow ${isOpen ? "open" : ""}`}>▼</span>
                      </button>
                      <div className={`accordion-body ${isOpen ? "open" : ""}`}>
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Need help? */}
          <div className="card" style={{ textAlign: "center", padding: "32px", marginTop: "48px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Still have questions?</h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>Our support representatives are ready to assist you directly.</p>
            <Link href="/contact" className="btn btn-primary" style={{ padding: "10px 24px" }}>
              Contact Support
            </Link>
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
