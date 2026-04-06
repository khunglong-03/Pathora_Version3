"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

type AlertProps = {
  children?: React.ReactNode;
  className?: string;
  icon?: string;
  toggle?: () => void;
  dismissible?: boolean;
  label?: string;
};

const Alert = ({
  children,
  className = "alert-dark",
  icon,
  toggle,
  dismissible,
  label,
}: AlertProps) => {
  const [isShow, setIsShow] = useState(true);

  const handleDestroy = () => setIsShow(false);

  if (!isShow) return null;

  return (
    <div className={`alert rounded-lg shadow-sm ${className}`} role="alert">
      <div className="flex items-start gap-3 rtl:space-x-reverse">
        {icon && (
          <div className="flex-0 text-[22px]" aria-hidden="true">
            <Icon icon={icon} />
          </div>
        )}
        <div className="flex-1">{children ?? label}</div>
        {dismissible && (
          <button
            type="button"
            className="flex-0 cursor-pointer text-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
            onClick={handleDestroy}
            aria-label="Dismiss alert"
          >
            <Icon icon="heroicons-outline:x" />
          </button>
        )}
        {toggle && (
          <button
            type="button"
            className="flex-0 cursor-pointer text-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
            onClick={toggle}
            aria-label="Close alert"
          >
            <Icon icon="heroicons-outline:x" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
