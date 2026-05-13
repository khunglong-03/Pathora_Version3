import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { withdrawalService } from "@/api/services/withdrawalService";
import { AdminWithdrawalSummaryDto, WithdrawalStatus } from "@/types/withdrawal";
import WithdrawalDetailDrawer from "./WithdrawalDetailDrawer";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const AdminWithdrawalPage = () => {
  const { t } = useTranslation();
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalSummaryDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const params: any = {};
      if (statusFilter !== "") {
        params.status = parseInt(statusFilter, 10);
      }
      
      const res = await withdrawalService.getAdminWithdrawals(params);
      setWithdrawals(res.items);
    } catch (error) {
      console.error("Failed to load withdrawals", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

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
        <h4 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý Yêu cầu Rút tiền</h4>
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
                <th className="table-th">Người yêu cầu</th>
                <th className="table-th">Số tiền</th>
                <th className="table-th">Ngân hàng</th>
                <th className="table-th">Trạng thái</th>
                <th className="table-th">Ngày tạo</th>
                <th className="table-th">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
              {withdrawals.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer" onClick={() => setSelectedId(item.id)}>
                  <td className="table-td font-mono text-xs">{item.id.slice(0, 8)}</td>
                  <td className="table-td">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{item.managerName}</div>
                    <div className="text-xs text-slate-500">{item.managerEmail}</div>
                  </td>
                  <td className="table-td font-bold text-primary-500">{item.amount.toLocaleString()} VND</td>
                  <td className="table-td">{item.bankShortName}</td>
                  <td className="table-td">{getStatusBadge(item.status)}</td>
                  <td className="table-td">{dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}</td>
                  <td className="table-td">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
                      className="text-primary-500 hover:underline text-sm font-medium"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-slate-500">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <WithdrawalDetailDrawer
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default AdminWithdrawalPage;
