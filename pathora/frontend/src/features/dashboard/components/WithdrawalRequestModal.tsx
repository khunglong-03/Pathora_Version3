import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import Select from "@/components/ui/Select";
import { managerService, ManagerBankAccountItemDto } from "@/api/services/managerService";
import { withdrawalService } from "@/api/services/withdrawalService";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const schema = yup.object({
  bankAccountId: yup.string().required("Vui lòng chọn tài khoản ngân hàng"),
  amount: yup
    .number()
    .typeError("Số tiền phải là số")
    .required("Vui lòng nhập số tiền")
    .min(100000, "Số tiền rút tối thiểu là 100,000 VND")
    .max(10000000, "Số tiền rút tối đa là 10,000,000 VND"),
});

interface WithdrawalRequestModalProps {
  activeModal: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const WithdrawalRequestModal: React.FC<WithdrawalRequestModalProps> = ({
  activeModal,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [bankAccounts, setBankAccounts] = useState<ManagerBankAccountItemDto[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (activeModal) {
      loadData();
      reset();
    }
  }, [activeModal]);

  const loadData = async () => {
    try {
      const [banks] = await Promise.all([
        managerService.getMyBankAccounts(),
        // authService.getProfile(),
      ]);
      setBankAccounts(banks);
      setBalance(0);
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit = async (data: any) => {
    if (data.amount > balance) {
      toast.error("Số dư không đủ");
      return;
    }

    if (!window.confirm(`Số dư sẽ bị trừ ngay ${data.amount.toLocaleString()} VND. Bạn chắc chắn?`)) {
      return;
    }

    try {
      setIsLoading(true);
      await withdrawalService.createWithdrawal({
        bankAccountId: data.bankAccountId,
        amount: data.amount,
      });
      toast.success("Tạo yêu cầu rút tiền thành công");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Tạo yêu cầu rút tiền"
      isOpen={activeModal}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Số dư khả dụng: <span className="font-bold text-primary-500">{balance.toLocaleString()} VND</span>
        </div>
        
        <Select
          label="Tài khoản ngân hàng"
          options={bankAccounts.map((b) => ({
            value: b.id,
            label: `${b.bankShortName} - ${b.bankAccountNumber} - ${b.bankAccountName}`,
          }))}
          register={register}
          name="bankAccountId"
          error={errors.bankAccountId as any}
        />

        <TextInput
          name="amount"
          label="Số tiền cần rút"
          type="number"
          placeholder="Nhập số tiền (100,000 - 10,000,000)"
          register={register}
          error={errors.amount as any}
        />

        <div className="flex justify-end gap-3 mt-6">
          <Button
            text="Hủy"
            className="btn-light"
            onClick={onClose}
            type="button"
          />
          <Button
            text={isLoading ? "Đang xử lý..." : "Xác nhận"}
            className="btn-primary"
            type="submit"
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
};

export default WithdrawalRequestModal;
