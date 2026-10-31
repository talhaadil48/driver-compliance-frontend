import React from "react";
import { Loader2, ShieldCheck } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: string;
}

export function LoadingSpinner({ size = "md", className = "", color = "text-indigo-600" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return <Loader2 className={`animate-spin ${sizeClasses[size]} ${color} ${className}`} />;
}

export function PageLoader({
  message = "Loading...",
  subtitle = "Fetching latest records",
}: {
  message?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner">
          <ShieldCheck className="w-8 h-8 text-indigo-600 animate-pulse" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-indigo-600/20 border-t-indigo-600 animate-spin"></div>
      </div>
      <h3 className="text-base font-bold text-slate-800 tracking-tight">{message}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{subtitle}</p>
    </div>
  );
}

export function TableLoader({
  colSpan = 6,
  rows = 4,
  message = "Loading records...",
}: {
  colSpan?: number;
  rows?: number;
  message?: string;
}) {
  return (
    <>
      <tr>
        <td colSpan={colSpan} className="py-6 px-6 bg-slate-50/50">
          <div className="flex items-center justify-center space-x-2 text-xs font-medium text-slate-500">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
            <span>{message}</span>
          </div>
        </td>
      </tr>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-slate-100">
          <td className="py-4 px-6">
            <div className="h-4 bg-slate-200 rounded-md w-3/4 mb-1.5"></div>
            <div className="h-2.5 bg-slate-100 rounded w-1/2"></div>
          </td>
          <td className="py-4 px-6">
            <div className="h-4 bg-slate-200 rounded-md w-20"></div>
          </td>
          <td className="py-4 px-6">
            <div className="h-4 bg-slate-200 rounded-md w-24"></div>
          </td>
          <td className="py-4 px-6">
            <div className="h-6 bg-slate-200 rounded-full w-28"></div>
          </td>
          <td className="py-4 px-6">
            <div className="h-4 bg-slate-200 rounded-md w-16"></div>
          </td>
          <td className="py-4 px-6 text-right">
            <div className="h-6 bg-slate-200 rounded-lg w-20 ml-auto"></div>
          </td>
        </tr>
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
        <div className="w-10 h-10 rounded-xl bg-slate-100"></div>
      </div>
      <div className="h-8 bg-slate-200 rounded w-1/2"></div>
      <div className="h-2.5 bg-slate-100 rounded w-3/4"></div>
    </div>
  );
}

export function ButtonLoader({
  text = "Processing...",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center space-x-2 ${className}`}>
      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      <span>{text}</span>
    </span>
  );
}
