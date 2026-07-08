"use client";
import { useState, useRef, useEffect } from "react";
import { useUIStore } from "@/lib/stores/uiStore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, invalidateCache } from "@/lib/api";
import { workspaceService } from "@/features/workspace/workspaceService";
import { tk } from "@/lib/tokens";
import Avatar from "@/components/Avatar";
import Cropper, { Area } from "react-easy-crop";
import {
  User,
  Building,
  Bell,
  Shield,
  Palette,
  CreditCard,
  ArrowLeft,
  Upload,
  Check,
  LogOut,
  Loader2,
  X,
  Edit3,
  AlertTriangle,
  UserCheck,
  Trash2,
  Clock,
  ZoomIn,
  Save,
  Sun,
  Moon,
} from "lucide-react";

const clearAuthAndRedirect = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh");
  localStorage.removeItem("workspace_id");
  localStorage.removeItem("username");
  invalidateCache();
  window.location.href = "/login";
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, workspaceId, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsLogoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("profile");
  const { theme, setTheme } = useUIStore();

  // Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Workspace Form State
  const [isEditingWs, setIsEditingWs] = useState(false);
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [wsLogoPreview, setWsLogoPreview] = useState<string | null>(null);
  const [wsLogoFile, setWsLogoFile] = useState<File | null>(null);

  // Image Cropper State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"avatar" | "wsLogo">("avatar");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Security State
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Notifications State
  const [notifPrefs, setNotifPrefs] = useState({
    mentions: true,
    tasks: true,
    announcements: true,
    approvals: true,
    dm: true,
    email: true,
  });

  // Attendance Config State
  const [attConfig, setAttConfig] = useState({
    shift_start: "09:00",
    shift_end: "18:00",
    grace_period_minutes: 15,
    working_days: ["0", "1", "2", "3", "4"],
    productivity_cycle_days: 14,
  });
  const [attLoading, setAttLoading] = useState(false);
  const [attMsg, setAttMsg] = useState("");

  // UI State
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingWs, setIsSavingWs] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [wsMsg, setWsMsg] = useState("");
  const [passMsg, setPassMsg] = useState("");

  // Danger Zone State
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [showLeaveTransfer, setShowLeaveTransfer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [leaveLoading, setLeaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [members, setMembers] = useState<any[]>([]);
  const [selectedNewOwner, setSelectedNewOwner] = useState<number | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");

  // Workspace Deletion State
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deletionAt, setDeletionAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone_number || "");
      setDesignation(user.designation || "");
      setBio(user.bio || "");
      setAvatarPreview(user.profile_image || null);

      setWsName(user.company_name || "");
      setWsDesc(user.workspace_description || "");
      setWsLogoPreview(user.workspace_logo || null);

      if (user.notification_preferences)
        setNotifPrefs(user.notification_preferences);
    }
  }, [user]);

  // Fetch Workspace Deletion Status
  useEffect(() => {
    if (activeTab === "workspace" && user?.role === "owner") {
      workspaceService
        .getWorkspaceSettings()
        .then((data) => {
          setPendingDelete(data.pending_delete || false);
          setDeletionAt(data.deletion_at || null);
        })
        .catch(() => {});
    }
  }, [activeTab, user, deleteLoading]);

  // Fetch Attendance Config
  useEffect(() => {
    if (
      activeTab === "attendance" &&
      (user?.role === "owner" || user?.role === "admin")
    ) {
      workspaceService.getAttendanceConfig().then((data) => {
        if (data) {
          setAttConfig({
            shift_start: data.shift_start || "09:00",
            shift_end: data.shift_end || "18:00",
            grace_period_minutes: data.grace_period_minutes || 15,
            working_days: data.working_days || ["0", "1", "2", "3", "4"],
            productivity_cycle_days: data.productivity_cycle_days || 14,
          });
        }
      });
    }
  }, [activeTab, user]);

  // Countdown Timer
  useEffect(() => {
    if (pendingDelete && deletionAt) {
      const timer = setInterval(() => {
        const diff = new Date(deletionAt).getTime() - new Date().getTime();
        if (diff <= 0) {
          setTimeLeft("Deleting...");
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [pendingDelete, deletionAt]);

  // --- Handlers ---

  const onFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "avatar" | "wsLogo",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setCropTarget(target);
        setCropModalOpen(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const generateCroppedImage = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    const image = new Image();
    image.src = cropImageSrc;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const outputSize = 512;
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      outputSize,
      outputSize,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "cropped-image.jpg", {
          type: "image/jpeg",
        });
        const previewUrl = URL.createObjectURL(file);

        if (cropTarget === "avatar") {
          setAvatarFile(file);
          setAvatarPreview(previewUrl);
        } else {
          setWsLogoFile(file);
          setWsLogoPreview(previewUrl);
        }

        setCropModalOpen(false);
        setCropImageSrc(null);
      },
      "image/jpeg",
      0.9,
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFirstName(user.first_name || "");
    setLastName(user.last_name || "");
    setEmail(user.email || "");
    setPhone(user.phone_number || "");
    setDesignation(user.designation || "");
    setBio(user.bio || "");
    setAvatarPreview(user.profile_image || null);
    setAvatarFile(null);
    setProfileMsg("");
  };

  const handleCancelWsEdit = () => {
    setIsEditingWs(false);
    setWsName(user?.company_name || "");
    setWsDesc(user?.workspace_description || "");
    setWsLogoPreview(user?.workspace_logo || null);
    setWsLogoFile(null);
    setWsMsg("");
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMsg("");
    const formData = new FormData();
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("email", email);
    formData.append("phone_number", phone);
    formData.append("designation", designation);
    formData.append("bio", bio);
    if (avatarFile) formData.append("profile_image", avatarFile);

    try {
      const res = await apiFetch("/api/accounts/me/update/", {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        const updatedData = await res.json();
        setProfileMsg("Profile updated successfully!");
        setAvatarFile(null);
        setIsEditing(false);
        setFirstName(updatedData.first_name || "");
        setLastName(updatedData.last_name || "");
        setEmail(updatedData.email || "");
        setPhone(updatedData.phone_number || "");
        setDesignation(updatedData.designation || "");
        setBio(updatedData.bio || "");
        setAvatarPreview(updatedData.profile_image || null);
        await refreshUser();
      } else {
        const data = await res.json().catch(() => null);
        setProfileMsg(data?.error || "Failed to update profile.");
      }
    } catch (err) {
      setProfileMsg("Network error.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveWorkspace = async () => {
    if (!wsName.trim()) {
      setWsMsg("Workspace name cannot be empty.");
      return;
    }
    setIsSavingWs(true);
    setWsMsg("");
    const formData = new FormData();
    formData.append("name", wsName);
    formData.append("description", wsDesc);
    if (wsLogoFile) formData.append("logo", wsLogoFile);

    try {
      const res = await apiFetch(`/api/workspaces/${workspaceId}/settings/`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        const updatedData = await res.json();
        setWsMsg("Workspace updated successfully!");
        setWsLogoFile(null);
        setIsEditingWs(false);
        setWsLogoPreview(updatedData.logo || null);
        await refreshUser();
      } else {
        const data = await res.json().catch(() => null);
        setWsMsg(data?.error || "Failed to update workspace.");
      }
    } catch (err) {
      setWsMsg("Network error.");
    } finally {
      setIsSavingWs(false);
    }
  };

  const handleChangePassword = async () => {
    setIsSavingPass(true);
    setPassMsg("");
    if (newPass !== confirmPass) {
      setPassMsg("New passwords do not match.");
      setIsSavingPass(false);
      return;
    }

    try {
      const res = await apiFetch("/api/accounts/change-password/", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPass,
          new_password: newPass,
        }),
      });

      if (res.ok) {
        setPassMsg("Password changed successfully!");
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
      } else {
        const data = await res.json().catch(() => null);
        setPassMsg(data?.error || "Failed to change password.");
      }
    } catch (err) {
      setPassMsg("Network error.");
    } finally {
      setIsSavingPass(false);
    }
  };

  const handleNotifToggle = (key: keyof typeof notifPrefs) => {
    const newPrefs = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(newPrefs);
    apiFetch("/api/accounts/me/update/", {
      method: "PATCH",
      body: JSON.stringify({ notification_preferences: newPrefs }),
    });
  };

  const handleSaveAttConfig = async () => {
    setAttLoading(true);
    setAttMsg("");
    try {
      await workspaceService.updateAttendanceConfig({
        ...attConfig,
        working_days: attConfig.working_days.join(","),
      });
      setAttMsg("Configuration updated successfully");
    } catch {
      setAttMsg("Failed to update config");
    } finally {
      setAttLoading(false);
    }
  };

  // --- Danger Zone Handlers ---
  const fetchMembers = async () => {
    try {
      const data = await workspaceService.getMembers();
      setMembers(data.filter((m: any) => m.user_id !== user?.id));
    } catch (err) {
      setTransferError("Failed to load workspace members.");
    }
  };

  const handleLeaveClick = () => {
    if (user?.role === "owner") {
      fetchMembers();
      setShowLeaveWarning(true);
    } else {
      handleConfirmLeave();
    }
  };

  const handleConfirmLeave = async () => {
    setLeaveLoading(true);
    try {
      await workspaceService.leaveWorkspace();
      localStorage.removeItem("workspace_id");
      window.location.href = "/dashboard";
    } catch (err: any) {
      setTransferError(err.message || "Failed to leave workspace.");
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleOwnerTransferAndLeave = async () => {
    if (!selectedNewOwner) {
      setTransferError("Please select a new owner to transfer to.");
      return;
    }
    setTransferLoading(true);
    try {
      await workspaceService.transferOwnership(selectedNewOwner);
      await handleConfirmLeave();
    } catch (err: any) {
      setTransferError(err.message || "Failed to transfer and leave.");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleScheduleDelete = async () => {
    setDeleteLoading(true);
    try {
      await workspaceService.scheduleDeletion();
      const data = await workspaceService.getWorkspaceSettings();
      setPendingDelete(data.pending_delete);
      setDeletionAt(data.deletion_at);
      setShowDeleteModal(false);
    } catch (err) {
      setTransferError("Failed to schedule deletion.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = async () => {
    setDeleteLoading(true);
    try {
      await workspaceService.cancelDeletion();
      setPendingDelete(false);
      setDeletionAt(null);
    } catch (err) {
      setTransferError("Failed to cancel deletion.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    ...(user?.workspace_id
      ? [{ id: "workspace", label: "Workspace", icon: Building }]
      : []),
    ...(user?.role === "owner" || user?.role === "admin"
      ? [{ id: "attendance", label: "Attendance", icon: Clock }]
      : []),
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  const inputStyle = (isDisabled: boolean) => ({
    background: tk.bg,
    border: `1px solid ${tk.border}`,
    color: isDisabled ? tk.textMuted : tk.textPrimary,
    cursor: isDisabled ? "not-allowed" : "text",
    opacity: isDisabled ? 0.7 : 1,
  });

  return (
    <main
      className="min-h-screen p-4 md:p-6 lg:p-8"
      style={{
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm font-medium mb-6 hover:underline"
          style={{ color: tk.textSecondary }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-extrabold mb-8">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl p-2 grid grid-cols-2 lg:flex lg:flex-col gap-1"
              style={{
                background: tk.surface,
                border: `1px solid ${tk.border}`,
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-[var(--surface-hover)]"
                  style={{
                    background:
                      activeTab === tab.id ? tk.surfaceHover : "transparent",
                    color:
                      activeTab === tab.id
                        ? tab.id === "danger"
                          ? tk.primary
                          : tk.brandLight
                        : tk.textSecondary,
                  }}
                >
                  <tab.icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
              <div className="lg:mt-2 lg:pt-2 lg:border-t border-[var(--border)] mt-2 pt-2 col-span-2 lg:col-span-1">
                <button
                  onClick={clearAuthAndRedirect}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-red-500/10 text-red-400"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div
              className="rounded-2xl p-6 md:p-8"
              style={{
                background: tk.surface,
                border: `1px solid ${tk.border}`,
              }}
            >
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-xl font-bold">Profile Information</h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                        style={{
                          background: tk.surfaceHover,
                          color: tk.brandLight,
                        }}
                      >
                        <Edit3 size={14} /> Edit Profile
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                          style={{
                            background: tk.bg,
                            color: tk.textSecondary,
                            border: `1px solid ${tk.border}`,
                          }}
                        >
                          <X size={14} /> Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile}
                          className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--heading)] transition-colors flex items-center gap-2 disabled:opacity-50"
                          style={{ background: tk.brand }}
                        >
                          {isSavingProfile ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          {isSavingProfile ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    )}
                  </div>

                  {profileMsg && (
                    <span
                      className={`text-sm font-medium ${profileMsg.includes("success") ? "text-green-400" : "text-red-400"}`}
                    >
                      {profileMsg}
                    </span>
                  )}

                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar
                        src={avatarPreview}
                        name={`${firstName} ${lastName}`}
                        size="lg"
                        className="border-2 border-[var(--border)]"
                      />
                      {isEditing && (
                        <>
                          <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={(e) => onFileSelect(e, "avatar")}
                            accept="image/png, image/jpeg, image/webp"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2 rounded-full transition-transform hover:scale-110"
                            style={{
                              background: tk.brandLight,
                              border: `2px solid ${tk.surface}`,
                            }}
                          >
                            <Upload size={16} color="#FFFFFF" />
                          </button>
                        </>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Profile Photo</p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: tk.textMuted }}
                      >
                        {isEditing
                          ? "Click the icon to upload. Max 5MB."
                          : "Click 'Edit Profile' to change your photo."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        Username
                      </label>
                      <input
                        type="text"
                        value={user?.username || ""}
                        disabled
                        className="w-full p-3 rounded-lg outline-none transition-colors"
                        style={inputStyle(true)}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-3 rounded-lg outline-none transition-colors focus:border-[var(--brand-light)]"
                        style={inputStyle(!isEditing)}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-3 rounded-lg outline-none transition-colors focus:border-[var(--brand-light)]"
                        style={inputStyle(!isEditing)}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-3 rounded-lg outline-none transition-colors focus:border-[var(--brand-light)]"
                        style={inputStyle(!isEditing)}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-3 rounded-lg outline-none transition-colors focus:border-[var(--brand-light)]"
                        style={inputStyle(!isEditing)}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        Designation (Job Title)
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-3 rounded-lg outline-none transition-colors focus:border-[var(--brand-light)]"
                        style={inputStyle(!isEditing)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-3 rounded-lg outline-none transition-colors focus:border-[var(--brand-light)] resize-none"
                        style={inputStyle(!isEditing)}
                        placeholder="Tell us a little about yourself..."
                      ></textarea>
                    </div>
                    <div className="md:col-span-2">
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        Workspace Role
                      </label>
                      <input
                        type="text"
                        value={user?.role || "Member"}
                        disabled
                        className="w-full p-3 rounded-lg cursor-not-allowed capitalize outline-none transition-colors"
                        style={inputStyle(true)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* WORKSPACE TAB */}
              {activeTab === "workspace" && user?.workspace_id && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Workspace Settings</h2>
                    {user?.role === "owner" &&
                      (!isEditingWs ? (
                        <button
                          onClick={() => setIsEditingWs(true)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                          style={{
                            background: tk.surfaceHover,
                            color: tk.brandLight,
                          }}
                        >
                          <Edit3 size={14} /> Edit Workspace
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCancelWsEdit}
                            className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                            style={{
                              background: tk.bg,
                              color: tk.textSecondary,
                              border: `1px solid ${tk.border}`,
                            }}
                          >
                            <X size={14} /> Cancel
                          </button>
                          <button
                            onClick={handleSaveWorkspace}
                            disabled={isSavingWs}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--heading)] transition-colors flex items-center gap-2 disabled:opacity-50"
                            style={{ background: tk.brand }}
                          >
                            {isSavingWs ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            {isSavingWs ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      ))}
                  </div>

                  {wsMsg && !isEditingWs && (
                    <span
                      className={`text-sm font-medium ${wsMsg.includes("success") ? "text-green-400" : "text-red-400"}`}
                    >
                      {wsMsg}
                    </span>
                  )}

                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar
                        src={wsLogoPreview}
                        name={wsName}
                        size="lg"
                        className="rounded-2xl border-2 border-[var(--border)]"
                      />
                      {isEditingWs && (
                        <>
                          <input
                            type="file"
                            ref={wsLogoInputRef}
                            style={{ display: "none" }}
                            onChange={(e) => onFileSelect(e, "wsLogo")}
                            accept="image/png, image/jpeg, image/webp"
                          />
                          <button
                            onClick={() => wsLogoInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2 rounded-full transition-transform hover:scale-110"
                            style={{
                              background: tk.brandLight,
                              border: `2px solid ${tk.surface}`,
                            }}
                          >
                            <Upload size={16} color="#FFFFFF" />
                          </button>
                        </>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Workspace Logo</p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: tk.textMuted }}
                      >
                        {isEditingWs
                          ? "Max 5MB. (PNG, JPG, WEBP)"
                          : "Click 'Edit Workspace' to change logo."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        Workspace Name
                      </label>
                      <input
                        type="text"
                        value={wsName}
                        onChange={(e) => setWsName(e.target.value)}
                        disabled={!isEditingWs}
                        className="w-full p-3 rounded-lg outline-none transition-colors focus:border-[var(--brand-light)]"
                        style={inputStyle(!isEditingWs)}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        Description
                      </label>
                      <textarea
                        rows={1}
                        value={wsDesc}
                        onChange={(e) => {
                          setWsDesc(e.target.value);
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        disabled={!isEditingWs}
                        className="w-full p-3 rounded-lg outline-none transition-colors focus:border-[var(--brand-light)] resize-none overflow-hidden"
                        style={inputStyle(!isEditingWs)}
                        placeholder="What is this workspace about?"
                      ></textarea>
                    </div>
                  </div>

                  {/* DANGER ZONE INSIDE WORKSPACE TAB */}
                  <div
                    className="mt-10 pt-6 border-t"
                    style={{ borderColor: tk.border }}
                  >
                    <h3
                      className="text-base font-bold mb-4"
                      style={{ color: tk.primary }}
                    >
                      Danger Zone
                    </h3>

                    {pendingDelete ? (
                      <div
                        className="p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4"
                        style={{
                          background: `${tk.primary}10`,
                          border: `1px solid ${tk.primary}50`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Clock size={20} style={{ color: tk.primary }} />
                          <div>
                            <h4
                              className="text-sm font-semibold"
                              style={{ color: tk.textPrimary }}
                            >
                              Deletion Scheduled
                            </h4>
                            <p
                              className="text-xs mt-1"
                              style={{ color: tk.textMuted }}
                            >
                              Time remaining:{" "}
                              <span className="font-bold text-red-400">
                                {timeLeft}
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleCancelDelete}
                          disabled={deleteLoading}
                          className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--heading)] transition-colors flex-shrink-0"
                          style={{ background: tk.success }}
                        >
                          {deleteLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Cancel Deletion"
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {user?.role === "owner" && (
                          <div
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl"
                            style={{
                              background: tk.bg,
                              border: `1px solid ${tk.border}`,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <UserCheck
                                size={18}
                                style={{ color: tk.brandLight, marginTop: 2 }}
                              />
                              <div>
                                <h4 className="text-sm font-semibold">
                                  Transfer Ownership
                                </h4>
                                <p
                                  className="text-xs mt-1"
                                  style={{ color: tk.textMuted }}
                                >
                                  Transfer ownership to another member. You will
                                  be downgraded to admin.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                fetchMembers();
                                setShowLeaveWarning(false);
                                setShowLeaveTransfer(true);
                              }}
                              className="px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
                              style={{
                                border: `1px solid ${tk.brandLight}`,
                                color: tk.brandLight,
                              }}
                            >
                              Transfer
                            </button>
                          </div>
                        )}

                        <div
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl"
                          style={{
                            background: tk.bg,
                            border: `1px solid ${tk.border}`,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <LogOut
                              size={18}
                              style={{ color: tk.textMuted, marginTop: 2 }}
                            />
                            <div>
                              <h4 className="text-sm font-semibold">
                                Leave Workspace
                              </h4>
                              <p
                                className="text-xs mt-1"
                                style={{ color: tk.textMuted }}
                              >
                                {user?.role === "owner"
                                  ? "You must transfer ownership first."
                                  : "Permanently leave this workspace."}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleLeaveClick}
                            className="px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
                            style={{
                              border: `1px solid ${tk.primary}`,
                              color: tk.primary,
                            }}
                          >
                            Leave
                          </button>
                        </div>

                        {user?.role === "owner" && (
                          <div
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl"
                            style={{
                              background: `${tk.primary}05`,
                              border: `1px solid ${tk.primary}40`,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <Trash2
                                size={18}
                                style={{ color: tk.primary, marginTop: 2 }}
                              />
                              <div>
                                <h4 className="text-sm font-semibold">
                                  Delete Workspace
                                </h4>
                                <p
                                  className="text-xs mt-1"
                                  style={{ color: tk.textMuted }}
                                >
                                  Schedule deletion for this workspace. All
                                  members will become independent.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowDeleteModal(true)}
                              className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--heading)] flex-shrink-0"
                              style={{ background: tk.primary }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ATTENDANCE TAB */}
              {activeTab === "attendance" &&
                (user?.role === "owner" || user?.role === "admin") && (
                  <div className="space-y-8">
                    <h2 className="text-xl font-bold">
                      Attendance Configuration
                    </h2>
                    {attMsg && (
                      <span
                        className={`text-sm font-medium ${attMsg.includes("success") ? "text-green-400" : "text-red-400"}`}
                      >
                        {attMsg}
                      </span>
                    )}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            className="text-xs font-semibold uppercase block mb-2"
                            style={{ color: tk.textMuted }}
                          >
                            Shift Start
                          </label>
                          <input
                            type="time"
                            className="w-full p-3 rounded-lg border outline-none"
                            style={{
                              background: tk.bg,
                              borderColor: tk.border,
                              color: tk.textPrimary,
                              colorScheme: "dark",
                            }}
                            value={attConfig.shift_start}
                            onChange={(e) =>
                              setAttConfig({
                                ...attConfig,
                                shift_start: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label
                            className="text-xs font-semibold uppercase block mb-2"
                            style={{ color: tk.textMuted }}
                          >
                            Shift End
                          </label>
                          <input
                            type="time"
                            className="w-full p-3 rounded-lg border outline-none"
                            style={{
                              background: tk.bg,
                              borderColor: tk.border,
                              color: tk.textPrimary,
                              colorScheme: "dark",
                            }}
                            value={attConfig.shift_end}
                            onChange={(e) =>
                              setAttConfig({
                                ...attConfig,
                                shift_end: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className="text-xs font-semibold uppercase block mb-2"
                          style={{ color: tk.textMuted }}
                        >
                          Grace Period (Minutes)
                        </label>
                        <input
                          type="number"
                          className="w-full p-3 rounded-lg border outline-none"
                          style={{
                            background: tk.bg,
                            borderColor: tk.border,
                            color: tk.textPrimary,
                          }}
                          value={attConfig.grace_period_minutes}
                          onChange={(e) =>
                            setAttConfig({
                              ...attConfig,
                              grace_period_minutes: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label
                          className="text-xs font-semibold uppercase block mb-2"
                          style={{ color: tk.textMuted }}
                        >
                          Working Days
                        </label>
                        <div className="flex gap-2">
                          {["0", "1", "2", "3", "4", "5", "6"].map((d) => {
                            const dayName = [
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                              "Sun",
                            ][parseInt(d)];
                            const isActive = attConfig.working_days.includes(d);
                            return (
                              <button
                                key={d}
                                onClick={() => {
                                  const newDays = isActive
                                    ? attConfig.working_days.filter(
                                        (x) => x !== d,
                                      )
                                    : [...attConfig.working_days, d];
                                  setAttConfig({
                                    ...attConfig,
                                    working_days: newDays,
                                  });
                                }}
                                className={`flex-1 py-2 rounded-md text-xs font-semibold border`}
                                style={{
                                  background: isActive
                                    ? tk.brand
                                    : "transparent",
                                  borderColor: isActive ? tk.brand : tk.border,
                                  color: isActive ? "#fff" : tk.textMuted,
                                }}
                              >
                                {dayName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label
                          className="text-xs font-semibold uppercase block mb-2"
                          style={{ color: tk.textMuted }}
                        >
                          Productivity Cycle (Days)
                        </label>
                        <input
                          type="number"
                          className="w-full p-3 rounded-lg border outline-none"
                          style={{
                            background: tk.bg,
                            borderColor: tk.border,
                            color: tk.textPrimary,
                          }}
                          value={attConfig.productivity_cycle_days}
                          onChange={(e) =>
                            setAttConfig({
                              ...attConfig,
                              productivity_cycle_days:
                                parseInt(e.target.value) || 14,
                            })
                          }
                        />
                      </div>
                      <button
                        onClick={handleSaveAttConfig}
                        disabled={attLoading}
                        className="w-full py-3 rounded-lg font-semibold text-[var(--heading)] flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: tk.brand }}
                      >
                        {attLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        Save Configuration
                      </button>
                    </div>
                  </div>
                )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">
                    Notification Preferences
                  </h2>
                  <div className="space-y-4">
                    {[
                      {
                        key: "mentions",
                        label: "Mentions",
                        desc: "Notify me when someone @mentions me in a channel or task.",
                      },
                      {
                        key: "tasks",
                        label: "Task Assignments",
                        desc: "Notify me when a task is assigned to me.",
                      },
                      {
                        key: "announcements",
                        label: "Announcements",
                        desc: "Notify me when a new workspace announcement is posted.",
                      },
                      {
                        key: "approvals",
                        label: "Approval Requests",
                        desc: "Notify me when a task requires my approval.",
                      },
                      {
                        key: "dm",
                        label: "Direct Messages",
                        desc: "Notify me when I receive a direct message.",
                      },
                      {
                        key: "email",
                        label: "Email Notifications",
                        desc: "Send critical notifications to my email address.",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{
                          background: tk.bg,
                          border: `1px solid ${tk.border}`,
                        }}
                      >
                        <div className="mr-4">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: tk.textPrimary }}
                          >
                            {item.label}
                          </span>
                          <p
                            className="text-xs mt-1"
                            style={{ color: tk.textMuted }}
                          >
                            {item.desc}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={
                              notifPrefs[item.key as keyof typeof notifPrefs]
                            }
                            onChange={() =>
                              handleNotifToggle(
                                item.key as keyof typeof notifPrefs,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand-light)]"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <div className="space-y-8">
                  <h2 className="text-xl font-bold">Change Password</h2>
                  <div className="space-y-6 max-w-md">
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        className="w-full p-3 rounded-lg outline-none focus:border-[var(--brand-light)]"
                        style={{
                          background: tk.bg,
                          border: `1px solid ${tk.border}`,
                          color: tk.textPrimary,
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="w-full p-3 rounded-lg outline-none focus:border-[var(--brand-light)]"
                        style={{
                          background: tk.bg,
                          border: `1px solid ${tk.border}`,
                          color: tk.textPrimary,
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: tk.textMuted }}
                      >
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        className="w-full p-3 rounded-lg outline-none focus:border-[var(--brand-light)]"
                        style={{
                          background: tk.bg,
                          border: `1px solid ${tk.border}`,
                          color: tk.textPrimary,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={isSavingPass}
                        className="px-6 py-2.5 rounded-lg font-semibold text-[var(--heading)] transition-colors flex items-center gap-2 disabled:opacity-50"
                        style={{ background: tk.brand }}
                      >
                        {isSavingPass ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Shield size={16} />
                        )}
                        {isSavingPass ? "Saving..." : "Change Password"}
                      </button>
                      {passMsg && (
                        <span
                          className={`text-sm font-medium ${passMsg.includes("success") ? "text-green-400" : "text-red-400"}`}
                        >
                          {passMsg}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* APPEARANCE TAB */}
              {activeTab === "appearance" && (
                <div className="space-y-8">
                  <h2 className="text-xl font-bold">Appearance</h2>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div
                      onClick={() => setTheme("dark")}
                      className="p-4 rounded-xl border-2 cursor-pointer transition-all"
                      style={{
                        background: "#081325",
                        borderColor:
                          theme === "dark" ? tk.brandLight : "transparent",
                      }}
                    >
                      <div
                        className="h-24 rounded-lg mb-3 flex items-center justify-center"
                        style={{ background: "#172440" }}
                      >
                        <Moon size={24} color="#FFFFFF" />
                      </div>
                      <p className="text-sm font-bold text-center text-white">
                        Dark Mode
                      </p>
                    </div>
                    <div
                      onClick={() => setTheme("light")}
                      className="p-4 rounded-xl border-2 cursor-pointer transition-all"
                      style={{
                        background: "#F8FAFC",
                        borderColor:
                          theme === "light" ? tk.brand : "transparent",
                      }}
                    >
                      <div className="h-24 rounded-lg mb-3 flex items-center justify-center bg-white border border-gray-200">
                        <Sun size={24} color="#F59E0B" />
                      </div>
                      <p className="text-sm font-bold text-center text-slate-800">
                        Light Mode
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BILLING TAB */}
              {activeTab === "billing" && (
                <div>
                  <h2 className="text-xl font-bold mb-6">
                    Billing & Subscription
                  </h2>
                  <div
                    className="p-6 rounded-xl"
                    style={{
                      background: tk.bg,
                      border: `1px solid ${tk.border}`,
                    }}
                  >
                    <h3 className="text-lg font-bold mb-2">Free Plan</h3>
                    <p className="text-sm mb-4" style={{ color: tk.textMuted }}>
                      You are currently on the Free Plan. Upgrade to unlock
                      unlimited teams and advanced analytics.
                    </p>
                    <button
                      className="px-6 py-2.5 rounded-lg font-semibold text-[var(--heading)]"
                      style={{ background: tk.success }}
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LEAVE WARNING MODAL (For Owner) */}
      {showLeaveWarning && user?.role === "owner" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => !leaveLoading && setShowLeaveWarning(false)}
        >
          <div
            className="rounded-xl w-full max-w-md p-6"
            style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: tk.tintDanger }}
              >
                <AlertTriangle size={20} color={tk.danger} />
              </div>
              <button
                onClick={() => setShowLeaveWarning(false)}
                style={{ color: tk.textMuted }}
              >
                <X size={20} />
              </button>
            </div>
            <h2
              className="text-lg font-bold mb-2"
              style={{ color: tk.heading }}
            >
              Transfer Ownership Required
            </h2>
            <p className="text-sm mb-6" style={{ color: tk.textMuted }}>
              You are the owner of this workspace. You must transfer ownership
              to another member before you can leave.
            </p>
            <button
              onClick={() => {
                setShowLeaveWarning(false);
                setShowLeaveTransfer(true);
              }}
              className="w-full py-3 rounded-lg font-bold text-sm"
              style={{ background: tk.brand, color: "#fff" }}
            >
              Select New Owner
            </button>
          </div>
        </div>
      )}

      {/* TRANSFER & LEAVE MODAL */}
      {showLeaveTransfer && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => !transferLoading && setShowLeaveTransfer(false)}
        >
          <div
            className="rounded-xl w-full max-w-md p-6"
            style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: tk.tintBrand }}
              >
                <UserCheck size={20} color={tk.brand} />
              </div>
              <button
                onClick={() => setShowLeaveTransfer(false)}
                style={{ color: tk.textMuted }}
              >
                <X size={20} />
              </button>
            </div>
            <h2
              className="text-lg font-bold mb-2"
              style={{ color: tk.heading }}
            >
              Select New Owner
            </h2>
            <p className="text-sm mb-6" style={{ color: tk.textMuted }}>
              Select a member to take over as owner. You will leave the
              workspace immediately after.
            </p>

            <div
              className="max-h-48 overflow-y-auto rounded-lg mb-6"
              style={{ border: `1px solid ${tk.border}` }}
            >
              {members.length === 0 ? (
                <div
                  className="p-4 text-center text-sm"
                  style={{ color: tk.textMuted }}
                >
                  No other members available.
                </div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.user_id}
                    onClick={() => setSelectedNewOwner(m.user_id)}
                    className="flex items-center gap-3 p-3 cursor-pointer last:border-0"
                    style={{
                      borderBottom: `1px solid ${tk.border}`,
                      background:
                        selectedNewOwner === m.user_id
                          ? tk.tintBrand
                          : "transparent",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded border flex items-center justify-center"
                      style={{
                        border: `1px solid ${selectedNewOwner === m.user_id ? tk.brand : tk.border}`,
                        background:
                          selectedNewOwner === m.user_id
                            ? tk.brand
                            : "transparent",
                      }}
                    >
                      {selectedNewOwner === m.user_id && (
                        <Check size={14} color="#fff" />
                      )}
                    </div>
                    <span className="text-sm" style={{ color: tk.textPrimary }}>
                      {m.full_name || m.username}
                    </span>
                  </div>
                ))
              )}
            </div>

            {transferError && (
              <div
                className="text-sm mb-4 text-center"
                style={{ color: tk.danger }}
              >
                {transferError}
              </div>
            )}

            <button
              onClick={handleOwnerTransferAndLeave}
              disabled={!selectedNewOwner || transferLoading}
              className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: tk.brand, color: "#fff" }}
            >
              {transferLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Transferring &
                  Leaving...
                </>
              ) : (
                "Transfer & Leave"
              )}
            </button>
          </div>
        </div>
      )}

      {/* IMAGE CROPPER MODAL */}
      {cropModalOpen && cropImageSrc && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
        >
          <div
            className="w-full max-w-sm flex flex-col items-center"
            style={{
              background: tk.surface,
              borderRadius: 16,
              padding: 24,
              gap: 20,
            }}
          >
            <div className="flex justify-between items-center w-full mb-2">
              <h3
                className="text-lg font-bold"
                style={{ color: tk.textPrimary }}
              >
                Crop Image
              </h3>
              <button
                onClick={() => setCropModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: tk.textMuted,
                  cursor: "pointer",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div
              style={{
                position: "relative",
                width: 300,
                height: 300,
                borderRadius: "50%",
                overflow: "hidden",
                background: tk.bg,
              }}
            >
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
              />
            </div>

            <div className="w-full flex items-center gap-3 mt-2">
              <ZoomIn size={16} color={tk.textSecondary} />
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <button
              onClick={generateCroppedImage}
              className="w-full py-3 rounded-lg font-semibold text-[var(--heading)] mt-2"
              style={{
                background: tk.brand,
                border: "none",
                cursor: "pointer",
              }}
            >
              Apply & Save
            </button>
          </div>
        </div>
      )}

      {/* DELETE WORKSPACE MODAL */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => !deleteLoading && setShowDeleteModal(false)}
        >
          <div
            className="rounded-xl w-full max-w-md p-6"
            style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: tk.tintDanger }}
              >
                <Trash2 size={20} color={tk.danger} />
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ color: tk.textMuted }}
              >
                <X size={20} />
              </button>
            </div>
            <h2
              className="text-lg font-bold mb-2"
              style={{ color: tk.heading }}
            >
              Schedule Deletion?
            </h2>
            <p className="text-sm mb-6" style={{ color: tk.textMuted }}>
              This will start a 24-hour countdown. After 24 hours, the workspace
              and all its data will be permanently deleted, and all members will
              become independent. You can cancel this anytime within the 24
              hours.
            </p>
            <button
              onClick={handleScheduleDelete}
              disabled={deleteLoading}
              className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: tk.danger, color: "#fff" }}
            >
              {deleteLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Scheduling...
                </>
              ) : (
                "Yes, Start 24h Countdown"
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
