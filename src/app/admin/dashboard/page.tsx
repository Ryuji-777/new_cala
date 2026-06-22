"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { createBrowserClient } from "@supabase/ssr";
import Popup from "@/components/Popup";
import ConfirmPopup from "@/components/ConfirmPopup";

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentAdminProfile, setCurrentAdminProfile] = useState<any>(null);

  // Popup modal state
  const [popup, setPopup] = useState<{ message: string; type: "success" | "error" | "info"; onClose?: () => void } | null>(null);
  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // Tabs: "overview", "approvals", "users", "super-admin"
  const [activeTab, setActiveTab] = useState("overview");

  // Data lists
  const [profiles, setProfiles] = useState<any[]>([]);
  const [unverifiedProfiles, setUnverifiedProfiles] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);

  // Health stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    freelancers: 0,
    clients: 0,
    admins: 0,
  });

  // User creation form
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "both", // 'freelancer', 'client', or 'both'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formActiveField, setFormActiveField] = useState<string | null>(null);
  const [formValidated, setFormValidated] = useState<Record<string, boolean>>({});
  const [newUserError, setNewUserError] = useState<string | null>(null);

  // Admin creation form
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    contactNumber: "",
    city: "",
    zip: "",
  });
  const [adminFormErrors, setAdminFormErrors] = useState<Record<string, string>>({});
  const [adminFormActiveField, setAdminFormActiveField] = useState<string | null>(null);
  const [adminFormValidated, setAdminFormValidated] = useState<Record<string, boolean>>({});
  const [newAdminError, setNewAdminError] = useState<string | null>(null);

  // Searchable Location Selectors for new Admin
  const [adminCountryQuery, setAdminCountryQuery] = useState("");
  const [adminSelectedCountry, setAdminSelectedCountry] = useState<string | null>(null);
  const [isAdminCountryOpen, setIsAdminCountryOpen] = useState(false);
  const adminCountryRef = React.useRef<HTMLDivElement>(null);

  const [adminStateQuery, setAdminStateQuery] = useState("");
  const [adminSelectedState, setAdminSelectedState] = useState<string | null>(null);
  const [isAdminStateOpen, setIsAdminStateOpen] = useState(false);
  const adminStateRef = React.useRef<HTMLDivElement>(null);

  // Promote admin search query
  const [promoteSearch, setPromoteSearch] = useState("");

  // User search and filters
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Moderation Reports State
  const [reports, setReports] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [activeResolveReportId, setActiveResolveReportId] = useState<string | null>(null);
  const [currentResolutionNotes, setCurrentResolutionNotes] = useState("");

  const verifyAdminAccess = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile || (!profile.is_admin && !profile.is_super_admin)) {
      setPopup({
        message: "Access Denied: You are not authorized to view the Admin Dashboard.",
        type: "error",
        onClose: () => router.push("/profile/view")
      });
      return;
    }

    setCurrentAdminProfile(profile);
    setIsAdmin(profile.is_admin);
    setIsSuperAdmin(profile.is_super_admin);

    await loadStats();
    await loadDataLists();
    await loadNotifications(user.id);
    setIsLoading(false);
  };

  const loadNotifications = async (uId: string) => {
    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uId)
      .order("created_at", { ascending: false });

    if (notifs) {
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.is_read).length);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentAdminProfile) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", currentAdminProfile.id);
    loadNotifications(currentAdminProfile.id);
  };

  const loadStats = async () => {
    const { data: allProfiles } = await supabase.from("profiles").select("id, is_verified, is_freelancer, is_client, is_admin");
    if (allProfiles) {
      setStats({
        totalUsers: allProfiles.length,
        verifiedUsers: allProfiles.filter((p) => p.is_verified).length,
        freelancers: allProfiles.filter((p) => p.is_freelancer).length,
        clients: allProfiles.filter((p) => p.is_client).length,
        admins: allProfiles.filter((p) => p.is_admin).length,
      });
    }
  };

  const loadDataLists = async () => {
    // Fetch all profiles
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (allProfiles) {
      setProfiles(allProfiles);
      setUnverifiedProfiles(allProfiles.filter((p) => !p.is_verified && p.id_attachment_url));
    }

    // Fetch logs (only for super admin, but fetch anyway)
    const { data: logs } = await supabase
      .from("system_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (logs) setSystemLogs(logs);

    // Fetch archives
    const { data: archs } = await supabase
      .from("archives")
      .select("*")
      .order("deleted_at", { ascending: false });
    if (archs) setArchives(archs);

    // Fetch moderation reports
    const { data: reps } = await supabase
      .from("reports")
      .select("*, reporter:profiles!reporter_id(first_name, last_name, screen_name)")
      .order("created_at", { ascending: false });
    if (reps) setReports(reps);

    // Fetch jobs for report references
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("id, title, client_id");
    if (jobsData) setAllJobs(jobsData);

    // Fetch services for report references
    const { data: servicesData } = await supabase
      .from("services")
      .select("id, title, freelancer_id");
    if (servicesData) setAllServices(servicesData);
  };

  useEffect(() => {
    verifyAdminAccess();
  }, []);

  // Approve ID Handler
  const handleApproveId = async (profileId: string, screenName: string) => {
    if (!currentAdminProfile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: true })
      .eq("id", profileId);

    if (error) {
      setPopup({
        message: "Error approving ID: " + error.message,
        type: "error"
      });
      return;
    }

    // Log action
    await supabase.from("system_logs").insert({
      actor_id: currentAdminProfile.id,
      actor_email: currentAdminProfile.email,
      action: "approve_user_id",
      details: { target_id: profileId, screen_name: screenName },
    });

    // Notify user
    await supabase.from("notifications").insert({
      user_id: profileId,
      title: "ID Verification Approved! 🎉",
      content: "Administrator has successfully approved your ID. You are now verified on Cala.",
    });

    setPopup({
      message: `Successfully approved ID for @${screenName}`,
      type: "success"
    });
    loadStats();
    loadDataLists();
  };

  // Reject ID Handler (resets ID attachment to null)
  const handleRejectId = async (profileId: string, screenName: string) => {
    if (!currentAdminProfile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ id_attachment_url: null, is_verified: false })
      .eq("id", profileId);

    if (error) {
      setPopup({
        message: "Error rejecting ID: " + error.message,
        type: "error"
      });
      return;
    }

    // Log action
    await supabase.from("system_logs").insert({
      actor_id: currentAdminProfile.id,
      actor_email: currentAdminProfile.email,
      action: "reject_user_id",
      details: { target_id: profileId, screen_name: screenName },
    });

    // Notify user
    await supabase.from("notifications").insert({
      user_id: profileId,
      title: "ID Verification Rejected ⚠️",
      content: "Your ID document was rejected by the administrator. Please update and re-upload in your profile edit view.",
    });

    setPopup({
      message: `Rejected ID attachment for @${screenName}. They will need to re-upload.`,
      type: "success"
    });
    loadStats();
    loadDataLists();
  };

  // Promote / Demote Admin
  const handleToggleAdminStatus = async (targetId: string, screenName: string, makeAdmin: boolean) => {
    if (!currentAdminProfile || !isSuperAdmin) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: makeAdmin })
      .eq("id", targetId);

    if (error) {
      setPopup({
        message: "Failed to update admin role: " + error.message,
        type: "error"
      });
      return;
    }

    // Log Action
    await supabase.from("system_logs").insert({
      actor_id: currentAdminProfile.id,
      actor_email: currentAdminProfile.email,
      action: makeAdmin ? "promote_admin" : "demote_admin",
      details: { target_id: targetId, screen_name: screenName },
    });

    setPopup({
      message: `Updated admin status for @${screenName}`,
      type: "success"
    });
    loadStats();
    loadDataLists();
  };

  // Delete User Handler (stages to archives first, then deletes profile)
  const handleDeleteUser = async (targetProfile: any) => {
    if (!currentAdminProfile) return;
    
    setConfirmState({
      message: `Are you sure you want to delete user @${targetProfile.screen_name || targetProfile.first_name}? This action will archive and delete their public profile.`,
      onConfirm: async () => {
        setConfirmState(null);
        await executeDeleteUser(targetProfile);
      }
    });
  };

  const executeDeleteUser = async (targetProfile: any) => {
    // 1. Insert into archives
    const { error: archiveError } = await supabase.from("archives").insert({
      resource_type: "user",
      original_id: targetProfile.id,
      data: targetProfile,
      deleted_by: currentAdminProfile.id,
      deleted_by_email: currentAdminProfile.email,
    });

    if (archiveError) {
      setPopup({
        message: "Failed to archive user details: " + archiveError.message,
        type: "error"
      });
      return;
    }

    // 2. Delete profile
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", targetProfile.id);

    if (deleteError) {
      setPopup({
        message: "Failed to delete user profile: " + deleteError.message,
        type: "error"
      });
      return;
    }

    // 3. Log Action
    await supabase.from("system_logs").insert({
      actor_id: currentAdminProfile.id,
      actor_email: currentAdminProfile.email,
      action: "delete_user",
      details: { target_id: targetProfile.id, screen_name: targetProfile.screen_name, first_name: targetProfile.first_name },
    });

    setPopup({
      message: "User deleted and archived successfully.",
      type: "success"
    });
    loadStats();
    loadDataLists();
  };

  // Restore Archive Handler
  const handleRestoreArchive = async (archive: any) => {
    if (!currentAdminProfile || !isSuperAdmin) return;

    setConfirmState({
      message: `Are you sure you want to restore this archived ${archive.resource_type}?`,
      onConfirm: async () => {
        setConfirmState(null);
        await executeRestoreArchive(archive);
      }
    });
  };

  const executeRestoreArchive = async (archive: any) => {
    try {
      const data = typeof archive.data === "string" ? JSON.parse(archive.data) : archive.data;
      let error = null;

      if (archive.resource_type === "user") {
        // Insert back into profiles
        const { error: insertError } = await supabase
          .from("profiles")
          .insert(data);
        error = insertError;
      } else if (archive.resource_type === "job") {
        const { error: insertError } = await supabase
          .from("jobs")
          .insert(data);
        error = insertError;
      } else if (archive.resource_type === "skill") {
        const { error: insertError } = await supabase
          .from("freelancer_skills")
          .insert(data);
        error = insertError;
      } else {
        throw new Error(`Unsupported resource type: ${archive.resource_type}`);
      }

      if (error) {
        let errorMsg = error.message;
        if (error.code === "23503") {
          if (archive.resource_type === "user") {
            errorMsg = "Cannot restore this user because the corresponding auth account no longer exists in Supabase Auth.";
          } else if (archive.resource_type === "job") {
            errorMsg = "Cannot restore this job because the posting client profile no longer exists.";
          } else if (archive.resource_type === "skill") {
            errorMsg = "Cannot restore this skill because the corresponding freelancer profile no longer exists.";
          }
        }
        setPopup({
          message: `Failed to restore: ${errorMsg}`,
          type: "error"
        });
        return;
      }

      // Delete from archives
      const { error: deleteError } = await supabase
        .from("archives")
        .delete()
        .eq("id", archive.id);

      if (deleteError) {
        setPopup({
          message: `Restored successfully but failed to remove archive entry: ${deleteError.message}`,
          type: "error"
        });
        return;
      }

      // Log action
      await supabase.from("system_logs").insert({
        actor_id: currentAdminProfile.id,
        actor_email: currentAdminProfile.email,
        action: "restore_archive",
        details: {
          archive_id: archive.id,
          resource_type: archive.resource_type,
          original_id: archive.original_id,
          label: archive.resource_type === "user" ? data.email : archive.resource_type === "job" ? data.title : data.skill_name
        },
      });

      setPopup({
        message: `Successfully restored ${archive.resource_type}!`,
        type: "success"
      });

      loadStats();
      loadDataLists();
    } catch (err: any) {
      setPopup({
        message: `Failed to restore: ${err.message}`,
        type: "error"
      });
    }
  };

  // Permanent Delete Archive Handler
  const handlePermanentDeleteArchive = async (archive: any) => {
    if (!currentAdminProfile || !isSuperAdmin) return;

    setConfirmState({
      message: `Are you sure you want to PERMANENTLY delete this archived ${archive.resource_type}? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmState(null);
        await executePermanentDeleteArchive(archive);
      }
    });
  };

  const executePermanentDeleteArchive = async (archive: any) => {
    try {
      const data = typeof archive.data === "string" ? JSON.parse(archive.data) : archive.data;
      const { error: deleteError } = await supabase
        .from("archives")
        .delete()
        .eq("id", archive.id);

      if (deleteError) {
        setPopup({
          message: `Failed to delete archive entry: ${deleteError.message}`,
          type: "error"
        });
        return;
      }

      // Log action
      await supabase.from("system_logs").insert({
        actor_id: currentAdminProfile.id,
        actor_email: currentAdminProfile.email,
        action: "permanent_delete_archive",
        details: {
          archive_id: archive.id,
          resource_type: archive.resource_type,
          original_id: archive.original_id,
          label: archive.resource_type === "user" ? data.email : archive.resource_type === "job" ? data.title : data.skill_name
        },
      });

      setPopup({
        message: `Permanently deleted archived ${archive.resource_type}.`,
        type: "success"
      });

      loadStats();
      loadDataLists();
    } catch (err: any) {
      setPopup({
        message: `Failed to delete: ${err.message}`,
        type: "error"
      });
    }
  };

  const handleResolveReport = async (reportId: string, status: "resolved_no_violation" | "resolved_violation", targetReporterId: string) => {
    if (!currentAdminProfile) return;
    if (!currentResolutionNotes.trim()) {
      setPopup({
        message: "Please enter resolution notes before submitting.",
        type: "error"
      });
      return;
    }

    const { error } = await supabase
      .from("reports")
      .update({
        status,
        resolution_notes: currentResolutionNotes.trim(),
        resolved_by: currentAdminProfile.id,
        resolved_at: new Date().toISOString()
      })
      .eq("id", reportId);

    if (error) {
      setPopup({
        message: "Failed to resolve report: " + error.message,
        type: "error"
      });
      return;
    }

    // Log action
    await supabase.from("system_logs").insert({
      actor_id: currentAdminProfile.id,
      actor_email: currentAdminProfile.email,
      action: "resolve_report",
      details: { report_id: reportId, decision: status, notes: currentResolutionNotes.trim() },
    });

    // Notify user
    const decisionText = status === "resolved_violation" ? "Violation Found ⚠️" : "No Violation Found ✅";
    await supabase.from("notifications").insert({
      user_id: targetReporterId,
      title: `Moderation Report Decision: ${decisionText}`,
      content: `The moderation team resolved the report you submitted. Resolution notes: "${currentResolutionNotes.trim()}"`,
    });

    setPopup({
      message: `Report has been resolved as: ${status === "resolved_violation" ? "Violation Found" : "No Violation Found"}.`,
      type: "success"
    });
    setActiveResolveReportId(null);
    setCurrentResolutionNotes("");
    loadStats();
    loadDataLists();
  };

  // Format Archive Details for Premium Display
  const renderArchiveDetails = (a: any) => {
    try {
      const data = typeof a.data === "string" ? JSON.parse(a.data) : a.data;
      if (a.resource_type === "user") {
        return (
          <div>
            <strong>{data.first_name} {data.last_name}</strong> (@{data.screen_name || "unset"})
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{data.email}</div>
          </div>
        );
      } else if (a.resource_type === "job") {
        return (
          <div>
            <strong>{data.title}</strong>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Budget: ${data.budget} &bull; {data.category}</div>
          </div>
        );
      } else if (a.resource_type === "skill") {
        return (
          <div>
            <strong>Skill: {data.skill_name}</strong>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Freelancer ID: {data.freelancer_id}</div>
          </div>
        );
      }
      return <pre style={{ fontSize: "11px", margin: 0 }}>{JSON.stringify(data)}</pre>;
    } catch (e) {
      return <pre style={{ fontSize: "11px", margin: 0 }}>{JSON.stringify(a.data)}</pre>;
    }
  };

  // Validate Add User field
  const validateForm = (name: string, value: string): string => {
    switch (name) {
      case "firstName":
        if (!value.trim()) return "First name is required.";
        if (/\d/.test(value)) return "First name cannot contain numbers.";
        return "";
      case "lastName":
        if (!value.trim()) return "Last name is required.";
        if (/\d/.test(value)) return "Last name cannot contain numbers.";
        return "";
      case "email":
        if (!value.trim()) return "Email is required.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email.";
        return "";
      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        return "";
      case "contactNumber":
        if (!value.trim()) return "Contact number is required.";
        if (!/^\+?[0-9\s-]{7,15}$/.test(value)) return "Please enter a valid contact number.";
        return "";
      case "city":
        if (!value.trim()) return "City is required.";
        return "";
      case "zip":
        if (!value.trim()) return "ZIP / Postal code is required.";
        return "";
      case "country":
        if (!value.trim()) return "Country is required.";
        return "";
      case "state":
        if (!value.trim()) return "State / Region is required.";
        return "";
      default:
        return "";
    }
  };

  // Form validator trigger
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    Object.keys(newUserForm).forEach((key) => {
      if (key !== "role") {
        const val = newUserForm[key as keyof typeof newUserForm];
        const errorMsg = validateForm(key, val);
        if (errorMsg) newErrors[key] = errorMsg;
      }
    });
    setFormErrors(newErrors);
  }, [newUserForm]);

  // Admin form validator trigger
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    Object.keys(newAdminForm).forEach((key) => {
      const val = newAdminForm[key as keyof typeof newAdminForm];
      const errorMsg = validateForm(key, val);
      if (errorMsg) newErrors[key] = errorMsg;
    });
    const countryError = validateForm("country", adminSelectedCountry || "");
    if (countryError) newErrors["country"] = countryError;
    const stateError = validateForm("state", adminSelectedState || "");
    if (stateError) newErrors["state"] = stateError;

    setAdminFormErrors(newErrors);
  }, [newAdminForm, adminSelectedCountry, adminSelectedState]);

  // Click outside to close admin dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminCountryRef.current && !adminCountryRef.current.contains(event.target as Node)) {
        setIsAdminCountryOpen(false);
      }
      if (adminStateRef.current && !adminStateRef.current.contains(event.target as Node)) {
        setIsAdminStateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getAdminFormInputClass = (name: string) => {
    const base = "form-input";
    if (adminFormActiveField === name) return base;
    if (adminFormValidated[name]) {
      return adminFormErrors[name] ? `${base} is-invalid` : `${base} is-valid`;
    }
    return base;
  };

  const adminFilteredCountries = countriesData.filter((c) =>
    c.name.toLowerCase().includes(adminCountryQuery.toLowerCase())
  );

  const adminAvailableStates = adminSelectedCountry
    ? countriesData.find((c) => c.name === adminSelectedCountry)?.states || []
    : [];

  const adminFilteredStates = adminAvailableStates.filter((s) =>
    s.toLowerCase().includes(adminStateQuery.toLowerCase())
  );

  const getFormInputClass = (name: string) => {
    const base = "form-input";
    if (formActiveField === name) return base;
    if (formValidated[name]) {
      return formErrors[name] ? `${base} is-invalid` : `${base} is-valid`;
    }
    return base;
  };

  // Add User Submission
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewUserError(null);

    const allValidated = { firstName: true, lastName: true, email: true, password: true };
    setFormValidated(allValidated);

    if (Object.keys(formErrors).length > 0) return;

    try {
      // Sign up via Supabase (since we don't have Admin API service key in frontend client, we create via normal signUp)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: {
          data: {
            first_name: newUserForm.firstName,
            last_name: newUserForm.lastName,
          }
        }
      });

      if (signUpError) {
        setNewUserError(signUpError.message);
        return;
      }

      if (signUpData.user) {
        // Normal trigger handle_new_user executes. Let's update additional roles if chosen
        const isFree = newUserForm.role === "freelancer" || newUserForm.role === "both";
        const isCli = newUserForm.role === "client" || newUserForm.role === "both";

        await supabase
          .from("profiles")
          .update({
            is_freelancer: isFree,
            is_client: isCli,
            screen_name: `user_${Math.floor(Math.random() * 100000)}`, // Default screen name
            description: "Profile created by system administrator. Needs update.",
            is_verified: true, // Auto-verified since admin created them
          })
          .eq("id", signUpData.user.id);

        // Log Action
        if (currentAdminProfile) {
          await supabase.from("system_logs").insert({
            actor_id: currentAdminProfile.id,
            actor_email: currentAdminProfile.email,
            action: "add_user",
            details: { target_email: newUserForm.email, role: newUserForm.role },
          });
        }

        setPopup({
          message: "User created successfully!",
          type: "success"
        });
        setShowAddUserModal(false);
        setNewUserForm({ firstName: "", lastName: "", email: "", password: "", role: "both" });
        setFormValidated({});
        loadStats();
        loadDataLists();
      }
    } catch (err) {
      setNewUserError("Failed to add user.");
    }
  };

  // Add Admin Submission
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewAdminError(null);

    const allValidated = { 
      firstName: true, 
      lastName: true, 
      email: true, 
      password: true,
      contactNumber: true,
      city: true,
      zip: true,
      country: true,
      state: true
    };
    setAdminFormValidated(allValidated);

    if (Object.keys(adminFormErrors).length > 0 || !adminSelectedCountry || !adminSelectedState) {
      if (!adminSelectedCountry || !adminSelectedState) {
        setNewAdminError("Please select a valid Country and State / Region.");
      }
      return;
    }

    try {
      const tempSupabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false
          }
        }
      );

      const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
        email: newAdminForm.email,
        password: newAdminForm.password,
        options: {
          data: {
            first_name: newAdminForm.firstName,
            last_name: newAdminForm.lastName,
          }
        }
      });

      if (signUpError) {
        setNewAdminError(signUpError.message);
        return;
      }

      if (signUpData.user) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            is_admin: true,
            is_verified: true,
            screen_name: `admin_${Math.floor(Math.random() * 100000)}`,
            description: "System Administrator account.",
            contact_number: newAdminForm.contactNumber,
            country: adminSelectedCountry,
            state: adminSelectedState,
            city: newAdminForm.city,
            zip: newAdminForm.zip,
          })
          .eq("id", signUpData.user.id);

        if (updateError) {
          setNewAdminError(updateError.message);
          return;
        }

        if (currentAdminProfile) {
          await supabase.from("system_logs").insert({
            actor_id: currentAdminProfile.id,
            actor_email: currentAdminProfile.email,
            action: "add_admin",
            details: { target_email: newAdminForm.email },
          });
        }

        setPopup({
          message: "Administrator account created successfully!",
          type: "success"
        });
        setShowAddAdminModal(false);
        setNewAdminForm({ firstName: "", lastName: "", email: "", password: "", contactNumber: "", city: "", zip: "" });
        setAdminSelectedCountry(null);
        setAdminSelectedState(null);
        setAdminCountryQuery("");
        setAdminStateQuery("");
        setAdminFormValidated({});
        loadStats();
        loadDataLists();
      }
    } catch (err: any) {
      setNewAdminError(err.message || "Failed to add administrator.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>Verifying Administrative Access...</p>
      </div>
    );
  }

  // Filter profiles for Super Admin promote role lookup
  const filteredPromoteList = profiles.filter((p) =>
    (p.screen_name || p.email).toLowerCase().includes(promoteSearch.toLowerCase())
  );

  // Filter profiles for user management search and filter selectors
  const filteredProfiles = profiles.filter((p) => {
    const searchString = `${p.first_name || ""} ${p.last_name || ""} @${p.screen_name || ""} ${p.email || ""}`.toLowerCase();
    const matchesSearch = searchString.includes(userSearchQuery.toLowerCase());

    let matchesRole = true;
    if (roleFilter === "freelancer") {
      matchesRole = p.is_freelancer;
    } else if (roleFilter === "client") {
      matchesRole = p.is_client;
    } else if (roleFilter === "admin") {
      matchesRole = p.is_admin && !p.is_super_admin;
    } else if (roleFilter === "super-admin") {
      matchesRole = p.is_super_admin;
    }

    let matchesVerification = true;
    if (verificationFilter === "verified") {
      matchesVerification = p.is_verified;
    } else if (verificationFilter === "pending") {
      matchesVerification = !p.is_verified;
    }

    return matchesSearch && matchesRole && matchesVerification;
  });

  // Filter reports
  const filteredReports = reports.filter((r) => {
    let matchesStatus = true;
    if (reportStatusFilter !== "all") {
      matchesStatus = r.status === reportStatusFilter;
    }

    let matchesType = true;
    if (reportTypeFilter !== "all") {
      if (reportTypeFilter === "posting") {
        matchesType = r.target_type === "job" || r.target_type === "service";
      } else {
        matchesType = r.target_type === reportTypeFilter;
      }
    }

    return matchesStatus && matchesType;
  });

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="container header-container">
          <Link href="/" className="logo">
            <div className="logo-icon">C</div>
            Cala Admin Portal
          </Link>
          <nav className="nav-links">
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
              Welcome, {currentAdminProfile.first_name} ({isSuperAdmin ? "Super Admin" : "Admin"})
            </span>
            
            {/* Notifications Bell Dropdown */}
            <div className="notif-container">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="notif-bell-btn"
                title="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span className="notif-title">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="notif-mark-read">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="notif-list">
                    {notifications.map((n) => (
                      <div key={n.id} className={`notif-item ${!n.is_read ? "unread" : ""}`}>
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-content">{n.content}</div>
                        <div className="notif-item-time">
                          {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="notif-empty">No notifications yet.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "13px" }}>
              Log Out
            </button>
          </nav>
        </div>
      </header>

      <main style={{ padding: "40px 24px", flex: 1 }}>
        <div className="container">
          
          <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "24px" }}>
            Control Dashboard
          </h2>

          {/* TAB BUTTONS */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "24px", marginBottom: "32px" }}>
            <button 
              onClick={() => setActiveTab("overview")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "overview" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "overview" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              Overview & Health
            </button>
            <button 
              onClick={() => setActiveTab("approvals")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "approvals" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "approvals" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              ID Approvals ({unverifiedProfiles.length})
            </button>
            <button 
              onClick={() => setActiveTab("users")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "users" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "users" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              User Management
            </button>
            <button 
              onClick={() => setActiveTab("reports")} 
              style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "reports" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "reports" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
            >
              Reports ({reports.filter((r) => r.status === "pending").length})
            </button>
            {isSuperAdmin && (
              <>
                <button 
                  onClick={() => setActiveTab("super-admin")} 
                  style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "super-admin" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "super-admin" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
                >
                  Admin Roles
                </button>
                <button 
                  onClick={() => setActiveTab("logs")} 
                  style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "logs" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "logs" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
                >
                  Audit Logs
                </button>
                <button 
                  onClick={() => setActiveTab("archives")} 
                  style={{ padding: "12px 4px", fontSize: "14px", fontWeight: "600", color: activeTab === "archives" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "archives" ? "2px solid var(--primary-color)" : "none", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
                >
                  Archives ({archives.length})
                </button>
              </>
            )}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div className="card">
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Total Users</p>
                <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>{stats.totalUsers}</h3>
              </div>
              <div className="card">
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Verified IDs</p>
                <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px", color: "var(--success-color)" }}>
                  {stats.verifiedUsers} <span style={{ fontSize: "14px", fontWeight: "400", color: "var(--text-secondary)" }}>({stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%)</span>
                </h3>
              </div>
              <div className="card">
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Freelancers</p>
                <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>{stats.freelancers}</h3>
              </div>
              <div className="card">
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Clients</p>
                <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px" }}>{stats.clients}</h3>
              </div>
              <div className="card">
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>System Admins</p>
                <h3 style={{ fontSize: "32px", fontWeight: "800", marginTop: "4px", color: "var(--primary-color)" }}>{stats.admins}</h3>
              </div>
            </div>
          )}

          {/* TAB 2: ID APPROVALS */}
          {activeTab === "approvals" && (
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Pending Document Approvals</h3>
              {unverifiedProfiles.map((user, idx) => (
                <div key={idx} className="card" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "center" }}>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: "700" }}>{user.first_name} {user.last_name}</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      @{user.screen_name} &bull; {user.email} &bull; {user.city}, {user.state}, {user.country}
                    </p>
                    <p style={{ fontSize: "14px", marginTop: "10px", fontStyle: "italic", color: "#555" }}>
                      &quot;{user.description}&quot;
                    </p>
                    
                    {/* Simulated Attached ID display */}
                    <div style={{ marginTop: "14px", display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#f1f5f9", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                      <span style={{ fontSize: "16px" }}>📄</span>
                      <a href={user.id_attachment_url} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "var(--primary-color)", fontWeight: "600" }}>
                        View Attached ID Document
                      </a>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button onClick={() => handleApproveId(user.id, user.screen_name)} className="btn btn-primary" style={{ backgroundColor: "var(--success-color)" }}>
                      Approve ID
                    </button>
                    <button onClick={() => handleRejectId(user.id, user.screen_name)} className="btn btn-outline" style={{ color: "var(--error-color)", borderColor: "var(--error-border)" }}>
                      Reject / Request Re-upload
                    </button>
                  </div>
                </div>
              ))}
              {unverifiedProfiles.length === 0 && (
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No profiles currently pending ID verification.</p>
              )}
            </div>
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {activeTab === "users" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700" }}>
                  All Registered Accounts ({filteredProfiles.length !== profiles.length ? `${filteredProfiles.length} of ${profiles.length}` : profiles.length})
                </h3>
                <button onClick={() => setShowAddUserModal(true)} className="btn btn-primary">
                  + Add User
                </button>
              </div>

              {/* Search and Filters Bar */}
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <input
                    type="text"
                    placeholder="Search name, username, or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "14px" }}
                  />
                </div>
                <div style={{ width: "150px" }}>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "14px", backgroundColor: "#fff" }}
                  >
                    <option value="all">All Roles</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                    <option value="super-admin">Super Admin</option>
                  </select>
                </div>
                <div style={{ width: "180px" }}>
                  <select
                    value={verificationFilter}
                    onChange={(e) => setVerificationFilter(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "14px", backgroundColor: "#fff" }}
                  >
                    <option value="all">All Verifications</option>
                    <option value="pending">Pending ID Verification</option>
                    <option value="verified">Verified ID</option>
                  </select>
                </div>
              </div>

              {/* LIST USERS */}
              <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "#fff" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ padding: "12px 16px" }}>Name</th>
                      <th style={{ padding: "12px 16px" }}>Username</th>
                      <th style={{ padding: "12px 16px" }}>Email</th>
                      <th style={{ padding: "12px 16px" }}>Role Mode</th>
                      <th style={{ padding: "12px 16px" }}>Verification</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: "600" }}>{p.first_name} {p.last_name}</td>
                        <td style={{ padding: "12px 16px" }}>@{p.screen_name || "unset"}</td>
                        <td style={{ padding: "12px 16px" }}>{p.email}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {p.is_freelancer && <span className="tag" style={{ marginRight: "4px" }}>Freelancer</span>}
                          {p.is_client && <span className="tag">Client</span>}
                          {!p.is_freelancer && !p.is_client && <span style={{ color: "#aaa" }}>none</span>}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {p.is_verified ? (
                            <span style={{ color: "var(--success-color)", fontWeight: "600" }}>Verified</span>
                          ) : (
                            <span style={{ color: "var(--text-secondary)" }}>Pending</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button 
                            onClick={() => handleDeleteUser(p)} 
                            disabled={p.id === currentAdminProfile.id}
                            className="btn btn-outline" 
                            style={{ padding: "4px 8px", fontSize: "12px", color: "var(--error-color)", borderColor: "var(--error-border)" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ADD USER MODAL */}
              {showAddUserModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
                  <div className="card" style={{ width: "100%", maxWidth: "450px", backgroundColor: "#fff", padding: "32px", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Add New Account</h3>
                    
                    {newUserError && (
                      <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)", padding: "10px", fontSize: "13px", borderRadius: "var(--radius-sm)", marginBottom: "12px" }}>
                        {newUserError}
                      </div>
                    )}

                    <form onSubmit={handleAddUser} noValidate>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div className="form-group">
                          <label className="form-label">First Name</label>
                          <input
                            type="text"
                            value={newUserForm.firstName}
                            className={getFormInputClass("firstName")}
                            onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                            onFocus={() => setFormActiveField("firstName")}
                            onBlur={() => { setFormActiveField(null); setFormValidated(p => ({ ...p, firstName: true })); }}
                            required
                          />
                          {formValidated.firstName && formErrors.firstName && (
                            <span className="form-error">{formErrors.firstName}</span>
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Last Name</label>
                          <input
                            type="text"
                            value={newUserForm.lastName}
                            className={getFormInputClass("lastName")}
                            onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                            onFocus={() => setFormActiveField("lastName")}
                            onBlur={() => { setFormActiveField(null); setFormValidated(p => ({ ...p, lastName: true })); }}
                            required
                          />
                          {formValidated.lastName && formErrors.lastName && (
                            <span className="form-error">{formErrors.lastName}</span>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          value={newUserForm.email}
                          className={getFormInputClass("email")}
                          onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                          onFocus={() => setFormActiveField("email")}
                          onBlur={() => { setFormActiveField(null); setFormValidated(p => ({ ...p, email: true })); }}
                          required
                        />
                        {formValidated.email && formErrors.email && (
                          <span className="form-error">{formErrors.email}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          value={newUserForm.password}
                          className={getFormInputClass("password")}
                          onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                          onFocus={() => setFormActiveField("password")}
                          onBlur={() => { setFormActiveField(null); setFormValidated(p => ({ ...p, password: true })); }}
                          required
                        />
                        {formValidated.password && formErrors.password && (
                          <span className="form-error">{formErrors.password}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Role Type</label>
                        <select 
                          value={newUserForm.role}
                          onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid #cbd5e1" }}
                        >
                          <option value="freelancer">Freelancer Mode</option>
                          <option value="client">Client Mode</option>
                          <option value="both">Both Freelancer & Client</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                        <button type="button" onClick={() => setShowAddUserModal(false)} className="btn btn-outline">Cancel</button>
                        <button type="submit" className="btn btn-primary">Create User</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ADD ADMIN MODAL */}
              {showAddAdminModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
                  <div className="card" style={{ width: "100%", maxWidth: "450px", backgroundColor: "#fff", padding: "32px", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Create New Administrator</h3>
                    
                    {newAdminError && (
                      <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)", padding: "10px", fontSize: "13px", borderRadius: "var(--radius-sm)", marginBottom: "12px" }}>
                        {newAdminError}
                      </div>
                    )}

                    <form onSubmit={handleAddAdmin} noValidate>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div className="form-group">
                          <label className="form-label">First Name</label>
                          <input
                            type="text"
                            value={newAdminForm.firstName}
                            className={getAdminFormInputClass("firstName")}
                            onChange={(e) => setNewAdminForm({ ...newAdminForm, firstName: e.target.value })}
                            onFocus={() => setAdminFormActiveField("firstName")}
                            onBlur={() => { setAdminFormActiveField(null); setAdminFormValidated(p => ({ ...p, firstName: true })); }}
                            required
                          />
                          {adminFormValidated.firstName && adminFormErrors.firstName && (
                            <span className="form-error">{adminFormErrors.firstName}</span>
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Last Name</label>
                          <input
                            type="text"
                            value={newAdminForm.lastName}
                            className={getAdminFormInputClass("lastName")}
                            onChange={(e) => setNewAdminForm({ ...newAdminForm, lastName: e.target.value })}
                            onFocus={() => setAdminFormActiveField("lastName")}
                            onBlur={() => { setAdminFormActiveField(null); setAdminFormValidated(p => ({ ...p, lastName: true })); }}
                            required
                          />
                          {adminFormValidated.lastName && adminFormErrors.lastName && (
                            <span className="form-error">{adminFormErrors.lastName}</span>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          value={newAdminForm.email}
                          className={getAdminFormInputClass("email")}
                          onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                          onFocus={() => setAdminFormActiveField("email")}
                          onBlur={() => { setAdminFormActiveField(null); setAdminFormValidated(p => ({ ...p, email: true })); }}
                          required
                        />
                        {adminFormValidated.email && adminFormErrors.email && (
                          <span className="form-error">{adminFormErrors.email}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          value={newAdminForm.password}
                          className={getAdminFormInputClass("password")}
                          onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                          onFocus={() => setAdminFormActiveField("password")}
                          onBlur={() => { setAdminFormActiveField(null); setAdminFormValidated(p => ({ ...p, password: true })); }}
                          required
                        />
                        {adminFormValidated.password && adminFormErrors.password && (
                          <span className="form-error">{adminFormErrors.password}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Contact Number</label>
                        <input
                          type="text"
                          value={newAdminForm.contactNumber}
                          className={getAdminFormInputClass("contactNumber")}
                          onChange={(e) => setNewAdminForm({ ...newAdminForm, contactNumber: e.target.value })}
                          onFocus={() => setAdminFormActiveField("contactNumber")}
                          onBlur={() => { setAdminFormActiveField(null); setAdminFormValidated(p => ({ ...p, contactNumber: true })); }}
                          placeholder="e.g. +639123456789"
                          required
                        />
                        {adminFormValidated.contactNumber && adminFormErrors.contactNumber && (
                          <span className="form-error">{adminFormErrors.contactNumber}</span>
                        )}
                      </div>

                      {/* Searchable Location Selectors */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                        
                        {/* Searchable Country Selector */}
                        <div className="form-group" ref={adminCountryRef} style={{ position: "relative" }}>
                          <label className="form-label">Country</label>
                          <input
                            type="text"
                            className={getAdminFormInputClass("country")}
                            value={adminCountryQuery}
                            placeholder={adminSelectedCountry || "Type to search..."}
                            onFocus={() => {
                              setIsAdminCountryOpen(true);
                              setAdminFormActiveField("country");
                            }}
                            onBlur={() => {
                              setAdminFormActiveField(null);
                              setTimeout(() => setAdminFormValidated(prev => ({ ...prev, country: true })), 150);
                            }}
                            onChange={(e) => {
                              setAdminCountryQuery(e.target.value);
                              setIsAdminCountryOpen(true);
                            }}
                            required
                          />
                          {isAdminCountryOpen && (
                            <ul style={{ 
                              position: "absolute", top: "100%", left: 0, right: 0, 
                              backgroundColor: "#fff", border: "1px solid var(--border-color)", 
                              maxHeight: "120px", overflowY: "auto", zIndex: 210, listStyle: "none", 
                              padding: 0, margin: 0, borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                              boxShadow: "var(--shadow-md)"
                            }}>
                              {adminFilteredCountries.map((c, idx) => (
                                <li 
                                  key={idx}
                                  onClick={() => {
                                    setAdminSelectedCountry(c.name);
                                    setAdminCountryQuery(c.name);
                                    setAdminSelectedState(null);
                                    setAdminStateQuery("");
                                    setIsAdminCountryOpen(false);
                                  }}
                                  style={{ padding: "8px 12px", cursor: "pointer", fontSize: "13px", borderBottom: "1px solid #f1f5f9" }}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {c.name}
                                </li>
                              ))}
                              {adminFilteredCountries.length === 0 && (
                                <li style={{ padding: "8px 12px", color: "var(--text-secondary)", fontSize: "13px" }}>No results</li>
                              )}
                            </ul>
                          )}
                          {adminFormValidated.country && adminFormErrors.country && (
                            <span className="form-error">{adminFormErrors.country}</span>
                          )}
                        </div>

                        {/* Searchable State Selector */}
                        <div className="form-group" ref={adminStateRef} style={{ position: "relative" }}>
                          <label className="form-label">State / Region</label>
                          <input
                            type="text"
                            className={getAdminFormInputClass("state")}
                            value={adminStateQuery}
                            placeholder={adminSelectedState || "Type to search..."}
                            disabled={!adminSelectedCountry}
                            onFocus={() => {
                              setIsAdminStateOpen(true);
                              setAdminFormActiveField("state");
                            }}
                            onBlur={() => {
                              setAdminFormActiveField(null);
                              setTimeout(() => setAdminFormValidated(prev => ({ ...prev, state: true })), 150);
                            }}
                            onChange={(e) => {
                              setAdminStateQuery(e.target.value);
                              setIsAdminStateOpen(true);
                            }}
                            required
                          />
                          {isAdminStateOpen && adminSelectedCountry && (
                            <ul style={{ 
                              position: "absolute", top: "100%", left: 0, right: 0, 
                              backgroundColor: "#fff", border: "1px solid var(--border-color)", 
                              maxHeight: "120px", overflowY: "auto", zIndex: 210, listStyle: "none", 
                              padding: 0, margin: 0, borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                              boxShadow: "var(--shadow-md)"
                            }}>
                              {adminFilteredStates.map((s, idx) => (
                                <li 
                                  key={idx}
                                  onClick={() => {
                                    setAdminSelectedState(s);
                                    setAdminStateQuery(s);
                                    setIsAdminStateOpen(false);
                                  }}
                                  style={{ padding: "8px 12px", cursor: "pointer", fontSize: "13px", borderBottom: "1px solid #f1f5f9" }}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {s}
                                </li>
                              ))}
                              {adminFilteredStates.length === 0 && (
                                <li style={{ padding: "8px 12px", color: "var(--text-secondary)", fontSize: "13px" }}>No results</li>
                              )}
                            </ul>
                          )}
                          {adminFormValidated.state && adminFormErrors.state && (
                            <span className="form-error">{adminFormErrors.state}</span>
                          )}
                        </div>

                      </div>

                      {/* City & Zip row */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                        <div className="form-group">
                          <label className="form-label">City</label>
                          <input
                            type="text"
                            value={newAdminForm.city}
                            className={getAdminFormInputClass("city")}
                            onChange={(e) => setNewAdminForm({ ...newAdminForm, city: e.target.value })}
                            onFocus={() => setAdminFormActiveField("city")}
                            onBlur={() => { setAdminFormActiveField(null); setAdminFormValidated(p => ({ ...p, city: true })); }}
                            required
                          />
                          {adminFormValidated.city && adminFormErrors.city && (
                            <span className="form-error">{adminFormErrors.city}</span>
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">ZIP / Postal Code</label>
                          <input
                            type="text"
                            value={newAdminForm.zip}
                            className={getAdminFormInputClass("zip")}
                            onChange={(e) => setNewAdminForm({ ...newAdminForm, zip: e.target.value })}
                            onFocus={() => setAdminFormActiveField("zip")}
                            onBlur={() => { setAdminFormActiveField(null); setAdminFormValidated(p => ({ ...p, zip: true })); }}
                            required
                          />
                          {adminFormValidated.zip && adminFormErrors.zip && (
                            <span className="form-error">{adminFormErrors.zip}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                        <button type="button" onClick={() => setShowAddAdminModal(false)} className="btn btn-outline">Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Admin</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: MODERATION REPORTS */}
          {activeTab === "reports" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700" }}>
                  Moderation Reports ({filteredReports.length !== reports.length ? `${filteredReports.length} of ${reports.length}` : reports.length})
                </h3>
              </div>

              {/* Filters Bar */}
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
                <div style={{ width: "200px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase" }}>Filter by Status</label>
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "14px", backgroundColor: "#fff" }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Review</option>
                    <option value="resolved_no_violation">Resolved (No Violation)</option>
                    <option value="resolved_violation">Resolved (Violation Found)</option>
                  </select>
                </div>
                <div style={{ width: "200px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase" }}>Filter by Target Type</label>
                  <select
                    value={reportTypeFilter}
                    onChange={(e) => setReportTypeFilter(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "14px", backgroundColor: "#fff" }}
                  >
                    <option value="all">All Targets</option>
                    <option value="profile">Profiles Only</option>
                    <option value="posting">Postings (Jobs & Services)</option>
                  </select>
                </div>
              </div>

              {/* LIST REPORTS */}
              <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "#fff" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ padding: "12px 16px" }}>Reported Item</th>
                      <th style={{ padding: "12px 16px" }}>Reported By</th>
                      <th style={{ padding: "12px 16px" }}>Reason for Report</th>
                      <th style={{ padding: "12px 16px" }}>Report Date</th>
                      <th style={{ padding: "12px 16px" }}>Status</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r, idx) => {
                      // Resolve target details helper
                      let targetLabel = "Unknown Target";
                      let targetLink = "#";

                      if (r.target_type === "profile") {
                        const prof = profiles.find((p) => p.id === r.target_id);
                        targetLabel = prof ? `Profile: ${prof.first_name} ${prof.last_name} (@${prof.screen_name})` : `Profile ID: ${r.target_id}`;
                        targetLink = `/profile/${r.target_id}`;
                      } else if (r.target_type === "job") {
                        const jb = allJobs.find((j) => j.id === r.target_id);
                        targetLabel = jb ? `Job: ${jb.title}` : `Job ID: ${r.target_id}`;
                        targetLink = `/jobs/${r.target_id}`;
                      } else if (r.target_type === "service") {
                        const sv = allServices.find((s) => s.id === r.target_id);
                        targetLabel = sv ? `Service: ${sv.title}` : `Service ID: ${r.target_id}`;
                        targetLink = `/services/${r.target_id}`;
                      }

                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)", verticalAlign: "top" }}>
                          <td style={{ padding: "12px 16px", fontWeight: "600" }}>
                            <Link href={targetLink} className="nav-link" style={{ color: "var(--primary-color)", textDecoration: "underline" }} target="_blank">
                              {targetLabel}
                            </Link>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {r.reporter ? (
                              <span>@{r.reporter.screen_name || `${r.reporter.first_name} ${r.reporter.last_name}`}</span>
                            ) : (
                              <span style={{ color: "var(--text-secondary)" }}>Anonymous</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px", maxWidth: "300px", wordBreak: "break-word" }}>{r.reason}</td>
                          <td style={{ padding: "12px 16px", fontSize: "12px" }}>
                            {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {r.status === "pending" && (
                              <span className="tag" style={{ backgroundColor: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" }}>
                                Pending Review
                              </span>
                            )}
                            {r.status === "resolved_no_violation" && (
                              <span className="tag" style={{ backgroundColor: "var(--success-bg)", color: "var(--success-color)", border: "1px solid var(--success-border)" }}>
                                No Violation
                              </span>
                            )}
                            {r.status === "resolved_violation" && (
                              <span className="tag" style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)", border: "1px solid var(--error-border)" }}>
                                Violation Found
                              </span>
                            )}

                            {r.status !== "pending" && r.resolution_notes && (
                              <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                Note: {r.resolution_notes}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            {r.status === "pending" ? (
                              activeResolveReportId === r.id ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "220px", float: "right" }}>
                                  <textarea
                                    value={currentResolutionNotes}
                                    onChange={(e) => setCurrentResolutionNotes(e.target.value)}
                                    placeholder="Enter resolution notes..."
                                    style={{ width: "100%", minHeight: "60px", padding: "6px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius-sm)", outline: "none", textAlign: "left" }}
                                  />
                                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                    <button 
                                      onClick={() => handleResolveReport(r.id, "resolved_no_violation", r.reporter_id)}
                                      className="btn btn-primary"
                                      style={{ padding: "4px 8px", fontSize: "11px", backgroundColor: "var(--success-color)", borderColor: "var(--success-color)" }}
                                    >
                                      No Violation
                                    </button>
                                    <button 
                                      onClick={() => handleResolveReport(r.id, "resolved_violation", r.reporter_id)}
                                      className="btn btn-primary"
                                      style={{ padding: "4px 8px", fontSize: "11px", backgroundColor: "var(--error-color)", borderColor: "var(--error-color)" }}
                                    >
                                      Violation Found
                                    </button>
                                    <button 
                                      onClick={() => { setActiveResolveReportId(null); setCurrentResolutionNotes(""); }}
                                      className="btn btn-outline"
                                      style={{ padding: "4px 8px", fontSize: "11px" }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => { setActiveResolveReportId(r.id); setCurrentResolutionNotes(""); }}
                                  className="btn btn-primary"
                                  style={{ padding: "4px 8px", fontSize: "12px" }}
                                >
                                  Resolve
                                </button>
                              )
                            ) : (
                              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Resolved</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredReports.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>No reports found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SUPER ADMIN CONTROLS */}
          {activeTab === "super-admin" && isSuperAdmin && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700" }}>
                  System Administrators ({profiles.filter(p => p.is_admin).length})
                </h3>
                <button onClick={() => setShowAddAdminModal(true)} className="btn btn-primary">
                  + Create Admin
                </button>
              </div>

              {/* LIST ADMINS */}
              <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "#fff" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ padding: "12px 16px" }}>Name</th>
                      <th style={{ padding: "12px 16px" }}>Username</th>
                      <th style={{ padding: "12px 16px" }}>Email</th>
                      <th style={{ padding: "12px 16px" }}>Role</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.filter(p => p.is_admin).map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: "600" }}>{p.first_name} {p.last_name}</td>
                        <td style={{ padding: "12px 16px" }}>@{p.screen_name || "unset"}</td>
                        <td style={{ padding: "12px 16px" }}>{p.email}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {p.is_super_admin ? (
                            <span className="tag" style={{ backgroundColor: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>Super Admin</span>
                          ) : (
                            <span className="tag" style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" }}>Admin</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          {!p.is_super_admin && p.id !== currentAdminProfile.id && (
                            <button 
                              onClick={() => handleToggleAdminStatus(p.id, p.screen_name, false)}
                              className="btn btn-outline" 
                              style={{ padding: "4px 8px", fontSize: "12px", color: "var(--error-color)", borderColor: "var(--error-border)" }}
                            >
                              Demote
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === "logs" && isSuperAdmin && (
            <div className="card">
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>System Action & Audit Logs</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                A full history of administrative and critical events performed on Cala.
              </p>
              <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ padding: "12px 16px" }}>Admin Actor</th>
                      <th style={{ padding: "12px 16px" }}>Action</th>
                      <th style={{ padding: "12px 16px" }}>Details</th>
                      <th style={{ padding: "12px 16px" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemLogs.map((log, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: "600" }}>{log.actor_email}</td>
                        <td style={{ padding: "12px 16px" }}><span className="tag">{log.action}</span></td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{JSON.stringify(log.details)}</td>
                        <td style={{ padding: "12px 16px" }}>{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {systemLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>No system logs available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: ARCHIVES */}
          {activeTab === "archives" && isSuperAdmin && (
            <div className="card">
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Archived Deleted Entities</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Review, restore, or permanently delete items that have been archived.
              </p>
              <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ padding: "12px 16px" }}>Type</th>
                      <th style={{ padding: "12px 16px" }}>Original ID</th>
                      <th style={{ padding: "12px 16px" }}>Deleted By</th>
                      <th style={{ padding: "12px 16px" }}>Archive Details</th>
                      <th style={{ padding: "12px 16px" }}>Deleted Date</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archives.map((a, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: "600" }}><span className="tag">{a.resource_type}</span></td>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{a.original_id.slice(0, 8)}...</td>
                        <td style={{ padding: "12px 16px" }}>{a.deleted_by_email}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                          {renderArchiveDetails(a)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>{new Date(a.deleted_at).toLocaleString()}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => handleRestoreArchive(a)}
                              className="btn btn-blue-outline"
                              style={{ padding: "4px 8px", fontSize: "12px" }}
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDeleteArchive(a)}
                              className="btn btn-outline"
                              style={{ padding: "4px 8px", fontSize: "12px", color: "var(--error-color)", borderColor: "var(--error-border)" }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {archives.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>No archived items found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Cala Freelance Marketplace. Admin Portal.</p>
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
