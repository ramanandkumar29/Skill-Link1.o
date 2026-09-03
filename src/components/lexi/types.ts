export type MessageRole = "user" | "assistant" | "system";

export interface LexiWorkerCardData {
  workerId: string;
  name: string;
  occupation: string;
  category: string;
  rating: number;
  reviewsCount?: number;
  experience?: string;
  location?: string;
  distanceKm?: number | string;
  visitingFee: number;
  hourlyRate?: number;
  phone?: string;
  avatarUrl?: string;
  badge?: "Legendary" | "Top Rated" | "Expert" | "Verified";
  skills?: string[];
  isAvailable?: boolean;
  recommendationScore?: number;
  rankingBadge?: string;
  rank?: number;
  whyRecommended?: string[];
}

export interface LexiBookingPreviewData {
  workerId: string;
  workerName: string;
  occupation: string;
  serviceType: string;
  date: string;
  time: string;
  location: string;
  visitingFee: number;
  estimatedLabor?: string;
  totalInspectionEstimate?: string;
  clientName?: string;
  clientPhone?: string;
}

export interface LexiServiceCardData {
  serviceId: string;
  name: string;
  nameHi?: string;
  category: string;
  icon?: string;
  baseVisitFee: number;
  estimatedLaborRange?: string;
  description?: string;
}

export interface LexiBookingCardData {
  bookingId: string;
  workerName: string;
  serviceType: string;
  status: "Pending" | "Confirmed" | "In-Progress" | "Completed" | "Cancelled";
  date?: string;
  totalEstimate?: number;
  otpSecret?: string;
  customerPhone?: string;
}

export interface LexiSOSCardData {
  issueType: string;
  location: string;
  eta: string;
  priceLock: number;
  assignedWorkerName?: string;
  assignedWorkerPhone?: string;
  status: "DISPATCHED" | "SEARCHING" | "ACCEPTED";
}

export interface LexiRateEstimateData {
  serviceName: string;
  visitFee: number;
  laborRange: string;
  unit: string;
  note?: string;
  priceLocked?: boolean;
}

export interface RichPayload {
  type: "workers" | "service" | "booking" | "booking_preview" | "sos" | "rate_estimate";
  workers?: LexiWorkerCardData[];
  bookingPreview?: LexiBookingPreviewData;
  service?: LexiServiceCardData;
  booking?: LexiBookingCardData;
  sos?: LexiSOSCardData;
  rateEstimate?: LexiRateEstimateData;
}

export interface ChatMessageItem {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  richPayload?: RichPayload;
  requiresLocation?: boolean;
  pendingTrade?: string;
  intent?: string;
  isError?: boolean;
}

export interface SuggestedPromptItem {
  id: string;
  text: string;
  category: "sos" | "home" | "pricing" | "general" | "institution";
  icon?: string;
}
