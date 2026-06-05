import React, { useState, useEffect, useRef } from "react";
import Modal from "@/components/ui/Modal";
import { useTranslation } from "react-i18next";
import { managerService } from "@/api/services/managerService";
import { VisaStatusBadge, Icon } from "@/components/ui";
import TextInput from "@/components/ui/TextInput";
import Textarea from "@/components/ui/Textarea";

type AdminVisaApplication = {
  id: string;
  booking: string;
  applicant: string;
  passport: string;
  country: string;
  type: string;
  status: string;
  submittedDate: string;
  decisionDate: string;
};

type VisaApplicationDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  visas: AdminVisaApplication[];
  onSuccess: () => void;
};

export const VisaApplicationDetailModal = ({
  isOpen,
  onClose,
  bookingId,
  visas,
  onSuccess,
}: VisaApplicationDetailModalProps) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [fee, setFee] = useState<string>("");
  const [visaFileUrl, setVisaFileUrl] = useState<string>("");
  const [refusalReason, setRefusalReason] = useState<string>("");

  const [visaNumber, setVisaNumber] = useState("");
  const [entryType, setEntryType] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [category, setCategory] = useState("");
  const [format, setFormat] = useState("");
  const [maxStayDays, setMaxStayDays] = useState<number | "">("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [destinationCountryInput, setDestinationCountryInput] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // A11y trigger refs
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Reset activeIndex when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      triggerElementRef.current = document.activeElement as HTMLElement;
    } else {
      setData(null);
      resetFields();
      if (triggerElementRef.current) {
        setTimeout(() => {
          triggerElementRef.current?.focus();
        }, 50);
      }
    }
  }, [isOpen, bookingId]);

  const activeVisa = visas[activeIndex];
  const activeVisaId = activeVisa?.id || null;

  useEffect(() => {
    if (isOpen && activeVisaId) {
      loadData(activeVisaId);
    } else {
      setData(null);
      resetFields();
    }
  }, [isOpen, activeVisaId]);

  // A11y ESC close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, submitting]);

  // A11y focus trap
  useEffect(() => {
    if (!isOpen || loading || !modalContentRef.current) return;
    const focusableElements = modalContentRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [isOpen, loading, activeIndex]);

  const resetFields = () => {
    setFee("");
    setVisaFileUrl("");
    setRefusalReason("");
    setVisaNumber("");
    setEntryType("");
    setIssuedAt("");
    setExpiresAt("");
    setCategory("");
    setFormat("");
    setMaxStayDays("");
    setIssuingAuthority("");
    setDestinationCountryInput("");
  };

  const loadData = async (id: string) => {
    setLoading(true);
    try {
      const res = await managerService.getVisaApplication(id);
      setData(res);

      const resData = res as any;
      // Pre-fill fields if available
      setVisaFileUrl(resData.visaFileUrl || "");
      setRefusalReason(resData.refusalReason || "");
      setVisaNumber(resData.visaNumber || "");
      setEntryType(resData.entryType ?? "");
      setIssuedAt(resData.issuedAt ? new Date(resData.issuedAt).toISOString().split("T")[0] : "");
      setExpiresAt(resData.expiresAt ? new Date(resData.expiresAt).toISOString().split("T")[0] : "");
      setCategory(resData.category ?? "");
      setFormat(resData.format ?? "");
      setMaxStayDays(resData.maxStayDays ?? "");
      setIssuingAuthority(resData.issuingAuthority || "");
      setDestinationCountryInput(resData.destinationCountry || "");
      setFee(resData.serviceFee ? resData.serviceFee.toString() : "");
    } catch (err) {
      import("react-toastify").then(({ toast }) => toast.error(t("common.error", "Error loading details")));
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteFee = async () => {
    const feeNum = parseFloat(fee);
    if (isNaN(feeNum) || feeNum <= 0) {
      import("react-toastify").then(({ toast }) => toast.error(t("visa.error.invalidFee", "Invalid fee amount")));
      return;
    }
    setSubmitting(true);
    setData((prev: any) => prev ? { ...prev, serviceFee: feeNum, status: "Awaiting_Payment" } : null);
    try {
      await managerService.quoteVisaFee({ visaApplicationId: activeVisaId!, fee: feeNum });
      import("react-toastify").then(({ toast }) => toast.success(t("visa.success.quoted", "Fee quoted successfully")));
      onSuccess();
      await loadData(activeVisaId!);
    } catch (err) {
      import("react-toastify").then(({ toast }) => toast.error(err instanceof Error ? err.message : "Failed to quote fee"));
      await loadData(activeVisaId!);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterDetails = async () => {
    const trimmedCountry = destinationCountryInput.trim();
    if (trimmedCountry && (trimmedCountry.length < 2 || trimmedCountry.length > 100)) {
      import("react-toastify").then(({ toast }) => toast.error("Quốc gia đến phải từ 2 đến 100 ký tự"));
      return;
    }
    if (!visaNumber.trim()) {
      import("react-toastify").then(({ toast }) => toast.error(t("visa.error.visaNumberRequired", "Visa number is required")));
      return;
    }
    if (!issuedAt || !expiresAt) {
      import("react-toastify").then(({ toast }) => toast.error(t("visa.error.datesRequired", "Issued/Expires dates are required")));
      return;
    }
    if (new Date(expiresAt) <= new Date(issuedAt)) {
      import("react-toastify").then(({ toast }) => toast.error(t("visa.error.expiresAfterIssued", "Expires must be after issued date")));
      return;
    }

    const currentNormStatus = getNormalizedStatus(data);
    const showFeeInput = data?.isSystemAssisted && !data?.serviceFeePaidAt && currentNormStatus !== "under_review";
    let feeVal: number | undefined = undefined;
    if (showFeeInput) {
      feeVal = parseFloat(fee);
      if (isNaN(feeVal) || feeVal <= 0) {
        import("react-toastify").then(({ toast }) => toast.error(t("visa.error.invalidFee", "Vui lòng nhập phí dịch vụ hợp lệ lớn hơn 0")));
        return;
      }
    }

    setSubmitting(true);
    setData((prev: any) => prev ? {
      ...prev,
      visaNumber: visaNumber.trim(),
      issuedAt: new Date(issuedAt).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      category,
      format,
      destinationCountry: destinationCountryInput.trim(),
      entryType: entryType || undefined,
      maxStayDays: maxStayDays !== "" && Number.isFinite(Number(maxStayDays)) ? Number(maxStayDays) : undefined,
      issuingAuthority: issuingAuthority || undefined,
      visaFileUrl: visaFileUrl || undefined,
      serviceFee: feeVal !== undefined ? feeVal : prev.serviceFee,
      status: "Approved",
    } : null);
    try {
      await managerService.registerVisaDetails({
        visaApplicationId: activeVisaId!,
        visaNumber: visaNumber.trim(),
        issuedAt: new Date(issuedAt).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        category: (category || undefined) as any,
        format: (format || undefined) as any,
        destinationCountry: (destinationCountryInput.trim() || undefined) as any,
        entryType: entryType || undefined,
        maxStayDays: maxStayDays !== "" && Number.isFinite(Number(maxStayDays)) ? Number(maxStayDays) : undefined,
        issuingAuthority: issuingAuthority || undefined,
        visaFileUrl: visaFileUrl || undefined,
        serviceFee: feeVal,
      });
      import("react-toastify").then(({ toast }) => toast.success(t("visa.success.registered", "Đăng ký chi tiết và duyệt Visa thành công")));
      onSuccess();
      await loadData(activeVisaId!);
    } catch (err) {
      import("react-toastify").then(({ toast }) => toast.error(err instanceof Error ? err.message : "Failed to register visa details"));
      await loadData(activeVisaId!);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: number) => {
    if (status === 4) {
      if (!refusalReason || refusalReason.trim().length < 5) {
        import("react-toastify").then(({ toast }) =>
          toast.error(t("visa.error.refusalReasonMinLength", "Refusal reason must be at least 5 characters for rejection."))
        );
        return;
      }
    }
    setSubmitting(true);
    setData((prev: any) => prev ? {
      ...prev,
      status: status === 3 ? "Approved" : status === 4 ? "Rejected" : prev.status,
      refusalReason: status === 4 ? refusalReason : prev.refusalReason,
    } : null);
    try {
      await managerService.updateVisaStatus({
        visaApplicationId: activeVisaId!,
        status,
        refusalReason: status === 4 ? refusalReason : undefined,
        visaFileUrl: status === 3 && visaFileUrl ? visaFileUrl : undefined,
        ...(status === 3 && data?.isSystemAssisted
          ? {
              visaNumber: visaNumber || undefined,
              entryType: entryType || undefined,
              issuedAt: issuedAt ? new Date(issuedAt).toISOString() : undefined,
              expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
              category: category || undefined,
              format: format || undefined,
              maxStayDays: maxStayDays !== "" ? maxStayDays : undefined,
              issuingAuthority: issuingAuthority || undefined,
            }
          : {}),
      });
      import("react-toastify").then(({ toast }) => toast.success(t("visa.success.updated", "Visa status updated")));
      onSuccess();
      await loadData(activeVisaId!);
    } catch (err) {
      import("react-toastify").then(({ toast }) => toast.error(err instanceof Error ? err.message : "Failed to update status"));
      await loadData(activeVisaId!);
    } finally {
      setSubmitting(false);
    }
  };

  const getNormalizedStatus = (dataObj: any) => {
    if (!dataObj) return "";
    let statusStr = "";
    if (typeof dataObj.status === "string") {
      statusStr = dataObj.status.toLowerCase();
      if (statusStr === "processing") statusStr = "under_review";
    } else {
      statusStr =
        dataObj.status === 1
          ? "pending"
          : dataObj.status === 2
          ? "under_review"
          : dataObj.status === 3
          ? "approved"
          : dataObj.status === 4
          ? "rejected"
          : "cancelled";
    }

    if (statusStr === "pending" && dataObj.serviceFee > 0 && !dataObj.serviceFeePaidAt) {
      return "awaiting_payment";
    }
    return statusStr;
  };

  const getValidityDays = (expiresAtStr: string) => {
    if (!expiresAtStr) return null;
    const expiry = new Date(expiresAtStr);
    const now = new Date();
    expiry.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCategoryLabel = (cat: string) => {
    if (!cat) return "—";
    const map: Record<string, string> = {
      Tourist: t("visa.category.tourist", "Du lịch"),
      Business: t("visa.category.business", "Công tác"),
      FamilyVisit: t("visa.category.familyVisit", "Thăm thân"),
      Student: t("visa.category.student", "Du học"),
      Transit: t("visa.category.transit", "Quá cảnh"),
      Other: t("visa.category.other", "Khác"),
    };
    return map[cat] || cat;
  };

  const getFormatLabel = (fmt: string) => {
    if (!fmt) return "—";
    const map: Record<string, string> = {
      Sticker: t("visa.format.sticker", "Sticker (Dán)"),
      EVisa: t("visa.format.evisa", "E-Visa"),
      VisaOnArrival: t("visa.format.visaOnArrival", "Visa cấp tại cửa khẩu (VOA)"),
    };
    return map[fmt] || fmt;
  };

  const getEntryTypeLabel = (entry: string) => {
    if (!entry) return "—";
    const map: Record<string, string> = {
      Single: t("visa.entryType.single", "Nhập cảnh 1 lần (Single)"),
      Double: t("visa.entryType.double", "Nhập cảnh 2 lần (Double)"),
      Multiple: t("visa.entryType.multiple", "Nhập cảnh nhiều lần (Multiple)"),
    };
    return map[entry] || entry;
  };

  const normalizedStatus = getNormalizedStatus(data);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("visa.detail.title", "Duyệt Thông Tin Visa")}
      size="xl"
      className="max-w-4xl"
      centered
      themeClass="bg-white border-b border-stone-100 [&_h2]:!text-stone-900 [&_h2]:!font-bold [&_button]:!text-stone-400 hover:[&_button]:!text-stone-900"
    >
      <div ref={modalContentRef} className="flex flex-col md:flex-row gap-6 h-[600px] min-w-0">
        {/* Left Sidebar: List of Passengers */}
        <div className="w-full md:w-72 shrink-0 border-r border-stone-100 pr-6 flex flex-col gap-3 bg-white min-h-0">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">
            {t("visa.sidebar.title", "DANH SÁCH HÀNH KHÁCH")} ({visas.length})
          </h3>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
            {visas.map((v, idx) => {
              const isActive = idx === activeIndex;
              const s = v.status ? v.status.toLowerCase() : "";

              return (
                <button
                  key={v.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isActive
                      ? "bg-amber-50 border-amber-300 text-amber-900 shadow-xs font-bold"
                      : "bg-stone-50/50 border-stone-200/50 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div className="v-stack min-w-0">
                    <span className="text-xs font-bold truncate block">{v.applicant}</span>
                    <span
                      className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${
                        isActive ? "text-amber-700/80" : "text-stone-400"
                      }`}
                    >
                      {v.passport}
                    </span>
                  </div>

                  <div className="shrink-0">
                    {s === "approved" ? (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-100 text-emerald-700">
                        <Icon icon="heroicons:check" className="size-3.5" />
                      </span>
                    ) : s === "rejected" ? (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-red-100 text-red-700">
                        <Icon icon="heroicons:x-mark" className="size-3.5" />
                      </span>
                    ) : s === "awaiting_payment" ? (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-purple-100 text-purple-700">
                        <Icon icon="heroicons:credit-card" className="size-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-amber-100 text-amber-700">
                        <Icon icon="heroicons:clock" className="size-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="flex-1 flex flex-col justify-between h-full min-w-0 bg-white min-h-0">
          {loading ? (
            <div className="flex items-center justify-center flex-1 py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
            </div>
          ) : data ? (
            <div className="flex flex-col h-full justify-between min-w-0 min-h-0">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-5 min-h-0">
                {/* Header Section */}
                <div className="flex justify-between items-start pb-4 border-b border-stone-100">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                      {data.participantName || "-"}
                    </h2>
                    <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5 font-medium">
                      <Icon icon="heroicons:identification" className="size-4 text-stone-400" />
                      {t("visa.detail.passport", "Hộ chiếu")}:{" "}
                      <span className="font-mono font-bold text-stone-700">{data.passportNumber || "-"}</span>
                    </p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    <VisaStatusBadge status={normalizedStatus as any} />
                  </div>
                </div>

                {/* Info Fields Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200/40">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                      {t("visa.detail.destination", "Điểm đến")}
                    </p>
                    <p className="text-sm font-semibold text-stone-850 truncate">
                      {data.destinationCountry || t("visa.pendingDestination", "Chờ xác định")}
                    </p>
                  </div>
                  <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200/40">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                      {t("visa.detail.visaType", "Loại Visa")}
                    </p>
                    <p className="text-sm font-semibold text-stone-850 truncate">
                      {data.isSystemAssisted ? t("visa.assisted", "Hỗ trợ dịch vụ") : t("visa.selfProvided", "Tự túc")}
                    </p>
                  </div>
                </div>

                {/* Passport Scan Section */}
                {data.passportFileUrl && (
                  <div className="bg-stone-50/55 p-5 rounded-2xl border border-stone-200/60 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <Icon icon="heroicons:document-text" className="size-4 text-stone-500" />
                        {t("visa.detail.passportScan", "Ảnh chụp Hộ chiếu (Passport Scan)")}
                      </h4>
                      <a
                        href={data.passportFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {t("visa.detail.viewOriginal", "Xem ảnh gốc")}
                        <Icon icon="heroicons:arrow-top-right-on-square" className="size-3.5" />
                      </a>
                    </div>
                    
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-stone-200 bg-stone-150 flex items-center justify-center group cursor-zoom-in">
                      {data.passportFileUrl.toLowerCase().endsWith(".pdf") ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                          <Icon icon="heroicons:document-text" className="size-16 text-stone-400" />
                          <span className="text-xs font-bold text-stone-700">Tệp PDF Hộ chiếu</span>
                          <a
                            href={data.passportFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-850 transition-colors"
                          >
                            Mở PDF
                          </a>
                        </div>
                      ) : (
                        <img
                          src={data.passportFileUrl}
                          alt="Passport Scan"
                          className="w-full h-full object-contain transition-transform duration-300 ease-in-out group-hover:scale-125"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Form Processing */}
                <div className="border-t border-slate-100 pt-5">
                  {/* System-Assisted Visa application flow (pending, awaiting_payment, or under_review) */}
                  {data.isSystemAssisted && (normalizedStatus === "pending" || normalizedStatus === "awaiting_payment" || normalizedStatus === "under_review") && (() => {
                    const showFeeInput = !data.serviceFeePaidAt && normalizedStatus !== "under_review";
                    return (
                      <div className="space-y-5">
                        <div className="v-stack">
                          <h4 className="text-sm font-bold text-stone-900">
                            {t("visa.action.registerAndApprove", "Xử lý hồ sơ dịch vụ Visa")}
                          </h4>
                          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                            {showFeeInput 
                              ? t("visa.detail.unifiedRegisterWithFeeDesc", "Nhập phí dịch vụ và thông tin Visa bên dưới để lưu và duyệt tự động.")
                              : t("visa.detail.unifiedRegisterDesc", "Nhập thông tin Visa bên dưới để lưu và duyệt tự động.")
                            }
                          </p>
                        </div>

                        {/* Unified Form container */}
                        <div className="v-stack gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                          {showFeeInput && (
                            <div className="grid grid-cols-1 gap-4">
                              <TextInput
                                id="visa-fee-input"
                                type="number"
                                label={`${t("visa.detail.feeAmount", "Phí dịch vụ (VND)")} *`}
                                placeholder="e.g. 1500000"
                                value={fee}
                                onChange={(e: any) => setFee(e.target.value)}
                              />
                            </div>
                          )}

                          <h5 className="font-bold text-xs text-slate-700 flex items-center gap-1.5 pt-2 border-t border-slate-200/40">
                            <Icon icon="heroicons:document-duplicate" className="size-4 text-stone-400" />
                            {t("visa.detail.systemAssistedDetailsRequired", "Thông tin Visa")}
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <TextInput
                              id="visa-number-input"
                              type="text"
                              label={`${t("visa.detail.visaNumber", "Số Visa")} *`}
                              placeholder="Ex: V123456"
                              value={visaNumber}
                              onChange={(e: any) => setVisaNumber(e.target.value)}
                            />
                            <TextInput
                              id="visa-authority-input"
                              type="text"
                              label={t("visa.detail.issuingAuthority", "Cơ quan cấp")}
                              placeholder="Ex: Đại sứ quán Nhật Bản"
                              value={issuingAuthority}
                              onChange={(e: any) => setIssuingAuthority(e.target.value)}
                            />
                            <TextInput
                              id="visa-issued-at-input"
                              type="date"
                              label={`${t("visa.detail.issuedAt", "Ngày cấp")} *`}
                              value={issuedAt}
                              onChange={(e: any) => setIssuedAt(e.target.value)}
                            />
                            <TextInput
                              id="visa-expires-at-input"
                              type="date"
                              label={`${t("visa.detail.expiresAt", "Ngày hết hạn")} *`}
                              value={expiresAt}
                              onChange={(e: any) => setExpiresAt(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Rejection section for under_review (payment completed) */}
                        {normalizedStatus === "under_review" && (
                          <div className="space-y-3">
                            <Textarea
                              label={t("visa.detail.refusalReason", "Lý do từ chối (Chỉ nhập khi muốn Từ chối)")}
                              placeholder={t("visa.detail.refusalReasonPlaceholder", "Nhập lý do...")}
                              value={refusalReason}
                              onChange={(e: any) => setRefusalReason(e.target.value)}
                              row={3}
                            />
                          </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-stone-200/50">
                          {normalizedStatus === "under_review" && (
                            <button
                              onClick={() => handleUpdateStatus(4)}
                              disabled={submitting || !refusalReason.trim()}
                              className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {t("common.reject", "Từ chối")}
                            </button>
                          )}
                          <button
                            onClick={handleRegisterDetails}
                            disabled={submitting}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {submitting ? "..." : t("visa.action.saveAndApprove", "Lưu & Duyệt Visa")}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Customer self-provided Visa application flow */}
                  {(normalizedStatus === "pending" || normalizedStatus === "under_review") && !data.isSystemAssisted && (
                    <div className="bg-stone-50/55 p-5 rounded-2xl border border-stone-200/60 space-y-4">
                      <div className="v-stack">
                        <h4 className="text-sm font-bold text-stone-900">
                          {t("visa.action.reviewSelfVisa", "Duyệt hồ sơ khách hàng tự túc")}
                        </h4>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                          {t("visa.detail.reviewSelfVisaDesc", "Kiểm tra kỹ file tài liệu visa do khách hàng tự tải lên trước khi đưa ra quyết định.")}
                        </p>
                      </div>

                      {data.visaFileUrl && (
                        <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-stone-200/50">
                          <div className="flex items-center gap-2">
                            <Icon icon="heroicons:document-text" className="size-5 text-stone-400" />
                            <span className="text-xs font-bold text-stone-700">{t("visa.detail.visaFile", "Tài liệu Visa")}</span>
                          </div>
                          <a
                            href={data.visaFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {t("visa.detail.viewDocument", "Xem tài liệu")}
                            <Icon icon="heroicons:arrow-top-right-on-square" className="size-3.5 text-stone-500" />
                          </a>
                        </div>
                      )}

                      {/* Visa Details Section */}
                      <div className="bg-white p-5 rounded-xl border border-stone-200/50 space-y-4 shadow-xs">
                        <h5 className="font-bold text-xs text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <Icon icon="heroicons:clipboard-document-list" className="size-4 text-stone-500" />
                          {t("visa.detail.submittedInfo", "Thông tin Visa khai báo")}
                        </h5>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                          <div className="v-stack">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                              {t("visa.detail.visaNumber", "Số Visa")}
                            </span>
                            <span className="font-mono font-bold text-stone-850 mt-0.5">
                              {data.visaNumber || "—"}
                            </span>
                          </div>

                          <div className="v-stack">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                              {t("visa.detail.issuingAuthority", "Cơ quan cấp")}
                            </span>
                            <span className="font-semibold text-stone-855 mt-0.5">
                              {data.issuingAuthority || "—"}
                            </span>
                          </div>

                          <div className="v-stack">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                              {t("visa.detail.issuedAt", "Ngày cấp")}
                            </span>
                            <span className="font-semibold text-stone-855 mt-0.5">
                              {data.issuedAt ? new Date(data.issuedAt).toLocaleDateString() : "—"}
                            </span>
                          </div>

                          <div className="v-stack">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                              {t("visa.detail.expiresAt", "Ngày hết hạn")}
                            </span>
                            <span className="font-semibold text-stone-855 mt-0.5">
                              {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : "—"}
                            </span>
                          </div>
                        </div>

                        {/* Validity period badge */}
                        {data.expiresAt && (() => {
                          const diffDays = getValidityDays(data.expiresAt);
                          if (diffDays === null) return null;
                          const isExpired = diffDays < 0;
                          const isExpiringSoon = diffDays >= 0 && diffDays <= 30;

                          let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                          let badgeText = t("visa.validity.valid", "Visa còn thời hạn hiệu lực (còn {{count}} ngày)", { count: diffDays });
                          let iconName = "heroicons:check-circle";

                          if (isExpired) {
                            badgeColor = "bg-red-50 text-red-700 border-red-200";
                            badgeText = t("visa.validity.expired", "Visa đã hết hạn (quá hạn {{count}} ngày)", { count: Math.abs(diffDays) });
                            iconName = "heroicons:x-circle";
                          } else if (isExpiringSoon) {
                            badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                            badgeText = t("visa.validity.expiringSoon", "Visa sắp hết hạn (còn {{count}} ngày)", { count: diffDays });
                            iconName = "heroicons:exclamation-circle";
                          }

                          return (
                            <div className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold ${badgeColor}`}>
                              <Icon icon={iconName} className="size-4 shrink-0" />
                              <span>{badgeText}</span>
                            </div>
                          );
                        })()}
                      </div>

                      <Textarea
                        label={t("visa.detail.refusalReason", "Refusal Reason (Required for Rejection)")}
                        placeholder={t("visa.detail.refusalReasonPlaceholder", "Enter reason...")}
                        value={refusalReason}
                        onChange={(e: any) => setRefusalReason(e.target.value)}
                        row={3}
                      />

                      <div className="flex justify-end gap-3 pt-3 border-t border-stone-200/50">
                        <button
                          onClick={() => handleUpdateStatus(4)}
                          disabled={submitting || !refusalReason}
                          className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {t("common.reject", "Reject")}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(3)}
                          disabled={submitting}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {t("common.approve", "Approve")}
                        </button>
                      </div>
                    </div>
                  )}

                  {(normalizedStatus === "approved" || normalizedStatus === "rejected") && (
                    <div className="bg-[#f9fafb] p-5 rounded-2xl border border-slate-200/50 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] space-y-4">
                      <h4 className="text-sm font-bold text-stone-900 mb-1">
                        {t("visa.detail.decisionInfo", "Decision Information")}
                      </h4>
                      {data.isSystemAssisted && data.serviceFee > 0 && (
                        <div className="v-stack mb-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            {t("visa.detail.serviceFee", "Service Fee")}
                          </p>
                          <p className="text-xs text-slate-900 font-bold">
                            {data.serviceFee.toLocaleString()} VND
                            {data.serviceFeePaidAt && (
                              <span className="text-emerald-600 ml-2">({t("common.paid", "Paid")})</span>
                            )}
                          </p>
                        </div>
                      )}
                      {data.visaFileUrl && (
                        <div className="v-stack">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            {t("visa.detail.visaFile", "Visa Document")}
                          </p>
                          <a
                            href={data.visaFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline text-xs font-semibold"
                          >
                            {t("visa.detail.viewDocument", "View Document")} {"\u2192"}
                          </a>
                        </div>
                      )}

                      {normalizedStatus === "approved" && (
                        <div className="mt-2 border-t border-slate-200/55 pt-3">
                          <h5 className="font-bold text-xs text-slate-700 mb-2">
                            {t("visa.detail.systemAssistedDetails", "Visa Details")}
                          </h5>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                            <div className="v-stack">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                                Visa Number
                              </p>
                              <p className="text-xs font-bold text-slate-900">{data.visaNumber || "—"}</p>
                            </div>
                            <div className="v-stack">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                                Issuing Authority
                              </p>
                              <p className="text-xs font-semibold text-slate-900">{data.issuingAuthority || "—"}</p>
                            </div>
                            <div className="v-stack">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                                Issued At
                              </p>
                              <p className="text-xs font-semibold text-slate-900">
                                {data.issuedAt ? new Date(data.issuedAt).toLocaleDateString() : "—"}
                              </p>
                            </div>
                            <div className="v-stack">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                                Expires At
                              </p>
                              <p className="text-xs font-semibold text-slate-900">
                                {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {data.refusalReason && (
                        <div className="v-stack">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            {t("visa.detail.refusalReason", "Refusal Reason")}
                          </p>
                          <p className="text-xs text-red-600 font-bold">{data.refusalReason}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Footer Navigation */}
              <div className="flex justify-between items-center pt-4 border-t border-stone-150 mt-4 gap-4 shrink-0 bg-white">
                <button
                  type="button"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((prev) => prev - 1)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 font-bold text-xs rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                >
                  <Icon icon="heroicons:arrow-left" className="size-4" />
                  {t("common.previous", "Trước")}
                </button>
                <span className="text-xs font-extrabold text-stone-400 font-sans">
                  {activeIndex + 1} / {visas.length}
                </span>
                <button
                  type="button"
                  disabled={activeIndex === visas.length - 1}
                  onClick={() => setActiveIndex((prev) => prev + 1)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 font-bold text-xs rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                >
                  {t("common.next", "Sau")}
                  <Icon icon="heroicons:arrow-right" className="size-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 py-16 text-center text-xs text-stone-400 font-bold">
              {t("visa.noActiveVisa", "Không tìm thấy hồ sơ visa.")}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default VisaApplicationDetailModal;
