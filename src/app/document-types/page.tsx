"use client";

import React, { useEffect, useState } from "react";
import { FileText, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import { TableLoader } from "@/components/Loaders";
import { apiFetch } from "@/lib/api";
import { DocumentType } from "@/types";

export default function DocumentTypesPage() {
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocTypes = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<DocumentType[]>("/document-types");
      setDocTypes(res);
    } catch (err) {
      console.error("Failed to load document types:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocTypes();
  }, []);

  return (
    <div className="space-y-6">
      <Header
        title="Document Types & Compliance Configuration"
        subtitle="Predefined fleet document types, requirements, and expiry tracking rules configured in the system."
      />

      {/* Info Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Document types are standardized in the codebase to ensure consistent compliance tracking and data integrity.
          </span>
        </div>
        <button
          onClick={loadDocTypes}
          disabled={loading}
          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold flex items-center space-x-1.5 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Document Types Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Document Name</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-center">Requires Expiry</th>
                <th className="py-3.5 px-4 text-center">Mandatory</th>
                <th className="py-3.5 px-4 text-right">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableLoader colSpan={7} rows={4} message="Loading standardized document rules..." />
              ) : docTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No document types defined.
                  </td>
                </tr>
              ) : (
                docTypes.map((dt, idx) => (
                  <tr key={dt.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{dt.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{dt.code}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {dt.description || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {dt.requires_expiry ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tracked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-slate-400 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>No</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {dt.is_mandatory ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
                          Required
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 rounded-md">
                          Optional
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 rounded-full">
                        Standard
                      </span>
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
