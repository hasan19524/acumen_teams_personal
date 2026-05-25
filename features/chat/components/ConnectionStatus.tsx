// features/chat/components/ConnectionStatus.tsx

"use client";

interface ConnectionStatusProps {
  state: "connecting" | "connected" | "reconnecting" | "disconnected";
}

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const getStatusColor = () => {
    switch (state) {
      case "connected":
        return "#10b981";
      case "connecting":
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
      case "connected":
        return "Active now";
      case "connecting":
        return "Connecting...";
      case "reconnecting":
        return "Reconnecting...";
      case "disconnected":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: getStatusColor(),
          animation:
            state === "connecting" || state === "reconnecting"
              ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
              : "none",
        }}
      />
      <div style={{ fontSize: 13, opacity: 0.6 }}>{getStatusText()}</div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
