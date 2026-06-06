"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {
  ActiveNotification,
  useNotificationStore,
} from "../store/notificationStore";
import { notificationConfig } from "../types/notification";
import { respondDMRequest, undoDMRequestRejection, isWithinUndoWindow } from "../../chat/services/dmRequestService";

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

  const handleClick = () => {
    // DM request notifications should not redirect on click —
    // they have explicit action buttons instead
    if (isDMRequest) return;
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
      style={{ x, opacity, scale }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => pauseNotification(notification.notification_id)}
      onMouseLeave={() => resumeNotification(notification.notification_id)}
      onClick={handleClick}
      className="relative w-[380px] overflow-hidden rounded-xl shadow-2xl cursor-pointer border border-[var(--border)]"
      role="alert"
      aria-live="assertive"
    >
      {/* Background & Glassmorphism */}
      <div className="backdrop-blur-xl bg-[var(--card)]/90 p-4 flex gap-3 items-start">
        {/* Accent Left Border */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: config?.accent || "#6366f1" }}
        />

        {/* Icon / Avatar */}
        <div className="flex-shrink-0 relative">
          {notification.data.avatar_url ? (
            <img
              src={notification.data.avatar_url}
              className="w-10 h-10 rounded-full object-cover"
              alt=""
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center text-lg">
              {config?.icon || "💬"}
            </div>
          )}
          {/* Unread dot */}
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--destructive)] border-2 border-[var(--card)]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pl-2">
          <p
            className="font-bold text-sm text-[var(--card-foreground)]"
            style={{ color: config?.accent || "#6366f1" }}
          >
            {notification.data.title ||
              notification.notification_type.replace("_", " ").toUpperCase()}
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5 truncate">
            {notification.data.message}
          </p>

          {/* ── DM Request: Accept / Reject Buttons ──────────────── */}
          {isDMRequest && dmRequestId && (
            <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleAcceptDM}
                disabled={actionLoading !== null}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-50"
              >
                {actionLoading === "accept" ? "..." : "Accept"}
              </button>
              <button
                onClick={handleRejectDM}
                disabled={actionLoading !== null}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors disabled:opacity-50"
              >
                {actionLoading === "reject" ? "..." : "Decline"}
              </button>
            </div>
          )}

          {/* ── DM Rejected: Undo Button (24h window) ────────────── */}
          {isDMRejected && dmRequestId && (
            <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleUndoReject}
                disabled={actionLoading !== null}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--muted)] hover:bg-[var(--accent)] text-[var(--card-foreground)] transition-colors disabled:opacity-50"
              >
                {actionLoading === "undo" ? "..." : "Undo Rejection"}
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
          className="text-[var(--muted-foreground)] hover:text-[var(--card-foreground)] transition-colors mt-0.5"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>

      {/* Progress Timer Bar */}
      {!notification._isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--muted)]/30">
          <motion.div
            className="h-full"
            style={{
              width: `${notification._progress}%`,
              backgroundColor: config?.accent || "#6366f1",
            }}
            transition={{ duration: 0.05, ease: "linear" }}
          />
        </div>
      )}
    </motion.div>
  );
});

NotificationPopup.displayName = "NotificationPopup";
