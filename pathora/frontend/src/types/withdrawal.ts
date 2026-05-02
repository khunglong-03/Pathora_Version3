export enum WithdrawalStatus {
  Pending = 0,
  Approved = 1,
  Completed = 2,
  Rejected = 3,
  Cancelled = 4,
}

export interface WithdrawalSummaryDto {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  bankAccountNumber: string;
  bankShortName: string | null;
  bankAccountName: string | null;
  createdAt: string;
  approvedAt: string | null;
  completedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  rejectionReason: string | null;
}

export interface AdminWithdrawalSummaryDto {
  id: string;
  userId: string;
  managerName: string | null;
  managerEmail: string | null;
  amount: number;
  status: WithdrawalStatus;
  bankAccountNumber: string;
  bankShortName: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export interface WithdrawalDetailDto {
  id: string;
  userId: string;
  managerName: string | null;
  managerEmail: string | null;
  amount: number;
  status: WithdrawalStatus;
  bankAccountNumber: string;
  bankCode: string;
  bankBin: string;
  bankShortName: string | null;
  bankAccountName: string | null;
  createdAt: string;
  approvedAt: string | null;
  completedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  rejectionReason: string | null;
  adminNote: string | null;
}

export interface CreateWithdrawalPayload {
  bankAccountId: string;
  amount: number;
}
