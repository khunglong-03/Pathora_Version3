import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import { withdrawalService } from "@/api/services/withdrawalService";
import { WithdrawalSummaryDto, WithdrawalStatus } from "@/types/withdrawal";
import WithdrawalRequestModal from "./WithdrawalRequestModal";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const ManagerWithdrawalPage = () => {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<number>(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalSummaryDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      // const profile = await authService.getProfile();
      setBalance(0);

      const params: any = {};
      if (statusFilter !== "") {
        params.status = parseInt(statusFilter, 10);
      }
      
      const res = await withdrawalService.getWithdrawals(params);
      setWithdrawals(res.items);
    } catch (error) {
      console.error("Failed to load withdrawals", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCancel = async (id: string) => {
    if (!window.confirm("Bạn chắc chắn muốn hủy yêu cầu rút tiền này?")) return;
    try {
      await withdrawalService.cancelWithdrawal(id);
      toast.success("Đã hủy yêu cầu");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi hủy");
    }
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.Pending:
        return <Badge label="Pending" className="bg-amber-500 text-white" />;
      case WithdrawalStatus.Approved:
        return <Badge label="Approved" className="bg-blue-500 text-white" />;
      case WithdrawalStatus.Completed:
        return <Badge label="Completed" className="bg-emerald-500 text-white" />;
      case WithdrawalStatus.Rejected:
        return <Badge label="Rejected" className="bg-rose-500 text-white" />;
      case WithdrawalStatus.Cancelled:
        return <Badge label="Cancelled" className="bg-slate-500 text-white" />;
      default:
        return <Badge label="Unknown" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white">Lịch sử rút tiền</h4>
          <p className="text-sm text-slate-500">Số dư hiện tại: <span className="font-bold text-primary-500">{balance.toLocaleString()} VND</span></p>
        </div>
        <Button
          icon="heroicons:plus"
          text="Tạo yêu cầu rút tiền"
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        />
      </div>

      <Card>
        <div className="mb-4 w-48">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trạng thái</label>
          <select
            className="form-control py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value={WithdrawalStatus.Pending}>Pending</option>
            <option value={WithdrawalStatus.Approved}>Approved</option>
            <option value={WithdrawalStatus.Completed}>Completed</option>
            <option value={WithdrawalStatus.Rejected}>Rejected</option>
            <option value={WithdrawalStatus.Cancelled}>Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700">
            <thead className="bg-slate-200 dark:bg-slate-700">
              <tr>
                <th className="table-th">Mã YC</th>
                <th className="table-th">Số tiền</th>
                <th className="table-th">Ngân hàng</th>
                <th className="table-th">Trạng thái</th>
                <th className="table-th">Ngày tạo</th>
                <th className="table-th">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
              {withdrawals.map((item) => (
                <tr key={item.id}>
                  <td className="table-td font-mono text-xs">{item.id.slice(0, 8)}</td>
                  <td className="table-td font-bold">{item.amount.toLocaleString()} VND</td>
                  <td className="table-td">{item.bankShortName} - {item.bankAccountNumber}</td>
                  <td className="table-td">{getStatusBadge(item.status)}</td>
                  <td className="table-td">{dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}</td>
                  <td className="table-td">
                    {item.status === WithdrawalStatus.Pending && (
                      <button
                        onClick={() => handleCancel(item.id)}
                        className="text-rose-500 hover:underline text-sm"
                      >
                        Hủy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-slate-500">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <WithdrawalRequestModal
        activeModal={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default ManagerWithdrawalPage;
