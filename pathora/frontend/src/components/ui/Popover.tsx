"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

const Popover = PopoverPrimitive.Root;

interface PopoverTriggerProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  PopoverTriggerProps &
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ children, className, title, ...props }, ref) => (
  <PopoverPrimitive.Trigger {...props} asChild ref={ref}>
    {children || <button className={className}>{title}</button>}
  </PopoverPrimitive.Trigger>
));
PopoverTrigger.displayName = "PopoverTrigger";

interface PopoverContentProps {
  children?: React.ReactNode;
  title?: string;
  className?: string;
  align?: "center" | "start" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  PopoverContentProps &
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ children, title, className, align, side, ...props }, forwardedRef) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      className="w-sm rounded-md bg-white p-2.5 text-sm shadow-md dark:bg-slate-800"
      align={align}
      side={side}
      sideOffset={5}
      {...props}
      ref={forwardedRef}
    >
      <div className="-mx-2.5 -mt-2.5 rounded-sm rounded-t-md rounded-b-none bg-slate-900 p-2.5 text-sm font-medium text-slate-200 dark:bg-slate-600 dark:text-slate-900">
        {title}
      </div>
      <p className="mt-2">{children}</p>
      <PopoverPrimitive.Arrow className="fill-white dark:fill-slate-600" />
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
