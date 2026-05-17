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

// Hebrew label maps
export const SIDE_LABELS: Record<Side, string> = {
  bride: "כלה",
  groom: "חתן",
};

export const GROUP_LABELS: Record<Group, string> = {
  family: "משפחה",
  friends: "חברים",
  work: "עבודה",
  other: "אחר",
};

export const STATUS_LABELS: Record<RsvpStatus, string> = {
  pending: "ממתין",
  attending: "מגיע/ה",
  not_attending: "לא מגיע/ה",
};
