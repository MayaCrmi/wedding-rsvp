import { useState } from "react";
import Dashboard from "./components/Dashboard/Dashboard";
import GuestList from "./components/GuestList/GuestList";
import SendInvites from "./components/SendInvites/SendInvites";
import Responses from "./components/Responses/Responses";
import Tasks from "./components/Tasks/Tasks";
import Vendors from "./components/Vendors/Vendors";
import "./styles/global.css";

type MainTab = "dashboard" | "vendors" | "tasks" | "rsvp";
type RsvpSubTab = "guests" | "send" | "responses";

const MAIN_TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: "dashboard", label: "לוח בקרה", icon: "🏠" },
  { id: "vendors",   label: "ספקים",    icon: "🤝" },
  { id: "tasks",     label: "משימות",   icon: "📋" },
  { id: "rsvp",      label: "RSVP",     icon: "💌" },
];

const RSVP_SUB_TABS: { id: RsvpSubTab; label: string; icon: string }[] = [
  { id: "guests",    label: "רשימת מוזמנים",  icon: "👥" },
  { id: "send",      label: "שליחת הזמנות",   icon: "✉️" },
  { id: "responses", label: "תגובות",          icon: "✅" },
];

export default function App() {
  const [activeMain, setActiveMain] = useState<MainTab>("dashboard");
  const [activeRsvp, setActiveRsvp] = useState<RsvpSubTab>("guests");

  const navigateToRsvp = (sub: RsvpSubTab) => {
    setActiveMain("rsvp");
    setActiveRsvp(sub);
  };

  return (
    <div className="page-wrapper">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-logo">Down the Aisle</span>
          <span className="header-tagline">כל מה שצריך לתכנן את החתונה שלכם</span>
        </div>
        <span className="header-flowers">🌸 🌿 🌸</span>
      </header>

      {/* Main tab bar */}
      <nav className="tab-nav">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeMain === tab.id ? " active" : ""}`}
            onClick={() => setActiveMain(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* RSVP sub-tab bar — only visible when RSVP is active */}
      {activeMain === "rsvp" && (
        <nav className="sub-tab-nav">
          {RSVP_SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`sub-tab-btn${activeRsvp === tab.id ? " active" : ""}`}
              onClick={() => setActiveRsvp(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      )}

      <main className="tab-content">
        {activeMain === "dashboard" && (
          <Dashboard onNavigate={(sub) => navigateToRsvp(sub as RsvpSubTab)} />
        )}
        {activeMain === "vendors" && <Vendors />}
        {activeMain === "tasks"   && <Tasks />}
        {activeMain === "rsvp" && (
          <>
            {activeRsvp === "guests"    && <GuestList />}
            {activeRsvp === "send"      && <SendInvites />}
            {activeRsvp === "responses" && <Responses />}
          </>
        )}
      </main>
    </div>
  );
}
