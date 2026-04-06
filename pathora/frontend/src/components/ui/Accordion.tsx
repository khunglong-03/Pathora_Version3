"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { sanitizeHtml } from "@/utils/sanitize";

type AccordionItem = {
  title: string;
  content: string;
};

type AccordionProps = {
  items: AccordionItem[];
  className?: string;
};

const Accordion = ({ items, className = "space-y-5" }: AccordionProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleAccordion(index);
    }
  };

  return (
    <div className={className}>
      {items.map((item, index) => {
        const isOpen = activeIndex === index;
        const headerId = `accordion-header-${index}`;
        const panelId = `accordion-panel-${index}`;

        return (
          <div
            className="accordion shadow-base dark:shadow-none rounded-md"
            key={index}
          >
            <button
              id={headerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleAccordion(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`flex w-full cursor-pointer justify-between px-8 py-4 text-start text-base font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
                isOpen
                  ? "bg-slate-50 rounded-t-md dark:bg-slate-700 dark:bg-opacity-60"
                  : "bg-white rounded-md dark:bg-slate-700"
              } ${isOpen ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}
            >
              <span>{item.title}</span>
              <span
                className={`text-slate-900 dark:text-white text-[22px] transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              >
                <Icon icon="heroicons-outline:chevron-down" />
              </span>
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className={`text-sm font-normal bg-white dark:bg-slate-900 rounded-b-md ${
                  isOpen ? "dark:border dark:border-slate-700 dark:border-t-0" : ""
                } text-slate-600 dark:text-slate-300`}
              >
                <div
                  className="px-8 py-4"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content) }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
