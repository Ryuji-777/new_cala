import Link from "next/link";

export default function TermsOfService() {
  return (
    <>
      {/* Header Navigation */}
      <header className="header">
        <div className="container header-container">
          <Link href="/" className="logo" id="nav-logo">
            <div className="logo-icon">C</div>
            Cala
          </Link>
          <nav className="nav-links">
            <Link href="/login" className="nav-link" id="nav-login">
              Log in
            </Link>
            <Link href="/signup" className="btn btn-primary" id="nav-signup">
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ padding: "64px 0", flex: 1, backgroundColor: "#fafafa" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <div 
            className="card" 
            style={{ 
              backgroundColor: "var(--bg-card)", 
              padding: "48px", 
              borderRadius: "8px", 
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-md)"
            }}
          >
            <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "24px", marginBottom: "32px" }}>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", fontSize: "14px", color: "var(--primary-color)", fontWeight: "600", marginBottom: "16px", gap: "6px" }}>
                &larr; Back to Home
              </Link>
              <h1 style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
                Terms of Service
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "8px" }}>
                Last Updated: June 20, 2026
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontSize: "15px", lineHeight: "1.7", color: "var(--text-primary)" }}>
              <section>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  1. Acceptance of Terms
                </h2>
                <p style={{ color: "var(--text-secondary)" }}>
                  By accessing or using the Cala Freelance Marketplace (the "Platform"), you agree to comply with and be bound by these Terms of Service. Please read them carefully. If you do not agree to these terms, you must not access or use the Platform.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  2. Description of Service
                </h2>
                <p style={{ color: "var(--text-secondary)" }}>
                  Cala provides an online venue where clients ("Clients") can post projects or purchase direct services offered by freelancers ("Freelancers"). Freelancers can apply to jobs and provide services. Cala acts as a platform to facilitate secure communication, job matching, escrowed contract management, and payouts.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  3. User Accounts & Identity Verification
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
                  To access certain features of the Platform, you must register for an account and maintain an accurate, up-to-date profile. You agree to provide true and complete information.
                </p>
                <p style={{ color: "var(--text-secondary)" }}>
                  To maintain the safety and integrity of the Platform, all users must submit a valid identification document for administrative approval. Unverified accounts cannot post jobs, hire freelancers, or request budget payouts. Cala reserves the right to suspend or terminate accounts that fail the identity verification process.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  4. Escrow & Wallet Payments
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
                  Clients maintain a digital wallet balance on the platform. When a Client hires a Freelancer (either through direct service purchase or by accepting a job application), the required funds are immediately deducted from the Client's wallet and secured in a contract escrow.
                </p>
                <p style={{ color: "var(--text-secondary)" }}>
                  Upon successful completion of the work, the Client marks the contract as completed, transferring the escrowed budget directly to the Freelancer's digital wallet. In the event of a cancellation, funds are refunded to the Client's wallet balance.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  5. User Conduct and Rules
                </h2>
                <p style={{ color: "var(--text-secondary)" }}>
                  Users agree to engage in professional communication and deliver high-quality services. Any attempts to bypass the Platform's payment system, share fraudulent identity documents, or harass other users will result in immediate termination of account access and potential forfeiture of digital wallet balances.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  6. Limitation of Liability
                </h2>
                <p style={{ color: "var(--text-secondary)" }}>
                  Cala is not a party to any contract entered into between Clients and Freelancers. We do not guarantee the quality, safety, or legality of any services advertised. Cala shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use of the Platform or dispute of service delivery.
                </p>
              </section>

              <section style={{ borderTop: "1px solid var(--border-color)", paddingTop: "24px", marginTop: "16px" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                  If you have questions about these Terms of Service, please contact Cala Administrator support.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <p>&copy; {new Date().getFullYear()} Cala Freelance Marketplace. All rights reserved.</p>
          <div style={{ display: "flex", gap: "16px" }}>
            <Link href="/terms-of-service" style={{ color: "var(--primary-color)", fontWeight: "600" }}>Terms of Service</Link>
            <Link href="/privacy-policy" style={{ color: "var(--text-secondary)" }}>Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
