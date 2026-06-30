// features/teams/components/CreateTeamModal.tsx
"use client";

import { useState } from "react";
import { X, Plus, Lock, Globe, Loader2, Search, Check } from "lucide-react";
import { tk, Member } from "../lib";
import { workspaceService } from "@/features/workspace/workspaceService";

interface CreateTeamModalProps {
  showModal: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<any>;
  isCreating: boolean;
  users: Member[];
}

const PRESET_COLORS = [
  "#4B1587",
  "#E31E24",
  "#1FA463",
  "#F5B041",
  "#5DADE2",
  "#0D1B3D",
];

export function CreateTeamModal({
  showModal,
  onClose,
  onCreate,
  isCreating,
  users,
}: CreateTeamModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  if (!showModal) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    // Pass member_ids directly. The backend CreateTeamView will add them instantly.
    await onCreate({
      name,
      description,
      leader_id: leaderId ? Number(leaderId) : null,
      is_private: isPrivate,
      color,
      member_ids: selectedMembers,
    });

    // Reset form on success
    setName("");
    setDescription("");
    setLeaderId("");
    setIsPrivate(false);
    setColor(PRESET_COLORS[0]);
    setSelectedMembers([]);
    setMemberSearch("");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="modal-fade"
        style={{
          background: tk.surface,
          border: `1px solid ${tk.border}`,
          borderRadius: 12,
          width: "100%",
          maxWidth: 480,
          padding: 24,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: tk.textPrimary,
            }}
          >
            Create New Team
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: tk.textMuted,
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Name & Color */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Team Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engineering"
                autoFocus
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", gap: 6, paddingBottom: 2 }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: `2px solid ${color === c ? "#FFFFFF" : "transparent"}`,
                    background: c,
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What does this team do?"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Leader & Visibility */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={labelStyle}>Team Leader</label>
              <select
                value={leaderId}
                onChange={(e) => setLeaderId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select a leader...</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.full_name || u.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Visibility</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setIsPrivate(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    border: `1px solid ${!isPrivate ? tk.brand : tk.border}`,
                    background: !isPrivate ? tk.brand : "transparent",
                    color: !isPrivate ? "#fff" : tk.textSecondary,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Globe size={14} /> Public
                </button>
                <button
                  onClick={() => setIsPrivate(true)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    border: `1px solid ${isPrivate ? tk.brand : tk.border}`,
                    background: isPrivate ? tk.brand : "transparent",
                    color: isPrivate ? "#fff" : tk.textSecondary,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Lock size={14} /> Private
                </button>
              </div>
            </div>
          </div>

          {/* Members Selection (Single Modal Flow) */}
          <div>
            <label style={labelStyle}>Add Members (Optional)</label>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: tk.textMuted, pointerEvents: "none" }} />
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members to add..."
                style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: `1px solid ${tk.border}`, background: tk.bg, color: tk.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ maxHeight: 180, overflowY: "auto", border: `1px solid ${tk.border}`, borderRadius: 8, background: tk.bg }}>
              {users.filter(u => u.full_name.toLowerCase().includes(memberSearch.toLowerCase()) || u.username.toLowerCase().includes(memberSearch.toLowerCase())).map(u => (
                <div key={u.user_id} onClick={() => setSelectedMembers(prev => prev.includes(u.user_id) ? prev.filter(id => id !== u.user_id) : [...prev, u.user_id])} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", borderBottom: `1px solid ${tk.border}` }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: `1px solid ${selectedMembers.includes(u.user_id) ? tk.brand : tk.border}`, background: selectedMembers.includes(u.user_id) ? tk.brand : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {selectedMembers.includes(u.user_id) && <Check size={14} color="#fff" />}
                  </div>
                  <span style={{ fontSize: 14, color: tk.textPrimary }}>{u.full_name || u.username}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isCreating}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "none",
              background: !name.trim() ? tk.border : tk.brand,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: !name.trim() ? "not-allowed" : "pointer",
              opacity: !name.trim() ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isCreating ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} /> Create Team
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: tk.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: "block",
  marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${tk.border}`,
  background: tk.bg,
  color: tk.textPrimary,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};
