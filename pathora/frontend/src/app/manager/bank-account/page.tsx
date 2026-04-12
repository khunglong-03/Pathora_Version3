'use client';

import { useEffect, useState } from 'react';
import { managerService, ManagerBankAccountDto } from '@/services/managerService';

export default function BankAccountPage() {
  const [bankAccount, setBankAccount] = useState<ManagerBankAccountDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBankAccount();
  }, []);

  const fetchBankAccount = async () => {
    try {
      setIsLoading(true);
      const data = await managerService.getMyBankAccount();
      setBankAccount(data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setBankAccount(null);
      } else {
        setError('Failed to load bank account information.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Bank Account Information</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {bankAccount ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Account Number</h3>
              <p className="mt-1 text-lg">{bankAccount.accountNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Bank Name</h3>
              <p className="mt-1 text-lg">{bankAccount.bankName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Branch</h3>
              <p className="mt-1 text-lg">{bankAccount.branch}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Swift Code</h3>
              <p className="mt-1 text-lg font-mono">{bankAccount.swiftCode}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Verification Status</h3>
              <p className="mt-1">
                {bankAccount.verified ? (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Verified
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    Not Verified
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">No bank account information found.</p>
        </div>
      )}
    </div>
  );
}
