import { useEffect, useState, useCallback } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { fetchStats, fetchTasksSummary, fetchVendorsSummary } from "../../api/client";
import type { Stats, TasksSummary, VendorsSummary } from "../../types";
import { TASK_CATEGORY_ICONS, TASK_CATEGORY_LABELS } from "../../types";

type RsvpSubTab = "dashboard" | "guests" | "send" | "responses";

interface Props {
  onNavigate: (tab: RsvpSubTab) => void;
}

const STATUS_COLORS = {
  attending:     "#6aaa85",
  pending:       "#d4a843",
  not_attending: "#c47272",
};

function formatCurrency(n: number): string {
  return `₪${n.toLocaleString("he-IL")}`;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "white", border: "1px solid #e8d5c8", borderRadius: 8, padding: "8px 14px", fontSize: 13, direction: "rtl" }}>
        <strong style={{ color: "#5c3d2e" }}>{payload[0].name}</strong><br />
        <span>מוזמנים: {payload[0].value}</span>
      </div>
    );
  }
  return null;
};

export default function Dashboard({ onNavigate }: Props) {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [tasks, setTasks]     = useState<TasksSummary | null>(null);
  const [vendors, setVendors] = useState<VendorsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [s, t, v] = await Promise.all([
        fetchStats(), fetchTasksSummary(), fetchVendorsSummary(),
      ]);
      setStats(s); setTasks(t); setVendors(v);
    } catch {
      setError("שגיאה בטעינת הנתונים. ודא שהשרת פועל.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="empty-state">
      <div className="spinner" style={{ width: 36, height: 36, margin: "0 auto 12px" }} />
      <p>טוען נתונים...</p>
    </div>
  );

  if (error) return <div className="alert alert-error">{error}</div>;

  const { totals, by_status, by_side } = stats!;
  const responded   = totals.attending_guests + totals.declined_guests;
  const responseRate = totals.total_guests > 0
    ? Math.round((responded / totals.total_guests) * 100) : 0;
  const taskPct = tasks && tasks.total > 0
    ? Math.round((tasks.done / tasks.total) * 100) : 0;

  const pieData = [
    { name: "מגיע/ה",    value: by_status.attending?.count     ?? 0, color: STATUS_COLORS.attending },
    { name: "ממתין",      value: by_status.pending?.count       ?? 0, color: STATUS_COLORS.pending },
    { name: "לא מגיע/ה", value: by_status.not_attending?.count ?? 0, color: STATUS_COLORS.not_attending },
  ].filter((d) => d.value > 0);

  const sideBar = [
    {
      name: "כלה",
      "מגיע":    by_side.bride?.attending?.people     ?? 0,
      "ממתין":   by_side.bride?.pending?.people       ?? 0,
      "לא מגיע": by_side.bride?.not_attending?.people ?? 0,
    },
    {
      name: "חתן",
      "מגיע":    by_side.groom?.attending?.people     ?? 0,
      "ממתין":   by_side.groom?.pending?.people       ?? 0,
      "לא מגיע": by_side.groom?.not_attending?.people ?? 0,
    },
  ];

  return (
    <div>
      <h2 className="page-title">🏠 לוח בקרה</h2>

      {/* ── Three hub cards ──────────────────────────────────── */}
      <div className="hub-grid">

        {/* RSVP hub */}
        <div className="hub-card" onClick={() => onNavigate("guests")}>
          <div className="hub-card-icon">💌</div>
          <div className="hub-card-content">
            <div className="hub-card-title">מוזמנים</div>
            <div className="hub-card-stats">
              <span><strong>{totals.attending_people}</strong> מגיעים</span>
              <span><strong>{totals.pending_guests}</strong> ממתינים</span>
              <span><strong>{totals.total_guests}</strong> סה״כ</span>
            </div>
            <div className="progress-track" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${responseRate}%` }} />
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
              {responseRate}% ענו
            </div>
          </div>
          <div className="hub-card-arrow">←</div>
        </div>

        {/* Tasks hub — informational only, navigation via main tabs */}
        <div className="hub-card" style={{ cursor: "default" }}>
          <div className="hub-card-icon">📋</div>
          <div className="hub-card-content">
            <div className="hub-card-title">משימות</div>
            <div className="hub-card-stats">
              <span><strong>{tasks?.done ?? 0}</strong> הושלמו</span>
              <span><strong>{tasks?.remaining ?? 0}</strong> נותרו</span>
              <span><strong>{tasks?.total ?? 0}</strong> סה״כ</span>
            </div>
            <div className="progress-track" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${taskPct}%`, background: "linear-gradient(90deg,#6aaa85,#3d8f65)" }} />
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
              {taskPct}% הושלמו
            </div>
          </div>
        </div>

        {/* Vendors hub — informational only, navigation via main tabs */}
        <div className="hub-card" style={{ cursor: "default" }}>
          <div className="hub-card-icon">🤝</div>
          <div className="hub-card-content">
            <div className="hub-card-title">ספקים</div>
            <div className="hub-card-stats">
              <span><strong>{vendors?.booked ?? 0}</strong> מוזמנים</span>
              <span><strong>{vendors?.total ?? 0}</strong> סה״כ</span>
              <span>{formatCurrency(vendors?.total_budget ?? 0)} תקציב</span>
            </div>
            <div style={{ marginTop: 8, fontSize: "0.8rem" }}>
              {(vendors?.deposits_outstanding ?? 0) > 0 ? (
                <span className="badge badge-pending" style={{ fontSize: "0.72rem" }}>
                  {formatCurrency(vendors!.deposits_outstanding)} מקדמות שנותרו
                </span>
              ) : (
                <span className="badge badge-attending" style={{ fontSize: "0.72rem" }}>
                  כל המקדמות שולמו ✓
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Upcoming tasks ────────────────────────────────────── */}
      {tasks && tasks.upcoming.length > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-title">⏰ המשימות הדחופות הבאות</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks.upcoming.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.5rem 0.75rem", background: "var(--rose-gold-pale)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "1.2rem" }}>{TASK_CATEGORY_ICONS[t.category]}</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{t.title}</span>
                <span className={`badge ${t.priority === "high" ? "badge-declined" : t.priority === "medium" ? "badge-pending" : "badge-family"}`} style={{ fontSize: "0.7rem" }}>
                  {t.priority === "high" ? "דחוף" : t.priority === "medium" ? "בינוני" : "נמוך"}
                </span>
                <span className="badge badge-other" style={{ fontSize: "0.7rem" }}>
                  {TASK_CATEGORY_LABELS[t.category]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RSVP charts ──────────────────────────────────────── */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-title">💌 פילוח לפי סטטוס</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ fontSize: 13, color: "var(--text)" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">🌸 כלה מול חתן (אנשים)</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sideBar} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ direction: "rtl", fontSize: 13 }} cursor={{ fill: "rgba(201,149,108,0.1)" }} />
              <Legend formatter={(v) => <span style={{ fontSize: 13 }}>{v}</span>} />
              <Bar dataKey="מגיע"    fill="#6aaa85" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ממתין"   fill="#d4a843" radius={[4, 4, 0, 0]} />
              <Bar dataKey="לא מגיע" fill="#c47272" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <button onClick={load} className="btn btn-outline" style={{ marginTop: "1.25rem" }}>
        🔄 רענן נתונים
      </button>
    </div>
  );
}
