import { useEffect, useState, useCallback } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { fetchStats } from "../../api/client";
import type { Stats } from "../../types";

const STATUS_COLORS = {
  attending:     "#6aaa85",
  pending:       "#d4a843",
  not_attending: "#c47272",
};

const GROUP_HE: Record<string, string> = {
  family:  "משפחה",
  friends: "חברים",
  work:    "עבודה",
  other:   "אחר",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const item = payload[0];
    return (
      <div style={{
        background: "white", border: "1px solid #e8d5c8",
        borderRadius: 8, padding: "8px 14px", fontSize: 13, direction: "rtl",
      }}>
        <strong style={{ color: "#5c3d2e" }}>{item.name}</strong>
        <br />
        <span>מוזמנים: {item.value}</span>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStats();
      setStats(data);
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

  if (error || !stats) return (
    <div className="alert alert-error">{error || "שגיאה לא ידועה"}</div>
  );

  const { totals, by_status, by_side, by_group } = stats;

  const responded = totals.attending_guests + totals.declined_guests;
  const responseRate = totals.total_guests > 0
    ? Math.round((responded / totals.total_guests) * 100)
    : 0;

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

  const groupBar = Object.entries(by_group).map(([grp, statuses]) => ({
    name:      GROUP_HE[grp] ?? grp,
    "מגיע":    statuses?.attending?.people     ?? 0,
    "ממתין":   statuses?.pending?.people       ?? 0,
    "לא מגיע": statuses?.not_attending?.people ?? 0,
  }));

  return (
    <div>
      <h2 className="page-title">📊 לוח בקרה</h2>

      <div className="stat-cards">
        <div className="stat-card total">
          <span className="stat-value">{totals.total_guests}</span>
          <span className="stat-label">סה״כ מוזמנים</span>
        </div>
        <div className="stat-card people">
          <span className="stat-value">{totals.total_people}</span>
          <span className="stat-label">סה״כ אנשים (כולל נלווים)</span>
        </div>
        <div className="stat-card attending">
          <span className="stat-value">{totals.attending_people}</span>
          <span className="stat-label">אנשים מגיעים</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-value">{totals.pending_guests}</span>
          <span className="stat-label">ממתינים לתשובה</span>
        </div>
        <div className="stat-card declined">
          <span className="stat-value">{totals.declined_guests}</span>
          <span className="stat-label">לא מגיעים</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span className="card-title" style={{ marginBottom: 0 }}>🕊️ אחוז מענה</span>
          <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--deep)" }}>
            {responseRate}%
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${responseRate}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span>ענו: {responded} מוזמנים</span>
          <span>נשלחו הזמנות: {totals.invited_count}</span>
          <span>מספרים לא תקינים: {totals.invalid_phones}</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-title">💌 פילוח לפי סטטוס</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 13, color: "var(--text)", direction: "rtl" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">🌸 כלה מול חתן (אנשים)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sideBar} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ direction: "rtl", fontSize: 13 }}
                cursor={{ fill: "rgba(201,149,108,0.1)" }}
              />
              <Legend formatter={(v) => <span style={{ fontSize: 13 }}>{v}</span>} />
              <Bar dataKey="מגיע"    fill="#6aaa85" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ממתין"   fill="#d4a843" radius={[4, 4, 0, 0]} />
              <Bar dataKey="לא מגיע" fill="#c47272" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-title">👥 פילוח לפי קבוצה (אנשים)</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={groupBar} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ direction: "rtl", fontSize: 13 }}
              cursor={{ fill: "rgba(201,149,108,0.1)" }}
            />
            <Legend formatter={(v) => <span style={{ fontSize: 13 }}>{v}</span>} />
            <Bar dataKey="מגיע"    fill="#6aaa85" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ממתין"   fill="#d4a843" radius={[4, 4, 0, 0]} />
            <Bar dataKey="לא מגיע" fill="#c47272" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <button onClick={load} className="btn btn-outline" style={{ marginTop: "1.25rem" }}>
        🔄 רענן נתונים
      </button>
    </div>
  );
}
