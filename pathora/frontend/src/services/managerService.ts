import axiosInstance from '@/api/axiosInstance';
import { extractData } from '@/utils/apiResponse';

export interface ManagerBankAccountDto {
  accountNumber: string;
  bankName: string;
  branch: string;
  swiftCode: string;
  verified: boolean;
}

export interface UpdateMyBankAccountRequest {
  accountNumber: string;
  bankName: string;
  branch: string;
  swiftCode: string;
}

export const managerService = {
  getMyBankAccount: async (): Promise<ManagerBankAccountDto> => {
    const response = await axiosInstance.get('/api/manager/me/bank-account');
    return extractData<ManagerBankAccountDto>(response);
  },

  updateMyBankAccount: async (data: UpdateMyBankAccountRequest): Promise<void> => {
    await axiosInstance.put('/api/manager/me/bank-account', data);
  },
};
