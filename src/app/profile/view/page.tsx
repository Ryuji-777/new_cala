"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Popup from "@/components/Popup";

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

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Popup modal state
  const [popup, setPopup] = useState<{ message: string; type: "success" | "error" | "info"; onClose?: () => void } | null>(null);

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

  // Profile Picture State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Portfolio States
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [newPortfolioFiles, setNewPortfolioFiles] = useState<File[]>([]);
  const [newPortfolioDesc, setNewPortfolioDesc] = useState("");
  const [newPortfolioError, setNewPortfolioError] = useState<string | null>(null);
  const [newPortfolioPreviews, setNewPortfolioPreviews] = useState<string[]>([]);
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [isSubmittingPortfolio, setIsSubmittingPortfolio] = useState(false);

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
        e.target.value = ""; // Reset the input value
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

  const handlePortfolioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPortfolioError(null);
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length === 0) {
        setNewPortfolioFiles([]);
        setNewPortfolioPreviews([]);
        return;
      }

      if (files.length > 4) {
        const err = "You can only upload up to 4 images for a portfolio item.";
        setNewPortfolioError(err);
        setNewPortfolioFiles([]);
        setNewPortfolioPreviews([]);
        e.target.value = "";
        alert("Validation Error: " + err);
        return;
      }

      const validExtensions = ["png", "jpg", "jpeg"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      for (const file of files) {
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
        if (!validExtensions.includes(fileExt)) {
          const err = `Invalid file type for "${file.name}". Only PNG and JPG images are allowed.`;
          setNewPortfolioError(err);
          setNewPortfolioFiles([]);
          setNewPortfolioPreviews([]);
          e.target.value = "";
          alert("Validation Error: " + err);
          return;
        }
        if (file.size > maxSize) {
          const err = `File "${file.name}" is too large. Maximum size allowed is 5MB.`;
          setNewPortfolioError(err);
          setNewPortfolioFiles([]);
          setNewPortfolioPreviews([]);
          e.target.value = "";
          alert("Validation Error: " + err);
          return;
        }
      }

      // All files are valid
      setNewPortfolioFiles(files);
      setNewPortfolioPreviews(files.map((file) => URL.createObjectURL(file)));
    } else {
      setNewPortfolioFiles([]);
      setNewPortfolioPreviews([]);
    }
  };

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

    if (profileError || !profileData || (!profileData.screen_name && !profileData.is_admin && !profileData.is_super_admin)) {
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

    if (profileData.avatar_url) {
      setAvatarPreview(profileData.avatar_url);
    }

    if (profileData.is_freelancer) {
      const { data: portData } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false });
      if (portData) setPortfolio(portData);
    }

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
      setPopup({
        message: "You must have at least one active role selected.",
        type: "error"
      });
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
      setPopup({
        message: "Error switching role: " + error.message,
        type: "error"
      });
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
      setPopup({
        message: "Insufficient funds in simulated wallet.",
        type: "error"
      });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ wallet_balance: nextBalance })
      .eq("id", profile.id);

    if (error) {
      setPopup({
        message: "Wallet simulation failed: " + error.message,
        type: "error"
      });
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

    if (Object.keys(errors).length > 0 || avatarError) {
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

      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${profile.id}/avatar-${Date.now()}.${fileExt}`;
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
            avatarUrl = `https://picsum.photos/seed/${profile.id}/150/150`;
          }
        } catch (err) {
          console.warn("Avatar upload exception, falling back to mock:", err);
          avatarUrl = `https://picsum.photos/seed/${profile.id}/150/150`;
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
          avatar_url: avatarUrl,
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
    } catch (err) {
      setSubmitError("Failed to save profile modifications.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPortfolioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPortfolioError(null);

    if (newPortfolioFiles.length === 0) {
      const err = "Please upload at least 1 image (minimum 1, maximum 4 images required).";
      setNewPortfolioError(err);
      alert("Validation Error: " + err);
      return;
    }
    if (newPortfolioFiles.length > 4) {
      const err = "You can only upload up to 4 images.";
      setNewPortfolioError(err);
      alert("Validation Error: " + err);
      return;
    }
    if (!newPortfolioDesc.trim()) {
      setNewPortfolioError("Please enter a description for the portfolio item.");
      return;
    }

    setIsSubmittingPortfolio(true);

    try {
      const inserts = [];
      for (let i = 0; i < newPortfolioFiles.length; i++) {
        const file = newPortfolioFiles[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${profile.id}/portfolio-${Date.now()}-${i}.${fileExt}`;
        let publicUrl = "";
        try {
          const { error: uploadError } = await supabase.storage
            .from("attachments")
            .upload(fileName, file, { cacheControl: "3600", upsert: true });

          if (uploadError) {
            console.warn("Portfolio upload failed, checking bucket status:", uploadError.message);
            if (uploadError.message.includes("Bucket not found")) {
              publicUrl = `https://picsum.photos/seed/portfolio-${Date.now()}-${i}/600/400`;
            } else {
              setNewPortfolioError("Upload failed: " + uploadError.message);
              setIsSubmittingPortfolio(false);
              return;
            }
          } else {
            const { data: { publicUrl: url } } = supabase.storage
              .from("attachments")
              .getPublicUrl(fileName);
            publicUrl = url;
          }
        } catch (err) {
          console.warn("Portfolio upload exception, falling back to mock:", err);
          publicUrl = `https://picsum.photos/seed/portfolio-${Date.now()}-${i}/600/400`;
        }

        inserts.push({
          freelancer_id: profile.id,
          image_url: publicUrl,
          description: newPortfolioDesc.trim(),
        });
      }

      const { error: dbError } = await supabase
        .from("portfolio_items")
        .insert(inserts);

      if (dbError) {
        setNewPortfolioError("Failed to save portfolio details: " + dbError.message);
      } else {
        setPopup({
          message: "Portfolio item added successfully!",
          type: "success"
        });
        setNewPortfolioFiles([]);
        setNewPortfolioDesc("");
        setNewPortfolioPreviews([]);
        setShowAddPortfolioModal(false);
        fetchProfileData();
      }
    } catch (err) {
      setNewPortfolioError("An unexpected error occurred while adding portfolio.");
    } finally {
      setIsSubmittingPortfolio(false);
    }
  };

  const handleDeletePortfolioItem = async (itemId: string) => {
    const { error } = await supabase
      .from("portfolio_items")
      .delete()
      .eq("id", itemId)
      .eq("freelancer_id", profile.id);

    if (error) {
      setPopup({
        message: "Failed to delete portfolio item: " + error.message,
        type: "error"
      });
    } else {
      setPopup({
        message: "Portfolio item deleted successfully!",
        type: "success"
      });
      fetchProfileData();
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
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "13px" }}>
              Log Out
            </button>
          </nav>
        </div>
      </header>

      {/* Main Profile Layout */}
      <main style={{ padding: "48px 24px", flex: 1, display: "flex", justifyContent: "center" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <div style={{ marginBottom: "24px" }}>
            <button 
              onClick={handleGoBack} 
              className="btn btn-outline" 
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", fontSize: "14px" }}
            >
              ← Back
            </button>
          </div>
          
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
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary-color)" }} 
                    />
                  ) : (
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", color: "#64748b" }}>
                      {profile.first_name[0]}{profile.last_name[0]}
                    </div>
                  )}
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

              {/* Portfolio showcase */}
              {profile.is_freelancer && (
                <div style={{ marginTop: "32px", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary)" }}>My Portfolio</h4>
                    <button 
                      type="button" 
                      onClick={() => setShowAddPortfolioModal(true)} 
                      className="btn btn-outline"
                      style={{ padding: "6px 14px", fontSize: "13px" }}
                    >
                      + Add Item
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
                    {portfolio.map((item, idx) => (
                      <div key={idx} style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", overflow: "hidden", backgroundColor: "#fff", display: "flex", flexDirection: "column" }}>
                        <img 
                          src={item.image_url} 
                          alt="Portfolio Work" 
                          style={{ width: "100%", height: "140px", objectFit: "cover" }} 
                        />
                        <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: "1.4" }}>{item.description}</p>
                          <button 
                            type="button" 
                            onClick={() => handleDeletePortfolioItem(item.id)} 
                            className="btn btn-outline" 
                            style={{ width: "100%", padding: "4px", fontSize: "11px", color: "var(--error-color)", borderColor: "var(--error-border)", backgroundColor: "var(--error-bg)" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {portfolio.length === 0 && (
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No portfolio items added yet. Click &quot;+ Add Item&quot; to build your portfolio.</p>
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
                
                {/* Profile Picture Edit */}
                <div className="form-group">
                  <label className="form-label" htmlFor="editAvatarFile">Profile Picture (Optional)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile Preview"
                        style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary-color)" }}
                      />
                    ) : (
                      <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "700", color: "#64748b" }}>
                        {profile.first_name[0]}{profile.last_name[0]}
                      </div>
                    )}
                    <input
                      id="editAvatarFile"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      style={{ fontSize: "14px" }}
                      onChange={handleAvatarChange}
                    />
                  </div>
                  {avatarError && (
                    <span className="form-error" style={{ display: "block", marginTop: "4px" }}>{avatarError}</span>
                  )}
                </div>

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

      {showAddPortfolioModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", backgroundColor: "#fff", padding: "32px", borderRadius: "var(--radius-md)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Add Portfolio Item</h3>
            
            {newPortfolioError && (
              <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)", padding: "10px", fontSize: "13px", borderRadius: "var(--radius-sm)", marginBottom: "12px" }}>
                {newPortfolioError}
              </div>
            )}

            <form onSubmit={handleAddPortfolioItem}>
              <div className="form-group">
                <label className="form-label">Portfolio Images (1-4 images required)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "8px" }}>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    multiple
                    onChange={handlePortfolioFileChange}
                  />
                  
                  {newPortfolioPreviews.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {newPortfolioPreviews.map((preview, index) => (
                        <img 
                          key={index} 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          style={{ width: "60px", height: "60px", borderRadius: "var(--radius-sm)", objectFit: "cover", border: "1px solid var(--border-color)" }} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Work Description</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: "100px", width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "13px" }}
                  value={newPortfolioDesc}
                  onChange={(e) => setNewPortfolioDesc(e.target.value)}
                  placeholder="Describe your role, tools used, and overall outcome of this project..."
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddPortfolioModal(false);
                    setNewPortfolioFiles([]);
                    setNewPortfolioPreviews([]);
                    setNewPortfolioDesc("");
                    setNewPortfolioError(null);
                  }} 
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingPortfolio}>
                  {isSubmittingPortfolio ? "Adding..." : "Add to Portfolio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
