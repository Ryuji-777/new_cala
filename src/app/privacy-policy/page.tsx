import Link from "next/link";

export default function PrivacyPolicy() {
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
                Privacy Policy
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "8px" }}>
                Last Updated: June 20, 2026
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontSize: "15px", lineHeight: "1.7", color: "var(--text-primary)" }}>
              <section>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  1. Information We Collect
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
                  We collect information to provide a secure and functional freelance marketplace. This includes:
                </p>
                <ul style={{ color: "var(--text-secondary)", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <li><strong>Account Details:</strong> Name, email address, password, profile bio, screen name, skills, and rates.</li>
                  <li><strong>Verification Documents:</strong> Identity verification documents (e.g. government-issued photo IDs) uploaded to our secure servers to verify user eligibility.</li>
                  <li><strong>Payment Information:</strong> Transaction histories, payment logs, and billing details processed by our payment integration.</li>
                  <li><strong>Platform Usage Data:</strong> Chat messages exchanged between clients and freelancers, notifications logs, and general activity logs.</li>
                </ul>
              </section>

              <section>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  2. How We Use Your Information
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
                  We use the information we collect for the following business purposes:
                </p>
                <ul style={{ color: "var(--text-secondary)", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <li>To verify user identity and prevent fraud or system abuse.</li>
                  <li>To establish contracts and handle digital escrow transactions securely.</li>
                  <li>To display user profile portfolios, ratings, and feedback reviews publicly on the landing page and dashboard.</li>
                  <li>To send real-time notifications about project updates, direct messages, and payments.</li>
                </ul>
              </section>

              <section>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  3. Information Sharing & Security
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
                  We value your privacy. We do not sell or trade your personal information to third parties. Your data is shared only under the following conditions:
                </p>
                <ul style={{ color: "var(--text-secondary)", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <li><strong>With Other Users:</strong> Information on your public profile (first name, screen name, category, reviews) is visible to all visitors.</li>
                  <li><strong>Service Providers:</strong> Secure databases (Supabase, Postgres) and authentication providers to host, secure, and run our web applications.</li>
                  <li><strong>Legal Compliance:</strong> If required by law, subpoena, or to protect the safety and rights of Cala users.</li>
                </ul>
              </section>

              <section>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  4. Data Protection & Retention
                </h2>
                <p style={{ color: "var(--text-secondary)" }}>
                  We implement industry-standard encryption and security measures to protect your identification documents and database records. When a profile is deleted by an administrator, the personal record is permanently archived in our system archive log for compliance and security audit logs, while the public profile is immediately removed from the live site.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  5. Your Rights and Choices
                </h2>
                <p style={{ color: "var(--text-secondary)" }}>
                  You have the right to access, edit, or update your profile details directly through the platform dashboard. You can toggle between client and freelancer views and request account deletion. If you need assistance with verification status updates or document removal, you may contact the system support team.
                </p>
              </section>

              <section style={{ borderTop: "1px solid var(--border-color)", paddingTop: "24px", marginTop: "16px" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                  For data requests or privacy concerns, please contact the Cala Administrator privacy department.
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
            <Link href="/terms-of-service" style={{ color: "var(--text-secondary)" }}>Terms of Service</Link>
            <Link href="/privacy-policy" style={{ color: "var(--primary-color)", fontWeight: "600" }}>Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
