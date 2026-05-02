import React from "react";

interface InfoFieldProps {
  label: string;
  value: string;
  mono?: boolean;
}

export function InfoField({ label, value, mono }: InfoFieldProps) {
  return (
    <div className="flex flex-col">
      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">{label}</p>
      <p
        className={`text-sm font-bold text-slate-900 leading-tight ${mono ? "font-mono bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50 w-fit" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

interface QuickInfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function QuickInfoItem({ icon, label, value }: QuickInfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center size-10 rounded-[0.8rem] bg-slate-50 border border-slate-100 text-slate-500 shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="flex flex-col justify-center min-h-[40px]">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}
