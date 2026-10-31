import React from "react";
import { AlertCircle, Clock, CheckCircle2, MinusCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "EXPIRED" | "EXPIRING_SOON" | "VALID" | "MISSING" | "NOT_APPLICABLE" | "COMPLIANT" | "INCOMPLETE" | string;
  label?: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, label, size = "md" }: StatusBadgeProps) {
  let colorClass = "bg-slate-100 text-slate-700 border-slate-300";
  let Icon = MinusCircle;
  let displayLabel = label || status;

  switch (status) {
    case "EXPIRED":
      colorClass = "bg-rose-50 text-rose-700 border-rose-300";
      Icon = AlertCircle;
      if (!label) displayLabel = "Expired";
      break;
    case "MISSING":
    case "INCOMPLETE":
      colorClass = "bg-rose-50 text-rose-700 border-rose-300";
      Icon = AlertCircle;
      if (!label) displayLabel = status === "MISSING" ? "Missing" : "Action Required";
      break;
    case "EXPIRING_SOON":
      colorClass = "bg-amber-50 text-amber-800 border-amber-300";
      Icon = Clock;
      if (!label) displayLabel = "Expiring (< 30d)";
      break;
    case "VALID":
    case "COMPLIANT":
      colorClass = "bg-emerald-50 text-emerald-800 border-emerald-300";
      Icon = CheckCircle2;
      if (!label) displayLabel = status === "VALID" ? "Valid" : "Compliant";
      break;
    case "NOT_APPLICABLE":
      colorClass = "bg-slate-100 text-slate-500 border-slate-200";
      Icon = MinusCircle;
      if (!label) displayLabel = "Optional / N/A";
      break;
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-medium border rounded-full ${sizeClasses} ${colorClass}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
