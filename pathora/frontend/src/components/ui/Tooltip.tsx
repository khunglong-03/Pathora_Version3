"use client";

import React from "react";

const Tooltip = ({
  children,
  title,
  className = "btn btn-dark",
  ...props
}: {
  children?: React.ReactNode;
  title?: string;
  className?: string;
  [key: string]: unknown;
}) => {
  return <>{children || <button className={className}>{title}</button>}</>;
};

export default Tooltip;
