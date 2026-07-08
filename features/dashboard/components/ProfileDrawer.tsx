import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  X,
  Edit3,
  Calendar,
  Users,
  LogOut,
  Building,
  Mail,
  Phone,
  Crown,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { workspaceService } from "@/features/workspace/workspaceService";
import Avatar from "@/components/Avatar";
import { tk } from "@/lib/tokens";
import { useProfileStore } from "@/features/dashboard/store/profileStore";
import { useTeamStore, useAuthStore } from "@/lib/stores/cache";

const clearAuthAndRedirect = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh");
  localStorage.removeItem("workspace_id");
  localStorage.removeItem("username");
  useAuthStore.getState().clearAuth(); // Clear Zustand state on logout!
  window.location.href = "/login";
};

export default function ProfileDrawer() {
  const { user: currentUser } = useAuth();
  const { isProfileOpen, targetUser, closeProfile } = useProfileStore();
  const [fetchedUser, setFetchedUser] = useState<any>(null);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const [showNoPfpToast, setShowNoPfpToast] = useState(false);

  const allTeams = useTeamStore((s) => s.teams);

  // Use targetUser if provided, otherwise default to current user
  const targetUserId = targetUser?.user_id || targetUser?.id;
  const currentUserId = currentUser?.id || currentUser?.user_id;
  const isMe = !targetUser || targetUserId === currentUserId;

  useEffect(() => {
    if (isProfileOpen) {
      setFetchedUser(null); // Reset on open
      if (isMe) {
        setFetchedUser(currentUser);
      } else if (targetUserId) {
        apiFetch(`/api/accounts/${targetUserId}/profile/`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) setFetchedUser(data);
            else setFetchedUser(targetUser); // Fallback to basic info
          })
          .catch(() => setFetchedUser(targetUser));
      }
    }
  }, [isProfileOpen, isMe, targetUserId, targetUser, currentUser]);

  const user = fetchedUser || targetUser || currentUser;

  useEffect(() => {
    if (isProfileOpen && user) {
      workspaceService
        .getTeams()
        .then((data) => {
          useTeamStore.getState().setTeams(data || []);
        })
        .catch(() => useTeamStore.getState().setTeams([]));
    }
  }, [isProfileOpen, user]);

  // Filter teams locally from the global store
  const teams = allTeams.filter((t: any) =>
    t.members?.some(
      (m: any) => m.user_id === user?.id || m.user_id === user?.user_id,
    ),
  );

  if (!isProfileOpen || !user) return null;

  const DetailRow = ({
    icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string | null | undefined;
  }) => {
    if (!value) return null;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 0",
          borderBottom: `1px solid ${tk.border}`,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: tk.surfaceHover,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              color: tk.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 14,
              color: tk.textPrimary,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {value}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 100,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={closeProfile}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 450,
          height: "100vh",
          background: tk.surface,
          borderLeft: `1px solid ${tk.border}`,
          padding: 24,
          overflowY: "auto",
          animation: "slideIn 0.3s ease-out",
        }}
      >
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: tk.textPrimary,
            }}
          >
            {isMe ? "My Profile" : "Member Profile"}
          </h3>
          <button
            onClick={closeProfile}
            style={{
              background: "transparent",
              border: "none",
              color: tk.textMuted,
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
                    <div 
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => {
              if (user?.profile_image) {
                setIsImageEnlarged(true);
              } else {
                setShowNoPfpToast(true);
                setTimeout(() => setShowNoPfpToast(false), 3000);
              }
            }}
          >
            <Avatar
              src={user?.profile_image}
              name={
                user?.full_name ||
                `${user?.first_name || ""} ${user?.last_name || ""}`
              }
              size="lg"
              className="border-2"
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: 20, fontWeight: 700, color: tk.textPrimary }}
            >
              {user?.full_name || user?.username}
            </div>
            <div style={{ fontSize: 14, color: tk.textMuted }}>
              @{user?.username}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              {user?.role && (
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 12,
                    background: `${tk.brandLight}20`,
                    color: tk.brandLight,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "capitalize",
                  }}
                >
                  {user.role}
                </span>
              )}
              {user?.designation && (
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 12,
                    background: `${tk.success}20`,
                    color: tk.success,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {user.designation}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <DetailRow
            icon={<Building size={16} color={tk.textSecondary} />}
            label="Workspace"
            value={user?.company_name || "Acumen Teams"}
          />
          <DetailRow
            icon={<Mail size={16} color={tk.textSecondary} />}
            label="Email"
            value={user?.email}
          />
          <DetailRow
            icon={<Phone size={16} color={tk.textSecondary} />}
            label="Phone"
            value={user?.phone_number}
          />
          <DetailRow
            icon={<Calendar size={16} color={tk.textSecondary} />}
            label="Joined Workspace"
            value={
              user?.joined_at
                ? new Date(user.joined_at).toLocaleDateString()
                : null
            }
          />

          {user?.bio && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 0",
                borderBottom: `1px solid ${tk.border}`,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: tk.surfaceHover,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={16} color={tk.textSecondary} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: tk.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 4,
                  }}
                >
                  Bio
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: tk.textSecondary,
                    lineHeight: 1.5,
                  }}
                >
                  {user.bio}
                </div>
              </div>
            </div>
          )}

          {teams.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: tk.surfaceHover,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={16} color={tk.textSecondary} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: tk.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Current Teams
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  {teams.map((t) => (
                    <span
                      key={t.id}
                      style={{
                        fontSize: 12,
                        color: tk.textPrimary,
                        background: tk.bg,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: `1px solid ${tk.border}`,
                      }}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions - ONLY visible if viewing your own profile */}
        {isMe && (
          <div style={{ display: "grid", gap: 8 }}>
            <button
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${tk.border}`,
                background: tk.surfaceHover,
                color: tk.textPrimary,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onClick={() => {
                closeProfile();
                window.location.href = "/dashboard/settings";
              }}
            >
              <Edit3 size={16} color={tk.brandLight} /> Edit Profile & Settings
            </button>
            {user?.role === "owner" && (
              <button
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${tk.border}`,
                  background: "transparent",
                  color: tk.textPrimary,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onClick={() => {
                  closeProfile();
                  window.location.href = "/dashboard/settings";
                }}
              >
                <Crown size={16} color={tk.warning} /> Workspace Settings
              </button>
            )}
            <button
              onClick={clearAuthAndRedirect}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${tk.primary}40`,
                background: "transparent",
                color: tk.primary,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>

      {/* Enlarged Image Lightbox (Circular) */}
      {isImageEnlarged && user?.profile_image && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            padding: 20,
            flexDirection: "column",
            gap: 20,
          }}
          onClick={() => setIsImageEnlarged(false)}
        >
          <div
            style={{
              width: 300,
              height: 300,
              borderRadius: "50%",
              overflow: "hidden",
              border: `4px solid ${tk.brandLight}`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              background: tk.bg,
            }}
          >
            <img
              src={user.profile_image}
              alt="Enlarged Profile"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
          {/* The close button has been removed. Clicking anywhere on the dark background closes the image. */}
        </div>
      )}

      {/* No PFP Toast */}
      {showNoPfpToast && (
        <div
          style={{
            position: "fixed",
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%)",
            background: tk.surfaceHover,
            color: tk.textPrimary,
            padding: "12px 24px",
            borderRadius: 8,
            border: `1px solid ${tk.border}`,
            fontSize: 14,
            fontWeight: 600,
            zIndex: 300,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          No profile picture present
        </div>
      )}
    </div>
  );
}
