import { useState, useRef } from "react";
import type { ImportPreviewGuest } from "../../types";
import { importPreview, importConfirm } from "../../api/client";
import { SIDE_LABELS, GROUP_LABELS } from "../../types";

interface Props {
  onImported: () => void;
  onClose: () => void;
}

type Step = "upload" | "preview" | "done";

export default function ImportModal({ onImported, onClose }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewGuest[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [savedCount, setSavedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("בחר קובץ Excel"); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await importPreview(file);
      setPreview(result.preview);
      setParseErrors(result.errors);
      setSelected(new Set(result.preview.map((_, i) => i)));
      setStep("preview");
    } catch (e: any) {
      setError(e?.response?.data?.error || "שגיאה בניתוח הקובץ");
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (i: number) => {
    setSelected((s) => {
      const next = new Set(s);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === preview.length) setSelected(new Set());
    else setSelected(new Set(preview.map((_, i) => i)));
  };

  const handleConfirm = async () => {
    const chosen = preview.filter((_, i) => selected.has(i));
    if (!chosen.length) { setError("לא נבחרו שורות לייבוא"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await importConfirm(chosen);
      setSavedCount(res.inserted);
      setStep("done");
      onImported();
    } catch (e: any) {
      setError(e?.response?.data?.error || "שגיאה בשמירה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 820 }}>
        <div className="modal-header">
          <h3 className="modal-title">📂 ייבוא מוזמנים מאקסל</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div>
            <div className="alert alert-info" style={{ marginBottom: "1.25rem" }}>
              <div>
                <strong>פורמט הקובץ הנדרש:</strong> קובץ Excel (.xlsx) עם עמודות:<br />
                <code style={{ fontSize: "0.8rem", background: "#e0ecff", padding: "2px 6px", borderRadius: 4 }}>
                  שם | טלפון | מייל | צד (כלה/חתן) | קבוצה (משפחה/חברים/עבודה/אחר) | כמות אורחים | הערות
                </code>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">בחר קובץ Excel</label>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="form-control"
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
                {loading ? "מנתח..." : "נתח קובץ"}
              </button>
              <button className="btn btn-outline" onClick={onClose}>ביטול</button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div>
            {parseErrors.length > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: "1rem" }}>
                <div>
                  <strong>שגיאות בפרסור ({parseErrors.length}):</strong>
                  <ul style={{ marginTop: 4, paddingRight: 16, fontSize: "0.8rem" }}>
                    {parseErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              </div>
            )}
            <div style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                {preview.length} שורות נמצאו, {selected.size} נבחרו לייבוא
              </span>
              <button className="btn btn-sm btn-outline" onClick={toggleAll}>
                {selected.size === preview.length ? "בטל הכל" : "בחר הכל"}
              </button>
            </div>
            <div className="table-wrapper" style={{ maxHeight: 380, overflowY: "auto" }}>
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" className="checkbox-custom"
                        checked={selected.size === preview.length && preview.length > 0}
                        onChange={toggleAll} />
                    </th>
                    <th>שם</th>
                    <th>טלפון</th>
                    <th>צד</th>
                    <th>קבוצה</th>
                    <th>כמות</th>
                    <th>הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((g, i) => (
                    <tr key={i} style={{ opacity: selected.has(i) ? 1 : 0.45 }}>
                      <td>
                        <input type="checkbox" className="checkbox-custom"
                          checked={selected.has(i)}
                          onChange={() => toggleRow(i)} />
                      </td>
                      <td>{g.name}</td>
                      <td>
                        {g.phone_valid ? (
                          <span dir="ltr" style={{ fontSize: "0.82rem" }}>{g.phone}</span>
                        ) : (
                          <span className="phone-invalid">
                            ⚠️ <span dir="ltr">{g.phone || "—"}</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${g.side}`}>
                          {SIDE_LABELS[g.side]}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${g.grp}`}>
                          {GROUP_LABELS[g.grp]}
                        </span>
                      </td>
                      <td>{g.party_size}</td>
                      <td style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {g.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleConfirm} disabled={loading || selected.size === 0}>
                {loading ? "שומר..." : `ייבא ${selected.size} מוזמנים`}
              </button>
              <button className="btn btn-outline" onClick={() => { setStep("upload"); setPreview([]); }}>
                חזור
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>✅</div>
            <h4 style={{ color: "var(--deep)", marginBottom: "0.5rem" }}>הייבוא הושלם בהצלחה!</h4>
            <p style={{ color: "var(--text-muted)" }}>
              {savedCount} מוזמנים נוספו לרשימה
            </p>
            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: "1.25rem" }}>
              סגור
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
