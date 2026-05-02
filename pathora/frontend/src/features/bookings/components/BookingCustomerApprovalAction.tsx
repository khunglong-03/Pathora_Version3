"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { handleApiError } from "@/utils/apiResponse";

interface BookingCustomerApprovalActionProps {
  bookingId: string;
  tourInstanceId: string;
  onSuccess: () => void;
}

export function BookingCustomerApprovalAction({
  bookingId,
  tourInstanceId,
  onSuccess,
}: BookingCustomerApprovalActionProps) {
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingReject, setLoadingReject] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async () => {
    try {
      setLoadingApprove(true);
      await tourInstanceService.customerApprove(tourInstanceId);
      toast.success("Đã đồng ý lịch trình thành công.");
      onSuccess();
    } catch (error: unknown) {
      const handledError = handleApiError(error);
      toast.error(handledError.message || "Không thể đồng ý lịch trình.");
    } finally {
      setLoadingApprove(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do chỉnh sửa.");
      return;
    }
    if (rejectReason.length > 1000) {
      toast.error("Lý do tối đa 1000 ký tự.");
      return;
    }

    try {
      setLoadingReject(true);
      await tourInstanceService.customerReject(tourInstanceId, rejectReason);
      toast.success("Đã gửi yêu cầu chỉnh sửa thành công.");
      setIsRejectModalOpen(false);
      onSuccess();
    } catch (error: unknown) {
      const handledError = handleApiError(error);
      toast.error(handledError.message || "Không thể gửi yêu cầu chỉnh sửa.");
    } finally {
      setLoadingReject(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] border border-orange-200/50 shadow-[0_20px_40px_-15px_rgba(249,115,22,0.1)] p-8 v-stack relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Info weight="fill" className="size-32 text-orange-500" />
        </div>

        <div className="h-stack items-start gap-4 mb-6 relative z-10">
          <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
            <Info weight="fill" className="size-6" />
          </div>
          <div className="v-stack gap-1 flex-1">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Lịch trình cần phê duyệt
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Lịch trình của bạn đã được thiết kế xong và đang chờ bạn phê duyệt. 
              Vui lòng xem kỹ thông tin lịch trình trước khi quyết định.
            </p>
          </div>
        </div>

        <div className="h-stack gap-3 relative z-10 pt-4 border-t border-slate-100">
          <button
            onClick={handleApprove}
            disabled={loadingApprove || loadingReject}
            className="flex-1 h-stack items-center justify-center gap-2 py-4 rounded-[1.5rem] bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {loadingApprove ? (
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle weight="bold" className="size-5" />
            )}
            Đồng ý lịch trình
          </button>
          
          <button
            onClick={() => setIsRejectModalOpen(true)}
            disabled={loadingApprove || loadingReject}
            className="flex-1 h-stack items-center justify-center gap-2 py-4 rounded-[1.5rem] bg-orange-50 text-orange-600 font-bold hover:bg-orange-100 transition-colors disabled:opacity-50"
          >
            <XCircle weight="bold" className="size-5" />
            Yêu cầu chỉnh sửa
          </button>
        </div>
      </motion.div>

      {/* Reject Modal */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Yêu cầu chỉnh sửa lịch trình</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Vui lòng cho chúng tôi biết bạn muốn thay đổi điểm nào trong lịch trình.
                </p>
              </div>
              
              <div className="p-6">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Tôi muốn thêm 1 ngày ở lại khách sạn này..."
                  className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                  maxLength={1000}
                />
                <div className="text-right text-xs text-slate-400 mt-2">
                  {rejectReason.length}/1000
                </div>
              </div>

              <div className="p-6 pt-0 h-stack justify-end gap-3">
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  disabled={loadingReject || !rejectReason.trim()}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors h-stack gap-2 disabled:opacity-50"
                >
                  {loadingReject ? (
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Gửi yêu cầu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
