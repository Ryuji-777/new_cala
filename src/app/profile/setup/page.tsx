"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Searchable location data
const countriesData = [
  {
    name: "Philippines",
    states: [
      "Metro Manila",
      "Calabarzon",
      "Central Luzon",
      "Central Visayas",
      "Western Visayas",
      "Davao Region",
      "Northern Mindanao",
      "Bicol Region",
      "Ilocos Region",
      "Cagayan Valley",
      "Mimaropa",
      "Eastern Visayas",
      "Zamboanga Peninsula",
      "Soccsksargen",
      "Caraga",
      "Cordillera Administrative Region",
      "BARMM"
    ]
  },
  {
    name: "Singapore",
    states: [
      "Central Region",
      "East Region",
      "North Region",
      "North-East Region",
      "West Region"
    ]
  },
  {
    name: "Japan",
    states: [
      "Tokyo",
      "Osaka",
      "Kyoto",
      "Hokkaido",
      "Fukuoka",
      "Aichi",
      "Kanagawa",
      "Okinawa",
      "Chiba",
      "Saitama"
    ]
  },
  {
    name: "South Korea",
    states: [
      "Seoul",
      "Busan",
      "Incheon",
      "Daegu",
      "Daejeon",
      "Gwangju",
      "Ulsan",
      "Gyeonggi",
      "Gangwon",
      "Jeju"
    ]
  },
  {
    name: "India",
    states: [
      "Andhra Pradesh",
      "Arunachal Pradesh",
      "Assam",
      "Bihar",
      "Chhattisgarh",
      "Goa",
      "Gujarat",
      "Haryana",
      "Himachal Pradesh",
      "Jharkhand",
      "Karnataka",
      "Kerala",
      "Madhya Pradesh",
      "Maharashtra",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Odisha",
      "Punjab",
      "Rajasthan",
      "Sikkim",
      "Tamil Nadu",
      "Telangana",
      "Tripura",
      "Uttar Pradesh",
      "Uttarakhand",
      "West Bengal",
      "Delhi",
      "Noida"
    ]
  },
  {
    name: "Malaysia",
    states: [
      "Kuala Lumpur",
      "Selangor",
      "Penang",
      "Johor",
      "Sabah",
      "Sarawak",
      "Perak",
      "Pahang",
      "Melaka",
      "Kedah"
    ]
  },
  {
    name: "Thailand",
    states: [
      "Bangkok",
      "Chiang Mai",
      "Phuket",
      "Chonburi",
      "Nonthaburi",
      "Nakhon Ratchasima"
    ]
  },
  {
    name: "Indonesia",
    states: [
      "Jakarta",
      "West Java",
      "Central Java",
      "East Java",
      "Bali",
      "Yogyakarta",
      "Banten",
      "North Sumatra"
    ]
  },
  {
    name: "Vietnam",
    states: [
      "Hanoi",
      "Ho Chi Minh City",
      "Da Nang",
      "Hai Phong",
      "Can Tho",
      "Binh Duong"
    ]
  },
  {
    name: "China",
    states: [
      "Beijing",
      "Shanghai",
      "Guangdong",
      "Zhejiang",
      "Jiangsu",
      "Sichuan",
      "Fujian",
      "Hubei"
    ]
  }
];

// Predefined categories and skills from the user
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
  ],
  "Sales & Marketing": [
    "Marketers", "Social Media Marketers", "Sales Experts", "Management Experts", 
    "Digital Marketing Services", "Facebook Advertising", "SEO Experts", "Advertising Consultants", 
    "Lead Generation Services", "Content Writers", "Keyword Researchers", "Data Entry Experts", 
    "Email Marketers", "Researchers", "Instagram Marketers", "Analytics Experts", 
    "Freelance Writers", "Designers", "Search Engine Marketers", "Customer Service Representatives"
  ],
  "Engineering & Architecture": [
    "Designers", "3D Designers", "3D Modelers", "Mechanical Engineers", "Drawing Artists", 
    "AutoCAD Designers", "Architects", "2D Designers", "Drafters", "3D Rendering Experts", 
    "SolidWorks Designers", "Interior Designers", "Construction Experts", "Google SketchUp Experts", 
    "Civil Engineers", "Software Developers", "Revit Designers", "3Ds Max Designers", 
    "Adobe Photoshop Designers", "Analytics Experts"
  ],
  "Business & Finance": [
    "Accountants", "Data Entry Experts", "Management Experts", "Financial Analysts", 
    "Analytics Experts", "Data Managers", "Bookkeepers", "Microsoft Excel Experts", 
    "QuickBooks Consultants", "Payroll Services", "Microsoft Developers", "Researchers", 
    "Marketers", "Data Analysts", "Freelance Writers", "Business Consultants", "Financial Planners", 
    "Project Managers", "Business Planners", "Sales Experts"
  ],
  "Education & Training": [
    "Freelance Writers", "Trainers", "Tutors", "Mathematics Experts", "English Language Experts", 
    "Data Entry Experts", "Data Managers", "Mathematics Tutors", "Content Writers", 
    "English Teachers", "Educational Consultants", "Algebra Tutors", "Science Teachers", 
    "Science Consultants", "Typists", "Designers", "Researchers", "Calculus Tutors", 
    "Management Experts", "Mental Health Consultants"
  ],
  "Legal": [
    "Legal Advisors", "Drafters", "Freelance Writers", "Researchers", "Legal Researchers", 
    "Data Entry Experts", "Legal Assistants", "Legal Documents Services", "Paralegal Services", 
    "Litigation Lawyers", "Business Consultants", "Typists", "Legal Writers", 
    "Employment Contract Lawyers", "Management Experts", "English Language Experts", 
    "Service Contract Specialists", "Contract Managers", "Business Contract Lawyers", "Patent Attorneys"
  ]
};

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);

  // Form State
  const [screenName, setScreenName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Programming & Development");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [idFile, setIdFile] = useState<File | null>(null);

  // Profile Picture State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const validateImageFile = (file: File): string => {
    const validExtensions = ["png", "jpg", "jpeg"];
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    if (!validExtensions.includes(fileExt)) {
      return "Invalid file type. Only PNG and JPG images are allowed.";
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return "File is too large. Maximum size allowed is 5MB.";
    }
    return "";
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const errorMsg = validateImageFile(file);
      if (errorMsg) {
        setAvatarError(errorMsg);
        setAvatarFile(null);
        setAvatarPreview(null);
        e.target.value = ""; // Clear file input selection
        alert("Validation Error: " + errorMsg); // Immediate visibility
      } else {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    } else {
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  // Searchable Country Dropdown States
  const [countryQuery, setCountryQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  // Searchable State Dropdown States
  const [stateQuery, setStateQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [isStateOpen, setIsStateOpen] = useState(false);
  const stateRef = useRef<HTMLDivElement>(null);

  // Data Privacy Agreement State
  const [agreeDataPrivacy, setAgreeDataPrivacy] = useState(false);

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validatedFields, setValidatedFields] = useState<Record<string, boolean>>({});
  const [activeField, setActiveField] = useState<string | null>(null);

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get current logged-in user
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
      } else {
        setUserId(user.id);
      }
    };
    checkUser();
  }, []);

  // Filter country search
  const filteredCountries = countriesData.filter((c) =>
    c.name.toLowerCase().includes(countryQuery.toLowerCase())
  );

  // Get states of the selected country
  const availableStates = selectedCountry
    ? countriesData.find((c) => c.name === selectedCountry)?.states || []
    : [];

  // Filter state search
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

  // Validate individual field
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
        if (!value) return "Please search and select a country.";
        return "";
      case "state":
        if (!value) return "Please search and select a state.";
        return "";
      case "zip":
        if (!value.trim()) return "ZIP / Postal code is required.";
        return "";
      case "role":
        if (!isFreelancer && !isClient) return "You must select at least one role (Freelancer or Client).";
        return "";
      case "idFile":
        if (!value) return "You must upload a valid ID document to verify your account.";
        return "";
      case "agreeDataPrivacy":
        if (!value) return "You must agree to the Data Privacy Act of 2012 to continue.";
        return "";
      default:
        return "";
    }
  };

  // Run validation on changes
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    
    const fieldsToValidate = {
      screenName,
      description,
      city,
      country: selectedCountry,
      state: selectedState,
      zip,
      idFile,
      agreeDataPrivacy,
    };

    Object.keys(fieldsToValidate).forEach((key) => {
      const val = fieldsToValidate[key as keyof typeof fieldsToValidate];
      const errorMsg = validateField(key, val);
      if (errorMsg) {
        newErrors[key] = errorMsg;
      }
    });

    // Handle role dependency error
    const roleError = validateField("role", null);
    if (roleError) {
      newErrors["role"] = roleError;
    }

    setErrors(newErrors);
  }, [screenName, description, city, selectedCountry, selectedState, zip, isFreelancer, isClient, idFile, agreeDataPrivacy]);

  // Toggle skills checkbox
  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

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

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSubmitError(null);

    // Set all fields to validated
    const allValidated = {
      screenName: true,
      description: true,
      city: true,
      country: true,
      state: true,
      zip: true,
      idFile: true,
      role: true,
      agreeDataPrivacy: true,
    };
    setValidatedFields(allValidated);

    // If there are validation errors, block submission
    if (Object.keys(errors).length > 0 || avatarError) {
      return;
    }

    setIsSubmitting(true);

    try {
      let idAttachmentUrl = "https://example.com/mock-attachments/verified-id.png";

      // Upload ID to Supabase storage if file is selected
      if (idFile) {
        const fileExt = idFile.name.split(".").pop();
        const fileName = `${userId}/id-verification-${Date.now()}.${fileExt}`;
        
        // Try uploading to bucket 'attachments' (ignore if bucket doesn't exist, we will use mock URL)
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

      let avatarUrl = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
        try {
          const { error: uploadError } = await supabase.storage
            .from("attachments")
            .upload(fileName, avatarFile, { cacheControl: "3600", upsert: true });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("attachments")
              .getPublicUrl(fileName);
            avatarUrl = publicUrl;
          } else {
            console.warn("Avatar upload failed, falling back to mock:", uploadError.message);
            avatarUrl = `https://picsum.photos/seed/${userId}/150/150`;
          }
        } catch (err) {
          console.warn("Avatar upload exception, falling back to mock:", err);
          avatarUrl = `https://picsum.photos/seed/${userId}/150/150`;
        }
      }

      // Get auth user details to pass email/names to upsert
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubmitError("User session not found. Please log in again.");
        setIsSubmitting(false);
        return;
      }

      // Upsert profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          email: user.email || "",
          screen_name: screenName,
          description: description,
          city: city,
          country: selectedCountry,
          state: selectedState,
          zip: zip,
          id_attachment_url: idAttachmentUrl,
          avatar_url: avatarUrl,
          is_freelancer: isFreelancer,
          is_client: isClient,
          is_verified: false, // Wait for admin approval
        });

      if (updateError) {
        setSubmitError(updateError.message);
        setIsSubmitting(false);
        return;
      }

      // Insert skills if freelancer
      if (isFreelancer && selectedSkills.length > 0) {
        const skillInserts = selectedSkills.map((skill) => ({
          freelancer_id: userId,
          skill_name: skill,
        }));

        const { error: skillError } = await supabase
          .from("freelancer_skills")
          .insert(skillInserts);

        if (skillError) {
          setSubmitError("Profile updated, but there was an error saving your skills: " + skillError.message);
          setIsSubmitting(false);
          return;
        }
      }

      // Redirect to their appropriate workspace/dashboard instead of profile view
      if (isFreelancer) {
        router.replace("/freelancer/dashboard");
      } else {
        router.replace("/client/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setSubmitError("An unexpected error occurred while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="container header-container">
          <div className="logo">
            <div className="logo-icon">C</div>
            Cala
          </div>
          <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: "600" }}>Account Onboarding</span>
        </div>
      </header>

      {/* Main onboarding container */}
      <main style={{ padding: "48px 24px", flex: 1, display: "flex", justifyContent: "center" }}>
        <div className="card" style={{ width: "100%", maxWidth: "680px", padding: "40px" }}>
          
          <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px", textAlign: "center" }}>Complete Your Profile</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "32px", textAlign: "center" }}>
            Set up your Cala profile details to start applying for jobs or posting work.
          </p>

          {submitError && (
            <div style={{ 
              backgroundColor: "var(--error-bg)", 
              border: "1px solid var(--error-border)", 
              color: "var(--error-color)", 
              padding: "12px", 
              borderRadius: "var(--radius-sm)", 
              fontSize: "14px", 
              marginBottom: "20px" 
            }}>
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            
            {/* Screen Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="screenName">Screen Name (Public Username)</label>
              <input
                id="screenName"
                type="text"
                className={getInputClass("screenName")}
                value={screenName}
                onChange={(e) => setScreenName(e.target.value)}
                onBlur={handleBlur}
                onFocus={handleFocus}
                placeholder="e.g. janesmith_dev"
                name="screenName"
                required
              />
              {validatedFields.screenName && errors.screenName && (
                <span className="form-error">{errors.screenName}</span>
              )}
            </div>

            {/* Profile Description with bottom-right counter */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">About Yourself / Description</label>
              <div className="textarea-container">
                <textarea
                  id="description"
                  className={getInputClass("description")}
                  style={{ minHeight: "120px", resize: "vertical", width: "100%", padding: "10px 12px", fontSize: "14px", borderRadius: "var(--radius-sm)", outline: "none", border: "1px solid #cbd5e1" }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Introduce yourself, your core background, and what you offer to the platform. Min 150, max 600 characters."
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

            {/* Role Switcher check boxes */}
            <div className="form-group" style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              <label className="form-label" style={{ marginBottom: "12px" }}>Select Your Role(s)</label>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                Choose one or both roles. You can toggle between client and freelancer modes in your profile settings later.
              </p>
              <div style={{ display: "flex", gap: "24px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isFreelancer}
                    onChange={(e) => setIsFreelancer(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  I am a Freelancer (Looking for Work)
                </label>
                
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isClient}
                    onChange={(e) => setIsClient(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  I am a Client (Hiring Freelancers)
                </label>
              </div>
              {validatedFields.role && errors.role && (
                <span className="form-error" style={{ marginTop: "8px" }}>{errors.role}</span>
              )}
            </div>

            {/* Searchable Location Selectors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px" }}>
              
              {/* Searchable Country Selector */}
              <div className="form-group" ref={countryRef}>
                <label className="form-label">Country</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className={getInputClass("country")}
                    value={countryQuery}
                    placeholder={selectedCountry || "Type to search Country..."}
                    onFocus={() => {
                      setIsCountryOpen(true);
                      setActiveField("country");
                    }}
                    onBlur={() => {
                      setActiveField(null);
                      // Give click event on list time to register
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
                            setSelectedState(null); // Reset state when country changes
                            setStateQuery("");
                            setIsCountryOpen(false);
                          }}
                          style={{ padding: "8px 12px", cursor: "pointer", fontSize: "14px", borderBottom: "1px solid #f1f5f9" }}
                          onMouseDown={(e) => e.preventDefault()} // Prevent input blur from closing before selection
                        >
                          {c.name}
                        </li>
                      ))}
                      {filteredCountries.length === 0 && (
                        <li style={{ padding: "8px 12px", color: "var(--text-secondary)", fontSize: "14px" }}>No countries found</li>
                      )}
                    </ul>
                  )}
                </div>
                {validatedFields.country && errors.country && (
                  <span className="form-error">{errors.country}</span>
                )}
              </div>

              {/* Searchable State Selector */}
              <div className="form-group" ref={stateRef}>
                <label className="form-label">State / Region</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className={getInputClass("state")}
                    value={stateQuery}
                    placeholder={selectedState || "Type to search State..."}
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
                      {filteredStates.length === 0 && (
                        <li style={{ padding: "8px 12px", color: "var(--text-secondary)", fontSize: "14px" }}>No states found</li>
                      )}
                    </ul>
                  )}
                </div>
                {validatedFields.state && errors.state && (
                  <span className="form-error">{errors.state}</span>
                )}
              </div>

            </div>

            {/* City & Zip Code row */}
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

            {/* Skills selection (Only visible if isFreelancer is checked) */}
            {isFreelancer && (
              <div className="form-group" style={{ border: "1px solid var(--border-color)", padding: "20px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--bg-main)", marginTop: "12px" }}>
                <label className="form-label" style={{ marginBottom: "12px" }}>Post Your Skills</label>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  Select the category and tick the skills that represent your expertise.
                </p>

                {/* Category select dropdown */}
                <div style={{ marginBottom: "16px" }}>
                  <label className="form-label" style={{ fontSize: "12px" }}>Category</label>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid #cbd5e1", outline: "none" }}
                  >
                    {Object.keys(skillsCategories).map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Skills Grid checkboxes */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxHeight: "180px", overflowY: "auto", padding: "8px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "#ffffff" }}>
                  {skillsCategories[selectedCategory].map((skill, idx) => (
                    <label key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                        style={{ cursor: "pointer" }}
                      />
                      {skill}
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: "12px" }}>
                  <p style={{ fontSize: "12px", fontWeight: "600" }}>Selected skills ({selectedSkills.length}):</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                    {selectedSkills.map((s, idx) => (
                      <span key={idx} className="tag">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Picture (Avatar) - Optional */}
            <div className="form-group" style={{ marginTop: "24px" }}>
              <label className="form-label" htmlFor="avatarFile">Profile Picture (Optional)</label>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                Upload a PNG or JPG photo to show as your profile picture on the website (max 5MB).
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {avatarPreview && (
                  <img
                    src={avatarPreview}
                    alt="Profile Preview"
                    style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary-color)" }}
                  />
                )}
                <input
                  id="avatarFile"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  style={{ display: "block", fontSize: "14px" }}
                  onChange={handleAvatarChange}
                />
              </div>
              {avatarError && (
                <span className="form-error" style={{ display: "block", marginTop: "4px" }}>{avatarError}</span>
              )}
            </div>

            {/* File ID attachment */}
            <div className="form-group" style={{ marginTop: "24px" }}>
              <label className="form-label" htmlFor="idFile">Attach Valid ID Document</label>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                Upload a scanned copy or clear picture of a Government-issued ID (driver license, passport, etc.). Admins must verify this document before applications or job posts can be finalized.
              </p>
              <input
                id="idFile"
                type="file"
                accept="image/*,.pdf"
                style={{ display: "block", fontSize: "14px" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setIdFile(e.target.files[0]);
                  } else {
                    setIdFile(null);
                  }
                  setValidatedFields((prev) => ({ ...prev, idFile: true }));
                }}
                onBlur={() => setValidatedFields((prev) => ({ ...prev, idFile: true }))}
                required
              />
              {validatedFields.idFile && errors.idFile && (
                <span className="form-error">{errors.idFile}</span>
              )}
            </div>

            {/* Data Privacy Agreement Checkbox */}
            <div className="form-group" style={{ marginTop: "24px", backgroundColor: "#f8fafc", padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", fontWeight: "500", cursor: "pointer", lineHeight: "1.4" }}>
                <input
                  type="checkbox"
                  checked={agreeDataPrivacy}
                  onChange={(e) => {
                    setAgreeDataPrivacy(e.target.checked);
                    setValidatedFields(prev => ({ ...prev, agreeDataPrivacy: true }));
                  }}
                  style={{ width: "18px", height: "18px", marginTop: "2px", cursor: "pointer" }}
                  required
                />
                <span>
                  I agree to the processing of my personal data in accordance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> of the Philippines. I understand that my ID document and profile details will be verified by the platform administrators.
                </span>
              </label>
              {validatedFields.agreeDataPrivacy && errors.agreeDataPrivacy && (
                <span className="form-error" style={{ display: "block", marginTop: "8px" }}>{errors.agreeDataPrivacy}</span>
              )}
            </div>

            {/* Submit onboarding */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: "700", marginTop: "24px" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving Profile..." : "Complete Setup & Submit ID for Verification"}
            </button>

          </form>

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
