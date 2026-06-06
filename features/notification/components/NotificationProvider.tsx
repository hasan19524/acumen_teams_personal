"use client";

import React, { ReactNode } from "react";
import { useNotificationSocket } from "../websocket/useNotificationSocket";
import { NotificationStack } from "./NotificationStack";

// 1. The hook lives in this inner component
const NotificationLogic = () => {
  useNotificationSocket();
  return <NotificationStack />;
};

// 2. The Provider is just a pass-through for the children
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  return (
    <>
      {children}
      <NotificationLogic />
    </>
  );
};
