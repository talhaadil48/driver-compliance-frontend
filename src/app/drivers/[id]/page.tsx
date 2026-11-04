"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Upload,
  Download,
  Eye,
  ExternalLink,
  RefreshCw,
  Trash2,
  CheckCircle,
  X,
  FileCheck2,
  History,
  Clock,
  User,
  Phone,
  Search,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { PageLoader, ButtonLoader } from "@/components/Loaders";
import {
  apiFetch,
  apiUpload,
  apiReplaceUpload,
  getDocumentViewUrl,
  getDocumentDownloadUrl,
  formatDateUK,
} from "@/lib/api";
import { Driver, DocumentSlotSummary, DriverAuditLog } from "@/types";

export default function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const driverId = parseInt(resolvedParams.id, 10);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "documents" ? "documents" : (searchParams.get("tab") === "history" ? "history" : "fields");

  const [activeTab, setActiveTab] = useState<"fields" | "documents" | "history">(initialTab);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTabA, setSavingTabA] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tab C: Audit Logs State
  const [auditLogs, setAuditLogs] = useState<DriverAuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilter, setAuditFilter] = useState("ALL");
  const [auditSearch, setAuditSearch] = useState("");

  // Tab A Form State
  const [tabAData, setTabAData] = useState({
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

  // Tab B: Document Upload State
  const [uploadModalSlot, setUploadModalSlot] = useState<DocumentSlotSummary | null>(null);
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Tab B: Replace Document State
  const [replaceDocId, setReplaceDocId] = useState<number | null>(null);
  const [replaceFileObj, setReplaceFileObj] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);

  const loadDriver = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Driver>(`/drivers/${driverId}`);
      setDriver(data);
      setTabAData({
        full_name: data.full_name || "",
        type: data.type || "Driver",
        callsign: data.callsign || "",
        dob: data.dob || "",
        national_insurance_number: data.national_insurance_number || "",
        dbs_certificate_number: data.dbs_certificate_number || "",
        dbs_update_service_reference: data.dbs_update_service_reference || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        notes: data.notes || "",
        dbs_update_service_expiry: data.dbs_update_service_expiry || "",
        safeguarding_expiry: data.safeguarding_expiry || "",
        first_aid_expiry: data.first_aid_expiry || "",
        autism_awareness_expiry: data.autism_awareness_expiry || "",
        autism_awareness_expiry_enabled: data.autism_awareness_expiry_enabled ?? true,
      });
    } catch (err) {
      console.error("Failed to load driver details:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const logs = await apiFetch<DriverAuditLog[]>(`/drivers/${driverId}/audit-logs`);
      setAuditLogs(logs);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadDriver();
    loadAuditLogs();
  }, [driverId]);

  const handleSaveTabA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTabA(true);
    setSaveSuccess(false);
    try {
      const payload = {
        full_name: tabAData.full_name.trim(),
        type: tabAData.type || "Driver",
        callsign: tabAData.callsign.trim() || null,
        dob: tabAData.dob || null,
        national_insurance_number: tabAData.national_insurance_number.trim() || null,
        dbs_certificate_number: tabAData.dbs_certificate_number.trim() || null,
        dbs_update_service_reference: tabAData.dbs_update_service_reference.trim() || null,
        email: tabAData.email.trim() || null,
        phone: tabAData.phone.trim() || null,
        address: tabAData.address.trim() || null,
        notes: tabAData.notes.trim() || null,
        dbs_update_service_expiry: tabAData.dbs_update_service_expiry || null,
        safeguarding_expiry: tabAData.safeguarding_expiry || null,
        first_aid_expiry: tabAData.first_aid_expiry || null,
        autism_awareness_expiry: tabAData.autism_awareness_expiry || null,
        autism_awareness_expiry_enabled: tabAData.autism_awareness_expiry_enabled ?? true,
      };

      const updated = await apiFetch<Driver>(`/drivers/${driverId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setDriver(updated);
      setSaveSuccess(true);
      loadAuditLogs();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to save driver information: " + err.message);
    } finally {
      setSavingTabA(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalSlot || !uploadFileObj) return;

    setUploading(true);
    setUploadError(null);
    try {
      // 1. Get presigned upload URL from backend (sends only tiny JSON metadata)
      const presign = await apiFetch<{
        upload_url: string;
        file_key: string;
        file_name: string;
        storage_type: string;
      }>(`/documents/driver/${driverId}/presign-upload`, {
        method: "POST",
        body: JSON.stringify({
          file_name: uploadFileObj.name,
          document_type_id: uploadModalSlot.document_type_id,
          mime_type: uploadFileObj.type || "application/pdf",
          file_size: uploadFileObj.size,
        }),
      });

      // 2. Upload directly to AWS S3 from the browser (bypasses backend & Vercel limits)
      const s3Res = await fetch(presign.upload_url, {
        method: "PUT",
        body: uploadFileObj,
        headers: {
          "Content-Type": uploadFileObj.type || "application/pdf",
        },
      });

      if (!s3Res.ok) {
        throw new Error(`Direct S3 upload failed with status ${s3Res.status}`);
      }

      // 3. Confirm document record in database
      await apiFetch(`/documents/driver/${driverId}/confirm-upload`, {
        method: "POST",
        body: JSON.stringify({
          document_type_id: uploadModalSlot.document_type_id,
          file_name: presign.file_name,
          file_key: presign.file_key,
          file_size: uploadFileObj.size,
          mime_type: uploadFileObj.type || "application/pdf",
          storage_type: "s3",
          notes: uploadNotes.trim() || null,
        }),
      });

      setUploadModalSlot(null);
      setUploadFileObj(null);
      setUploadNotes("");
      loadDriver();
      loadAuditLogs();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceDocId || !replaceFileObj) return;
    setReplacing(true);
    try {
      // 1. Get presigned replace URL from backend
      const presign = await apiFetch<{
        upload_url: string;
        file_key: string;
        file_name: string;
        storage_type: string;
      }>(`/documents/${replaceDocId}/presign-replace`, {
        method: "POST",
        body: JSON.stringify({
          file_name: replaceFileObj.name,
          mime_type: replaceFileObj.type || "application/pdf",
          file_size: replaceFileObj.size,
        }),
      });

      // 2. Upload directly to AWS S3 from the browser
      const s3Res = await fetch(presign.upload_url, {
        method: "PUT",
        body: replaceFileObj,
        headers: {
          "Content-Type": replaceFileObj.type || "application/pdf",
        },
      });

      if (!s3Res.ok) {
        throw new Error(`Direct S3 upload failed with status ${s3Res.status}`);
      }

      // 3. Confirm replacement in database
      await apiFetch(`/documents/${replaceDocId}/confirm-replace`, {
        method: "POST",
        body: JSON.stringify({
          file_name: presign.file_name,
          file_key: presign.file_key,
          file_size: replaceFileObj.size,
          mime_type: replaceFileObj.type || "application/pdf",
          storage_type: "s3",
        }),
      });

      setReplaceDocId(null);
      setReplaceFileObj(null);
      loadDriver();
      loadAuditLogs();
    } catch (err: any) {
      alert("Failed to replace document: " + err.message);
    } finally {
      setReplacing(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm("Are you sure you want to delete this document file from storage?")) return;
    try {
      await apiFetch(`/documents/${docId}`, { method: "DELETE" });
      loadDriver();
      loadAuditLogs();
    } catch (err: any) {
      alert("Failed to delete document: " + err.message);
    }
  };

  if (loading && !driver) {
    return <PageLoader message="Loading personnel compliance record..." subtitle="Fetching certification expiries and document records" />;
  }

  if (!driver) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-slate-500">Driver record not found.</p>
        <Link href="/drivers" className="text-xs font-semibold text-indigo-600">
          &larr; Back to Drivers Directory
        </Link>
      </div>
    );
  }

  const comp = driver.compliance;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Profile Header */}
      <div>
        <Link
          href="/drivers"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Drivers Directory</span>
        </Link>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
              {driver.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-black text-slate-900">
                  {driver.full_name}
                </h2>
                <StatusBadge
                  status={comp?.overall_status || "INCOMPLETE"}
                  label={comp?.overall_badge}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                    driver.type === "Passenger"
                      ? "bg-purple-50 border-purple-200 text-purple-700"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                  }`}
                >
                  {driver.type || "Driver"}
                </span>
                {driver.callsign && (
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-bold font-mono text-xs border ${
                      driver.type === "Passenger"
                        ? "bg-purple-50 border-purple-200 text-purple-700"
                        : "bg-indigo-50 border-indigo-200 text-indigo-700"
                    }`}
                  >
                    ID: {driver.callsign}
                  </span>
                )}
                <span>
                  NI:{" "}
                  <strong className="text-slate-700 font-mono">
                    {driver.national_insurance_number || "Not set"}
                  </strong>
                </span>
                <span>&bull;</span>
                <span className="flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Phone: </span>
                  {driver.phone ? (
                    <a
                      href={`tel:${driver.phone}`}
                      className="text-slate-800 font-mono font-bold hover:text-indigo-600 hover:underline"
                    >
                      {driver.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not set</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Strictly Separated Main Tabs */}
      <div className="flex border-b border-slate-200 space-x-8">
        <button
          onClick={() => setActiveTab("fields")}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === "fields"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Tab A: Information & Expiry Fields</span>
          {comp?.has_expired && (
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === "documents"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tab B: Documents</span>
          <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-mono">
            {comp?.documents_summary?.reduce((acc, slot) => acc + (slot.files?.length || 0), 0) || 0}
          </span>
          {comp?.has_missing_doc && (
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === "history"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Tab C: Changes & Audit Log</span>
          <span className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-mono font-bold">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB A: Information & Expiry Fields                                        */}
      {/* ========================================================================= */}
      {activeTab === "fields" && (
        <div className="space-y-6">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Driver profile and expiry dates updated successfully!</span>
            </div>
          )}

          {/* Compliance Visual Matrix Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Expiry Status Matrix (Red / Yellow / Green / Grey Rules)</span>
              <span className="text-[11px] font-normal text-slate-400">
                Staff can edit dates directly below
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {comp?.fields_evaluation.map((field) => (
                <div
                  key={field.key}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                    field.color === "red"
                      ? "bg-rose-50/70 border-rose-200"
                      : field.color === "yellow"
                      ? "bg-amber-50/70 border-amber-200"
                      : field.color === "green"
                      ? "bg-emerald-50/70 border-emerald-200"
                      : "bg-slate-50/70 border-slate-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {field.name}
                      </span>
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-900">
                      {field.date ? formatDateUK(field.date) : <span className="text-rose-600 italic">Missing Date</span>}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <StatusBadge status={field.status} label={field.label} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form: Personal Info & Expiry Dates */}
          <form onSubmit={handleSaveTabA} className="space-y-6">
            {/* Section 1A: Personal Details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-3">
                1. Personnel Profile Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={tabAData.full_name}
                    onChange={(e) => setTabAData({ ...tabAData, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role / Type *
                  </label>
                  <select
                    value={tabAData.type}
                    onChange={(e) => setTabAData({ ...tabAData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  >
                    <option value="Driver">Driver</option>
                    <option value="Passenger">Passenger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tabAData.type === "Passenger" ? "Passenger ID (e.g. P1)" : "ID *"}
                  </label>
                  <input
                    type="text"
                    value={tabAData.callsign}
                    onChange={(e) => setTabAData({ ...tabAData, callsign: e.target.value })}
                    placeholder={tabAData.type === "Passenger" ? "e.g. P1" : "e.g. 245"}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth (DOB)
                  </label>
                  <input
                    type="date"
                    value={tabAData.dob}
                    onChange={(e) => setTabAData({ ...tabAData, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    National Insurance Number
                  </label>
                  <input
                    type="text"
                    value={tabAData.national_insurance_number}
                    onChange={(e) =>
                      setTabAData({ ...tabAData, national_insurance_number: e.target.value })
                    }
                    placeholder="QQ123456C"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DBS Certificate Number
                  </label>
                  <input
                    type="text"
                    value={tabAData.dbs_certificate_number}
                    onChange={(e) =>
                      setTabAData({ ...tabAData, dbs_certificate_number: e.target.value })
                    }
                    placeholder="001849204820"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DBS Update Service Ref
                  </label>
                  <input
                    type="text"
                    value={tabAData.dbs_update_service_reference}
                    onChange={(e) =>
                      setTabAData({ ...tabAData, dbs_update_service_reference: e.target.value })
                    }
                    placeholder="C948201948"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={tabAData.phone}
                    onChange={(e) => setTabAData({ ...tabAData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={tabAData.email}
                    onChange={(e) => setTabAData({ ...tabAData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={tabAData.address}
                    onChange={(e) => setTabAData({ ...tabAData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Section 1B: Standard Fleet Expiry Dates */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600">
                  2. Document Expiry Dates
                </h3>
                <span className="text-xs text-slate-400">
                  Update dates independently of documents
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* DBS Update Service Expiry */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DBS Update Service Expiry
                  </label>
                  <input
                    type="date"
                    value={tabAData.dbs_update_service_expiry}
                    onChange={(e) =>
                      setTabAData({ ...tabAData, dbs_update_service_expiry: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                {/* Safeguarding Expiry */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Safeguarding Expiry
                  </label>
                  <input
                    type="date"
                    value={tabAData.safeguarding_expiry}
                    onChange={(e) =>
                      setTabAData({ ...tabAData, safeguarding_expiry: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                {/* First Aid Expiry */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Aid Expiry
                  </label>
                  <input
                    type="date"
                    value={tabAData.first_aid_expiry}
                    onChange={(e) =>
                      setTabAData({ ...tabAData, first_aid_expiry: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                {/* Autism Awareness Expiry */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Autism Awareness Expiry
                  </label>
                  <input
                    type="date"
                    value={tabAData.autism_awareness_expiry}
                    onChange={(e) =>
                      setTabAData({ ...tabAData, autism_awareness_expiry: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Save Button Bar */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
              <Link
                href="/drivers"
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={savingTabA}
                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {savingTabA ? (
                  <ButtonLoader text="Saving Changes..." />
                ) : (
                  <span>Save Information & Dates</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB B: Documents (Separate Section)                                        */}
      {/* ========================================================================= */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>Personnel Documents</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload and manage compliance documents for {driver.full_name}.
              </p>
            </div>
          </div>

          {/* Document Slots List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comp?.documents_summary.map((slot) => {
              const isUploaded = slot.files && slot.files.length > 0;
              return (
                <div
                  key={slot.code}
                  className={`p-5 rounded-2xl border transition ${
                    isUploaded
                      ? "bg-white border-slate-200 shadow-sm"
                      : slot.is_mandatory
                      ? "bg-rose-50/40 border-rose-200"
                      : "bg-slate-50/50 border-slate-200"
                  }`}
                >
                  {/* Slot Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {slot.name}
                        </h4>
                        {slot.is_mandatory && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold text-rose-600 bg-rose-100 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{slot.code}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isUploaded ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Uploaded ({slot.files.length})
                        </span>
                      ) : slot.is_mandatory ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Missing Document
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          Not Uploaded (Optional)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Uploaded Files in this Slot */}
                  {isUploaded ? (
                    <div className="mt-4 space-y-2">
                      {slot.files.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex items-center space-x-2.5">
                            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div className="min-w-0">
                              <a
                                href={getDocumentViewUrl(file.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-slate-900 hover:text-indigo-600 truncate block transition"
                                title="Open document in new tab"
                              >
                                {file.file_name}
                              </a>
                              <span className="text-[10px] text-slate-400">
                                {Math.round(file.file_size / 1024)} KB &bull;{" "}
                                {formatDateUK(file.uploaded_at)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            {/* View in New Tab Button */}
                            <a
                              href={getDocumentViewUrl(file.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Open document in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            {/* Download Button */}
                            <a
                              href={getDocumentDownloadUrl(file.id)}
                              download={file.file_name}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Download Document"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>

                            {/* Replace Button */}
                            <button
                              onClick={() => {
                                setReplaceDocId(file.id);
                                setReplaceFileObj(null);
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition text-xs font-medium cursor-pointer"
                              title="Replace file"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteDocument(file.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-white/60 border border-dashed border-slate-200 rounded-xl text-center">
                      <p className="text-xs text-slate-400">
                        {slot.is_mandatory
                          ? "This required document has not been uploaded yet."
                          : "No document uploaded for this optional slot."}
                      </p>
                    </div>
                  )}

                  {/* Slot Action Button (Upload Document) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setUploadModalSlot(slot);
                        setUploadFileObj(null);
                        setUploadNotes("");
                        setUploadError(null);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploaded ? "Replace / Upload File" : "Upload Document"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB C: Changes History & Audit Trail                                      */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-600" />
                <span>Personnel Audit Trail & Change Log</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Full chronological history of profile modifications, date updates, and document transactions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by user or field..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Actions ({auditLogs.length})</option>
                <option value="FIELD_UPDATE">Field Updates Only</option>
                <option value="DOCUMENT">Document Activities</option>
                <option value="DRIVER_CREATED">Profile Created</option>
              </select>

              <button
                onClick={loadAuditLogs}
                disabled={loadingAudit}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 transition cursor-pointer"
                title="Refresh Change Log"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAudit ? "animate-spin text-indigo-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Audit Logs Table / List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {auditLogs.filter((log) => {
              if (auditFilter === "FIELD_UPDATE" && log.action_type !== "FIELD_UPDATE") return false;
              if (auditFilter === "DOCUMENT" && !["DOCUMENT_UPLOAD", "DOCUMENT_REPLACE", "DOCUMENT_DELETE"].includes(log.action_type)) return false;
              if (auditFilter === "DRIVER_CREATED" && log.action_type !== "DRIVER_CREATED") return false;
              if (auditSearch.trim()) {
                const q = auditSearch.toLowerCase();
                const matchStaff = log.staff_name?.toLowerCase().includes(q);
                const matchField = log.field_name?.toLowerCase().includes(q);
                const matchOld = log.old_value?.toLowerCase().includes(q);
                const matchNew = log.new_value?.toLowerCase().includes(q);
                const matchNotes = log.notes?.toLowerCase().includes(q);
                if (!matchStaff && !matchField && !matchOld && !matchNew && !matchNotes) return false;
              }
              return true;
            }).length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <History className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No Changes Recorded Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Whenever staff members edit fields, update expiry dates, or upload/replace documents, each modification will be recorded here with user details, previous values, and exact timestamps.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-6">Timestamp (UK)</th>
                      <th className="py-3.5 px-6">Changed By</th>
                      <th className="py-3.5 px-6">Change Type</th>
                      <th className="py-3.5 px-6">Field / Document</th>
                      <th className="py-3.5 px-6">Previous Value</th>
                      <th className="py-3.5 px-6">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {auditLogs
                      .filter((log) => {
                        if (auditFilter === "FIELD_UPDATE" && log.action_type !== "FIELD_UPDATE") return false;
                        if (auditFilter === "DOCUMENT" && !["DOCUMENT_UPLOAD", "DOCUMENT_REPLACE", "DOCUMENT_DELETE"].includes(log.action_type)) return false;
                        if (auditFilter === "DRIVER_CREATED" && log.action_type !== "DRIVER_CREATED") return false;
                        if (auditSearch.trim()) {
                          const q = auditSearch.toLowerCase();
                          const matchStaff = log.staff_name?.toLowerCase().includes(q);
                          const matchField = log.field_name?.toLowerCase().includes(q);
                          const matchOld = log.old_value?.toLowerCase().includes(q);
                          const matchNew = log.new_value?.toLowerCase().includes(q);
                          const matchNotes = log.notes?.toLowerCase().includes(q);
                          if (!matchStaff && !matchField && !matchOld && !matchNew && !matchNotes) return false;
                        }
                        return true;
                      })
                      .map((log) => {
                        const dateObj = new Date(log.created_at);
                        const timeStr = !isNaN(dateObj.getTime())
                          ? dateObj.toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : log.created_at;

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-4 px-6 font-mono text-slate-600 whitespace-nowrap">
                              <div className="flex items-center space-x-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{timeStr}</span>
                              </div>
                            </td>

                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                                  {log.staff_name.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-semibold text-slate-900">{log.staff_name}</span>
                              </div>
                            </td>

                            <td className="py-4 px-6 whitespace-nowrap">
                              {log.action_type === "FIELD_UPDATE" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  Field Update
                                </span>
                              )}
                              {log.action_type === "DOCUMENT_UPLOAD" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Document Uploaded
                                </span>
                              )}
                              {log.action_type === "DOCUMENT_REPLACE" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Document Replaced
                                </span>
                              )}
                              {log.action_type === "DOCUMENT_DELETE" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Document Deleted
                                </span>
                              )}
                              {log.action_type === "DRIVER_CREATED" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  Profile Created
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">
                              {log.field_name}
                            </td>

                            <td className="py-4 px-6 max-w-xs">
                              {log.old_value ? (
                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-mono bg-rose-50 text-rose-700 border border-rose-200">
                                  {log.old_value}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">None (Empty)</span>
                              )}
                            </td>

                            <td className="py-4 px-6 max-w-xs">
                              {log.new_value ? (
                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {log.new_value}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">None (Cleared)</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Upload Document Modal (Tab B)                                             */}
      {/* ========================================================================= */}
      {uploadModalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Upload {uploadModalSlot.name}
                </h3>
                <span className="text-xs text-slate-400">
                  {driver.full_name} {driver.callsign ? `(#${driver.callsign})` : ""}
                </span>
              </div>
              <button
                onClick={() => setUploadModalSlot(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select File (PDF, JPG, PNG) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  onChange={(e) => setUploadFileObj(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="e.g. Certificate reference or details"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalSlot(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFileObj}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {uploading ? (
                    <ButtonLoader text="Uploading Document..." />
                  ) : (
                    <span>Confirm Upload</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Replace Document Modal (Tab B)                                            */}
      {/* ========================================================================= */}
      {replaceDocId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Replace Document File
              </h3>
              <button
                onClick={() => setReplaceDocId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReplaceDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Replacement File (PDF, JPG, PNG) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  onChange={(e) => setReplaceFileObj(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This will replace the existing file while keeping audit records and page configuration.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplaceDocId(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replacing || !replaceFileObj}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {replacing ? (
                    <ButtonLoader text="Replacing file in S3..." />
                  ) : (
                    <span>Confirm Replacement</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
