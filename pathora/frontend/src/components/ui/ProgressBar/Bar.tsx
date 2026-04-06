import React from "react";

const Bar = ({ value, className, showValue, striped, animate }) => {
  return (
    <div
      className={`flex flex-col text-center whitespace-nowrap justify-center h-full progress-bar  ${className} ${
        striped ? "stripes" : ""
      }
      ${animate ? "animate-stripes" : ""}
      `}
      style={{ width: `${value}%` }}
    >
      {showValue && (
        <span className="text-[10px] text-white font-bold">{value + "%"}</span>
      )}
    </div>
  );
};

export default Bar;
