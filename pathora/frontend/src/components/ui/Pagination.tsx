"use client";

import { useMemo } from "react";
import Icon from "@/components/ui/Icon";

type PaginationProps = {
  totalPages: number;
  currentPage: number;
  handlePageChange: (page: number) => void;
  text?: boolean;
  className?: string;
};

const Pagination = ({
  totalPages,
  currentPage,
  handlePageChange,
  text,
  className = "custom-class",
}: PaginationProps) => {
  const pages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className={className}>
      <ul className="pagination">
        <li>
          {text ? (
            <button
              className="text-slate-600 dark:text-slate-300 prev-next-btn focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              Previous
            </button>
          ) : (
            <button
              className="text-xl leading-4 text-slate-900 dark:text-white h-6 w-6 flex items-center justify-center flex-col prev-next-btn focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              <Icon icon="heroicons-outline:chevron-left" />
            </button>
          )}
        </li>

        {pages.map((page) => (
            <li key={page}>
              <button
                className={`${page === currentPage ? "active" : ""} page-link focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded`}
                onClick={() => handlePageChange(page)}
                disabled={page === currentPage}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            </li>
        ))}

        <li>
          {text ? (
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="text-slate-600 dark:text-slate-300 prev-next-btn focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              aria-label="Go to next page"
            >
              Next
            </button>
          ) : (
            <button
              className="text-xl leading-4 text-slate-900 dark:text-white h-6 w-6 flex items-center justify-center flex-col prev-next-btn focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
            >
              <Icon icon="heroicons-outline:chevron-right" />
            </button>
          )}
        </li>
      </ul>
    </div>
  );
};

export default Pagination;
