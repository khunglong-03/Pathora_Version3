import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import type { CancellationEstimateDto } from "@/store/api/bookingCancellationApi";

export interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
  isRequesting: boolean;
  estimate?: CancellationEstimateDto;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  isRequesting,
  estimate,
}) => {
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Confirm Cancellation
                </Dialog.Title>

                {isLoading ? (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Loading estimate...
                  </div>
                ) : estimate ? (
                  <form onSubmit={handleSubmit} className="mt-4">
                    <div className="mb-4 rounded-md bg-gray-50 p-4 text-sm text-gray-700">
                      <div className="flex justify-between border-b pb-2">
                        <span>Paid Amount:</span>
                        <span className="font-semibold">
                          {(estimate.paidAmount ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span>Fee ({estimate.feePercent ?? 0}%):</span>
                        <span className="font-semibold text-red-600">
                          -
                          {(
                            ((estimate.paidAmount ?? 0) * (estimate.feePercent ?? 0)) /
                            100
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="font-medium">Estimated Refund:</span>
                        <span className="font-bold text-green-600">
                          {(estimate.refundAmount ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor="reason"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Reason for cancellation <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="reason"
                        name="reason"
                        rows={3}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Reason for cancellation"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={onClose}
                        disabled={isRequesting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-400"
                        disabled={isRequesting || !reason.trim()}
                      >
                        {isRequesting ? "Requesting..." : "Confirm"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-4 text-sm text-red-500">
                    Could not load estimate. Please try again.
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
