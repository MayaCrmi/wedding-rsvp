import { useState, useEffect } from "react";
import type { Guest, GuestFormData, Side, Group, RsvpStatus } from "../../types";
import { SIDE_LABELS, GROUP_LABELS, STATUS_LABELS } from "../../types";

interface Props {
  guest?: Guest | null;
  onSave: (data: GuestFormData) => Promise<void>;
  onClose: () => void;
}

const DEFAULT_FORM: GuestFormData = {
  name: "",
  phone: "",
  email: "",
  side: "bride",
  grp: "family",
  party_size: 1,
  notes: "",
  rsvp_status: "pending",
};

export default function GuestModal({ guest, onSave, onClose }: Props) {
  const [form, setForm] = useState<GuestFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (guest) {
      setForm({
        name:        guest.name,
        phone:       guest.phone || "",
        email:       guest.email || "",
        side:        guest.side,
        grp:         guest.grp,
        party_size:  guest.party_size,
        notes:       guest.notes || "",
        rsvp_status: guest.rsvp_status,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [guest]);

  const set = (key: keyof GuestFormData, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("שם חובה"); return; }
    setSaving(true);
    setError(null);
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
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">
            {guest ? "✏️ עריכת מוזמן" : "✨ הוספת מוזמן חדש"}
          </h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">שם מלא *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="ישראל ישראלי"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">טלפון</label>
              <input
                className="form-control"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="05X-XXXXXXX"
                dir="ltr"
              />
            </div>

            <div className="form-group">
              <label className="form-label">אימייל</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="example@gmail.com"
                dir="ltr"
              />
            </div>

            <div className="form-group">
              <label className="form-label">צד</label>
              <select
                className="form-control"
                value={form.side}
                onChange={(e) => set("side", e.target.value as Side)}
              >
                {(Object.entries(SIDE_LABELS) as [Side, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">קבוצה</label>
              <select
                className="form-control"
                value={form.grp}
                onChange={(e) => set("grp", e.target.value as Group)}
              >
                {(Object.entries(GROUP_LABELS) as [Group, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">מספר אנשים</label>
              <input
                className="form-control"
                type="number"
                min={1}
                max={20}
                value={form.party_size}
                onChange={(e) => set("party_size", parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">סטטוס RSVP</label>
              <select
                className="form-control"
                value={form.rsvp_status}
                onChange={(e) => set("rsvp_status", e.target.value as RsvpStatus)}
              >
                {(Object.entries(STATUS_LABELS) as [RsvpStatus, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">הערות (מגבלות תזונה, נגישות וכו׳)</label>
              <textarea
                className="form-control"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="לדוגמה: צמחוני, אלרגיה לבוטנים, נכה..."
                rows={2}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "שומר..." : guest ? "שמור שינויים" : "הוסף מוזמן"}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
