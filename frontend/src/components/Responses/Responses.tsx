import { useState, useEffect, useCallback } from "react";
import type { Guest, RsvpStatus } from "../../types";
import { SIDE_LABELS, GROUP_LABELS, STATUS_LABELS } from "../../types";
import { fetchGuests } from "../../api/client";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("he-IL", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function exportCSV(guests: Guest[]) {
  const header = ["שם", "טלפון", "צד", "קבוצה", "מספר אנשים", "סטטוס", "תאריך תגובה", "הערות"];
  const rows = guests.map((g) => [
    g.name,
    g.phone || "",
    SIDE_LABELS[g.side],
    GROUP_LABELS[g.grp],
    String(g.party_size),
    STATUS_LABELS[g.rsvp_status],
    formatDate(g.responded_at),
    g.notes || "",
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rsvp-responses.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Responses() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSide, setFilterSide] = useState("");
  const [filterGrp, setFilterGrp] = useState("");
  const [filterStatus, setFilterStatus] = useState<RsvpStatus | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filterSide)   params.side   = filterSide;
      if (filterGrp)    params.grp    = filterGrp;
      if (filterStatus) params.status = filterStatus;
      const data = await fetchGuests(params);
      setGuests(data);
    } catch {
      setError("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  }, [filterSide, filterGrp, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const attending   = guests.filter((g) => g.rsvp_status === "attending");
  const notAttending = guests.filter((g) => g.rsvp_status === "not_attending");

  const totalAttendingPeople = attending.reduce((sum, g) => sum + g.party_size, 0);

  const displayed = filterStatus
    ? guests.filter((g) => g.rsvp_status === filterStatus)
    : guests;

  return (
    <div>
      <h2 className="page-title">✅ תגובות</h2>

      {/* Summary */}
      <div className="stat-cards" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card attending">
          <span className="stat-value">{attending.length}</span>
          <span className="stat-label">מגיעים (משפחות)</span>
        </div>
        <div className="stat-card people">
          <span className="stat-value">{totalAttendingPeople}</span>
          <span className="stat-label">אנשים מגיעים</span>
        </div>
        <div className="stat-card declined">
          <span className="stat-value">{notAttending.length}</span>
          <span className="stat-label">לא מגיעים</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-value">{guests.filter((g) => g.rsvp_status === "pending").length}</span>
          <span className="stat-label">ממתינים</span>
        </div>
      </div>

      {/* Filters + export */}
      <div className="filters-bar" style={{ marginBottom: "1rem" }}>
        <select className="form-control" value={filterSide} onChange={(e) => setFilterSide(e.target.value)}>
          <option value="">כל הצדדים</option>
          {Object.entries(SIDE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <select className="form-control" value={filterGrp} onChange={(e) => setFilterGrp(e.target.value)}>
          <option value="">כל הקבוצות</option>
          {Object.entries(GROUP_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as RsvpStatus | "")}>
          <option value="">כל הסטטוסים</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <button
          className="btn btn-outline"
          onClick={() => exportCSV(displayed)}
          disabled={displayed.length === 0}
          style={{ marginRight: "auto" }}
        >
          📥 ייצוא CSV
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ width: 36, height: 36, margin: "0 auto 12px" }} />
          <p>טוען...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>אין תגובות עם הפילטרים הנוכחיים</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>שם</th>
                <th>טלפון</th>
                <th>צד</th>
                <th>קבוצה</th>
                <th>מספר אנשים</th>
                <th>סטטוס</th>
                <th>תאריך תגובה</th>
                <th>הערות</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((g) => (
                <tr key={g.id}>
                  <td><strong>{g.name}</strong></td>
                  <td>
                    {g.phone ? (
                      g.phone_valid ? (
                        <span dir="ltr" style={{ fontSize: "0.85rem" }}>{g.phone}</span>
                      ) : (
                        <span className="phone-invalid" title="מספר לא תקין">
                          ⚠️ <span dir="ltr">{g.phone}</span>
                        </span>
                      )
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${g.side}`}>{SIDE_LABELS[g.side]}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${g.grp}`}>{GROUP_LABELS[g.grp]}</span>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{g.party_size}</td>
                  <td>
                    <span className={`badge ${
                      g.rsvp_status === "attending"     ? "badge-attending" :
                      g.rsvp_status === "not_attending" ? "badge-declined"  : "badge-pending"
                    }`}>
                      {STATUS_LABELS[g.rsvp_status]}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>
                    {formatDate(g.responded_at)}
                  </td>
                  <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span title={g.notes || ""}>{g.notes || "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: "0.75rem", fontSize: "0.83rem", color: "var(--text-muted)", textAlign: "left" }}>
        מציג {displayed.length} מוזמנים
      </div>
    </div>
  );
}
