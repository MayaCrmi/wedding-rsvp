import axios from "axios";
import type {
  Guest,
  GuestFormData,
  ImportPreviewResponse,
  SendResponse,
  Stats,
  Task,
  TaskFormData,
  TasksSummary,
  Vendor,
  VendorFormData,
  VendorsSummary,
} from "../types";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
});

// ── Guests ────────────────────────────────────────────────────

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

// ── Messages ──────────────────────────────────────────────────

export const mockSend = (guest_ids: number[], template: string) =>
  api.post<SendResponse>("/messages/send", { guest_ids, template }).then((r) => r.data);

// ── Stats ─────────────────────────────────────────────────────

export const fetchStats = () =>
  api.get<Stats>("/stats").then((r) => r.data);

// ── Tasks ─────────────────────────────────────────────────────

export interface TaskFilters {
  completed?: number;
  category?: string;
}

export const fetchTasks = (filters?: TaskFilters) =>
  api.get<Task[]>("/tasks", { params: filters }).then((r) => r.data);

export const fetchTasksSummary = () =>
  api.get<TasksSummary>("/tasks/summary").then((r) => r.data);

export const createTask = (data: TaskFormData) =>
  api.post<Task>("/tasks", data).then((r) => r.data);

export const updateTask = (id: number, data: Partial<Task>) =>
  api.put<Task>(`/tasks/${id}`, data).then((r) => r.data);

export const deleteTask = (id: number) =>
  api.delete(`/tasks/${id}`).then((r) => r.data);

// ── Vendors ───────────────────────────────────────────────────

export const fetchVendors = (category?: string) =>
  api.get<Vendor[]>("/vendors", { params: category ? { category } : {} }).then((r) => r.data);

export const fetchVendorsSummary = () =>
  api.get<VendorsSummary>("/vendors/summary").then((r) => r.data);

export const createVendor = (data: VendorFormData) =>
  api.post<Vendor>("/vendors", data).then((r) => r.data);

export const updateVendor = (id: number, data: Partial<VendorFormData>) =>
  api.put<Vendor>(`/vendors/${id}`, data).then((r) => r.data);

export const deleteVendor = (id: number) =>
  api.delete(`/vendors/${id}`).then((r) => r.data);

export const uploadContract = (vendorId: number, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post<Vendor>(`/vendors/${vendorId}/contract`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const deleteContract = (vendorId: number) =>
  api.delete(`/vendors/${vendorId}/contract`).then((r) => r.data);

export const contractDownloadUrl = (vendorId: number) =>
  `http://localhost:5001/api/vendors/${vendorId}/contract`;
