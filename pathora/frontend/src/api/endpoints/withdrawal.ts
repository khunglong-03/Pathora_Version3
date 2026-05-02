export interface WithdrawalEndpoints {
  MANAGER_WITHDRAWALS: string;
  MANAGER_WITHDRAWAL_DETAIL: (id: string) => string;
  MANAGER_CANCEL_WITHDRAWAL: (id: string) => string;
  
  ADMIN_WITHDRAWALS: string;
  ADMIN_APPROVE_WITHDRAWAL: (id: string) => string;
  ADMIN_CONFIRM_TRANSFER: (id: string) => string;
  ADMIN_REJECT_WITHDRAWAL: (id: string) => string;
  ADMIN_WITHDRAWAL_QR: (id: string) => string;
}

export const WITHDRAWAL: WithdrawalEndpoints = {
  MANAGER_WITHDRAWALS: "/api/manager/withdrawals",
  MANAGER_WITHDRAWAL_DETAIL: (id: string) => `/api/manager/withdrawals/${id}`,
  MANAGER_CANCEL_WITHDRAWAL: (id: string) => `/api/manager/withdrawals/${id}/cancel`,
  
  ADMIN_WITHDRAWALS: "/api/admin/withdrawals",
  ADMIN_APPROVE_WITHDRAWAL: (id: string) => `/api/admin/withdrawals/${id}/approve`,
  ADMIN_CONFIRM_TRANSFER: (id: string) => `/api/admin/withdrawals/${id}/confirm-transfer`,
  ADMIN_REJECT_WITHDRAWAL: (id: string) => `/api/admin/withdrawals/${id}/reject`,
  ADMIN_WITHDRAWAL_QR: (id: string) => `/api/admin/withdrawals/${id}/qr`,
};
