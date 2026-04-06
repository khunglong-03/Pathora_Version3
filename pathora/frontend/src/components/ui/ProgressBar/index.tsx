import React from "react";
import Bar from "./Bar";

const ProgressBar = ({
  title,
  children,
  value,
  backClass = "rounded-full",
  className = "bg-slate-900",
  titleClass = "text-base font-normal",
  striped,
  animate,
  showValue,
}: {
  title?: string;
  children?: React.ReactNode;
  value?: number;
  backClass?: string;
  className?: string;
  titleClass?: string;
  striped?: boolean;
  animate?: boolean;
  showValue?: boolean;
}) => {
  return (
    <div className="relative">
      {title && (
        <span
          className={`mb-2 block tracking-[0.01em] text-slate-500 ${titleClass}`}
        >
          {title}
        </span>
      )}
      {
        // if no children, then show the progress bar
        !children && (
          <div
            className={`progress w-full overflow-hidden bg-slate-300 dark:bg-slate-600 ${backClass}`}
          >
            <Bar
              value={value || 0}
              className={className}
              striped={striped}
              animate={animate}
              showValue={showValue}
            />
          </div>
        )
      }
      {
        // if children, then show the progress bar with children
        children && (
          <div
            className={`progress flex w-full overflow-hidden bg-slate-300 dark:bg-slate-600 ${backClass}`}
          >
            {children}
          </div>
        )
      }
    </div>
  );
};

export default ProgressBar;
