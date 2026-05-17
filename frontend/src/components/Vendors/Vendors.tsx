import { useState, useEffect, useCallback, useRef } from "react";
import type { Vendor, VendorCategory, VendorFormData, VendorsSummary } from "../../types";
import { VENDOR_CATEGORY_LABELS, VENDOR_CATEGORY_ICONS } from "../../types";
import {
  fetchVendors, fetchVendorsSummary, createVendor, updateVendor,
  deleteVendor, uploadContract, deleteContract, contractDownloadUrl,
} from "../../api/client";
import VendorModal from "./VendorModal";

function formatCurrency(n: number | null): string {
  if (n == null) return "—";
  return `₪${n.toLocaleString("he-IL")}`;
}

function formatDate(s: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return s; }
}

const CATEGORIES: VendorCategory[] = [
  "photographer","videographer","venue","catering","florist",
  "music","hair_makeup","dress","cake","transportation","other",
];

interface VendorCardProps {
  vendor: Vendor;
  onEdit: () => void;
  onDelete: () => void;
  onContractUpload: (file: File) => void;
  onContractDelete: () => void;
}

function VendorCard({ vendor, onEdit, onDelete, onContractUpload, onContractDelete }: VendorCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isBooked = !!vendor.booking_date;
  const remaining = (vendor.price ?? 0) - (vendor.deposit_paid ? (vendor.deposit_amount ?? 0) : 0);

  return (
    <div className="vendor-card">
      <div className="vendor-card-top">
        <span className="vendor-cat-icon">{VENDOR_CATEGORY_ICONS[vendor.category]}</span>
        <div className="vendor-card-header">
          <span className="vendor-name">{vendor.business_name}</span>
          <span className={`badge ${isBooked ? "badge-attending" : "badge-pending"}`} style={{ fontSize: "0.7rem" }}>
            {isBooked ? "מוזמן ✓" : "בתהליך"}
          </span>
        </div>
        <div className="vendor-card-actions">
          <button className="btn btn-sm btn-outline" onClick={onEdit} title="עריכה">✏️</button>
          <button className="btn btn-sm btn-danger" onClick={onDelete} title="מחיקה">🗑️</button>
        </div>
      </div>

      <div className="vendor-card-body">
        {vendor.contact_name && (
          <div className="vendor-info-row">
            <span className="vendor-info-icon">👤</span>
            <span>{vendor.contact_name}</span>
          </div>
        )}
        {vendor.phone && (
          <div className="vendor-info-row">
            <span className="vendor-info-icon">📞</span>
            <span dir="ltr">{vendor.phone}</span>
          </div>
        )}
        {vendor.email && (
          <div className="vendor-info-row">
            <span className="vendor-info-icon">✉️</span>
            <a href={`mailto:${vendor.email}`} style={{ color: "var(--rose-gold)", textDecoration: "none" }} dir="ltr">
              {vendor.email}
            </a>
          </div>
        )}
        {vendor.website && (
          <div className="vendor-info-row">
            <span className="vendor-info-icon">🌐</span>
            <a href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
              target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--rose-gold)", textDecoration: "none" }} dir="ltr">
              {vendor.website}
            </a>
          </div>
        )}

        <div className="vendor-financials">
          <div className="vendor-fin-item">
            <span className="vendor-fin-label">מחיר</span>
            <span className="vendor-fin-value">{formatCurrency(vendor.price)}</span>
          </div>
          <div className="vendor-fin-item">
            <span className="vendor-fin-label">מקדמה</span>
            <span className="vendor-fin-value">
              {formatCurrency(vendor.deposit_amount)}
              {vendor.deposit_amount ? (
                vendor.deposit_paid
                  ? <span className="badge badge-attending" style={{ fontSize: "0.65rem", marginRight: 6 }}>שולמה ✓</span>
                  : <span className="badge badge-declined" style={{ fontSize: "0.65rem", marginRight: 6 }}>טרם שולמה</span>
              ) : null}
            </span>
          </div>
          {vendor.price && (
            <div className="vendor-fin-item">
              <span className="vendor-fin-label">יתרה לתשלום</span>
              <span className="vendor-fin-value" style={{ fontWeight: 700, color: remaining > 0 ? "var(--status-declined)" : "var(--status-attending)" }}>
                {formatCurrency(remaining)}
              </span>
            </div>
          )}
        </div>

        {(vendor.meeting_date || vendor.booking_date || vendor.event_date) && (
          <div className="vendor-dates">
            {vendor.meeting_date && (
              <span className="vendor-date-badge">📅 פגישה: {formatDate(vendor.meeting_date)}</span>
            )}
            {vendor.booking_date && (
              <span className="vendor-date-badge">✅ הוזמן: {formatDate(vendor.booking_date)}</span>
            )}
          </div>
        )}

        {vendor.notes && (
          <div className="vendor-notes">{vendor.notes}</div>
        )}

        {/* Contract */}
        <div className="vendor-contract">
          {vendor.contract_filename ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>📄 {vendor.contract_filename}</span>
              <a href={contractDownloadUrl(vendor.id)} target="_blank" rel="noopener noreferrer"
                className="btn btn-sm btn-outline">הורד חוזה</a>
              <button className="btn btn-sm btn-danger" onClick={onContractDelete}>הסר</button>
            </div>
          ) : (
            <div>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png"
                style={{ display: "none" }}
                onChange={(e) => { if (e.target.files?.[0]) onContractUpload(e.target.files[0]); }} />
              <button className="btn btn-sm btn-outline" onClick={() => fileRef.current?.click()}>
                📎 העלה חוזה
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [summary, setSummary] = useState<VendorsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<VendorCategory | "">("");
  const [editVendor, setEditVendor] = useState<Vendor | null | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vData, sData] = await Promise.all([
        fetchVendors(filterCategory || undefined),
        fetchVendorsSummary(),
      ]);
      setVendors(vData);
      setSummary(sData);
    } catch {
      setError("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: VendorFormData) => {
    if (editVendor) {
      await updateVendor(editVendor.id, data);
    } else {
      await createVendor(data);
    }
    await load();
  };

  const handleDelete = async (id: number) => {
    await deleteVendor(id);
    setDeleteConfirm(null);
    await load();
  };

  const handleContractUpload = async (vendor: Vendor, file: File) => {
    try {
      const updated = await uploadContract(vendor.id, file);
      setVendors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    } catch (e: any) {
      setError(e?.response?.data?.error || "שגיאה בהעלאת הקובץ");
    }
  };

  const handleContractDelete = async (vendor: Vendor) => {
    try {
      await deleteContract(vendor.id);
      setVendors((prev) => prev.map((v) =>
        v.id === vendor.id ? { ...v, contract_filename: null, contract_path: null } : v
      ));
    } catch {
      setError("שגיאה בהסרת החוזה");
    }
  };

  return (
    <div>
      <h2 className="page-title">🤝 ניהול ספקים</h2>

      {/* Summary strip */}
      {summary && (
        <div className="stat-cards" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card total">
            <span className="stat-value">{summary.total}</span>
            <span className="stat-label">סה״כ ספקים</span>
          </div>
          <div className="stat-card attending">
            <span className="stat-value">{summary.booked}</span>
            <span className="stat-label">מוזמנים</span>
          </div>
          <div className="stat-card people">
            <span className="stat-value">{formatCurrency(summary.total_budget)}</span>
            <span className="stat-label">תקציב כולל</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-value">{formatCurrency(summary.deposits_paid)}</span>
            <span className="stat-label">מקדמות ששולמו</span>
          </div>
          <div className="stat-card declined">
            <span className="stat-value">{formatCurrency(summary.deposits_outstanding)}</span>
            <span className="stat-label">מקדמות שנותרו</span>
          </div>
        </div>
      )}

      {/* Filters + add */}
      <div className="filters-bar" style={{ marginBottom: "1rem" }}>
        <select className="form-control" value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as VendorCategory | "")}>
          <option value="">כל הקטגוריות</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{VENDOR_CATEGORY_ICONS[c]} {VENDOR_CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      <div className="filters-actions">
        <button className="btn btn-primary" onClick={() => setEditVendor(null)}>
          ➕ הוסף ספק
        </button>
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginRight: "auto" }}>
          {loading ? "טוען..." : `${vendors.length} ספקים`}
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && vendors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤝</div>
          <p>אין ספקים עדיין</p>
          <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setEditVendor(null)}>
            הוסף ספק ראשון
          </button>
        </div>
      ) : (
        <div className="vendor-grid">
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onEdit={() => setEditVendor(vendor)}
              onDelete={() => setDeleteConfirm(vendor.id)}
              onContractUpload={(file) => handleContractUpload(vendor, file)}
              onContractDelete={() => handleContractDelete(vendor)}
            />
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm !== null && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🗑️ מחיקת ספק</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>
              האם למחוק את הספק? חוזה מצורף (אם קיים) יימחק גם הוא.
            </p>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>מחק</button>
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      {editVendor !== undefined && (
        <VendorModal
          vendor={editVendor}
          onSave={handleSave}
          onClose={() => setEditVendor(undefined)}
        />
      )}
    </div>
  );
}
