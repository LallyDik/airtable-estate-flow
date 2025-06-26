export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  type: string;
  size: number;
  broker: string;
  createdAt: string;
  lastPostDate?: string;
  nextAvailablePostDate?: string;
  // New fields from the form
  neighborhood?: string;
  city?: string;
  street?: string;
  number?: string;
  floor?: string;
  rooms?: string;
  offersUntil?: string;
  exclusivityDocument?: string; // URL to the uploaded document
}

export interface Post {
  id: string;
  property: string;
  propertyTitle?: string;
  date: string;
  timeSlot: "morning" | "afternoon" | "evening" | "נכס חדש";
  broker: string;
  createdAt: string;
}

export interface Image {
  id: string;
  property: string;
  url: string;
  description?: string;
}
export type TimeSlot = "morning" | "afternoon" | "evening" | "נכס חדש";

export const TIME_SLOT_LABELS = {
  morning: 'בוקר',
  afternoon: 'צהריים',
  evening: 'ערב'
} as const;
