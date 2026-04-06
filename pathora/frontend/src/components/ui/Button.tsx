import React from "react";
import Icon from "@/components/ui/Icon";
import Link from "next/link";
import i18n from "@/i18n/config";

type ButtonProps = {
  text?: string;
  type?: "button" | "submit" | "reset";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  icon?: string;
  loadingClass?: string;
  iconPosition?: "left" | "right";
  iconClass?: string;
  link?: string;
  onClick?: () => void;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  ariaLabel?: string;
  suppressHydrationWarning?: boolean;
  style?: React.CSSProperties;
};

const LoadingSpinner = ({ loadingClass }: { loadingClass?: string }) => (
  <svg
    className={`h-5 w-5 animate-spin ltr:mr-3 ltr:-ml-1 rtl:-mr-1 rtl:ml-3 ${loadingClass}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const ButtonContent = ({
  text,
  children,
  isLoading,
  icon,
  iconPosition = "left",
  iconClass = "text-[20px]",
  loadingClass,
}: Omit<
  ButtonProps,
  "onClick" | "link" | "type" | "disabled" | "className" | "ariaLabel"
>) => {
  if (children && !isLoading) return children;

  if (!children && !isLoading) {
    return (
      <span className="flex items-center">
        {icon && (
          <span
            className={`${iconPosition === "right" ? "order-1 ltr:ml-2 rtl:mr-2" : ""} ${text && iconPosition === "left" ? "ltr:mr-2 rtl:ml-2" : ""} ${iconClass}`}>
            <Icon icon={icon} aria-hidden="true" />
          </span>
        )}
        {text && <span>{text}</span>}
      </span>
    );
  }

  if (isLoading) {
    return (
      <>
        <LoadingSpinner loadingClass={loadingClass} />
        <span>{i18n.t("common.loading", "Loading...")}</span>
      </>
    );
  }

  return null;
};

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(({

  text,
  type = "button",
  isLoading,
  disabled,
  className = "bg-primary text-primary-foreground hover:bg-primary/90",
  children,
  icon,
  loadingClass = "unset-classname",
  iconPosition = "left",
  iconClass = "text-[20px]",
  link,
  onClick,
  onMouseEnter,
  onMouseLeave,
  ariaLabel,
  suppressHydrationWarning,
  style,

}, ref) => {
  const baseClasses = `btn inline-flex items-center justify-center rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background ${
    disabled || isLoading ? "pointer-events-none" : ""
  } ${disabled ? "cursor-not-allowed opacity-40" : ""} ${className}`;

  if (link) {
    return (
      <Link
        href={link}
        ref={ref as unknown as React.Ref<HTMLAnchorElement>}
        className={baseClasses}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-label={ariaLabel}
        aria-disabled={disabled || isLoading}
        suppressHydrationWarning={suppressHydrationWarning}
        style={style}>
        <ButtonContent
          text={text}
          isLoading={isLoading}
          icon={icon}
          iconPosition={iconPosition}
          iconClass={iconClass}
          loadingClass={loadingClass}>
          {children}
        </ButtonContent>
      </Link>
    );
  }

  return (
    <button
      ref={ref as unknown as React.Ref<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled || isLoading}
      className={baseClasses}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      suppressHydrationWarning={suppressHydrationWarning}
      style={style}>
      <ButtonContent
        text={text}
        isLoading={isLoading}
        icon={icon}
        iconPosition={iconPosition}
        iconClass={iconClass}
        loadingClass={loadingClass}>
        {children}
      </ButtonContent>
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
