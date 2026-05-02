import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import TextInput from "@/components/ui/TextInput";
import { withdrawalService } from "@/api/services/withdrawalService";
import { WithdrawalDetailDto, WithdrawalStatus } from "@/types/withdrawal";
import { toast } from "react-toastify";
import dayjs from "dayjs";

interface WithdrawalDetailDrawerProps {
  id: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const WithdrawalDetailDrawer: React.FC<WithdrawalDetailDrawerProps> = ({ id, onClose, onSuccess }) => {
  const [detail, setDetail] = useState<WithdrawalDetailDto | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadDetail(id);
    } else {
      setDetail(null);
      setQrUrl(null);
      setIsRejecting(false);
      setRejectReason("");
    }
  }, [id]);

  const loadDetail = async (withdrawalId: string) => {
    try {
      setIsLoading(true);
      const res = await withdrawalService.getWithdrawalDetail(withdrawalId);
      setDetail(res);
      if (res.status === WithdrawalStatus.Approved) {
        const qr = await withdrawalService.getWithdrawalQR(withdrawalId);
        setQrUrl(qr);
      }
    } catch (error) {
      toast.error("Không thể tải chi tiết yêu cầu rút tiền");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!detail) return;
    try {
      await withdrawalService.approveWithdrawal(detail.id);
      toast.success("Duyệt yêu cầu thành công");
      onSuccess();
      loadDetail(detail.id);
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi duyệt");
    }
  };

  const handleConfirmTransfer = async () => {
    if (!detail) return;
    if (!window.confirm("Xác nhận đã chuyển khoản thành công?")) return;
    try {
      await withdrawalService.confirmTransfer(detail.id);
      toast.success("Xác nhận chuyển khoản thành công");
      onSuccess();
      loadDetail(detail.id);
    } catch (error: any) {
      toast.error(error.message || "Lỗi xác nhận");
    }
  };

  const handleReject = async () => {
    if (!detail) return;
    if (rejectReason.length < 5) {
      toast.error("Lý do từ chối phải dài hơn 5 ký tự");
      return;
    }
    try {
      await withdrawalService.rejectWithdrawal(detail.id, rejectReason);
      toast.success("Từ chối yêu cầu thành công");
      setIsRejecting(false);
      onSuccess();
      loadDetail(detail.id);
    } catch (error: any) {
      toast.error(error.message || "Lỗi từ chối");
    }
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.Pending: return <Badge label="Pending" className="bg-amber-500 text-white" />;
      case WithdrawalStatus.Approved: return <Badge label="Approved" className="bg-blue-500 text-white" />;
      case WithdrawalStatus.Completed: return <Badge label="Completed" className="bg-emerald-500 text-white" />;
      case WithdrawalStatus.Rejected: return <Badge label="Rejected" className="bg-rose-500 text-white" />;
      case WithdrawalStatus.Cancelled: return <Badge label="Cancelled" className="bg-slate-500 text-white" />;
      default: return <Badge label="Unknown" />;
    }
  };

  if (!detail) return null;

  return (
    <Modal
      title={`Chi tiết rút tiền - ${detail.id.slice(0, 8)}`}
      isOpen={!!id}
      onClose={onClose}
    >
      {isLoading ? (
        <div className="py-8 text-center">Đang tải...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Người yêu cầu</p>
              <p className="font-medium">{detail.managerName} ({detail.managerEmail})</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Trạng thái</p>
              <div>{getStatusBadge(detail.status)}</div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Số tiền</p>
              <p className="font-bold text-primary-500 text-lg">{detail.amount.toLocaleString()} VND</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Ngày tạo</p>
              <p>{dayjs(detail.createdAt).format("DD/MM/YYYY HH:mm")}</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md">
            <h5 className="font-medium mb-2">Thông tin nhận tiền</h5>
            <p><strong>Ngân hàng:</strong> {detail.bankShortName} ({detail.bankCode})</p>
            <p><strong>Số TK:</strong> {detail.bankAccountNumber}</p>
            <p><strong>Chủ TK:</strong> {detail.bankAccountName}</p>
          </div>

          {detail.status === WithdrawalStatus.Pending && (
            <div className="flex gap-3 justify-end border-t pt-4">
              {!isRejecting ? (
                <>
                  <Button text="Từ chối" className="btn-danger" onClick={() => setIsRejecting(true)} />
                  <Button text="Duyệt" className="btn-primary" onClick={handleApprove} />
                </>
              ) : (
                <div className="flex-1 space-y-3">
                  <TextInput
                    label="Lý do từ chối"
                    value={rejectReason}
                    onChange={(e: any) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do từ chối (ít nhất 5 ký tự)"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button text="Hủy" className="btn-light" onClick={() => setIsRejecting(false)} />
                    <Button text="Xác nhận từ chối" className="btn-danger" onClick={handleReject} />
                  </div>
                </div>
              )}
            </div>
          )}

          {detail.status === WithdrawalStatus.Approved && qrUrl && (
            <div className="text-center space-y-4 border-t pt-4">
              <h5 className="font-medium text-slate-700 dark:text-slate-200">Quét mã QR để chuyển khoản</h5>
              <img src={qrUrl} alt="VietQR" className="mx-auto w-64 h-64 object-contain rounded-lg shadow-sm border border-slate-200" />
              <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded text-amber-800 dark:text-amber-200 text-sm">
                Vui lòng kiểm tra kỹ thông tin ngân hàng trước khi xác nhận.
              </div>
              <Button text="Đã chuyển khoản xong" className="btn-success w-full" onClick={handleConfirmTransfer} />
            </div>
          )}

          {detail.status === WithdrawalStatus.Rejected && detail.rejectionReason && (
            <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded text-rose-800 dark:text-rose-200 border-t pt-4">
              <p><strong>Lý do từ chối:</strong> {detail.rejectionReason}</p>
              {detail.rejectedAt && <p className="text-sm mt-1">Lúc {dayjs(detail.rejectedAt).format("DD/MM/YYYY HH:mm")}</p>}
            </div>
          )}

          {detail.status === WithdrawalStatus.Completed && detail.completedAt && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded text-emerald-800 dark:text-emerald-200 border-t pt-4">
              <p className="font-medium">Đã hoàn tất chuyển khoản</p>
              <p className="text-sm">Lúc {dayjs(detail.completedAt).format("DD/MM/YYYY HH:mm")}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default WithdrawalDetailDrawer;
