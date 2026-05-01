import * as signalR from "@microsoft/signalr";
import { getCookie } from "@/utils/cookie";
import { API_GATEWAY_BASE_URL } from "@/configs/apiGateway";

const HUB_URL = `${API_GATEWAY_BASE_URL}/hubs/notifications`;

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read?: boolean;
}

export interface BookingUpdate {
  bookingId: string;
  status: string;
  message: string;
  updatedAt: string;
}

export interface TourInstanceUpdate {
  instanceId: string;
  status: string;
  title: string;
  updatedAt: string;
}

export interface PaymentUpdate {
  transactionCode: string;
  normalizedStatus: "pending" | "paid" | "cancelled" | "expired" | "failed";
  amount?: number;
  paidAt?: string;
  bookingId?: string;
  paymentType?: string;
}

export interface ItineraryFeedbackEvent {
  event: string;
  tourInstanceId: string;
  feedbackId: string;
  reason: string;
}

type NotificationHandler = (notification: Notification) => void;
type BookingUpdateHandler = (update: BookingUpdate) => void;
type TourInstanceUpdateHandler = (update: TourInstanceUpdate) => void;
type PaymentUpdateHandler = (update: PaymentUpdate) => void;
type ConnectionHandler = () => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private notificationHandlers: NotificationHandler[] = [];
  private bookingUpdateHandlers: BookingUpdateHandler[] = [];
  private tourInstanceUpdateHandlers: TourInstanceUpdateHandler[] = [];
  private paymentUpdateHandlers: PaymentUpdateHandler[] = [];
  private itineraryFeedbackHandlers: ((event: ItineraryFeedbackEvent) => void)[] = [];
  private connectedHandlers: ConnectionHandler[] = [];
  private disconnectedHandlers: ConnectionHandler[] = [];
  private isConnecting = false;

  private getAccessToken(): string | null {
    return getCookie("access_token");
  }

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = this.getAccessToken();

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => token || "",
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 1000, 5000, 10000, 30000]) // Exponential backoff
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Register event handlers
      this.connection.on("ReceiveNotification", (notification: Notification) => {
        this.notificationHandlers.forEach((handler) => handler(notification));
      });

      this.connection.on("ReceiveBookingUpdate", (update: BookingUpdate) => {
        this.bookingUpdateHandlers.forEach((handler) => handler(update));
      });

      this.connection.on("ReceiveTourInstanceUpdate", (update: TourInstanceUpdate) => {
        this.tourInstanceUpdateHandlers.forEach((handler) => handler(update));
      });

      // Task 4.3.1: ReceivePaymentUpdate event for real-time payment status
      this.connection.on("ReceivePaymentUpdate", (update: PaymentUpdate) => {
        this.paymentUpdateHandlers.forEach((handler) => handler(update));
      });

      this.connection.on("ReceiveItineraryFeedbackEvent", (event: ItineraryFeedbackEvent) => {
        this.itineraryFeedbackHandlers.forEach((handler) => handler(event));
      });

      // Connection state handlers
      this.connection.onclose(() => {
        this.disconnectedHandlers.forEach((handler) => handler());
      });

      this.connection.onreconnecting(() => {
        console.log("[SignalR] Reconnecting...");
      });

      this.connection.onreconnected((connectionId) => {
        console.log("[SignalR] Reconnected with connection ID:", connectionId);
        this.connectedHandlers.forEach((handler) => handler());
      });

      await this.connection.start();
      console.log("[SignalR] Connected successfully");
      this.connectedHandlers.forEach((handler) => handler());
    } catch (error) {
      console.error("[SignalR] Failed to connect:", error);
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      console.log("[SignalR] Disconnected");
    }
  }

  async invoke(method: string, ...args: unknown[]): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.connect();
    }
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke(method, ...args);
    }
  }

  // Event subscription methods
  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.push(handler);
    return () => {
      const index = this.notificationHandlers.indexOf(handler);
      if (index > -1) {
        this.notificationHandlers.splice(index, 1);
      }
    };
  }

  onBookingUpdate(handler: BookingUpdateHandler): () => void {
    this.bookingUpdateHandlers.push(handler);
    return () => {
      const index = this.bookingUpdateHandlers.indexOf(handler);
      if (index > -1) {
        this.bookingUpdateHandlers.splice(index, 1);
      }
    };
  }

  onTourInstanceUpdate(handler: TourInstanceUpdateHandler): () => void {
    this.tourInstanceUpdateHandlers.push(handler);
    return () => {
      const index = this.tourInstanceUpdateHandlers.indexOf(handler);
      if (index > -1) {
        this.tourInstanceUpdateHandlers.splice(index, 1);
      }
    };
  }

  // Task 4.3.1: Payment update subscription
  onPaymentUpdate(handler: PaymentUpdateHandler): () => void {
    this.paymentUpdateHandlers.push(handler);
    return () => {
      const index = this.paymentUpdateHandlers.indexOf(handler);
      if (index > -1) {
        this.paymentUpdateHandlers.splice(index, 1);
      }
    };
  }

  onItineraryFeedbackEvent(handler: (event: ItineraryFeedbackEvent) => void): () => void {
    this.itineraryFeedbackHandlers.push(handler);
    return () => {
      const index = this.itineraryFeedbackHandlers.indexOf(handler);
      if (index > -1) {
        this.itineraryFeedbackHandlers.splice(index, 1);
      }
    };
  }

  onConnected(handler: ConnectionHandler): () => void {
    this.connectedHandlers.push(handler);
    return () => {
      const index = this.connectedHandlers.indexOf(handler);
      if (index > -1) {
        this.connectedHandlers.splice(index, 1);
      }
    };
  }

  onDisconnected(handler: ConnectionHandler): () => void {
    this.disconnectedHandlers.push(handler);
    return () => {
      const index = this.disconnectedHandlers.indexOf(handler);
      if (index > -1) {
        this.disconnectedHandlers.splice(index, 1);
      }
    };
  }

  // Check connection state
  get isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  get connectionState(): signalR.HubConnectionState | null {
    return this.connection?.state ?? null;
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
