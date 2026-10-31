"use client";

import React from "react";
import { Info } from "lucide-react";

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Staff System Online</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Staff-Only Management System</span>
          </div>
        </div>
      </div>
    </header>
  );
}
