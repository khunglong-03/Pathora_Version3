import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useTranslation } from "react-i18next";
import { managerService } from "@/api/services/managerService";
import { VisaStatusBadge } from "@/components/ui";
import TextInput from "@/components/ui/TextInput";
import Textarea from "@/components/ui/Textarea";

type VisaApplicationDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  visaId: string | null;
  onSuccess: () => void;
};

export const VisaApplicationDetailModal = ({ isOpen, onClose, visaId, onSuccess }: VisaApplicationDetailModalProps) => {
  const { t } = useTranslation();
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

  useEffect(() => {
    if (isOpen && visaId) {
      loadData();
    } else {
      setData(null);
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
    }
  }, [isOpen, visaId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await managerService.getVisaApplication(visaId!);
      console.log("Visa detail response:", res);
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
    } catch (err) {
      import("react-toastify").then(({ toast }) => toast.error(t("common.error", "Error loading details")));
      onClose();
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
    try {
      await managerService.quoteVisaFee({ visaApplicationId: visaId!, fee: feeNum });
      import("react-toastify").then(({ toast }) => toast.success(t("visa.success.quoted", "Fee quoted successfully")));
      onSuccess();
      onClose();
    } catch (err) {
      import("react-toastify").then(({ toast }) => toast.error(err instanceof Error ? err.message : "Failed to quote fee"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterDetails = async () => {
    if (!destinationCountryInput.trim()) {
      import("react-toastify").then(({ toast }) => toast.error("Quốc gia đến là bắt buộc"));
      return;
    }
    if (destinationCountryInput.trim().length < 2 || destinationCountryInput.trim().length > 3 || !/^[A-Z]+$/.test(destinationCountryInput.trim())) {
      import("react-toastify").then(({ toast }) => toast.error("Quốc gia đến phải từ 2 đến 3 ký tự viết hoa (ISO)"));
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
    if (!category || !format) {
      import("react-toastify").then(({ toast }) => toast.error(t("visa.error.categoryFormatRequired", "Category and format are required")));
      return;
    }
    setSubmitting(true);
    try {
      await managerService.registerVisaDetails({
        visaApplicationId: visaId!,
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
      });
      import("react-toastify").then(({ toast }) => toast.success(t("visa.success.registered", "Visa details registered")));
      onSuccess();
      await loadData();
    } catch (err) {
      import("react-toastify").then(({ toast }) => toast.error(err instanceof Error ? err.message : "Failed to register visa details"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: number) => {
    if (status === 4) {
      if (!refusalReason || refusalReason.trim().length < 5) {
        import("react-toastify").then(({ toast }) => toast.error(t("visa.error.refusalReasonMinLength", "Refusal reason must be at least 5 characters for rejection.")));
        return;
      }
    }
    setSubmitting(true);
    try {
      await managerService.updateVisaStatus({ 
        visaApplicationId: visaId!, 
        status, 
        refusalReason: status === 4 ? refusalReason : undefined,
        visaFileUrl: (status === 3 && visaFileUrl) ? visaFileUrl : undefined,
        ...(status === 3 && data?.isSystemAssisted ? {
          visaNumber: visaNumber || undefined,
          entryType: entryType || undefined,
          issuedAt: issuedAt ? new Date(issuedAt).toISOString() : undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          category: category || undefined,
          format: format || undefined,
          maxStayDays: maxStayDays !== "" ? maxStayDays : undefined,
          issuingAuthority: issuingAuthority || undefined,
        } : {})
      });
      import("react-toastify").then(({ toast }) => toast.success(t("visa.success.updated", "Visa status updated")));
      onSuccess();
      onClose();
    } catch (err) {
      import("react-toastify").then(({ toast }) => toast.error(err instanceof Error ? err.message : "Failed to update status"));
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
      statusStr = dataObj.status === 1 ? "pending" : dataObj.status === 2 ? "under_review" : dataObj.status === 3 ? "approved" : dataObj.status === 4 ? "rejected" : "cancelled";
    }
    
    if (statusStr === "pending" && dataObj.serviceFee > 0 && !dataObj.serviceFeePaidAt) {
      return "awaiting_payment";
    }
    return statusStr;
  };

  const normalizedStatus = getNormalizedStatus(data);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("visa.detail.title", "Visa Application Details")}
      size="lg"
      themeClass="bg-white border-b border-slate-100 [&_h2]:!text-slate-900 [&_button]:!text-slate-400 hover:[&_button]:!text-slate-900"
    >
      {loading ? (
        <div className="center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
        </div>
      ) : data ? (
        <div className="v-stack gap-6">
          <div className="grid grid-cols-2 gap-6 bg-[#f9fafb] p-6 rounded-[1.5rem] border border-slate-200/50 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
            <div className="v-stack">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t("visa.detail.applicant", "Applicant")}</p>
              <p className="text-base font-semibold text-slate-900">{data.participantName || "-"}</p>
            </div>
            <div className="v-stack">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t("visa.detail.passport", "Passport Number")}</p>
              <p className="font-mono text-base font-semibold text-slate-900">{data.passportNumber || "-"}</p>
            </div>
            <div className="v-stack">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t("visa.detail.destination", "Destination")}</p>
              <p className="text-base font-semibold text-slate-900">{data.destinationCountry || t("visa.pendingDestination")}</p>
            </div>
            <div className="v-stack">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t("visa.detail.status", "Status")}</p>
              <div className="mt-1">
                <VisaStatusBadge status={normalizedStatus as any} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 mt-2">
            {normalizedStatus === "pending" && data.isSystemAssisted && (
              <div className="v-stack gap-5">
                <div className="v-stack">
                  <h4 className="text-xl font-bold tracking-tight text-slate-900 mb-2">{t("visa.action.quoteFee", "Quote Visa Fee")}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[65ch]">
                    {t("visa.detail.quoteFeeDesc", "Enter the required fee to process this visa application. The customer will be notified to make the payment.")}
                  </p>
                </div>
                <div className="h-stack items-end gap-4">
                  <div className="flex-1">
                    <TextInput
                      type="number"
                      label={t("visa.detail.feeAmount", "Fee Amount (VND)")}
                      placeholder="e.g. 1500000"
                      value={fee}
                      onChange={(e: any) => setFee(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleQuoteFee}
                    disabled={submitting || !fee}
                    className="px-6 py-[11px] bg-zinc-950 text-white text-sm font-semibold rounded-[1rem] hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-950 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                  >
                    {submitting ? "..." : t("visa.action.submitQuote", "Submit Quote")}
                  </button>
                </div>
              </div>
            )}

            {(normalizedStatus === "pending" || normalizedStatus === "under_review") && !data.isSystemAssisted && (
              <div className="v-stack gap-5">
                <div className="v-stack">
                  <h4 className="text-xl font-bold tracking-tight text-slate-900 mb-2">{t("visa.action.reviewSelfVisa", "Review Customer-Provided Visa")}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[65ch]">
                    {t("visa.detail.reviewSelfVisaDesc", "Customer submitted their own visa. Review the document and decide.")}
                  </p>
                </div>

                {data.visaFileUrl && (
                  <div className="v-stack bg-[#f9fafb] p-4 rounded-xl border border-slate-200/50">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t("visa.detail.visaFile", "Visa Document")}</p>
                    <a href={data.visaFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                      {t("visa.detail.viewDocument", "View Document")} &rarr;
                    </a>
                  </div>
                )}

                <TextInput
                  type="text"
                  label={t("visa.detail.visaFileUrl", "Visa Document URL")}
                  placeholder="https://..."
                  value={visaFileUrl}
                  onChange={(e: any) => setVisaFileUrl(e.target.value)}
                />

                <Textarea
                  label={t("visa.detail.refusalReason", "Refusal Reason (Required for Rejection)")}
                  placeholder={t("visa.detail.refusalReasonPlaceholder", "Enter reason...")}
                  value={refusalReason}
                  onChange={(e: any) => setRefusalReason(e.target.value)}
                  row={3}
                />

                <div className="h-stack justify-end gap-4 pt-4">
                  <button
                    onClick={() => handleUpdateStatus(4)}
                    disabled={submitting || !refusalReason}
                    className="px-6 py-[11px] bg-red-50 text-red-600 text-sm font-semibold rounded-[1rem] hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-500"
                  >
                    {t("common.reject", "Reject")}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(3)}
                    disabled={submitting}
                    className="px-6 py-[11px] bg-emerald-600 text-white text-sm font-semibold rounded-[1rem] shadow-[0_8px_20px_-6px_rgba(5,150,105,0.3)] hover:bg-emerald-700 hover:shadow-[0_8px_20px_-6px_rgba(5,150,105,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  >
                    {t("common.approve", "Approve")}
                  </button>
                </div>
              </div>
            )}

            {normalizedStatus === "awaiting_payment" && (() => {
              const hasRegisteredDetails = Boolean(data.visaNumber);
              return (
                <div className="v-stack gap-5">
                  <div className="v-stack gap-3 bg-purple-50/50 p-6 rounded-[1.5rem] border border-purple-100">
                    <h4 className="text-xl font-bold tracking-tight text-purple-900">{t("visa.action.awaitingPayment", "Awaiting Payment")}</h4>
                    <div className="v-stack gap-2 text-sm text-purple-700">
                      <p>{t("visa.detail.feeQuoted", "Fee has been quoted:")} <span className="font-semibold">{data.serviceFee?.toLocaleString()} VND</span></p>
                      <p>{t("visa.detail.waitingCustomerPay", "Waiting for the customer to complete the payment.")}</p>
                    </div>
                  </div>

                  <div className="v-stack">
                    <h4 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
                      {hasRegisteredDetails
                        ? t("visa.action.updateRegisteredVisa", "Registered Visa Details")
                        : t("visa.action.registerDetails", "Register Visa Details")}
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-[65ch]">
                      {t("visa.detail.registerDetailsDescPreview", "You can register visa info now so customer sees it once payment is completed. Approval still requires customer payment.")}
                    </p>
                  </div>

                  <div className="v-stack gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h5 className="font-bold text-slate-700">
                      {hasRegisteredDetails
                        ? t("visa.detail.systemAssistedDetails", "Visa Details")
                        : t("visa.detail.systemAssistedDetailsRequired", "Visa Details (Required)")}
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <TextInput
                        type="text"
                        label="Destination Country (ISO) *"
                        placeholder="Ex: JP, KR, US"
                        maxLength={3}
                        value={destinationCountryInput}
                        onChange={(e: any) => setDestinationCountryInput(e.target.value.toUpperCase())}
                      />
                      <TextInput
                        type="text"
                        label="Visa Number *"
                        placeholder="Ex: V123456"
                        value={visaNumber}
                        onChange={(e: any) => setVisaNumber(e.target.value)}
                      />
                      <div className="v-stack">
                        <label className="text-sm font-medium text-slate-700 mb-[6px]">Entry Type</label>
                        <select
                          className="px-4 py-[11px] bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 outline-none transition-all shadow-sm"
                          value={entryType}
                          onChange={(e: any) => setEntryType(e.target.value)}
                        >
                          <option value="">{t("common.select", "Select")}</option>
                          <option value="Single">Single</option>
                          <option value="Double">Double</option>
                          <option value="Multiple">Multiple</option>
                        </select>
                      </div>
                      <TextInput
                        type="date"
                        label="Issued At *"
                        value={issuedAt}
                        onChange={(e: any) => setIssuedAt(e.target.value)}
                      />
                      <TextInput
                        type="date"
                        label="Expires At *"
                        value={expiresAt}
                        onChange={(e: any) => setExpiresAt(e.target.value)}
                      />
                      <div className="v-stack">
                        <label className="text-sm font-medium text-slate-700 mb-[6px]">Category *</label>
                        <select
                          className="px-4 py-[11px] bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 outline-none transition-all shadow-sm"
                          value={category}
                          onChange={(e: any) => setCategory(e.target.value)}
                        >
                          <option value="">{t("common.select", "Select")}</option>
                          <option value="Tourist">Tourist</option>
                          <option value="Business">Business</option>
                          <option value="FamilyVisit">Family Visit</option>
                          <option value="Student">Student</option>
                          <option value="Transit">Transit</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="v-stack">
                        <label className="text-sm font-medium text-slate-700 mb-[6px]">Format *</label>
                        <select
                          className="px-4 py-[11px] bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 outline-none transition-all shadow-sm"
                          value={format}
                          onChange={(e: any) => setFormat(e.target.value)}
                        >
                          <option value="">{t("common.select", "Select")}</option>
                          <option value="Sticker">Sticker</option>
                          <option value="EVisa">E-Visa</option>
                          <option value="VisaOnArrival">Visa On Arrival</option>
                        </select>
                      </div>
                      <TextInput
                        type="number"
                        label="Max Stay Days"
                        placeholder="Ex: 30"
                        value={maxStayDays as any}
                        onChange={(e: any) => setMaxStayDays(e.target.value ? Number(e.target.value) : "")}
                      />
                      <TextInput
                        type="text"
                        label="Issuing Authority"
                        placeholder="Ex: Embassy of Japan"
                        value={issuingAuthority}
                        onChange={(e: any) => setIssuingAuthority(e.target.value)}
                      />
                    </div>
                  </div>
                  <TextInput
                    type="text"
                    label={t("visa.detail.visaFileUrl", "Visa Document URL")}
                    placeholder="https://..."
                    value={visaFileUrl}
                    onChange={(e: any) => setVisaFileUrl(e.target.value)}
                  />

                  <div className="h-stack justify-end gap-4 pt-4">
                    <button
                      onClick={handleRegisterDetails}
                      disabled={submitting}
                      className="px-6 py-[11px] bg-zinc-950 text-white text-sm font-semibold rounded-[1rem] hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-950 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                    >
                      {submitting ? "..." : (hasRegisteredDetails ? t("visa.action.updateDetails", "Update Details") : t("visa.action.saveDetails", "Save Visa Details"))}
                    </button>
                  </div>
                </div>
              );
            })()}

            {normalizedStatus === "under_review" && data.isSystemAssisted && (() => {
              const hasRegisteredDetails = Boolean(data.visaNumber);
              return (
                <div className="v-stack gap-5">
                  <h4 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
                    {hasRegisteredDetails
                      ? t("visa.action.process", "Process Application")
                      : t("visa.action.registerDetails", "Register Visa Details")}
                  </h4>

                  {!hasRegisteredDetails && (
                    <p className="text-sm text-slate-500 leading-relaxed max-w-[65ch] -mt-3">
                      {t("visa.detail.registerDetailsDesc", "Customer has paid the service fee. Enter the issued visa information so they can view it. After saving, you can approve or reject the application.")}
                    </p>
                  )}

                  <div className="v-stack gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h5 className="font-bold text-slate-700">
                      {hasRegisteredDetails
                        ? t("visa.detail.systemAssistedDetails", "Visa Details")
                        : t("visa.detail.systemAssistedDetailsRequired", "Visa Details (Required)")}
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <TextInput
                        type="text"
                        label="Destination Country (ISO) *"
                        placeholder="Ex: JP, KR, US"
                        maxLength={3}
                        value={destinationCountryInput}
                        onChange={(e: any) => setDestinationCountryInput(e.target.value.toUpperCase())}
                      />
                      <TextInput
                        type="text"
                        label={`Visa Number${hasRegisteredDetails ? "" : " *"}`}
                        placeholder="Ex: V123456"
                        value={visaNumber}
                        onChange={(e: any) => setVisaNumber(e.target.value)}
                      />
                      <div className="v-stack">
                        <label className="text-sm font-medium text-slate-700 mb-[6px]">Entry Type</label>
                        <select
                          className="px-4 py-[11px] bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 outline-none transition-all shadow-sm"
                          value={entryType}
                          onChange={(e: any) => setEntryType(e.target.value)}
                        >
                          <option value="">{t("common.select", "Select")}</option>
                          <option value="Single">Single</option>
                          <option value="Double">Double</option>
                          <option value="Multiple">Multiple</option>
                        </select>
                      </div>
                      <TextInput
                        type="date"
                        label={`Issued At${hasRegisteredDetails ? "" : " *"}`}
                        value={issuedAt}
                        onChange={(e: any) => setIssuedAt(e.target.value)}
                      />
                      <TextInput
                        type="date"
                        label={`Expires At${hasRegisteredDetails ? "" : " *"}`}
                        value={expiresAt}
                        onChange={(e: any) => setExpiresAt(e.target.value)}
                      />
                      <div className="v-stack">
                        <label className="text-sm font-medium text-slate-700 mb-[6px]">{`Category${hasRegisteredDetails ? "" : " *"}`}</label>
                        <select
                          className="px-4 py-[11px] bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 outline-none transition-all shadow-sm"
                          value={category}
                          onChange={(e: any) => setCategory(e.target.value)}
                        >
                          <option value="">{t("common.select", "Select")}</option>
                          <option value="Tourist">Tourist</option>
                          <option value="Business">Business</option>
                          <option value="FamilyVisit">Family Visit</option>
                          <option value="Student">Student</option>
                          <option value="Transit">Transit</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="v-stack">
                        <label className="text-sm font-medium text-slate-700 mb-[6px]">{`Format${hasRegisteredDetails ? "" : " *"}`}</label>
                        <select
                          className="px-4 py-[11px] bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 outline-none transition-all shadow-sm"
                          value={format}
                          onChange={(e: any) => setFormat(e.target.value)}
                        >
                          <option value="">{t("common.select", "Select")}</option>
                          <option value="Sticker">Sticker</option>
                          <option value="EVisa">E-Visa</option>
                          <option value="VisaOnArrival">Visa On Arrival</option>
                        </select>
                      </div>
                      <TextInput
                        type="number"
                        label="Max Stay Days"
                        placeholder="Ex: 30"
                        value={maxStayDays as any}
                        onChange={(e: any) => setMaxStayDays(e.target.value ? Number(e.target.value) : "")}
                      />
                      <TextInput
                        type="text"
                        label="Issuing Authority"
                        placeholder="Ex: Embassy of Japan"
                        value={issuingAuthority}
                        onChange={(e: any) => setIssuingAuthority(e.target.value)}
                      />
                    </div>
                  </div>
                  <TextInput
                    type="text"
                    label={t("visa.detail.visaFileUrl", "Visa Document URL")}
                    placeholder="https://..."
                    value={visaFileUrl}
                    onChange={(e: any) => setVisaFileUrl(e.target.value)}
                  />

                  {!hasRegisteredDetails ? (
                    <div className="h-stack justify-end gap-4 pt-4">
                      <button
                        onClick={handleRegisterDetails}
                        disabled={submitting}
                        className="px-6 py-[11px] bg-zinc-950 text-white text-sm font-semibold rounded-[1rem] hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-950 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                      >
                        {submitting ? "..." : t("visa.action.saveDetails", "Save Visa Details")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <Textarea
                        label={t("visa.detail.refusalReason", "Refusal Reason (Required for Rejection)")}
                        placeholder={t("visa.detail.refusalReasonPlaceholder", "Enter reason...")}
                        value={refusalReason}
                        onChange={(e: any) => setRefusalReason(e.target.value)}
                        row={3}
                      />
                      <div className="h-stack justify-between items-center gap-4 pt-4">
                        <button
                          onClick={handleRegisterDetails}
                          disabled={submitting}
                          className="px-4 py-[9px] bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-[0.875rem] hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {t("visa.action.updateDetails", "Update Details")}
                        </button>
                        <div className="h-stack gap-4">
                          <button
                            onClick={() => handleUpdateStatus(4)}
                            disabled={submitting || !refusalReason}
                            className="px-6 py-[11px] bg-red-50 text-red-600 text-sm font-semibold rounded-[1rem] hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-500"
                          >
                            {t("common.reject", "Reject")}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(3)}
                            disabled={submitting}
                            className="px-6 py-[11px] bg-emerald-600 text-white text-sm font-semibold rounded-[1rem] shadow-[0_8px_20px_-6px_rgba(5,150,105,0.3)] hover:bg-emerald-700 hover:shadow-[0_8px_20px_-6px_rgba(5,150,105,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                          >
                            {t("common.approve", "Approve")}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {(normalizedStatus === "approved" || normalizedStatus === "rejected") && (
              <div className="v-stack gap-5 bg-[#f9fafb] p-6 rounded-[1.5rem] border border-slate-200/50 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
                <h4 className="text-xl font-bold tracking-tight text-slate-900 mb-2">{t("visa.detail.decisionInfo", "Decision Information")}</h4>
                {data.isSystemAssisted && data.serviceFee > 0 && (
                  <div className="v-stack mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t("visa.detail.serviceFee", "Service Fee")}</p>
                    <p className="text-sm text-slate-900 font-medium">
                      {data.serviceFee.toLocaleString()} VND 
                      {data.serviceFeePaidAt && <span className="text-emerald-600 ml-2">({t("common.paid", "Paid")})</span>}
                    </p>
                  </div>
                )}
                {data.visaFileUrl && (
                  <div className="v-stack">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t("visa.detail.visaFile", "Visa Document")}</p>
                    <a href={data.visaFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                      {t("visa.detail.viewDocument", "View Document")} &rarr;
                    </a>
                  </div>
                )}
                
                {normalizedStatus === "approved" && (
                  <div className="mt-2 border-t border-slate-200/50 pt-4">
                    <h5 className="font-bold text-slate-700 mb-3">{t("visa.detail.systemAssistedDetails", "Visa Details")}</h5>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="v-stack">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Visa Number</p>
                        <p className="text-sm font-medium text-slate-900">{data.visaNumber || "—"}</p>
                      </div>
                      <div className="v-stack">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Entry Type</p>
                        <p className="text-sm font-medium text-slate-900">
                          {data.entryType || "—"}
                        </p>
                      </div>
                      <div className="v-stack">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Issued At</p>
                        <p className="text-sm font-medium text-slate-900">
                          {data.issuedAt ? new Date(data.issuedAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div className="v-stack">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Expires At</p>
                        <p className="text-sm font-medium text-slate-900">
                          {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div className="v-stack">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Category</p>
                        <p className="text-sm font-medium text-slate-900">
                          {data.category === "FamilyVisit" ? "Family Visit" : data.category === "VisaOnArrival" ? "Visa On Arrival" : data.category || "—"}
                        </p>
                      </div>
                      <div className="v-stack">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Format</p>
                        <p className="text-sm font-medium text-slate-900">
                          {data.format === "EVisa" ? "E-Visa" : data.format === "VisaOnArrival" ? "Visa On Arrival" : data.format || "—"}
                        </p>
                      </div>
                      <div className="v-stack">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Max Stay Days</p>
                        <p className="text-sm font-medium text-slate-900">{data.maxStayDays ? `${data.maxStayDays} days` : "—"}</p>
                      </div>
                      <div className="v-stack">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Issuing Authority</p>
                        <p className="text-sm font-medium text-slate-900">{data.issuingAuthority || "—"}</p>
                      </div>
                    </div>
                  </div>
                )}
                {data.refusalReason && (
                  <div className="v-stack">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t("visa.detail.refusalReason", "Refusal Reason")}</p>
                    <p className="text-sm text-red-600 font-medium">{data.refusalReason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
