"use client";
import { useState } from "react";
import {
  BarChart3, Package, Users, Cpu, Tag, Webhook,
} from "lucide-react";
import OverviewTab from "./tabs/OverviewTab";
import PlansTab from "./tabs/PlansTab";
import SubscribersTab from "./tabs/SubscribersTab";
import UsageTab from "./tabs/UsageTab";
import CouponsTab from "./tabs/CouponsTab";
import WebhooksTab from "./tabs/WebhooksTab";

const TABS = [
  { key: "overview",    label: "Overview",    icon: BarChart3 },
  { key: "plans",       label: "Plans",       icon: Package },
  { key: "subscribers", label: "Subscribers", icon: Users },
  { key: "usage",       label: "AI Usage",    icon: Cpu },
  { key: "coupons",     label: "Coupons",     icon: Tag },
  { key: "webhooks",    label: "Webhooks",    icon: Webhook },
];

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-4 lg:space-y-6 animate-scale-in">
      {/* Page Header */}
      <div className="flex items-center gap-2.5 lg:gap-3">
        <div
          className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset-sm)" }}
        >
          <Package className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: "var(--brand-orange)" }} />
        </div>
        <div>
          <h1 className="text-lg lg:text-2xl font-black tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
            Subscription Management
          </h1>
          <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--brand-orange)", opacity: 0.7 }}>
            Revenue · Plans · Subscribers · AI Credits
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav
        className="flex items-center gap-1 p-1 lg:p-1.5 rounded-xl lg:rounded-2xl overflow-x-auto"
        style={{
          background: "var(--neu-base)",
          boxShadow: "var(--shadow-inset)",
          border: "var(--card-border)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-5 py-2 lg:py-2.5 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap shrink-0"
              style={
                isActive
                  ? {
                      background: "var(--bg-surface)",
                      color: "var(--brand-orange)",
                      boxShadow: "var(--shadow-raised)",
                      border: "var(--card-border)",
                    }
                  : { color: "var(--text-muted)" }
              }
            >
              <Icon className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.slice(0, 4)}</span>
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "plans" && <PlansTab />}
        {activeTab === "subscribers" && <SubscribersTab />}
        {activeTab === "usage" && <UsageTab />}
        {activeTab === "coupons" && <CouponsTab />}
        {activeTab === "webhooks" && <WebhooksTab />}
      </div>
    </div>
  );
}
