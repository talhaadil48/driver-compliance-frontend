"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  AlertTriangle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Search,
} from "lucide-react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { apiFetch, formatDateUK } from "@/lib/api";
import { CardSkeleton, TableLoader } from "@/components/Loaders";
import { ExpiryAlertItem } from "@/types";

export default function ExpiryTrackingPage() {
  const [alerts, setAlerts] = useState<ExpiryAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("filter_type", statusFilter);

      const res = await apiFetch<ExpiryAlertItem[]>(`/dashboard/expiries?${params.toString()}`);
      setAlerts(res);
    } catch (err) {
      console.error("Failed to load expiry alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusFilter]);

  const filteredAlerts = alerts.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.driver_name.toLowerCase().includes(q) ||
      item.field_name.toLowerCase().includes(q)
    );
  });

  const expiredCount = alerts.filter((a) => a.status === "EXPIRED").length;
  const expiringSoonCount = alerts.filter((a) => a.status === "EXPIRING_SOON").length;
  const missingCount = alerts.filter((a) => a.status === "MISSING").length;

  return (
    <div className="space-y-6">
      <Header
        title="Centralized Expiry Tracking & Alerts"
        subtitle="Monitor and manage all required expiry dates, renewals, and missing fields across the driver roster."
      />

      {/* Summary KPI Cards */}
      {loading && alerts.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setStatusFilter("EXPIRED")}
            className={`p-5 rounded-2xl border cursor-pointer transition ${
              statusFilter === "EXPIRED"
                ? "ring-2 ring-rose-500 bg-rose-50/80 border-rose-300"
                : "bg-white border-slate-200 hover:border-rose-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                Expired Required Dates
              </span>
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600">
              {expiredCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Requires immediate renewal (RED)</p>
          </div>

          <div
            onClick={() => setStatusFilter("EXPIRING_SOON")}
            className={`p-5 rounded-2xl border cursor-pointer transition ${
              statusFilter === "EXPIRING_SOON"
                ? "ring-2 ring-amber-500 bg-amber-50/80 border-amber-300"
                : "bg-white border-slate-200 hover:border-amber-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Expiring Soon (&le;30 Days)
              </span>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-600">
              {expiringSoonCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Action window active (YELLOW)</p>
          </div>

          <div
            onClick={() => setStatusFilter("MISSING")}
            className={`p-5 rounded-2xl border cursor-pointer transition ${
              statusFilter === "MISSING"
                ? "ring-2 ring-rose-500 bg-rose-50/80 border-rose-300"
                : "bg-white border-slate-200 hover:border-rose-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                Missing Required Dates
              </span>
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600">
              {missingCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Not yet entered by staff (RED)</p>
          </div>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search driver or field..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <option value="ALL">All Urgencies</option>
            <option value="EXPIRED">Expired Only (Red)</option>
            <option value="EXPIRING_SOON">Expiring Soon (Yellow)</option>
            <option value="MISSING">Missing Required (Red)</option>
          </select>
        </div>

        <button
          onClick={loadAlerts}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Expiry Tracking Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Personnel Name</th>
                <th className="py-3.5 px-6">Field / Certification</th>
                <th className="py-3.5 px-6">Recorded Date</th>
                <th className="py-3.5 px-6">Urgency Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && alerts.length === 0 ? (
                <TableLoader colSpan={5} rows={4} message="Scanning fleet rosters for expiry deadlines..." />
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No expiry records match current filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((item, idx) => (
                  <tr key={`${item.driver_id}-${item.field_key}-${idx}`} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <span>{item.driver_name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            item.driver_type === "Passenger"
                              ? "bg-purple-50 border-purple-200 text-purple-700"
                              : "bg-blue-50 border-blue-200 text-blue-700"
                          }`}
                        >
                          {item.driver_type || "Driver"}
                          {item.driver_callsign ? ` #${item.driver_callsign}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-medium">
                      {item.field_name}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs">
                      {item.date ? formatDateUK(item.date) : <span className="text-rose-500 font-bold">Missing</span>}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={item.status} label={item.label} size="sm" />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        href={`/drivers/${item.driver_id}`}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        <span>Update Tab A</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
