import { useState, useEffect, useCallback } from "react";
import type { Guest, SendResult } from "../../types";
import { SIDE_LABELS, GROUP_LABELS, STATUS_LABELS } from "../../types";
import { fetchGuests, mockSend } from "../../api/client";

const DEFAULT_TEMPLATE =
  "שלום {שם} 😊\n\nאנו שמחים להזמין אתכם לחתונה שלנו!\n\nנשמח לדעת האם תוכלו להגיע.\n\nאנא ענו בהקדם 🌸";

type SendStatus = "idle" | "sending" | "done";

interface GuestSendState {
  guest: Guest;
  status: "waiting" | "sending" | "success" | "failed";
  message: string;
}

export default function SendInvites() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [filterSide, setFilterSide] = useState("");
  const [filterGrp, setFilterGrp] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendStates, setSendStates] = useState<GuestSendState[]>([]);
  const [summary, setSummary] = useState<{ success: number; failed: number } | null>(null);

  const loadGuests = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterSide)   params.side   = filterSide;
      if (filterGrp)    params.grp    = filterGrp;
      if (filterStatus) params.status = filterStatus;
      const data = await fetchGuests(params);
      setGuests(data);
      setSelected(new Set(data.map((g) => g.id)));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [filterSide, filterGrp, filterStatus]);

  useEffect(() => { loadGuests(); }, [loadGuests]);

  const toggleGuest = (id: number) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === guests.length ? new Set() : new Set(guests.map((g) => g.id)));

  const handleSend = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;

    // Build initial states — all "sending" sequentially animated
    const initial: GuestSendState[] = guests
      .filter((g) => selected.has(g.id))
      .map((g) => ({ guest: g, status: "waiting", message: "ממתין לשליחה..." }));

    setSendStates(initial);
    setSendStatus("sending");
    setSummary(null);

    // Animate each guest with a small delay
    for (let i = 0; i < initial.length; i++) {
      await new Promise((res) => setTimeout(res, 220));
      setSendStates((prev) =>
        prev.map((s, idx) => idx === i ? { ...s, status: "sending", message: "שולח..." } : s)
      );
    }

    // One real API call
    try {
      const result = await mockSend(ids, template);

      const resultMap = new Map<number, SendResult>(result.results.map((r) => [r.id, r]));

      await new Promise((res) => setTimeout(res, 400));

      setSendStates((prev) =>
        prev.map((s) => {
          const r = resultMap.get(s.guest.id);
          if (!r) return s;
          return {
            ...s,
            status: r.status === "success" ? "success" : "failed",
            message: r.message,
          };
        })
      );

      setSummary({ success: result.success_count, failed: result.failed_count });
    } catch {
      setSendStates((prev) =>
        prev.map((s) => ({ ...s, status: "failed", message: "שגיאת שרת" }))
      );
      setSummary({ success: 0, failed: initial.length });
    }

    setSendStatus("done");
  };

  const resetSend = () => {
    setSendStatus("idle");
    setSendStates([]);
    setSummary(null);
    loadGuests();
  };

  const selectedGuests = guests.filter((g) => selected.has(g.id));
  const invalidCount = selectedGuests.filter((g) => !g.phone_valid).length;

  return (
    <div>
      <h2 className="page-title">✉️ שליחת הזמנות</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Left: Template */}
        <div>
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <div className="card-title">📝 תבנית הודעה</div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ marginBottom: 6 }}>
                השתמש ב-<code style={{ background: "var(--rose-gold-pale)", padding: "1px 6px", borderRadius: 4 }}>{"{שם}"}</code> להוספת שם המוזמן
              </label>
              <textarea
                className="form-control"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={8}
                style={{ fontFamily: "var(--font-body)", lineHeight: 1.7 }}
              />
            </div>
            {selectedGuests.length > 0 && (
              <div style={{ marginTop: "0.75rem", padding: "0.65rem 0.85rem", background: "var(--rose-gold-pale)", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--deep)" }}>תצוגה מקדימה עבור {selectedGuests[0].name}:</strong>
                <br />
                <span style={{ whiteSpace: "pre-wrap" }}>
                  {template.replace("{שם}", selectedGuests[0].name)}
                </span>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="card">
            <div className="card-title">🔍 סינון נמענים</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">צד</label>
                <select className="form-control" value={filterSide} onChange={(e) => setFilterSide(e.target.value)}>
                  <option value="">הכל</option>
                  {Object.entries(SIDE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">קבוצה</label>
                <select className="form-control" value={filterGrp} onChange={(e) => setFilterGrp(e.target.value)}>
                  <option value="">הכל</option>
                  {Object.entries(GROUP_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">סטטוס RSVP</label>
                <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">הכל</option>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Guest list + Send */}
        <div>
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div className="card-title" style={{ marginBottom: 0 }}>
                👥 נמענים ({selected.size})
              </div>
              <button className="btn btn-sm btn-outline" onClick={toggleAll}>
                {selected.size === guests.length ? "בטל הכל" : "בחר הכל"}
              </button>
            </div>

            {invalidCount > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: "0.75rem" }}>
                ⚠️ {invalidCount} מוזמנים עם מספר לא תקין — ההודעה תכשל עבורם
              </div>
            )}

            {loading ? (
              <div className="empty-state" style={{ padding: "1.5rem" }}>
                <div className="spinner" style={{ width: 28, height: 28, margin: "0 auto" }} />
              </div>
            ) : guests.length === 0 ? (
              <div className="empty-state" style={{ padding: "1rem" }}>
                <p>אין מוזמנים עם הפילטר הנוכחי</p>
              </div>
            ) : (
              <div className="scroll-area">
                {guests.map((g) => (
                  <label
                    key={g.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "0.55rem 0.4rem",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      transition: "background 0.12s",
                      background: selected.has(g.id) ? "var(--rose-gold-pale)" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={selected.has(g.id)}
                      onChange={() => toggleGuest(g.id)}
                    />
                    <span style={{ flex: 1, fontWeight: 500 }}>{g.name}</span>
                    {!g.phone_valid && (
                      <span title={`מספר לא תקין: ${g.phone || "חסר"}`} style={{ fontSize: "0.8rem", color: "var(--status-declined)" }}>
                        ⚠️
                      </span>
                    )}
                    <span className={`badge badge-${g.side}`} style={{ fontSize: "0.7rem" }}>
                      {SIDE_LABELS[g.side]}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Send button / results */}
          {sendStatus === "idle" && (
            <button
              className="btn btn-rose"
              style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", justifyContent: "center" }}
              disabled={selected.size === 0 || !template.trim()}
              onClick={handleSend}
            >
              💌 שלח הזמנות ל-{selected.size} מוזמנים
            </button>
          )}

          {(sendStatus === "sending" || sendStatus === "done") && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div className="card-title" style={{ marginBottom: 0 }}>
                  {sendStatus === "sending" ? "⏳ שולח..." : "📬 תוצאות שליחה"}
                </div>
                {sendStatus === "done" && (
                  <button className="btn btn-sm btn-outline" onClick={resetSend}>שלח שוב</button>
                )}
              </div>

              {summary && (
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <span className="badge badge-attending">✅ הצליח: {summary.success}</span>
                  {summary.failed > 0 && (
                    <span className="badge badge-declined">❌ נכשל: {summary.failed}</span>
                  )}
                </div>
              )}

              <div className="scroll-area">
                {sendStates.map((s, i) => (
                  <div
                    key={i}
                    className={`send-result-item ${s.status === "waiting" ? "sending" : s.status}`}
                  >
                    {s.status === "sending" || s.status === "waiting" ? (
                      <div className="spinner" />
                    ) : s.status === "success" ? (
                      <span>✅</span>
                    ) : (
                      <span>❌</span>
                    )}
                    <span style={{ flex: 1, fontWeight: 500 }}>{s.guest.name}</span>
                    <span style={{ fontSize: "0.78rem", color: "inherit", opacity: 0.8 }}>{s.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
