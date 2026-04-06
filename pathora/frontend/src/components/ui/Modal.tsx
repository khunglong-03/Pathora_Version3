"use client";

import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useState } from "react";
import Icon from "@/components/ui/Icon";

type ModalProps = {
  activeModal?: boolean;
  onClose?: () => void;
  noFade?: boolean;
  disableBackdrop?: boolean;
  className?: string;
  children?: React.ReactNode;
  footerContent?: React.ReactNode;
  centered?: boolean;
  scrollContent?: boolean;
  themeClass?: string;
  title?: string;
  uncontrol?: boolean;
  label?: string;
  labelClass?: string;
};

const Modal = ({
  activeModal,
  onClose,
  noFade,
  disableBackdrop,
  className = "max-w-xl",
  children,
  footerContent,
  centered,
  scrollContent,
  themeClass = "bg-slate-900 dark:bg-slate-800 dark:border-b dark:border-slate-700",
  title = "Basic Modal",
  uncontrol,
  label = "Basic Modal",
  labelClass,
}: ModalProps) => {
  const [showModal, setShowModal] = useState(false);

  const closeModal = () => setShowModal(false);
  const openModal = () => setShowModal(!showModal);

  const transitionClasses = noFade
    ? { enter: "", enterFrom: "", enterTo: "", leave: "", leaveFrom: "", leaveTo: "" }
    : {
        enter: "duration-300 ease-out",
        enterFrom: "opacity-0",
        enterTo: "opacity-100",
        leave: "duration-200 ease-in",
        leaveFrom: "opacity-100",
        leaveTo: "opacity-0",
      };

  const contentTransitionClasses = noFade
    ? { enter: "", enterFrom: "", enterTo: "", leave: "", leaveFrom: "", leaveTo: "" }
    : {
        enter: "duration-300 ease-out",
        enterFrom: "opacity-0 scale-95",
        enterTo: "opacity-100 scale-100",
        leave: "duration-200 ease-in",
        leaveFrom: "opacity-100 scale-100",
        leaveTo: "opacity-0 scale-95",
      };

  const renderModal = (isOpen: boolean, closeFn: () => void) => (
    <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-99999"
          onClose={!disableBackdrop ? closeFn : () => {}}
          aria-labelledby="modal-title"
        >
        {!disableBackdrop && (
          <TransitionChild as={Fragment} {...transitionClasses}>
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs backdrop-filter" />
          </TransitionChild>
        )}

        <div className="fixed inset-0 overflow-y-auto">
          <div
            className={`flex min-h-full justify-center p-6 text-center ${
              centered ? "items-center" : "items-start"
            }`}
          >
            <TransitionChild as={Fragment} {...contentTransitionClasses}>
              <DialogPanel
                className={`w-full transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all dark:bg-slate-800 ${className} ${
                  scrollContent ? "overscroll-contain" : ""
                }`}
              >
                <div
                  className={`relative flex justify-between overflow-hidden px-5 py-4 text-white ${themeClass}`}
                >
                  <Dialog.Title
                    as="h2"
                    id="modal-title"
                    className="text-base font-medium leading-6 tracking-wider text-white capitalize"
                  >
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={closeFn}
                    className="inline-flex h-11 w-11 items-center justify-center rounded text-[22px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="Close modal"
                  >
                    <Icon icon="heroicons-outline:x" />
                  </button>
                </div>
                <div
                  className={`px-6 py-8 ${
                    scrollContent ? "max-h-100 overflow-y-auto overscroll-contain" : ""
                  }`}
                >
                  {children}
                </div>
                {footerContent && (
                  <div className="flex justify-end space-x-3 border-t border-slate-100 px-4 py-3 dark:border-slate-700">
                    {footerContent}
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  if (uncontrol) {
    return (
      <>
        <button
          type="button"
          onClick={openModal}
          className={`btn ${labelClass}`}
        >
          {label}
        </button>
        {renderModal(showModal, closeModal)}
      </>
    );
  }

  return renderModal(activeModal ?? false, onClose ?? (() => {}));
};

export default Modal;
