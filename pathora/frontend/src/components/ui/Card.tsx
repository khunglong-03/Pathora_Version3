import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerSlot?: React.ReactNode;
  className?: string;
  bodyClass?: string;
  noBorder?: boolean;
  titleClass?: string;
};

const Card = ({
  children,
  title,
  subtitle,
  headerSlot,
  className = " ",
  bodyClass = "p-6",
  noBorder,
  titleClass = "text-foreground",
  ...props
}: CardProps) => {
  return (
    <div
      {...props}
      className={`rounded-xl bg-[var(--surface)] text-[var(--text-primary)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-card ${className}`}
    >
      {(title || subtitle) && (
        <header className={`card-header ${noBorder ? "no-border" : ""}`}>
          <div>
            {title && <div className={`card-title ${titleClass}`}>{title}</div>}
            {subtitle && <div className="card-subtitle">{subtitle}</div>}
          </div>
          {headerSlot && <div className="card-header-slot">{headerSlot}</div>}
        </header>
      )}
      <main className={`card-body ${bodyClass}`}>{children}</main>
    </div>
  );
};

export default Card;
