// ── RSVP types ───────────────────────────────────────────────
export type Side = "bride" | "groom";
export type Group = "family" | "friends" | "work" | "other";
export type RsvpStatus = "pending" | "attending" | "not_attending";

export interface Guest {
  id: number;
  name: string;
  phone: string;
  email: string;
  side: Side;
  grp: Group;
  party_size: number;
  notes: string;
  rsvp_status: RsvpStatus;
  phone_valid: number; // 0 | 1
  invited_at: string | null;
  responded_at: string | null;
  created_at: string;
}

export type GuestFormData = Omit<Guest, "id" | "phone_valid" | "invited_at" | "responded_at" | "created_at">;

export interface ImportPreviewGuest {
  name: string;
  phone: string;
  email: string;
  side: Side;
  grp: Group;
  party_size: number;
  notes: string;
  phone_valid: boolean;
  rsvp_status: RsvpStatus;
}

export interface ImportPreviewResponse {
  preview: ImportPreviewGuest[];
  errors: string[];
  col_map: Record<string, number | null>;
}

export interface SendResult {
  id: number;
  name: string;
  phone: string;
  status: "success" | "failed";
  message: string;
}

export interface SendResponse {
  results: SendResult[];
  total: number;
  success_count: number;
  failed_count: number;
}

export interface StatusCount {
  count: number;
  people: number;
}

export interface Stats {
  totals: {
    total_guests: number;
    total_people: number;
    attending_people: number;
    attending_guests: number;
    declined_guests: number;
    pending_guests: number;
    invalid_phones: number;
    invited_count: number;
  };
  by_status: Partial<Record<RsvpStatus, StatusCount>>;
  by_side: {
    bride: Partial<Record<RsvpStatus, StatusCount>>;
    groom: Partial<Record<RsvpStatus, StatusCount>>;
  };
  by_group: Partial<Record<Group, Partial<Record<RsvpStatus, StatusCount>>>>;
}

// ── Tasks types ───────────────────────────────────────────────
export type TaskPriority = "high" | "medium" | "low";
export type TaskCategory =
  | "venue" | "catering" | "photography" | "music"
  | "attire" | "beauty" | "flowers" | "invitations"
  | "legal" | "honeymoon" | "other";

export interface Task {
  id: number;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  due_months_before: number;
  completed: number; // 0 | 1
  completed_at: string | null;
  display_order: number;
  created_at: string;
}

export type TaskFormData = Omit<Task, "id" | "completed" | "completed_at" | "display_order" | "created_at">;

export interface TasksSummary {
  total: number;
  done: number;
  remaining: number;
  upcoming: Pick<Task, "id" | "title" | "category" | "priority" | "due_months_before">[];
}

// ── Vendors types ─────────────────────────────────────────────
export type VendorCategory =
  | "photographer" | "videographer" | "venue" | "catering"
  | "florist" | "music" | "hair_makeup" | "dress" | "cake"
  | "transportation" | "other";

export interface Vendor {
  id: number;
  category: VendorCategory;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  website: string;
  price: number | null;
  deposit_amount: number | null;
  deposit_paid: number; // 0 | 1
  booking_date: string | null;
  meeting_date: string | null;
  event_date: string | null;
  notes: string;
  contract_filename: string | null;
  contract_path: string | null;
  created_at: string;
}

export type VendorFormData = Omit<Vendor, "id" | "contract_filename" | "contract_path" | "created_at">;

export interface VendorsSummary {
  total: number;
  booked: number;
  total_budget: number;
  deposits_paid: number;
  deposits_outstanding: number;
}

// ── Hebrew label maps ─────────────────────────────────────────
export const SIDE_LABELS: Record<Side, string> = {
  bride: "כלה",
  groom: "חתן",
};

export const GROUP_LABELS: Record<Group, string> = {
  family:  "משפחה",
  friends: "חברים",
  work:    "עבודה",
  other:   "אחר",
};

export const STATUS_LABELS: Record<RsvpStatus, string> = {
  pending:       "ממתין",
  attending:     "מגיע/ה",
  not_attending: "לא מגיע/ה",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high:   "דחוף",
  medium: "בינוני",
  low:    "נמוך",
};

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  venue:       "אולם",
  catering:    "קייטרינג",
  photography: "צילום",
  music:       "מוזיקה",
  attire:      "לבוש",
  beauty:      "יופי",
  flowers:     "פרחים",
  invitations: "הזמנות",
  legal:       "משפטי",
  honeymoon:   "ירח דבש",
  other:       "אחר",
};

export const TASK_CATEGORY_ICONS: Record<TaskCategory, string> = {
  venue:       "🏛️",
  catering:    "🍽️",
  photography: "📷",
  music:       "🎵",
  attire:      "👗",
  beauty:      "💄",
  flowers:     "💐",
  invitations: "💌",
  legal:       "📋",
  honeymoon:   "✈️",
  other:       "📌",
};

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  photographer:  "צלם",
  videographer:  "וידאוגרף",
  venue:         "אולם",
  catering:      "קייטרינג",
  florist:       "פרחים",
  music:         "מוזיקה / DJ",
  hair_makeup:   "שיער ואיפור",
  dress:         "שמלה / חליפה",
  cake:          "עוגת חתונה",
  transportation:"הסעות",
  other:         "אחר",
};

export const VENDOR_CATEGORY_ICONS: Record<VendorCategory, string> = {
  photographer:  "📷",
  videographer:  "🎬",
  venue:         "🏛️",
  catering:      "🍽️",
  florist:       "💐",
  music:         "🎵",
  hair_makeup:   "💄",
  dress:         "👗",
  cake:          "🎂",
  transportation:"🚗",
  other:         "📌",
};

export const DUE_MONTHS_LABELS: Record<number, string> = {
  14: "12+ חודשים לפני",
  12: "12+ חודשים לפני",
  9:  "9 חודשים לפני",
  6:  "6 חודשים לפני",
  3:  "3 חודשים לפני",
  1:  "חודש לפני",
};

export function dueMonthsLabel(months: number): string {
  if (months >= 12) return "12+ חודשים לפני";
  if (months >= 9)  return "9 חודשים לפני";
  if (months >= 6)  return "6 חודשים לפני";
  if (months >= 3)  return "3 חודשים לפני";
  return "חודש לפני";
}
