const fs = require("fs");
let content = fs.readFileSync("pathora/frontend/src/features/bookings/components/CustomerAddParticipants.tsx", "utf-8");

// Add ParticipantVisaApplication interface
content = content.replace(
  /interface Participant \{/,
  `interface ParticipantVisaApplication {
  id: string;
  destinationCountry: string;
  minReturnDate: string;
  visaFileUrl: string;
}

interface Participant {`
);

// Replace the 3 visa fields with visaApplicationsList
content = content.replace(
  /\/\/ Visa application \(used when visaMode === "has_visa"\)\n\s+destinationCountry: string;\n\s+minReturnDate: string;\n\s+visaFileUrl: string;/,
  `// Visa applications (used when visaMode === "has_visa")
  visaApplicationsList: ParticipantVisaApplication[];`
);

// Update blankVisaFields type
content = content.replace(
  /\| "destinationCountry"\n\s+\| "minReturnDate"\n\s+\| "visaFileUrl"/,
  `| "visaApplicationsList"`
);

// Update blankVisaFields return object
content = content.replace(
  /destinationCountry: "",\n\s+minReturnDate: defaults\?\.minReturnDate \?\? "",\n\s+visaFileUrl: "",/,
  `visaApplicationsList: [{ id: \`new-visa-\${Date.now()}\`, destinationCountry: "", minReturnDate: defaults?.minReturnDate ?? "", visaFileUrl: "" }],`
);

// Update fetchData
content = content.replace(
  /const latestApp = visaApps\[visaApps\.length - 1\];\n\s+const hasVisaApp = !!latestApp;\n\s+const presetMode: VisaMode = latestApp\?\.isSystemAssisted\n\s+\? "needs_support"\n\s+: hasPassport\n\s+\? "has_visa"\n\s+: "";/,
  `const hasVisaApp = visaApps.length > 0;
        const presetMode: VisaMode = visaApps.some((a: any) => a.isSystemAssisted)
          ? "needs_support"
          : hasPassport
            ? "has_visa"
            : "";
            
        const visaApplicationsList = visaApps.map((a: any, i: number) => ({
          id: a.id || \`visa-\${Date.now()}-\${i}\`,
          destinationCountry: a.destinationCountry ?? "",
          minReturnDate: a.minReturnDate ? a.minReturnDate.split("T")[0] : returnDateIso,
          visaFileUrl: a.visaFileUrl ?? "",
        }));
        if (visaApplicationsList.length === 0) {
          visaApplicationsList.push({ id: \`new-visa-\${Date.now()}\`, destinationCountry: "", minReturnDate: returnDateIso, visaFileUrl: "" });
        }`
);

content = content.replace(
  /destinationCountry: latestApp\?\.destinationCountry \?\? "",\n\s+minReturnDate: latestApp\?\.minReturnDate \? latestApp\.minReturnDate\.split\("T"\)\[0\] : returnDateIso,\n\s+visaFileUrl: latestApp\?\.visaFileUrl \?\? "",/,
  `visaApplicationsList,`
);

// Update validateRow
content = content.replace(
  /if \(p\.visaMode === "has_visa"\) \{\n\s+if \(!p\.passportNumber\.trim\(\)\) return `\$\{p\.fullName\}: thiếu số passport\.`;\n\s+if \(!p\.passportNationality\.trim\(\)\) return `\$\{p\.fullName\}: thiếu quốc tịch passport\.`;\n\s+if \(!p\.passportIssuedAt\) return `\$\{p\.fullName\}: thiếu ngày cấp passport\.`;\n\s+if \(!p\.passportExpiresAt\) return `\$\{p\.fullName\}: thiếu ngày hết hạn passport\.`;\n\s+if \(tourReturnDate && new Date\(p\.passportExpiresAt\) < new Date\(tourReturnDate\)\) \{\n\s+return `\$\{p\.fullName\}: passport phải còn hạn sau ngày kết thúc tour \(\$\{tourReturnDate\}\)\.`;\n\s+\}\n\s+if \(!p\.passportFileUrl\.trim\(\)\) return `\$\{p\.fullName\}: thiếu file passport\.`;\n\s+if \(!p\.destinationCountry\.trim\(\)\) return `\$\{p\.fullName\}: thiếu quốc gia đến\.`;\n\s+\}/,
  `if (p.visaMode) {
      if (!p.passportNumber.trim()) return \`\${p.fullName}: thiếu số passport.\`;
      if (!p.passportNationality.trim()) return \`\${p.fullName}: thiếu quốc tịch passport.\`;
      if (!p.passportIssuedAt) return \`\${p.fullName}: thiếu ngày cấp passport.\`;
      if (!p.passportExpiresAt) return \`\${p.fullName}: thiếu ngày hết hạn passport.\`;
      if (tourReturnDate && new Date(p.passportExpiresAt) < new Date(tourReturnDate)) {
        return \`\${p.fullName}: passport phải còn hạn sau ngày kết thúc tour (\${tourReturnDate}).\`;
      }
      if (!p.passportFileUrl.trim()) return \`\${p.fullName}: thiếu file passport.\`;
    }
    if (p.visaMode === "has_visa") {
      if (p.visaApplicationsList.length === 0) return \`\${p.fullName}: vui lòng thêm hồ sơ visa.\`;
      for (const v of p.visaApplicationsList) {
        if (!v.destinationCountry.trim()) return \`\${p.fullName}: thiếu quốc gia đến cho một trong các hồ sơ visa.\`;
      }
    }`
);

// Update handleSave
content = content.replace(
  /if \(p\.visaMode === "has_visa"\) \{\n\s+await bookingService\.upsertParticipantPassport\(bookingId, participantId, \{\n\s+passportNumber: p\.passportNumber,\n\s+nationality: p\.passportNationality,\n\s+issuedAt: p\.passportIssuedAt \? new Date\(p\.passportIssuedAt\)\.toISOString\(\) : null,\n\s+expiresAt: p\.passportExpiresAt \? new Date\(p\.passportExpiresAt\)\.toISOString\(\) : null,\n\s+fileUrl: p\.passportFileUrl \|\| null,\n\s+\}\);\n\s+if \(!p\.hasVisaApp\) \{\n\s+await bookingService\.submitVisaApplication\(bookingId, \{\n\s+bookingParticipantId: participantId,\n\s+destinationCountry: p\.destinationCountry,\n\s+minReturnDate: p\.minReturnDate \? new Date\(p\.minReturnDate\)\.toISOString\(\) : undefined,\n\s+visaFileUrl: p\.visaFileUrl \|\| undefined,\n\s+\}\);\n\s+\}\n\s+\} else if \(p\.visaMode === "needs_support"\) \{\n\s+if \(!p\.hasVisaApp\) \{\n\s+await bookingService\.requestVisaSupport\(bookingId, participantId\);\n\s+\}\n\s+\}/,
  `if (p.visaMode) {
          await bookingService.upsertParticipantPassport(bookingId, participantId, {
            passportNumber: p.passportNumber,
            nationality: p.passportNationality,
            issuedAt: p.passportIssuedAt ? new Date(p.passportIssuedAt).toISOString() : null,
            expiresAt: p.passportExpiresAt ? new Date(p.passportExpiresAt).toISOString() : null,
            fileUrl: p.passportFileUrl || null,
          });

          if (p.visaMode === "has_visa") {
            for (const v of p.visaApplicationsList) {
              if (v.id.startsWith("new-visa-")) {
                await bookingService.submitVisaApplication(bookingId, {
                  bookingParticipantId: participantId,
                  destinationCountry: v.destinationCountry,
                  minReturnDate: v.minReturnDate ? new Date(v.minReturnDate).toISOString() : undefined,
                  visaFileUrl: v.visaFileUrl || undefined,
                });
              }
            }
          } else if (p.visaMode === "needs_support") {
            if (!p.hasVisaApp) {
              await bookingService.requestVisaSupport(bookingId, participantId);
            }
          }
        }`
);

// Add helper to update visa in the component
content = content.replace(
  /const updateParticipant = /,
  `const updateVisaApp = (participantId: string, visaId: string, field: keyof ParticipantVisaApplication, value: any) => {
    setParticipants(prev => prev.map(p => {
      if (p.id !== participantId) return p;
      return {
        ...p,
        visaApplicationsList: p.visaApplicationsList.map(v => v.id === visaId ? { ...v, [field]: value } : v)
      };
    }));
  };

  const addVisaApp = (participantId: string) => {
    setParticipants(prev => prev.map(p => {
      if (p.id !== participantId) return p;
      return {
        ...p,
        visaApplicationsList: [...p.visaApplicationsList, { id: \`new-visa-\${Date.now()}\`, destinationCountry: "", minReturnDate: tourReturnDate, visaFileUrl: "" }]
      };
    }));
  };

  const removeVisaApp = (participantId: string, visaId: string) => {
    setParticipants(prev => prev.map(p => {
      if (p.id !== participantId) return p;
      return {
        ...p,
        visaApplicationsList: p.visaApplicationsList.filter(v => v.id !== visaId)
      };
    }));
  };

  const updateParticipant = `
);

// Replace UI blocks
const uiOld = `{p.visaMode === "has_visa" && (
                      <div className="bg-slate-50 rounded-2xl p-5 v-stack gap-4 border border-slate-200">
                        <p className="text-sm font-bold text-slate-700">Thông tin passport</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Passport Number</label>
                            <input
                              type="text"
                              value={p.passportNumber}
                              onChange={(e) => updateParticipant(p.id, "passportNumber", e.target.value)}
                              placeholder="C1234567"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Passport Nationality</label>
                            <input
                              type="text"
                              maxLength={3}
                              value={p.passportNationality}
                              onChange={(e) => updateParticipant(p.id, "passportNationality", e.target.value.toUpperCase())}
                              placeholder="VN"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Issued Date</label>
                            <input
                              type="date"
                              value={p.passportIssuedAt}
                              onChange={(e) => updateParticipant(p.id, "passportIssuedAt", e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">
                              Expires Date {tourReturnDate && <span className="font-normal text-slate-400">(sau {tourReturnDate})</span>}
                            </label>
                            <input
                              type="date"
                              value={p.passportExpiresAt}
                              onChange={(e) => updateParticipant(p.id, "passportExpiresAt", e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Passport File URL</label>
                            <input
                              type="url"
                              value={p.passportFileUrl}
                              onChange={(e) => updateParticipant(p.id, "passportFileUrl", e.target.value)}
                              placeholder="https://..."
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                        </div>

                        <p className="text-sm font-bold text-slate-700 mt-2">Hồ sơ visa</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Destination Country (ISO)</label>
                            <input
                              type="text"
                              maxLength={3}
                              value={p.destinationCountry}
                              onChange={(e) => updateParticipant(p.id, "destinationCountry", e.target.value.toUpperCase())}
                              placeholder="JP, US, KR..."
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Min Return Date</label>
                            <input
                              type="date"
                              value={p.minReturnDate}
                              onChange={(e) => updateParticipant(p.id, "minReturnDate", e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Visa File URL (tùy chọn)</label>
                            <input
                              type="url"
                              value={p.visaFileUrl}
                              onChange={(e) => updateParticipant(p.id, "visaFileUrl", e.target.value)}
                              placeholder="https://..."
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {p.visaMode === "needs_support" && (
                      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 text-sm text-amber-900">
                        <p className="font-bold mb-1">Yêu cầu hỗ trợ làm visa</p>
                        <p>
                          Sau khi lưu, hệ thống tạo yêu cầu hỗ trợ. Operator sẽ báo phí dịch vụ; khi xác nhận và thanh toán, đội ngũ làm hồ sơ visa thay khách.
                        </p>
                      </div>
                    )}`;

const uiNew = `{p.visaMode && (
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mt-4 flex flex-col gap-4">
                        <p className="text-sm font-bold text-slate-700">Thông tin passport</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Passport Number</label>
                            <input
                              type="text"
                              value={p.passportNumber}
                              onChange={(e) => updateParticipant(p.id, "passportNumber", e.target.value)}
                              placeholder="C1234567"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Passport Nationality</label>
                            <input
                              type="text"
                              maxLength={3}
                              value={p.passportNationality}
                              onChange={(e) => updateParticipant(p.id, "passportNationality", e.target.value.toUpperCase())}
                              placeholder="VN"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Issued Date</label>
                            <input
                              type="date"
                              value={p.passportIssuedAt}
                              onChange={(e) => updateParticipant(p.id, "passportIssuedAt", e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">
                              Expires Date {tourReturnDate && <span className="font-normal text-slate-400">(sau {tourReturnDate})</span>}
                            </label>
                            <input
                              type="date"
                              value={p.passportExpiresAt}
                              onChange={(e) => updateParticipant(p.id, "passportExpiresAt", e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Passport File URL</label>
                            <input
                              type="url"
                              value={p.passportFileUrl}
                              onChange={(e) => updateParticipant(p.id, "passportFileUrl", e.target.value)}
                              placeholder="https://..."
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                        </div>

                        {p.visaMode === "has_visa" && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-sm font-bold text-slate-700">Hồ sơ visa ({p.visaApplicationsList.length})</p>
                              <button
                                type="button"
                                onClick={() => addVisaApp(p.id)}
                                className="text-xs font-bold text-slate-900 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                + Thêm visa
                              </button>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                              {p.visaApplicationsList.map((v, vIndex) => (
                                <div key={v.id} className="relative bg-white border border-slate-200 rounded-xl p-4">
                                  {p.visaApplicationsList.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeVisaApp(p.id, v.id)}
                                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition-colors"
                                      title="Xóa visa"
                                    >
                                      <Trash weight="bold" className="size-4" />
                                    </button>
                                  )}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-xs font-bold text-slate-600 mb-1 block">Destination Country (ISO)</label>
                                      <input
                                        type="text"
                                        maxLength={3}
                                        value={v.destinationCountry}
                                        onChange={(e) => updateVisaApp(p.id, v.id, "destinationCountry", e.target.value.toUpperCase())}
                                        placeholder="JP, US, KR..."
                                        disabled={!v.id.startsWith("new-visa-")}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-60"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold text-slate-600 mb-1 block">Min Return Date</label>
                                      <input
                                        type="date"
                                        value={v.minReturnDate}
                                        onChange={(e) => updateVisaApp(p.id, v.id, "minReturnDate", e.target.value)}
                                        disabled={!v.id.startsWith("new-visa-")}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-60"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="text-xs font-bold text-slate-600 mb-1 block">Visa File URL (tùy chọn)</label>
                                      <input
                                        type="url"
                                        value={v.visaFileUrl}
                                        onChange={(e) => updateVisaApp(p.id, v.id, "visaFileUrl", e.target.value)}
                                        placeholder="https://..."
                                        disabled={!v.id.startsWith("new-visa-")}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-60"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {p.visaMode === "needs_support" && (
                          <div className="mt-2 bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm text-amber-900">
                            <p className="font-bold mb-1">Yêu cầu hỗ trợ làm visa</p>
                            <p>
                              Hệ thống sẽ dùng thông tin passport trên để tạo yêu cầu hỗ trợ. Operator sẽ báo phí dịch vụ sau.
                            </p>
                          </div>
                        )}
                      </div>
                    )}`;

content = content.replace(uiOld, uiNew);

fs.writeFileSync("pathora/frontend/src/features/bookings/components/CustomerAddParticipants.tsx", content, "utf-8");
