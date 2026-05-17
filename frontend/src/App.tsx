import { useState } from "react";
import Dashboard from "./components/Dashboard/Dashboard";
import GuestList from "./components/GuestList/GuestList";
import SendInvites from "./components/SendInvites/SendInvites";
import Responses from "./components/Responses/Responses";
import Tasks from "./components/Tasks/Tasks";
import Vendors from "./components/Vendors/Vendors";
import "./styles/global.css";

type Tab = "dashboard" | "guests" | "send" | "responses" | "tasks" | "vendors";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard",  label: "לוח בקרה",        icon: "🏠" },
  { id: "guests",     label: "רשימת מוזמנים",   icon: "💌" },
  { id: "send",       label: "שליחת הזמנות",     icon: "✉️" },
  { id: "responses",  label: "תגובות",           icon: "✅" },
  { id: "tasks",      label: "משימות",            icon: "📋" },
  { id: "vendors",    label: "ספקים",             icon: "🤝" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="page-wrapper">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-logo">Down the Aisle</span>
          <span className="header-tagline">כל מה שצריך לתכנן את החתונה שלכם</span>
        </div>
        <span className="header-flowers">🌸 🌿 🌸</span>
      </header>

      <nav className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="tab-content">
        {activeTab === "dashboard"  && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === "guests"     && <GuestList />}
        {activeTab === "send"       && <SendInvites />}
        {activeTab === "responses"  && <Responses />}
        {activeTab === "tasks"      && <Tasks />}
        {activeTab === "vendors"    && <Vendors />}
      </main>
    </div>
  );
}
