"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  X,
  FileCheck,
} from "lucide-react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { TableLoader, ButtonLoader } from "@/components/Loaders";
import { apiFetch } from "@/lib/api";
import { DriverListItem } from "@/types";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // New Driver Form State
  const [formData, setFormData] = useState({
    full_name: "",
    type: "Driver",
    callsign: "",
    dob: "",
    national_insurance_number: "",
    dbs_certificate_number: "",
    dbs_update_service_reference: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    dbs_update_service_expiry: "",
    safeguarding_expiry: "",
    first_aid_expiry: "",
    autism_awareness_expiry: "",
    autism_awareness_expiry_enabled: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (statusFilter !== "ALL") params.append("status_filter", statusFilter);
      if (typeFilter !== "ALL") params.append("type_filter", typeFilter);

      const res = await apiFetch<DriverListItem[]>(`/drivers?${params.toString()}`);
      setDrivers(res);
    } catch (err) {
      console.error("Failed to load drivers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDrivers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, typeFilter]);

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setFormError("Personnel full name is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: any = {
        full_name: formData.full_name.trim(),
        type: formData.type || "Driver",
        callsign: formData.callsign.trim() || null,
        dob: formData.dob || null,
        national_insurance_number: formData.national_insurance_number.trim() || null,
        dbs_certificate_number: formData.dbs_certificate_number.trim() || null,
        dbs_update_service_reference: formData.dbs_update_service_reference.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        dbs_update_service_expiry: formData.dbs_update_service_expiry || null,
        safeguarding_expiry: formData.safeguarding_expiry || null,
        first_aid_expiry: formData.first_aid_expiry || null,
        autism_awareness_expiry: formData.autism_awareness_expiry || null,
        autism_awareness_expiry_enabled: true,
      };

      await apiFetch("/drivers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setShowAddModal(false);
      setFormData({
        full_name: "",
        type: "Driver",
        callsign: "",
        dob: "",
        national_insurance_number: "",
        dbs_certificate_number: "",
        dbs_update_service_reference: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        dbs_update_service_expiry: "",
        safeguarding_expiry: "",
        first_aid_expiry: "",
        autism_awareness_expiry: "",
        autism_awareness_expiry_enabled: true,
      });
      loadDrivers();
    } catch (err: any) {
      setFormError(err.message || "Failed to create driver profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDriver = async (id: number) => {
    try {
      await apiFetch(`/drivers/${id}`, { method: "DELETE" });
      setDeleteId(null);
      loadDrivers();
    } catch (err: any) {
      alert("Failed to delete driver: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Drivers Directory & Compliance Profiles"
        subtitle="Staff management of company drivers. Select any driver to view and update Tab A (Expiry Fields) or Tab B (Documents)."
      />

      {/* Control Bar: Search & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, NI or DBS..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center space-x-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            >
              <option value="ALL">All Roles (All Fleet)</option>
              <option value="Driver">Drivers Only</option>
              <option value="Passenger">Passengers Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLIANT">Fully Compliant</option>
              <option value="EXPIRING_SOON">Expiring Soon (&le;30d)</option>
              <option value="EXPIRED">Expired Dates</option>
              <option value="INCOMPLETE">Missing Requirements</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadDrivers}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Personnel</span>
          </button>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Personnel Full Name</th>
                <th className="py-3.5 px-6">Role / Type</th>
                <th className="py-3.5 px-6">Callsign / ID</th>
                <th className="py-3.5 px-6">NI Number</th>
                <th className="py-3.5 px-6">Compliance Status</th>
                <th className="py-3.5 px-6">Uploaded Docs</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && drivers.length === 0 ? (
                <TableLoader colSpan={7} rows={4} message="Loading fleet personnel roster..." />
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No records match the current filters.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <Link
                        href={`/drivers/${d.id}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 flex items-center space-x-2"
                      >
                        <span>{d.full_name}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          d.type === "Passenger"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {d.type || "Driver"}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {d.callsign ? (
                        <span
                          className={`px-2.5 py-1 rounded-lg border font-bold ${
                            d.type === "Passenger"
                              ? "bg-purple-50 border-purple-200 text-purple-700"
                              : "bg-indigo-50 border-indigo-200 text-indigo-700"
                          }`}
                        >
                          #{d.callsign}
                        </span>
                      ) : (
                        <span className="text-slate-400">ID #{d.id}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-medium">
                      {d.national_insurance_number || <span className="text-slate-400 italic">Not set</span>}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={d.overall_status} label={d.overall_badge} />
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {d.documents_count}
                      </span>{" "}
                      files stored
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/drivers/${d.id}`}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-lg transition"
                        >
                          Manage Profile
                        </Link>
                        <button
                          onClick={() => setDeleteId(d.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Driver"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Delete Driver Record?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This will permanently remove the driver profile, custom expiry fields, and associated document records.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDriver(deleteId)}
                className="px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Add New Driver Profile
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Staff entry of driver information and initial expiry dates.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateDriver} className="space-y-5">
              {/* Personal Info Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">
                  1. Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Personnel Role / Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    >
                      <option value="Driver">Driver</option>
                      <option value="Passenger">Passenger</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {formData.type === "Passenger" ? "Passenger ID (e.g. P5) *" : "Driver Callsign / ID *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.callsign}
                      onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                      placeholder={formData.type === "Passenger" ? "e.g. P5" : "e.g. 245"}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="e.g. Marcus Vance"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date of Birth (DOB)
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      National Insurance Number
                    </label>
                    <input
                      type="text"
                      value={formData.national_insurance_number}
                      onChange={(e) => setFormData({ ...formData, national_insurance_number: e.target.value })}
                      placeholder="e.g. QQ123456C"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+44 7700 900000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      DBS Certificate Number
                    </label>
                    <input
                      type="text"
                      value={formData.dbs_certificate_number}
                      onChange={(e) => setFormData({ ...formData, dbs_certificate_number: e.target.value })}
                      placeholder="e.g. 001849204820"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      DBS Update Service Ref
                    </label>
                    <input
                      type="text"
                      value={formData.dbs_update_service_reference}
                      onChange={(e) => setFormData({ ...formData, dbs_update_service_reference: e.target.value })}
                      placeholder="e.g. C948201948"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Expiry Dates Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">
                  2. Required & Optional Expiry Dates
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      DBS Update Service Expiry
                    </label>
                    <input
                      type="date"
                      value={formData.dbs_update_service_expiry}
                      onChange={(e) => setFormData({ ...formData, dbs_update_service_expiry: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Safeguarding Expiry
                    </label>
                    <input
                      type="date"
                      value={formData.safeguarding_expiry}
                      onChange={(e) => setFormData({ ...formData, safeguarding_expiry: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      First Aid Expiry
                    </label>
                    <input
                      type="date"
                      value={formData.first_aid_expiry}
                      onChange={(e) => setFormData({ ...formData, first_aid_expiry: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Autism Awareness Expiry
                    </label>
                    <input
                      type="date"
                      value={formData.autism_awareness_expiry}
                      onChange={(e) => setFormData({ ...formData, autism_awareness_expiry: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  {submitting ? <ButtonLoader text="Saving Profile..." /> : "Create Personnel Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
