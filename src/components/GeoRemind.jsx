import { useState } from "react";
import {
  Navigation, Sparkles, Bell, Search, SlidersHorizontal, Map,
  MapPin, ShoppingCart, Briefcase, Package, Dumbbell, Clock,
  ArrowUpDown, ChevronDown, LocateFixed, RefreshCw, MoreHorizontal,
  List, Plus, Radar, Send, ShoppingBasket, Footprints, Home, ChevronRight
} from "lucide-react";

const REMINDERS = [
  {
    id: 1,
    accent: "emerald",
    icon: ShoppingCart,
    title: "Pick up organic milk & Greek yogurt",
    note: "Check for oat milk discount on aisle 4",
    distance: "145 m away",
    place: "Whole Foods Market",
    tag: { label: "Groceries", icon: ShoppingBasket, color: "emerald" },
    radius: "120m circle",
    when: "Today, 10:00 AM",
  },
  {
    id: 2,
    accent: "sky",
    icon: Briefcase,
    title: "Submit weekly milestone timesheet",
    note: "Remember to attach invoice receipts",
    distance: "241 m away",
    place: "Tech Hub Office Campus",
    tag: { label: "Work", icon: Briefcase, color: "sky" },
    radius: "150m circle",
    when: "Today, 5:00 PM",
  },
  {
    id: 3,
    accent: "violet",
    icon: Package,
    title: "Check mailbox for courier parcel",
    note: "Key is under the small flowerpot",
    distance: "343 m away",
    place: "Home Apartment Complex",
    tag: { label: "Personal", icon: Home, color: "violet" },
    radius: "80m circle",
    when: "Tomorrow, 9:00 AM",
  },
  {
    id: 4,
    accent: "amber",
    icon: Dumbbell,
    title: "Gym workout",
    note: "Leg day – don't forget your shoes!",
    distance: "720 m away",
    place: "FitZone Gym",
    tag: { label: "Health", icon: Footprints, color: "amber" },
    radius: "200m circle",
    when: "Tomorrow, 7:00 AM",
  },
];

const ACCENTS = {
  emerald: { bar: "bg-emerald-500", ring: "bg-emerald-500/15", icon: "text-emerald-400" },
  sky: { bar: "bg-sky-500", ring: "bg-sky-500/15", icon: "text-sky-400" },
  violet: { bar: "bg-violet-500", ring: "bg-violet-500/15", icon: "text-violet-400" },
  amber: { bar: "bg-amber-500", ring: "bg-amber-500/15", icon: "text-amber-400" },
};

const TAG_COLORS = {
  emerald: "bg-emerald-500/15 text-emerald-300",
  sky: "bg-sky-500/15 text-sky-300",
  violet: "bg-violet-500/15 text-violet-300",
  amber: "bg-amber-500/15 text-amber-300",
};

const FILTERS = [
  { key: "all", label: "All", count: 4, icon: List },
  { key: "geofenced", label: "Geofenced", count: 3, icon: MapPin },
  { key: "standard", label: "Standard", count: 1, icon: Bell },
];

const TAGS = [
  { key: "all", label: "All Tags" },
  { key: "groceries", label: "Groceries", icon: ShoppingBasket },
  { key: "errands", label: "Errands", icon: Footprints },
  { key: "work", label: "Work", icon: Briefcase },
  { key: "personal", label: "Personal", icon: Home },
];

const NAV = [
  { key: "reminders", label: "Reminders", icon: List },
  { key: "map", label: "Map", icon: Map },
  { key: "add", label: "Add Reminder", icon: Plus },
  { key: "radar", label: "Radar", icon: Radar },
  { key: "simulator", label: "Simulator", icon: Send },
];

export default function GeoRemind() {
  const [filter, setFilter] = useState("all");
  const [tag, setTag] = useState("all");
  const [nav, setNav] = useState("reminders");

  const visible = REMINDERS.filter((r) => {
    if (filter === "geofenced" && r.id === 2 && false) return true;
    if (filter === "standard") return r.id === 2;
    if (filter === "geofenced") return r.id !== 2;
    return true;
  }).filter((r) => {
    if (tag === "all") return true;
    if (tag === "groceries") return r.tag.label === "Groceries";
    if (tag === "errands") return false;
    if (tag === "work") return r.tag.label === "Work";
    if (tag === "personal") return r.tag.label === "Personal" || r.tag.label === "Health";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center">
      <div className="w-full max-w-sm bg-slate-950 min-h-screen flex flex-col">
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4 text-white" fill="white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-semibold text-white text-[17px]">Geo</span>
                  <span className="font-semibold text-sky-400 text-[17px]">Remind</span>
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Right Place. Right Reminder.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                Live
              </button>
              <button className="relative w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Bell className="w-4 h-4 text-slate-300" />
                <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
              </button>
              <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden border border-slate-800" />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 mb-3.5">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-sm text-slate-500 flex-1">Search reminders or locations...</span>
            <SlidersHorizontal className="w-4 h-4 text-slate-500 shrink-0" />
          </div>

          <div className="flex items-center gap-2 mb-3">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap ${
                    active
                      ? "border-sky-500 bg-sky-500/10 text-sky-300"
                      : "border-slate-800 bg-slate-900 text-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {f.label}
                  <span
                    className={`ml-0.5 text-[10px] w-4 h-4 rounded-full flex items-center justify-center ${
                      active ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
            <button className="ml-auto w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <Map className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
            {TAGS.map((t) => {
              const active = tag === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTag(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 ${
                    active
                      ? "border-sky-500 bg-sky-500/10 text-sky-300"
                      : "border-slate-800 bg-slate-900 text-slate-300"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <button className="flex items-center gap-1.5 text-sm text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            Sort by Distance
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-right">
              <LocateFixed className="w-4 h-4 text-sky-400" />
              <div className="leading-tight">
                <div className="text-slate-400">Current Location</div>
                <button className="text-sky-400 font-medium">Update Now</button>
              </div>
            </div>
            <button className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-4 pb-4 space-y-3">
          {visible.map((r) => {
            const a = ACCENTS[r.accent];
            const Icon = r.icon;
            const TagIcon = r.tag.icon;
            return (
              <div key={r.id} className="flex rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                <div className={`w-1 ${a.bar}`} />
                <div className="flex-1 p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-full ${a.ring} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${a.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[15px] font-semibold text-white leading-snug">{r.title}</h3>
                        <button className="text-slate-500 shrink-0 -mt-0.5">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[13px] text-slate-400 mt-0.5">{r.note}</p>
                      <div className="flex items-center gap-1.5 text-[13px] text-slate-400 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {r.distance} <span className="text-slate-600">•</span> <span className="text-slate-300">{r.place}</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-3 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium rounded-xl py-2">
                    <Navigation className="w-3.5 h-3.5" />
                    Navigate
                  </button>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${TAG_COLORS[r.tag.color]}`}>
                        <TagIcon className="w-3 h-3" />
                        {r.tag.label}
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300">
                        <MapPin className="w-3 h-3" />
                        {r.radius}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {r.when}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button className="w-full flex items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">Create a reminder anywhere</p>
              <p className="text-[12px] text-slate-400">Tap the + button to add a new location-based reminder</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
          </button>
        </div>

        <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur border-t border-slate-800 px-2 pt-2 pb-3">
          <div className="flex items-end justify-between">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = nav === n.key;
              if (n.key === "add") {
                return (
                  <button key={n.key} onClick={() => setNav(n.key)} className="flex flex-col items-center gap-1 -mt-6">
                    <div className="w-14 h-14 rounded-full bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] text-sky-400 font-medium">{n.label}</span>
                  </button>
                );
              }
              return (
                <button
                  key={n.key}
                  onClick={() => setNav(n.key)}
                  className="flex flex-col items-center gap-1 px-2 py-1 flex-1"
                >
                  <Icon className={`w-5 h-5 ${active ? "text-sky-400" : "text-slate-500"}`} />
                  <span className={`text-[10px] font-medium ${active ? "text-sky-400" : "text-slate-500"}`}>
                    {n.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
