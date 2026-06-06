"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { useNotificationStore } from "../store/notificationStore";
import { NotificationPopup } from "./NotificationPopup";

export const NotificationStack = () => {
  const notifications = useNotificationStore((s) => s.notifications);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notif) => (
          <div key={notif.notification_id} className="pointer-events-auto">
            <NotificationPopup notification={notif} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
