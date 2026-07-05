// features/chat/components/ConnectionStatus.tsx

"use client";

interface ConnectionStatusProps {
  state: "connecting" | "connected" | "reconnecting" | "disconnected";
}

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  // Only show the status text if disconnected or reconnecting due to network issues.
  // If connected or connecting (background), just show a subtle green dot.
  const showText = state === "disconnected" || state === "reconnecting";

  const getStatusColor = () => {
    switch (state) {
      case "connected":
      case "connecting":
        return "#10b981"; // Keep green during background connects
      case "reconnecting":
        return "#f59e0b";
      case "disconnected":
        return "#ef4444";
      default:
        return "#9ca3af";
    }
  };

  const getStatusText = () => {
    switch (state) {
      case "reconnecting":
        return "Reconnecting...";
      case "disconnected":
        return "Offline";
      default:
        return "";
    }
  };

  // FIX: Only pulse the dot if we are actually reconnecting (network issue).
  // Do not pulse during background "connecting" state.
  const shouldPulse = state === "reconnecting";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: getStatusColor(),
          animation: shouldPulse
            ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
            : "none",
        }}
      />
      {showText && <div style={{ fontSize: 13, opacity: 0.6 }}>{getStatusText()}</div>}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
