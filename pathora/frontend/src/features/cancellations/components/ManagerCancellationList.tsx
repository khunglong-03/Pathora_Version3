"use client";

import React, { useState } from "react";
import {
  useGetManagerCancellationRequestsQuery,
  useApproveCancellationRequestMutation,
  useRejectCancellationRequestMutation,
  useConfirmRefundPaidMutation,
  CancellationRequestDto,
} from "@/store/api/bookingCancellationApi";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MoneyIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Copy as CopyIcon,
  Phone as PhoneIcon,
} from "@phosphor-icons/react";
import { formatCurrency } from "@/utils/format";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { cn } from "@/lib/cn";

export const ManagerCancellationList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading, isFetching } = useGetManagerCancellationRequestsQuery(
    { page, pageSize: 10, status: statusFilter || undefined, search: debouncedSearch || undefined }
  );

  const [approveReq] = useApproveCancellationRequestMutation();
  const [rejectReq] = useRejectCancellationRequestMutation();
  const [confirmRefund] = useConfirmRefundPaidMutation();



  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // basic debounce
    setTimeout(() => setDebouncedSearch(e.target.value), 500);
  };

  const openModal = (req: CancellationRequestDto, action: "approve" | "reject" | "refund") => {
    let title = "";
    let inputPlaceholder = "";
    let inputValidator = undefined;
    
    if (action === "approve") {
      title = "Approve Cancellation";
      inputPlaceholder = "Internal Note (Optional)";
    } else if (action === "reject") {
      title = "Reject Cancellation";
      inputPlaceholder = "Reason for rejection *";
      inputValidator = (value: string) => (!value.trim() ? "Please provide a rejection reason" : null);
    } else {
      title = "Confirm Refund";
      inputPlaceholder = "Transaction Ref / Notes (Optional)";
    }

    import("sweetalert2").then(({ default: Swal }) => {
      Swal.fire({
        title,
        html: `
          <div style="font-size: 0.875rem; color: #475569; background-color: #f8fafc; padding: 1rem; border-radius: 0.75rem; border: 1px solid #f1f5f9; text-align: left; margin-bottom: 1rem;">
            <p><strong>Booking ID:</strong> ${req.bookingId}</p>
            <p><strong>Refund Amount:</strong> ${formatCurrency(req.refundAmount)}</p>
            <p style="margin-top: 0.5rem; color: #64748b; font-style: italic;">"${req.customerReason}"</p>
          </div>
        `,
        input: "textarea",
        inputPlaceholder,
        inputValidator,
        showCancelButton: true,
        confirmButtonText: action === "approve" ? "Approve" : action === "reject" ? "Reject" : "Confirm",
        confirmButtonColor: action === "approve" ? "#059669" : action === "reject" ? "#dc2626" : "#09090b",
        cancelButtonColor: "#64748b",
        customClass: {
          confirmButton: "px-5 py-2.5 rounded-xl font-medium text-white shadow-sm transition-all",
          cancelButton: "px-4 py-2.5 font-medium text-slate-600 transition-colors"
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          const noteValue = result.value || "";
          try {
            if (action === "approve") {
              await approveReq({ requestId: req.requestId, body: { managerNote: noteValue } }).unwrap();
              toast.success("Cancellation approved");
            } else if (action === "reject") {
              await rejectReq({ requestId: req.requestId, body: { managerNote: noteValue } }).unwrap();
              toast.success("Cancellation rejected");
            } else if (action === "refund") {
              await confirmRefund({ requestId: req.requestId, body: { refundProofNote: noteValue } }).unwrap();
              toast.success("Refund confirmed");
            }
          } catch (error: any) {
            toast.error(error?.data?.message || "Operation failed");
          }
        }
      });
    });
  };

  const getStatusBadge = (req: CancellationRequestDto) => {
    if (req.status === "Approved" && req.refundConfirmedAt) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <MoneyIcon weight="fill" /> Refunded
        </span>
      );
    }
    switch (req.status) {
      case "PendingManagerReview":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <ClockIcon weight="fill" /> Pending Review
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircleIcon weight="fill" /> Approved (Awaiting Refund)
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircleIcon weight="fill" /> Rejected
          </span>
        );
      case "RefundConfirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <MoneyIcon weight="fill" /> Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
            {req.status}
          </span>
        );
    }
  };

  return (
    <div className="v-stack gap-6">
      {/* Header & Filters */}
      <div className="v-stack sm:h-stack justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search booking ID..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        
        <div className="h-stack items-center gap-3 w-full sm:w-auto">
          <FunnelIcon className="text-slate-400" size={20} />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">All Statuses</option>
            <option value="PendingManagerReview">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="RefundConfirmed">Refund Confirmed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[1.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/50 overflow-hidden relative min-h-[400px]">
        {isLoading || isFetching ? (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 center">
            <div className="v-stack items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent circle animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Loading requests...</p>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200/50">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Request Date</th>
                <th className="px-6 py-4 whitespace-nowrap">Booking ID</th>
                <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Fee %</th>
                <th className="px-6 py-4 whitespace-nowrap">Refund Amount</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.items && data.items.length > 0 ? (
                data.items.map((req) => (
                  <tr key={req.requestId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {dayjs(req.createdAt).format("DD/MM/YYYY HH:mm")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {req.bookingId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium text-slate-900">{req.customerName || "No Name"}</div>
                      <div className="h-stack items-center gap-1.5 mt-0.5 text-slate-500">
                        <PhoneIcon weight="fill" className="text-slate-400" />
                        <span>{req.customerPhone || "No Phone"}</span>
                        {req.customerPhone && (
                          <div className="group relative ml-1">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(req.customerPhone);
                                toast.success("Đã copy số điện thoại", { position: "bottom-center", autoClose: 2000 });
                              }}
                              className="p-1 hover:bg-slate-100 rounded-md transition-colors text-blue-600 hover:text-blue-700 center"
                              title="Zalo / Copy Phone"
                            >
                              <span className="font-bold text-[10px] bg-blue-100 text-blue-700 px-1 rounded mr-1">Zalo</span>
                              <CopyIcon size={14} />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                              Copy số điện thoại (Zalo)
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(req)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 tabular-nums">
                      {req.feePercent}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-emerald-600 tabular-nums">
                      {formatCurrency(req.refundAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="h-stack items-center justify-end gap-2">
                        {req.status === "PendingManagerReview" && (
                          <>
                            <button
                              onClick={() => openModal(req, "approve")}
                              className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openModal(req, "reject")}
                              className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {req.status === "Approved" && !req.refundConfirmedAt && (
                          <button
                            onClick={() => openModal(req, "refund")}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors active:scale-[0.98]"
                          >
                            Confirm Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="v-stack items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 center">
                        <MagnifyingGlassIcon size={24} className="text-slate-400" />
                      </div>
                      <p>No cancellation requests found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalCount && data.totalCount > 10 && (
          <div className="px-6 py-4 border-t border-slate-200/50 h-stack items-center justify-between bg-slate-50/50">
            <span className="text-sm text-slate-500">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, data.totalCount)} of {data.totalCount} entries
            </span>
            <div className="h-stack items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page * 10 >= data.totalCount}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
