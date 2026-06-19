import Link from "next/link";

export default function Home() {
  // Highlighted freelancers based on the screenshot
  const featuredFreelancers = [
    {
      name: "On Wave Software Group",
      location: "Charlestown, Saint Paul Charlestown, St. Kitts",
      earnings: "$472,608 /yr",
      successRate: "100%",
      avatar: "OW",
      title: "Mobile and Web Application Development",
      rate: "$30/hr",
      minProject: "Starting at $120",
      description: "Outsource your project to us and we will deliver the software you need on budget. Delivering tailored agile software solutions for all your software challenges. With over 20 years experience in develop...",
      skills: ["Programming & Development", "Web Development & Design", "Angular", "App Development", "Back End Development", "Communications Technology", "Consultant"]
    },
    {
      name: "Suretek Infosoft Pvt. Ltd.",
      location: "Noida, Delhi, India",
      earnings: "$406,705 /yr",
      successRate: "100%",
      avatar: "SI",
      title: "AI Solutions",
      rate: "$15/hr",
      minProject: "Starting at $1K",
      description: "Suretek InfoSoft develops AI-powered systems that transform business operations through automation, insight generation, and predictive intelligence. We design and implement models in machine learning...",
      skills: ["Programming & Development", "Games (2D / 3D / Mobile)", "2D Games", "3D Games", "Android Game Development", "Artificial Intelligence", "Augmented Reality Development"]
    }
  ];

  const categories = [
    { name: "Programming & Development", count: "120,400+ Freelancers" },
    { name: "Design & Art", count: "85,200+ Freelancers" },
    { name: "Writing & Translation", count: "64,100+ Freelancers" },
    { name: "Business & Finance", count: "48,900+ Freelancers" }
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

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1 className="hero-title">
              Find & Hire Expert <span>Freelancers</span> for Any Job
            </h1>
            <p className="hero-subtitle">
              Cala connects world-class clients with specialized freelance talent. Build your profile, showcase your skills, and start collaborating today.
            </p>
            <div className="hero-ctas">
              <Link href="/signup" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "16px" }}>
                Get Started
              </Link>
              <Link href="/login" className="btn btn-outline" style={{ padding: "12px 24px", fontSize: "16px" }}>
                Browse Jobs
              </Link>
            </div>
          </div>
          
          {/* Small Decorative Grid illustrating the platform scale */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                style={{ 
                  backgroundColor: "var(--bg-main)", 
                  padding: "20px", 
                  borderRadius: "var(--radius-sm)", 
                  border: "1px solid var(--border-color)"
                }}
              >
                <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px" }}>{cat.name}</h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{cat.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Showcase Section (Replicating Guru Layout) */}
      <main style={{ padding: "48px 0", flex: 1 }}>
        <div className="container" style={{ maxWidth: "960px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700" }}>Featured Experts on Cala</h2>
            <Link href="/signup" style={{ color: "var(--primary-color)", fontSize: "14px", fontWeight: "600" }}>
              View all listings &rarr;
            </Link>
          </div>

          {/* List of Mock Freelancer Cards */}
          {featuredFreelancers.map((freelancer, index) => (
            <div key={index} className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Header row: Avatar, Name, Location, Earnings, Actions */}
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                
                {/* Fake Avatar */}
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "var(--radius-sm)", 
                  backgroundColor: "var(--primary-light)", 
                  color: "var(--primary-color)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontWeight: "bold",
                  fontSize: "18px",
                  border: "1px solid var(--border-color)"
                }}>
                  {freelancer.avatar}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--primary-color)" }}>
                        {freelancer.name}
                      </h3>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {freelancer.location}
                      </p>
                    </div>
                    
                    {/* Action button matching screenshot */}
                    <Link href="/signup" className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "13px" }}>
                      Get a Quote
                    </Link>
                  </div>

                  {/* Secondary info row */}
                  <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                    <span><strong>{freelancer.earnings}</strong> earned</span>
                    <span>&bull;</span>
                    <span style={{ color: "#16a34a" }}><strong>{freelancer.successRate}</strong> Success Rate</span>
                  </div>
                </div>

              </div>

              {/* Job Title and Description */}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "8px" }}>
                  {freelancer.title} <span style={{ fontWeight: "400", color: "var(--text-secondary)", fontSize: "14px" }}> &bull; {freelancer.rate} &bull; {freelancer.minProject}</span>
                </h4>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  {freelancer.description}
                </p>
              </div>

              {/* Skills tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {freelancer.skills.map((skill, sIdx) => (
                  <span key={sIdx} className="tag">{skill}</span>
                ))}
              </div>

            </div>
          ))}

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
