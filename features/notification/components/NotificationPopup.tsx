"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {
  ActiveNotification,
  useNotificationStore,
} from "../store/notificationStore";
import { notificationConfig } from "../types/notification";
import {
  respondDMRequest,
  undoDMRequestRejection,
  isWithinUndoWindow,
} from "../../chat/services/dmRequestService";
import { tk } from "@/lib/tokens";
interface Props {
  notification: ActiveNotification;
}

export const NotificationPopup = React.memo(({ notification }: Props) => {
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const pauseNotification = useNotificationStore((s) => s.pauseNotification);
  const resumeNotification = useNotificationStore((s) => s.resumeNotification);

  const [isExiting, setIsExiting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const config = notificationConfig[notification.notification_type];

  // ── DM Request Action Handlers ──────────────────────────────────────

  const isDMRequest = notification.notification_type === "dm_request";
  const isDMRejected = notification.notification_type === "dm_request_rejected";
  const dmRequestId: number | undefined =
    typeof notification.data?.dm_request_id === "number"
      ? notification.data.dm_request_id
      : undefined;

  const handleAcceptDM = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dmRequestId || actionLoading) return;
    setActionLoading("accept");
    try {
      await respondDMRequest(dmRequestId, { status: "accepted" });
      handleClose();
    } catch (err) {
      console.error("Failed to accept DM request:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDM = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dmRequestId || actionLoading) return;
    setActionLoading("reject");
    try {
      await respondDMRequest(dmRequestId, { status: "rejected" });
      handleClose();
    } catch (err) {
      console.error("Failed to reject DM request:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUndoReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dmRequestId || actionLoading) return;
    setActionLoading("undo");
    try {
      const rejectedAt = notification.data?.rejected_at || null;
      if (!isWithinUndoWindow(rejectedAt)) return;
      await undoDMRequestRejection(dmRequestId);
      handleClose();
    } catch (err) {
      console.error("Failed to undo DM rejection:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Existing Logic ──────────────────────────────────────────────────

  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, -150], [1, 0]);
  const scale = useTransform(x, [0, -150], [1, 0.95]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.x < -100) {
      setIsExiting(true);
      setTimeout(() => removeNotification(notification.notification_id), 200);
    }
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => removeNotification(notification.notification_id), 200);
  };

  const handleClick = async () => {
    // DM request notifications should not redirect on click —
    // they have explicit action buttons instead
    if (isDMRequest) return;

    // Auto-mark as read when user clicks notification
    try {
      await useNotificationStore
        .getState()
        .markAsRead(parseInt(notification.notification_id));
    } catch (error) {
      console.error("Failed to auto-mark notification as read:", error);
    }

    if (notification.data.redirect_url) {
      window.location.href = notification.data.redirect_url;
    }
    handleClose();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={
        isExiting
          ? { opacity: 0, x: -200, scale: 0.9 }
          : { opacity: 1, y: 0, scale: 1 }
      }
      exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => pauseNotification(notification.notification_id)}
      onMouseLeave={() => resumeNotification(notification.notification_id)}
      onClick={handleClick}
      role="alert"
      aria-live="assertive"
      className="relative w-[360px] overflow-hidden cursor-pointer"
      style={{
        x,
        opacity,
        scale,
        borderRadius: "12px",
        border: `1px solid ${tk.border}`,
        background: tk.surface,
        boxShadow:
          "0 12px 32px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Accent Left Border */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          backgroundColor: config?.accent || tk.brand,
        }}
      />

      {/* Main Content */}
      <div
        style={{
          padding: "16px",
          paddingLeft: "16px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        {/* Icon / Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {notification.data.avatar_url ? (
            <img
              src={notification.data.avatar_url}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "8px",
                objectFit: "cover",
                border: `1px solid ${tk.border}`,
              }}
              alt=""
            />
          ) : (
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "8px",
                background: tk.surfaceHover,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                border: `1px solid ${tk.border}`,
              }}
            >
              {config?.icon || "💬"}
            </div>
          )}
          {/* Unread Indicator */}
          <div
            style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: tk.primary,
              border: `2px solid ${tk.surface}`,
              boxShadow: `0 0 6px ${tk.primary}60`,
            }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: "14px",
              marginBottom: "4px",
              color: config?.accent || tk.brand,
            }}
          >
            {notification.data.title ||
              notification.notification_type.replace("_", " ").toUpperCase()}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: tk.textSecondary,
              marginBottom: "8px",
              lineHeight: 1.4,
            }}
          >
            {notification.data.message}
          </div>

          {/* ── DM Request: Accept / Reject Buttons ──────────────── */}
          {isDMRequest && dmRequestId && (
            <div
              style={{ display: "flex", gap: "8px", marginTop: "10px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleAcceptDM}
                disabled={actionLoading !== null}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  background: tk.success,
                  color: "#fff",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
              >
                {actionLoading === "accept" ? "..." : "Accept"}
              </button>
              <button
                onClick={handleRejectDM}
                disabled={actionLoading !== null}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: `1px solid ${tk.primary}40`,
                  background: tk.primary + "15",
                  color: tk.primary,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
              >
                {actionLoading === "reject" ? "..." : "Decline"}
              </button>
            </div>
          )}

          {/* ── DM Rejected: Undo Button (24h window) ────────────── */}
          {isDMRejected && dmRequestId && (
            <div
              style={{ display: "flex", gap: "8px", marginTop: "10px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleUndoReject}
                disabled={actionLoading !== null}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: `1px solid ${tk.border}`,
                  background: tk.surfaceHover,
                  color: tk.textSecondary,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
              >
                {actionLoading === "undo" ? "..." : "Undo"}
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          style={{
            background: "none",
            border: "none",
            color: tk.textMuted,
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            fontSize: "16px",
            transition: "color 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = tk.textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = tk.textMuted)}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>

      {/* Progress Timer Bar */}
      {!notification._isPaused && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: tk.border,
          }}
        >
          <motion.div
            style={{
              height: "100%",
              backgroundColor: config?.accent || tk.brand,
              width: `${notification._progress}%`,
            }}
            transition={{ duration: 0.05, ease: "linear" }}
          />
        </div>
      )}
    </motion.div>
  );
});

NotificationPopup.displayName = "NotificationPopup";
