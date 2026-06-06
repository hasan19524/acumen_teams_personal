"use client";

import React from "react";
import { useNotificationStore } from "@/features/notification/store/notificationStore";

interface NotificationBadgeProps {
  size?: number;
  style?: React.CSSProperties;
}

export function NotificationBadge({
  size = 18,
  style,
}: NotificationBadgeProps) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  if (unreadCount === 0) return null;

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;
  const isSmall = unreadCount < 10;

  return (
    <span
      style={{
        position: "absolute",
        top: -6,
        right: -6,
        minWidth: isSmall ? size : size + 8,
        height: size,
        borderRadius: isSmall ? "50%" : 9,
        background: "#ef4444",
        color: "#fff",
        fontSize: isSmall ? 10 : 11,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isSmall ? 0 : "0 5px",
        boxShadow: "0 2px 8px rgba(239,68,68,0.5)",
        lineHeight: 1,
        ...style,
      }}
    >
      {displayCount}
    </span>
  );
}
