// features/chat/websocket/manager.ts

type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";
type MessageHandler = (data: any) => void;

interface WebSocketManagerConfig {
  url: string;
  token: string;
  channelId: number | null;
  onStateChange: (state: ConnectionState) => void;
  onError: (error: string) => void;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketManagerConfig;
  private state: ConnectionState = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private isManualClose = false;
  private messageQueue: any[] = [];

  private readonly MAX_RECONNECT_ATTEMPTS = 15;
  private readonly MAX_BACKOFF_MS = 30000;
  private readonly HEARTBEAT_INTERVAL = 30000;
  private readonly HEARTBEAT_TIMEOUT = 25000;
  private pingTimer: NodeJS.Timeout | null = null;

  constructor(config: WebSocketManagerConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.state === "connecting" || this.state === "connected") {
      console.debug(`[WS] Already in state "${this.state}", skipping connect`);
      return;
    }

    this.setState("connecting");
    this.isManualClose = false;

    try {
      // CRITICAL FIX: Read the latest token from localStorage on every connect.
      // This ensures reconnections use a fresh token if the old one expired
      // and was silently refreshed by the REST API's 401 handler.
      const currentToken =
        (typeof window !== "undefined" && localStorage.getItem("token")) ||
        this.config.token;

      // Always read fresh token from localStorage on connect
      const freshToken =
        (typeof window !== "undefined" && localStorage.getItem("token")) ||
        currentToken;

      // AUTH FIX: Do not attempt connection if there is no token.
      // The backend will reject unauthenticated WS connections anyway.
      if (!freshToken) {
        console.debug("[WS] No auth token found, skipping connection.");
        this.setState("disconnected");
        return;
      }

      // Dynamically build URL: use /ws/notifications/ if no channelId, else /ws/chat/{id}/
      const path = this.config.channelId 
        ? `ws/chat/${this.config.channelId}/` 
        : `ws/notifications/`;
      
      let wsUrl = `${this.config.url}/${path}`;
      if (freshToken) {
        wsUrl += `?token=${freshToken}`;
      }

      console.debug(`[WS] Connecting to: ${wsUrl.replace(freshToken || '', '[TOKEN]')}`);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (event) => this.handleError(event);
      this.ws.onclose = (event) => this.handleClose(event);
    } catch (error) {
      this.config.onError(`Failed to create WebSocket: ${error}`);
      this.scheduleReconnect();
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.messageQueue.push(data);
      console.debug(
        `[WS] Message queued (not connected). Queue size: ${this.messageQueue.length}`,
      );
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  disconnect(): void {
    this.isManualClose = true;
    this.setState("disconnected");
    this.clearTimers();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.messageQueue = [];
  }

  getState(): ConnectionState {
    return this.state;
  }

  isReady(): boolean {
    return this.state === "connected" && this.ws?.readyState === WebSocket.OPEN;
  }

  private handleOpen(): void {
    console.debug("[WS] Connected");
    this.reconnectAttempts = 0;
    this.setState("connected");

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.flushMessageQueue();
    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      if (this.heartbeatTimer) {
        clearTimeout(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }

      this.messageHandlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error("[WS] Message handler error:", error);
        }
      });
    } catch (error) {
      console.error("[WS] Failed to parse message:", error);
    }
  }

  private handleError(event: Event): void {
    // Downgraded to console.warn to prevent Next.js dev overlay on expected auth/network failures.
    console.warn(`[WS] Connection error. This is normal if offline or not logged in yet.`);
    this.config.onError("WebSocket connection failed");
  }

  // Update the signature to accept the CloseEvent
  private handleClose(event: CloseEvent): void {
    console.debug(
      `[WS] Connection closed. Code: ${event.code}, Reason: ${event.reason}`,
    );
    this.clearTimers();

    if (this.isManualClose) {
      this.setState("disconnected");
      return;
    }

    // ── NEW: Prevent reconnect on Auth/Policy violations ──────────────────
    // If the backend closes the socket with a custom code (4001, 4003, 4010),
    // it means the connection is explicitly rejected (bad token, not a member, etc.).
    // Reconnecting will just cause an infinite loop of rejections.
    const noReconnectCodes = [4001, 4003, 4010, 1008];
    if (noReconnectCodes.includes(event.code)) {
      console.error(
        `[WS] Connection rejected by server (Code: ${event.code}). Stopping reconnect.`,
      );
      this.setState("disconnected");
      this.config.onError(
        `Connection rejected: ${event.reason || "Authentication failed"}`,
      );
      return;
    }
    // ── END NEW ───────────────────────────────────────────────────────────

    this.setState("reconnecting");
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error(
        `[WS] Max reconnect attempts (${this.MAX_RECONNECT_ATTEMPTS}) reached`,
      );
      this.setState("disconnected");
      this.config.onError("Failed to reconnect after multiple attempts");
      return;
    }

    const backoffMs = this.getBackoffDelay();
    this.reconnectAttempts++;

    console.debug(
      `[WS] Scheduling reconnect in ${backoffMs}ms (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`,
    );

    this.reconnectTimer = setTimeout(() => {
      console.debug(`[WS] Attempting reconnect (${this.reconnectAttempts})`);
      this.connect();
    }, backoffMs);
  }

  private getBackoffDelay(): number {
    const exponential = Math.pow(2, this.reconnectAttempts - 1) * 1000;
    const capped = Math.min(exponential, this.MAX_BACKOFF_MS);
    const jitter = capped * (0.9 + Math.random() * 0.2);
    return Math.round(jitter);
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
        this.heartbeatTimer = setTimeout(() => {
          console.warn("[WS] Heartbeat timeout, closing connection");
          if (this.ws) {
            this.ws.close(1000, "Heartbeat timeout");
          }
        }, this.HEARTBEAT_TIMEOUT);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private clearHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    console.debug(`[WS] Flushing ${this.messageQueue.length} queued messages`);
    const queue = [...this.messageQueue];
    this.messageQueue = [];

    queue.forEach((msg) => {
      this.send(msg);
    });
  }

  private setState(newState: ConnectionState): void {
    if (newState !== this.state) {
      console.debug(`[WS] State: ${this.state} → ${newState}`);
      this.state = newState;
      this.config.onStateChange(newState);
    }
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.clearHeartbeat();
  }
}
