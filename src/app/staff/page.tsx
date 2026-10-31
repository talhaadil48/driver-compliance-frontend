"use client";

import React, { useEffect, useState } from "react";
import {
  UserPlus,
  Trash2,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import { TableLoader, ButtonLoader } from "@/components/Loaders";
import { apiFetch } from "@/lib/api";
import { StaffUser } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function StaffSettingsPage() {
  const { staffUser: currentAdmin } = useAuth();
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "staff" | "viewer">("staff");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<StaffUser[]>("/staff");
      setStaffList(res);
    } catch (err) {
      console.error("Failed to load staff list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/staff", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          password,
          role,
        }),
      });

      setShowAddModal(false);
      setEmail("");
      setFullName("");
      setPassword("");
      setRole("staff");
      loadStaff();
    } catch (err: any) {
      setError(err.message || "Failed to create staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: StaffUser) => {
    try {
      await apiFetch(`/staff/${staff.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !staff.is_active }),
      });
      loadStaff();
    } catch (err: any) {
      alert("Error updating staff status: " + err.message);
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await apiFetch(`/staff/${id}`, { method: "DELETE" });
      loadStaff();
    } catch (err: any) {
      alert("Error deleting staff: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Authorized Staff & Access Settings"
        subtitle="Manage company staff credentials and administrative roles for this internal compliance portal."
      />

      {/* Action Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Authorized Personnel Directory
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Only active staff members can sign in and manage driver records.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Staff Member</th>
                <th className="py-3.5 px-6">Email Address</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Account Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <TableLoader colSpan={5} rows={3} message="Loading authorized staff accounts..." />
              ) : (
                staffList.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-bold text-slate-900 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {member.full_name[0]}
                      </div>
                      <span>{member.full_name}</span>
                    </td>
                    <td className="py-4 px-6 text-xs font-medium text-slate-600">
                      {member.email}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded ${
                          member.role === "admin"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {member.role === "admin" ? "Compliance Admin" : "Staff Specialist"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(member)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                          member.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {member.is_active ? "Active" : "Deactivated"}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {currentAdmin?.id !== member.id && (
                        <button
                          onClick={() => handleDeleteStaff(member.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete staff account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Add Authorized Staff Member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-xs text-red-600 rounded-xl">{error}</div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rachel Adams"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@company.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                >
                  <option value="staff">Staff Member (Normal Access)</option>
                  <option value="admin">Compliance Administrator (Full Control)</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  {submitting ? <ButtonLoader text="Creating Account..." /> : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
