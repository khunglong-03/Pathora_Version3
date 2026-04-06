import { Icon } from "@/components/ui";

interface InfoFieldProps {
  label: string;
  value: string;
  mono?: boolean;
}

export function InfoField({ label, value, mono }: InfoFieldProps) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p
        className={`text-sm font-semibold text-gray-700 ${mono ? "font-mono text-[#05073c]" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

interface QuickInfoItemProps {
  icon: string;
  label: string;
  value: string;
}

export function QuickInfoItem({ icon, label, value }: QuickInfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
        <Icon icon={icon} className="size-4 text-[#fa8b02]" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-bold text-[#05073c]">{value}</p>
      </div>
    </div>
  );
}
