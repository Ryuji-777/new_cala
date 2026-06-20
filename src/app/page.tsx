import Link from "next/link";

export default function Home() {
  const categories = [
    {
      name: "Programming & Development",
      skills: ["React", "Next.js", "TypeScript", "Node.js", "Python", "SQL", "Git", "API Integration", "Web Development"]
    },
    {
      name: "Design & Art",
      skills: ["Graphic Design", "UI/UX Design", "Figma", "Photoshop", "Illustrator", "Logo Design", "Video Editing", "Illustration"]
    },
    {
      name: "Writing & Translation",
      skills: ["Technical Writing", "SEO Optimization", "Copywriting", "Translation", "Proofreading", "Content Marketing", "Editing"]
    },
    {
      name: "Business & Finance",
      skills: ["Financial Analysis", "Accounting", "Business Consulting", "Project Management", "Marketing Strategy", "Excel Modeling"]
    }
  ];

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

      {/* Hero Section - Centered, Stats numbers removed */}
      <section className="hero" style={{ textAlign: "center", padding: "80px 0" }}>
        <div className="container" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 className="hero-title" style={{ fontSize: "40px", fontWeight: 800, lineHeight: 1.2, marginBottom: "20px" }}>
            Find & Hire Expert <span>Freelancers</span> for Any Job
          </h1>
          <p className="hero-subtitle" style={{ fontSize: "18px", color: "var(--text-secondary)", marginBottom: "32px", lineHeight: 1.6 }}>
            Cala connects world-class clients with specialized freelance talent. Build your profile, showcase your skills, and start collaborating today.
          </p>
          <div className="hero-ctas" style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            <Link href="/signup" className="btn btn-primary" style={{ padding: "12px 28px", fontSize: "16px" }}>
              Get Started
            </Link>
            <Link href="/login" className="btn btn-outline" style={{ padding: "12px 28px", fontSize: "16px" }}>
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Main Section - Categories and Skills Cards */}
      <main style={{ padding: "64px 0", flex: 1, backgroundColor: "#fafafa" }}>
        <div className="container" style={{ maxWidth: "1000px" }}>
          
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
              Explore Services by Category & Skills
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "8px" }}>
              Browse through our popular expert categories and select the specific skills you need for your project.
            </p>
          </div>

          {/* Grid of Categories and Skills Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                className="card" 
                style={{ 
                  backgroundColor: "var(--bg-card)", 
                  padding: "24px", 
                  borderRadius: "8px", 
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  margin: 0
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                  {cat.name}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {cat.skills.map((skill, sIdx) => (
                    <span 
                      key={sIdx} 
                      className="tag" 
                      style={{ 
                        fontSize: "11px", 
                        padding: "4px 10px", 
                        backgroundColor: "var(--bg-main)", 
                        color: "var(--text-secondary)",
                        borderRadius: "50px",
                        border: "1px solid var(--border-color)"
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Cala Freelance Marketplace. Built with Next.js, Supabase, and Vercel.</p>
        </div>
      </footer>
    </>
  );
}
