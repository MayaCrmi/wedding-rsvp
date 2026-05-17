import { useState, useEffect } from "react";
import type { Vendor, VendorCategory, VendorFormData } from "../../types";
import { VENDOR_CATEGORY_LABELS } from "../../types";

interface Props {
  vendor?: Vendor | null;
  onSave: (data: VendorFormData) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES: VendorCategory[] = [
  "photographer","videographer","venue","catering","florist",
  "music","hair_makeup","dress","cake","transportation","other",
];

const DEFAULT: VendorFormData = {
  category: "other", business_name: "", contact_name: "",
  phone: "", email: "", website: "",
  price: null, deposit_amount: null, deposit_paid: 0,
  booking_date: null, meeting_date: null, event_date: null, notes: "",
};

export default function VendorModal({ vendor, onSave, onClose }: Props) {
  const [form, setForm] = useState<VendorFormData>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vendor) {
      setForm({
        category:      vendor.category,
        business_name: vendor.business_name,
        contact_name:  vendor.contact_name || "",
        phone:         vendor.phone || "",
        email:         vendor.email || "",
        website:       vendor.website || "",
        price:         vendor.price,
        deposit_amount: vendor.deposit_amount,
        deposit_paid:  vendor.deposit_paid,
        booking_date:  vendor.booking_date || null,
        meeting_date:  vendor.meeting_date || null,
        event_date:    vendor.event_date || null,
        notes:         vendor.notes || "",
      });
    } else {
      setForm(DEFAULT);
    }
  }, [vendor]);

  const set = (key: keyof VendorFormData, value: string | number | null) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name.trim()) { setError("שם העסק חובה"); return; }
    setSaving(true); setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {vendor ? "✏️ עריכת ספק" : "➕ ספק חדש"}
          </h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Section: basic info */}
          <p className="vendor-section-title">פרטי ספק</p>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">קטגוריה</label>
              <select className="form-control" value={form.category}
                onChange={(e) => set("category", e.target.value as VendorCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{VENDOR_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">שם העסק *</label>
              <input className="form-control" value={form.business_name}
                onChange={(e) => set("business_name", e.target.value)}
                placeholder="שם החברה / הספק" required />
            </div>

            <div className="form-group">
              <label className="form-label">שם איש קשר</label>
              <input className="form-control" value={form.contact_name}
                onChange={(e) => set("contact_name", e.target.value)}
                placeholder="שם מלא" />
            </div>

            <div className="form-group">
              <label className="form-label">טלפון</label>
              <input className="form-control" value={form.phone} dir="ltr"
                onChange={(e) => set("phone", e.target.value)}
                placeholder="05X-XXXXXXX" />
            </div>

            <div className="form-group">
              <label className="form-label">אימייל</label>
              <input className="form-control" value={form.email} dir="ltr" type="email"
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com" />
            </div>

            <div className="form-group">
              <label className="form-label">אתר אינטרנט</label>
              <input className="form-control" value={form.website} dir="ltr"
                onChange={(e) => set("website", e.target.value)}
                placeholder="www.example.com" />
            </div>
          </div>

          {/* Section: financials */}
          <p className="vendor-section-title">תשלומים</p>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">מחיר כולל (₪)</label>
              <input className="form-control" type="number" min={0} dir="ltr"
                value={form.price ?? ""}
                onChange={(e) => set("price", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0" />
            </div>

            <div className="form-group">
              <label className="form-label">סכום מקדמה (₪)</label>
              <input className="form-control" type="number" min={0} dir="ltr"
                value={form.deposit_amount ?? ""}
                onChange={(e) => set("deposit_amount", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0" />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" className="checkbox-custom"
                  checked={!!form.deposit_paid}
                  onChange={(e) => set("deposit_paid", e.target.checked ? 1 : 0)} />
                <span className="form-label" style={{ margin: 0 }}>מקדמה שולמה</span>
              </label>
            </div>
          </div>

          {/* Section: dates */}
          <p className="vendor-section-title">תאריכים</p>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">תאריך הזמנה</label>
              <input className="form-control" type="date" dir="ltr"
                value={form.booking_date || ""}
                onChange={(e) => set("booking_date", e.target.value || null)} />
            </div>

            <div className="form-group">
              <label className="form-label">תאריך פגישה</label>
              <input className="form-control" type="date" dir="ltr"
                value={form.meeting_date || ""}
                onChange={(e) => set("meeting_date", e.target.value || null)} />
            </div>

            <div className="form-group">
              <label className="form-label">תאריך האירוע</label>
              <input className="form-control" type="date" dir="ltr"
                value={form.event_date || ""}
                onChange={(e) => set("event_date", e.target.value || null)} />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">הערות</label>
            <textarea className="form-control" rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="פרטים נוספים, תנאים, הסכמות..." />
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "שומר..." : vendor ? "שמור שינויים" : "הוסף ספק"}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}
