import React from "react";
import Icon from "@/components/ui/Icon";

type BadgeProps = {
  className?: string;
  label?: string;
  icon?: string;
  children?: React.ReactNode;
};

const Badge = ({
  className = "bg-danger-500 text-white",
  label,
  icon,
  children,
}: BadgeProps) => {
  return (
    <span className={`badge rounded-full ${className}`}>
      {!children && (
        <span className="inline-flex items-center">
          {icon && (
            <span className="inline-block ltr:mr-1 rtl:ml-1">
              <Icon icon={icon} />
            </span>
          )}
          {label}
        </span>
      )}
      {children && <span className="inline-flex items-center">{children}</span>}
    </span>
  );
};

export default Badge;
