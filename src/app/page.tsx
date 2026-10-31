"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  UserPlus,
  RefreshCw,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { apiFetch, formatDateUK } from "@/lib/api";
import { CardSkeleton, TableLoader } from "@/components/Loaders";
import { DashboardStats, ExpiryAlertItem, DashboardOverview } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const overview = await apiFetch<DashboardOverview>("/dashboard/overview");
      setStats(overview.stats);
      setExpiryAlerts(overview.expiries);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAlerts = expiryAlerts.filter((item) => {
    if (alertFilter === "ALL") return true;
    return item.status === alertFilter;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <Header
        title="Compliance & Operations Dashboard"
        subtitle="Real-time monitoring of driver certifications, expiry dates, and required documents."
      />

      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Quick Actions:</span>
          <span>Manage company fleet compliance records and expiry dates.</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/drivers"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Driver</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Drivers */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Managed Drivers
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {stats?.total_drivers ?? 0}
              </span>
              <span className="text-xs text-slate-500">records</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Internal company driver database</p>
          </div>

          {/* Compliant Drivers */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Fully Compliant
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-emerald-600">
                {stats?.compliant_drivers ?? 0}
              </span>
              <span className="text-xs text-slate-500">
                of {stats?.total_drivers ?? 0} (
                {stats?.total_drivers
                  ? Math.round((stats.compliant_drivers / stats.total_drivers) * 100)
                  : 0}
                %)
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">All required dates & documents valid</p>
          </div>

          {/* Expiring Soon */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Expiring Soon (&le;30d)
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-amber-600">
                {stats?.expiring_soon_drivers ?? 0}
              </span>
              <span className="text-xs text-slate-500">drivers warning</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Requires renewal within 30 days</p>
          </div>

          {/* Expired / Action Required */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                Expired & Incomplete
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-rose-600">
                {(stats?.expired_drivers ?? 0) + (stats?.incomplete_drivers ?? 0)}
              </span>
              <span className="text-xs text-slate-500">urgent action</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {stats?.expired_drivers ?? 0} expired &bull; {stats?.incomplete_drivers ?? 0} missing items
            </p>
          </div>
        </div>
      )}

      {/* Expiry Alerts & Missing Required Dates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Expiry Tracking & Field Alerts</span>
              <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full font-semibold">
                {filteredAlerts.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Expired dates (RED), missing required dates (RED), and upcoming expiries (YELLOW)
            </p>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "EXPIRED", "EXPIRING_SOON", "MISSING"].map((f) => (
              <button
                key={f}
                onClick={() => setAlertFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  alertFilter === f
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "ALL" && "All Alerts"}
                {f === "EXPIRED" && "Expired (Red)"}
                {f === "EXPIRING_SOON" && "Expiring ≤30d (Yellow)"}
                {f === "MISSING" && "Missing Required (Red)"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Personnel Name</th>
                <th className="py-3 px-6">Field / Certification</th>
                <th className="py-3 px-6">Expiry Date</th>
                <th className="py-3 px-6">Status Indicator</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && expiryAlerts.length === 0 ? (
                <TableLoader colSpan={5} rows={3} message="Evaluating certifications & expiry alerts..." />
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No active expiry alerts found under this filter.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert, idx) => (
                  <tr key={`${alert.driver_id}-${alert.field_key}-${idx}`} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <span>{alert.driver_name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            alert.driver_type === "Passenger"
                              ? "bg-purple-50 border-purple-200 text-purple-700"
                              : "bg-blue-50 border-blue-200 text-blue-700"
                          }`}
                        >
                          {alert.driver_type || "Driver"}
                          {alert.driver_callsign ? ` #${alert.driver_callsign}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-medium">
                      {alert.field_name}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs">
                      {alert.date ? formatDateUK(alert.date) : <span className="text-rose-500 font-semibold">Not Entered</span>}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={alert.status} label={alert.label} size="sm" />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        href={`/drivers/${alert.driver_id}`}
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
