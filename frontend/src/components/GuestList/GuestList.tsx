import { useState, useEffect, useCallback } from "react";
import type { Guest, GuestFormData } from "../../types";
import { SIDE_LABELS, GROUP_LABELS, STATUS_LABELS } from "../../types";
import {
  fetchGuests, createGuest, updateGuest,
  deleteGuest, bulkDeleteGuests,
} from "../../api/client";
import GuestModal from "./GuestModal";
import ImportModal from "./ImportModal";

const EMPTY_FILTERS = { side: "", grp: "", status: "", search: "" };

function PhoneCell({ phone, valid }: { phone: string; valid: number }) {
  if (!phone) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  if (!valid) {
    return (
      <span className="phone-invalid" title="מספר לא תקין">
        ⚠️ <span dir="ltr">{phone}</span>
      </span>
    );
  }
  return <span dir="ltr" className="phone-valid">{phone}</span>;
}

export default function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editGuest, setEditGuest] = useState<Guest | null | undefined>(undefined);
  const [showImport, setShowImport] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters.side)   params.side   = filters.side;
      if (filters.grp)    params.grp    = filters.grp;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const data = await fetchGuests(params);
      setGuests(data);
    } catch {
      setError("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: GuestFormData) => {
    if (editGuest) {
      await updateGuest(editGuest.id, data);
    } else {
      await createGuest(data);
    }
    await load();
    setSelected(new Set());
  };

  const handleDelete = async (id: number) => {
    await deleteGuest(id);
    setDeleteConfirm(null);
    await load();
    setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    if (!window.confirm(`למחוק ${selected.size} מוזמנים?`)) return;
    await bulkDeleteGuests(Array.from(selected));
    setSelected(new Set());
    await load();
  };

  const toggleRow = (id: number) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === guests.length ? new Set() : new Set(guests.map((g) => g.id)));

  const setFilter = (key: keyof typeof EMPTY_FILTERS, val: string) =>
    setFilters((f) => ({ ...f, [key]: val }));

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      <h2 className="page-title">💌 רשימת מוזמנים</h2>

      {/* Filters */}
      <div className="filters-bar">
        <input
          className="form-control"
          placeholder="🔍 חיפוש לפי שם..."
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          style={{ minWidth: 180 }}
        />

        <select className="form-control" value={filters.side} onChange={(e) => setFilter("side", e.target.value)}>
          <option value="">כל הצדדים</option>
          {Object.entries(SIDE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <select className="form-control" value={filters.grp} onChange={(e) => setFilter("grp", e.target.value)}>
          <option value="">כל הקבוצות</option>
          {Object.entries(GROUP_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <select className="form-control" value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
          <option value="">כל הסטטוסים</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        {hasFilters && (
          <button className="btn btn-sm btn-outline" onClick={clearFilters}>✕ נקה פילטרים</button>
        )}
      </div>

      {/* Actions */}
      <div className="filters-actions">
        <button className="btn btn-primary" onClick={() => setEditGuest(null)}>
          + הוסף מוזמן
        </button>
        <button className="btn btn-outline" onClick={() => setShowImport(true)}>
          📂 ייבוא מאקסל
        </button>
        {selected.size > 0 && (
          <button className="btn btn-danger" onClick={handleBulkDelete}>
            🗑️ מחק נבחרים ({selected.size})
          </button>
        )}
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginRight: "auto" }}>
          {loading ? "טוען..." : `${guests.length} מוזמנים`}
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Table */}
      {!loading && guests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💌</div>
          <p>לא נמצאו מוזמנים{hasFilters ? " עם הפילטרים הנוכחיים" : ""}</p>
          {!hasFilters && (
            <button className="btn btn-primary" onClick={() => setEditGuest(null)} style={{ marginTop: "1rem" }}>
              הוסף מוזמן ראשון
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    checked={guests.length > 0 && selected.size === guests.length}
                    onChange={toggleAll}
                  />
                </th>
                <th>שם</th>
                <th>טלפון</th>
                <th>צד</th>
                <th>קבוצה</th>
                <th>אנשים</th>
                <th>סטטוס</th>
                <th>הערות</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id}>
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={selected.has(g.id)}
                      onChange={() => toggleRow(g.id)}
                    />
                  </td>
                  <td>
                    <strong>{g.name}</strong>
                    {g.invited_at && (
                      <span title="נשלחה הזמנה" style={{ marginRight: 4, fontSize: "0.75rem" }}>✉️</span>
                    )}
                  </td>
                  <td>
                    <PhoneCell phone={g.phone} valid={g.phone_valid} />
                  </td>
                  <td>
                    <span className={`badge badge-${g.side}`}>{SIDE_LABELS[g.side]}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${g.grp}`}>{GROUP_LABELS[g.grp]}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>{g.party_size}</td>
                  <td>
                    <span className={`badge badge-${g.rsvp_status === "attending" ? "attending" : g.rsvp_status === "not_attending" ? "declined" : "pending"}`}>
                      {STATUS_LABELS[g.rsvp_status]}
                    </span>
                  </td>
                  <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span title={g.notes || ""}>{g.notes || "—"}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => setEditGuest(g)}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(g.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm !== null && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🗑️ מחיקת מוזמן</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>
              האם למחוק את המוזמן הזה? הפעולה לא ניתנת לביטול.
            </p>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>מחק</button>
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Guest modal */}
      {editGuest !== undefined && (
        <GuestModal
          guest={editGuest}
          onSave={handleSave}
          onClose={() => setEditGuest(undefined)}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onImported={load}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
