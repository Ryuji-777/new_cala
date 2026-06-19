"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Searchable location data
const countriesData = [
  {
    name: "United States",
    states: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"]
  },
  {
    name: "Canada",
    states: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"]
  },
  {
    name: "India",
    states: ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Noida"]
  },
  {
    name: "St. Kitts & Nevis",
    states: ["Saint Paul Charlestown", "Saint George Basseterre", "Saint John Capisterre", "Saint Mary Cayon", "Saint Peter Basseterre", "Saint Thomas Middle Island", "Trinity Palmetto Point", "Saint James Windward", "Saint John Figtree", "Saint Thomas Lowland"]
  },
  {
    name: "United Kingdom",
    states: ["England", "Scotland", "Wales", "Northern Ireland"]
  },
  {
    name: "Australia",
    states: ["New South Wales", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia", "Australian Capital Territory", "Northern Territory"]
  }
];

const skillsCategories: Record<string, string[]> = {
  "Programming & Development": [
    "Web Developers", "Software Developers", "PHP Developers", "WordPress Experts", 
    "JavaScript Developers", "HTML Developers", "Designers", "CSS Developers", 
    "Web Designers", "MySQL Developers", "Java Developers", "jQuery Developers", 
    "SQL Developers", "Computer Programmers", "App Developers", "Front End Developers", 
    "Python Developers", "C# Developers", "Management Experts", "C Developers"
  ],
  "Writing & Translation": [
    "Freelance Writers", "Data Entry Experts", "English Language Experts", "Typists", 
    "Content Writers", "Article Writers", "Translators", "Blog Writing Services", 
    "Editors", "Data Managers", "Proofreaders", "Researchers", "Microsoft Word Experts", 
    "Copywriters", "Creative Writers", "Microsoft Developers", "Marketers", "News Writers", 
    "Newsletters", "Journalists"
  ],
  "Design & Art": [
    "Designers", "Graphic Designers", "Logo Designers", "Adobe Photoshop Designers", 
    "Editors", "Business Card Designers", "Illustrators", "Poster Designers", 
    "Creative Designers", "Banner Ad Designers", "Brochure Designers", "Adobe Illustrator Experts", 
    "Photo Editors", "Flyer Designers", "Artists", "3D Designers", "Video Editors", 
    "Web Designers", "Photographers", "Animators"
  ],
  "Administrative & Secretarial": [
    "Data Entry Experts", "Data Managers", "Microsoft Developers", "Virtual Assistants", 
    "Typists", "Microsoft Word Experts", "Researchers", "Microsoft Excel Experts", 
    "Management Experts", "Customer Service Representatives", "Administrative Assistant", 
    "Copy and Paste Experts", "Freelance Writers", "Office Assistants", "PowerPoint Experts", 
    "Transcriptionists", "Marketers", "English Language Experts", "Accountants", "Editors"
  ]
};

export default function ProfileViewPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Edit states
  const [screenName, setScreenName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Programming & Development");
  const [editedSkills, setEditedSkills] = useState<string[]>([]);
  const [idFile, setIdFile] = useState<File | null>(null);

  // Country/State Dropdowns inside edit mode
  const [countryQuery, setCountryQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  const [stateQuery, setStateQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [isStateOpen, setIsStateOpen] = useState(false);
  const stateRef = useRef<HTMLDivElement>(null);

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validatedFields, setValidatedFields] = useState<Record<string, boolean>>({});
  const [activeField, setActiveField] = useState<string | null>(null);

  // Status simulation/wallet simulation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [walletAmount, setWalletAmount] = useState(0);

  // Fetch current user details
  const fetchProfileData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData || !profileData.screen_name) {
      router.push("/profile/setup");
      return;
    }

    setProfile(profileData);
    setWalletAmount(profileData.wallet_balance || 0);

    // Fetch skills
    const { data: skillsData } = await supabase
      .from("freelancer_skills")
      .select("skill_name")
      .eq("freelancer_id", user.id);

    const skillsList = skillsData ? skillsData.map((s) => s.skill_name) : [];
    setUserSkills(skillsList);

    // Pre-fill edit fields
    setScreenName(profileData.screen_name);
    setDescription(profileData.description || "");
    setCity(profileData.city || "");
    setSelectedCountry(profileData.country);
    setCountryQuery(profileData.country || "");
    setSelectedState(profileData.state);
    setStateQuery(profileData.state || "");
    setZip(profileData.zip || "");
    setIsFreelancer(profileData.is_freelancer);
    setIsClient(profileData.is_client);
    setEditedSkills(skillsList);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Filter country/state search list
  const filteredCountries = countriesData.filter((c) =>
    c.name.toLowerCase().includes(countryQuery.toLowerCase())
  );

  const availableStates = selectedCountry
    ? countriesData.find((c) => c.name === selectedCountry)?.states || []
    : [];

  const filteredStates = availableStates.filter((s) =>
    s.toLowerCase().includes(stateQuery.toLowerCase())
  );

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
      if (stateRef.current && !stateRef.current.contains(event.target as Node)) {
        setIsStateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Validation function
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case "screenName":
        if (!value.trim()) return "Screen name is required.";
        if (value.trim().length < 3) return "Screen name must be at least 3 characters.";
        return "";
      case "description":
        if (!value) return "Profile description is required.";
        if (value.length < 150) return `Description must be at least 150 characters. (Current: ${value.length}/600)`;
        if (value.length > 600) return `Description cannot exceed 600 characters. (Current: ${value.length}/600)`;
        return "";
      case "city":
        if (!value.trim()) return "City is required.";
        return "";
      case "country":
        if (!value) return "Country selection is required.";
        return "";
      case "state":
        if (!value) return "State selection is required.";
        return "";
      case "zip":
        if (!value.trim()) return "ZIP code is required.";
        return "";
      case "role":
        if (!isFreelancer && !isClient) return "You must select at least one role.";
        return "";
      default:
        return "";
    }
  };

  // Run validation checks on input changes
  useEffect(() => {
    if (!isEditing) return;

    const newErrors: Record<string, string> = {};
    const fieldsToValidate = {
      screenName,
      description,
      city,
      country: selectedCountry,
      state: selectedState,
      zip,
    };

    Object.keys(fieldsToValidate).forEach((key) => {
      const val = fieldsToValidate[key as keyof typeof fieldsToValidate];
      const errorMsg = validateField(key, val);
      if (errorMsg) {
        newErrors[key] = errorMsg;
      }
    });

    const roleError = validateField("role", null);
    if (roleError) {
      newErrors["role"] = roleError;
    }

    setErrors(newErrors);
  }, [screenName, description, city, selectedCountry, selectedState, zip, isFreelancer, isClient, isEditing]);

  // Blur Trigger
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setActiveField(null);
    setValidatedFields((prev) => ({ ...prev, [name]: true }));
  };

  // Focus Trigger (neutral outline while typing)
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setActiveField(name);
  };

  const getInputClass = (fieldName: string) => {
    const baseClass = "form-input";
    if (activeField === fieldName) return baseClass;
    if (validatedFields[fieldName]) {
      return errors[fieldName] ? `${baseClass} is-invalid` : `${baseClass} is-valid`;
    }
    return baseClass;
  };

  // Switch role and update in DB
  const handleRoleToggleQuick = async (roleType: "freelancer" | "client", enable: boolean) => {
    if (!profile) return;
    
    // Check if toggling off would leave zero roles
    const nextFreelancer = roleType === "freelancer" ? enable : profile.is_freelancer;
    const nextClient = roleType === "client" ? enable : profile.is_client;

    if (!nextFreelancer && !nextClient) {
      alert("You must have at least one active role selected.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        is_freelancer: nextFreelancer,
        is_client: nextClient,
      })
      .eq("id", profile.id);

    if (error) {
      alert("Error switching role: " + error.message);
    } else {
      fetchProfileData();
    }
  };

  // Wallet simulation
  const handleSimulateWallet = async (action: "deposit" | "withdraw") => {
    if (!profile) return;
    const amount = action === "deposit" ? 100 : -100;
    const nextBalance = Number(walletAmount) + amount;

    if (nextBalance < 0) {
      alert("Insufficient funds in simulated wallet.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ wallet_balance: nextBalance })
      .eq("id", profile.id);

    if (error) {
      alert("Wallet simulation failed: " + error.message);
    } else {
      setWalletAmount(nextBalance);
    }
  };

  // Save full profile edits
  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitError(null);

    const allValidated = {
      screenName: true,
      description: true,
      city: true,
      country: true,
      state: true,
      zip: true,
      role: true,
    };
    setValidatedFields(allValidated);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      let idAttachmentUrl = profile.id_attachment_url;

      // Handle optional ID upload in edit mode
      if (idFile) {
        const fileExt = idFile.name.split(".").pop();
        const fileName = `${profile.id}/id-verification-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(fileName, idFile, { cacheControl: "3600", upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("attachments")
            .getPublicUrl(fileName);
          idAttachmentUrl = publicUrl;
        }
      }

      // Update profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          screen_name: screenName,
          description: description,
          city: city,
          country: selectedCountry,
          state: selectedState,
          zip: zip,
          id_attachment_url: idAttachmentUrl,
          is_freelancer: isFreelancer,
          is_client: isClient,
          is_verified: idFile ? false : profile.is_verified, // Reset verification only if a new ID is uploaded
        })
        .eq("id", profile.id);

      if (updateError) {
        setSubmitError(updateError.message);
        setIsSubmitting(false);
        return;
      }

      // Handle skills updates (delete existing, insert new if isFreelancer is active)
      await supabase
        .from("freelancer_skills")
        .delete()
        .eq("freelancer_id", profile.id);

      if (isFreelancer && editedSkills.length > 0) {
        const skillInserts = editedSkills.map((s) => ({
          freelancer_id: profile.id,
          skill_name: s,
        }));
        await supabase.from("freelancer_skills").insert(skillInserts);
      }

      setIsEditing(false);
      fetchProfileData();
    } catch (err: any) {
      setSubmitError("Failed to save profile modifications.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setEditedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>Loading Profile Info...</p>
      </div>
    );
  }

  return (
    <>
      {/* Navigation Header */}
      <header className="header">
        <div className="container header-container">
          <Link href="/" className="logo">
            <div className="logo-icon">C</div>
            Cala
          </Link>
          <nav className="nav-links">
            {profile.is_admin && (
              <Link href="/admin/dashboard" className="nav-link">Admin Dashboard</Link>
            )}
            {profile.is_freelancer && (
              <Link href="/freelancer/dashboard" className="nav-link">Freelancer Workspace</Link>
            )}
            {profile.is_client && (
              <Link href="/client/dashboard" className="nav-link">Client Workspace</Link>
            )}
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "13px" }}>
              Log Out
            </button>
          </nav>
        </div>
      </header>

      {/* Main Profile Layout */}
      <main style={{ padding: "48px 24px", flex: 1, display: "flex", justifyContent: "center" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          
          {/* WALLET & STATUS BANNER */}
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--primary-light)", borderColor: "#bfdbfe" }}>
            <div>
              <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--primary-color)", fontWeight: "700" }}>Simulated Online Wallet</p>
              <h3 style={{ fontSize: "28px", fontWeight: "800", color: "var(--primary-color)", margin: "4px 0" }}>
                ${Number(walletAmount).toFixed(2)}
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Used for simulated client-freelancer contracts</p>
            </div>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => handleSimulateWallet("deposit")} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: "13px" }}>
                + Deposit $100
              </button>
              <button onClick={() => handleSimulateWallet("withdraw")} className="btn btn-outline" style={{ padding: "8px 14px", fontSize: "13px" }}>
                - Withdraw $100
              </button>
            </div>
          </div>

          {!isEditing ? (
            /* VIEW PROFILE VIEW */
            <div className="card" style={{ marginTop: "24px" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: "800" }}>
                      {profile.first_name} {profile.last_name}
                    </h2>
                    
                    {/* Verification badge */}
                    {profile.is_verified ? (
                      <span style={{ fontSize: "11px", fontWeight: "700", backgroundColor: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success-color)", padding: "2px 8px", borderRadius: "50px" }}>
                        Verified ID
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", fontWeight: "700", backgroundColor: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error-color)", padding: "2px 8px", borderRadius: "50px" }}>
                        ID Verification Pending Approval
                      </span>
                    )}
                  </div>
                  
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    @{profile.screen_name} &bull; {profile.city}, {profile.state}, {profile.country}
                  </p>
                </div>

                <button onClick={() => setIsEditing(true)} className="btn btn-outline">
                  Edit Profile
                </button>
              </div>

              {/* Roles toggle rows */}
              <div style={{ borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", padding: "16px 0", margin: "20px 0", display: "flex", gap: "24px" }}>
                <div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Freelancer Mode</p>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", fontWeight: "600", fontSize: "14px" }}>
                    <input
                      type="checkbox"
                      checked={profile.is_freelancer}
                      onChange={(e) => handleRoleToggleQuick("freelancer", e.target.checked)}
                    />
                    Active
                  </label>
                </div>

                <div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Client Mode</p>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", fontWeight: "600", fontSize: "14px" }}>
                    <input
                      type="checkbox"
                      checked={profile.is_client}
                      onChange={(e) => handleRoleToggleQuick("client", e.target.checked)}
                    />
                    Active
                  </label>
                </div>
              </div>

              {/* Profile Description */}
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>Bio Description</h4>
                <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  {profile.description || "No description set yet."}
                </p>
              </div>

              {/* Skills listed */}
              {profile.is_freelancer && (
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>Freelance Skills</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {userSkills.map((skill, idx) => (
                      <span key={idx} className="tag">{skill}</span>
                    ))}
                    {userSkills.length === 0 && (
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No skills listed yet.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* EDIT PROFILE VIEW */
            <div className="card" style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px" }}>Edit Profile Information</h3>

              {submitError && (
                <div style={{ backgroundColor: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error-color)", padding: "12px", borderRadius: "var(--radius-sm)", fontSize: "14px", marginBottom: "20px" }}>
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSaveEdits} noValidate>
                
                {/* Screen Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="screenName">Screen Name</label>
                  <input
                    id="screenName"
                    type="text"
                    className={getInputClass("screenName")}
                    value={screenName}
                    onChange={(e) => setScreenName(e.target.value)}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    name="screenName"
                    required
                  />
                  {validatedFields.screenName && errors.screenName && (
                    <span className="form-error">{errors.screenName}</span>
                  )}
                </div>

                {/* Description with bottom-right limit */}
                <div className="form-group">
                  <label className="form-label" htmlFor="description">Bio Description</label>
                  <div className="textarea-container">
                    <textarea
                      id="description"
                      className={getInputClass("description")}
                      style={{ minHeight: "120px", resize: "vertical", width: "100%", padding: "10px 12px", fontSize: "14px", borderRadius: "var(--radius-sm)", outline: "none", border: "1px solid #cbd5e1" }}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      name="description"
                      required
                    />
                    <span className="textarea-counter">
                      {description.length}/600
                    </span>
                  </div>
                  {validatedFields.description && errors.description && (
                    <span className="form-error">{errors.description}</span>
                  )}
                </div>

                {/* Role Toggles */}
                <div className="form-group" style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <label className="form-label" style={{ marginBottom: "12px" }}>Roles</label>
                  <div style={{ display: "flex", gap: "24px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={isFreelancer}
                        onChange={(e) => setIsFreelancer(e.target.checked)}
                      />
                      Freelancer
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={isClient}
                        onChange={(e) => setIsClient(e.target.checked)}
                      />
                      Client
                    </label>
                  </div>
                  {validatedFields.role && errors.role && (
                    <span className="form-error" style={{ marginTop: "8px" }}>{errors.role}</span>
                  )}
                </div>

                {/* Country/State Searchable Selectors */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  
                  {/* Country search */}
                  <div className="form-group" ref={countryRef}>
                    <label className="form-label">Country</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className={getInputClass("country")}
                        value={countryQuery}
                        placeholder={selectedCountry || "Search Country..."}
                        onFocus={() => {
                          setIsCountryOpen(true);
                          setActiveField("country");
                        }}
                        onBlur={() => {
                          setActiveField(null);
                          setTimeout(() => setValidatedFields(prev => ({ ...prev, country: true })), 150);
                        }}
                        onChange={(e) => {
                          setCountryQuery(e.target.value);
                          setIsCountryOpen(true);
                        }}
                      />
                      {isCountryOpen && (
                        <ul style={{ 
                          position: "absolute", top: "100%", left: 0, right: 0, 
                          backgroundColor: "#fff", border: "1px solid var(--border-color)", 
                          maxHeight: "160px", overflowY: "auto", zIndex: 10, listStyle: "none", 
                          padding: 0, margin: 0, borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                          boxShadow: "var(--shadow-md)"
                        }}>
                          {filteredCountries.map((c, idx) => (
                            <li 
                              key={idx}
                              onClick={() => {
                                setSelectedCountry(c.name);
                                setCountryQuery(c.name);
                                setSelectedState(null);
                                setStateQuery("");
                                setIsCountryOpen(false);
                              }}
                              style={{ padding: "8px 12px", cursor: "pointer", fontSize: "14px", borderBottom: "1px solid #f1f5f9" }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {c.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {validatedFields.country && errors.country && (
                      <span className="form-error">{errors.country}</span>
                    )}
                  </div>

                  {/* State search */}
                  <div className="form-group" ref={stateRef}>
                    <label className="form-label">State / Region</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className={getInputClass("state")}
                        value={stateQuery}
                        placeholder={selectedState || "Search State..."}
                        disabled={!selectedCountry}
                        onFocus={() => {
                          setIsStateOpen(true);
                          setActiveField("state");
                        }}
                        onBlur={() => {
                          setActiveField(null);
                          setTimeout(() => setValidatedFields(prev => ({ ...prev, state: true })), 150);
                        }}
                        onChange={(e) => {
                          setStateQuery(e.target.value);
                          setIsStateOpen(true);
                        }}
                      />
                      {isStateOpen && selectedCountry && (
                        <ul style={{ 
                          position: "absolute", top: "100%", left: 0, right: 0, 
                          backgroundColor: "#fff", border: "1px solid var(--border-color)", 
                          maxHeight: "160px", overflowY: "auto", zIndex: 10, listStyle: "none", 
                          padding: 0, margin: 0, borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                          boxShadow: "var(--shadow-md)"
                        }}>
                          {filteredStates.map((s, idx) => (
                            <li 
                              key={idx}
                              onClick={() => {
                                setSelectedState(s);
                                setStateQuery(s);
                                setIsStateOpen(false);
                              }}
                              style={{ padding: "8px 12px", cursor: "pointer", fontSize: "14px", borderBottom: "1px solid #f1f5f9" }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {validatedFields.state && errors.state && (
                      <span className="form-error">{errors.state}</span>
                    )}
                  </div>

                </div>

                {/* City & ZIP */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="city">City</label>
                    <input
                      id="city"
                      type="text"
                      className={getInputClass("city")}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      name="city"
                      required
                    />
                    {validatedFields.city && errors.city && (
                      <span className="form-error">{errors.city}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="zip">ZIP / Postal Code</label>
                    <input
                      id="zip"
                      type="text"
                      className={getInputClass("zip")}
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      name="zip"
                      required
                    />
                    {validatedFields.zip && errors.zip && (
                      <span className="form-error">{errors.zip}</span>
                    )}
                  </div>
                </div>

                {/* Skills configuration (if freelancer checkbox is checked) */}
                {isFreelancer && (
                  <div className="form-group" style={{ border: "1px solid var(--border-color)", padding: "16px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--bg-main)", marginTop: "12px" }}>
                    <label className="form-label" style={{ marginBottom: "12px" }}>Edit Skills</label>
                    
                    <div style={{ marginBottom: "12px" }}>
                      <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid #cbd5e1" }}
                      >
                        {Object.keys(skillsCategories).map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxHeight: "150px", overflowY: "auto", padding: "8px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "#ffffff" }}>
                      {skillsCategories[selectedCategory].map((skill, idx) => (
                        <label key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={editedSkills.includes(skill)}
                            onChange={() => handleSkillToggle(skill)}
                          />
                          {skill}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional ID Attachment Update */}
                <div className="form-group" style={{ marginTop: "24px" }}>
                  <label className="form-label" htmlFor="idFile">Update Valid ID Document (Optional)</label>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    Leave blank to keep your current verified ID. Uploading a new ID will mark your account as unverified until approved again by an admin.
                  </p>
                  <input
                    id="idFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setIdFile(e.target.files[0]);
                      } else {
                        setIdFile(null);
                      }
                    }}
                  />
                </div>

                {/* Buttons row */}
                <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn btn-outline" disabled={isSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>

              </form>
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
