import axios from "axios";
import type {
  Guest,
  GuestFormData,
  ImportPreviewResponse,
  SendResponse,
  Stats,
} from "../types";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
});

// ── Guests ──────────────────────────────────────────────────────────────────

export interface GuestFilters {
  side?: string;
  grp?: string;
  status?: string;
  search?: string;
}

export const fetchGuests = (filters?: GuestFilters) =>
  api.get<Guest[]>("/guests", { params: filters }).then((r) => r.data);

export const createGuest = (data: GuestFormData) =>
  api.post<Guest>("/guests", data).then((r) => r.data);

export const updateGuest = (id: number, data: Partial<GuestFormData>) =>
  api.put<Guest>(`/guests/${id}`, data).then((r) => r.data);

export const deleteGuest = (id: number) =>
  api.delete(`/guests/${id}`).then((r) => r.data);

export const bulkDeleteGuests = (ids: number[]) =>
  api.post("/guests/bulk-delete", { ids }).then((r) => r.data);

export const importPreview = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post<ImportPreviewResponse>("/guests/import/preview", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const importConfirm = (guests: ImportPreviewResponse["preview"]) =>
  api.post("/guests/import/confirm", { guests }).then((r) => r.data);

// ── Messages ─────────────────────────────────────────────────────────────────

export const mockSend = (guest_ids: number[], template: string) =>
  api
    .post<SendResponse>("/messages/send", { guest_ids, template })
    .then((r) => r.data);

// ── Stats ─────────────────────────────────────────────────────────────────────

export const fetchStats = () =>
  api.get<Stats>("/stats").then((r) => r.data);
