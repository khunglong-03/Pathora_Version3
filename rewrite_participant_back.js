const fs = require("fs");
let content = fs.readFileSync("pathora/frontend/src/features/bookings/components/CustomerAddParticipants.tsx", "utf-8");

// Remove ParticipantVisaApplication
content = content.replace(
  /interface ParticipantVisaApplication \{\n  id: string;\n  destinationCountry: string;\n  minReturnDate: string;\n  visaFileUrl: string;\n\}\n\n/,
  ""
);

// Replace visaApplicationsList with original fields
content = content.replace(
  /\/\/ Visa applications \(used when visaMode === "has_visa"\)\n\s+visaApplicationsList: ParticipantVisaApplication\[\];/,
  `// Visa application (used when visaMode === "has_visa")
  destinationCountry: string;
  minReturnDate: string;
  visaFileUrl: string;`
);

// Revert blankVisaFields type
content = content.replace(
  /\| "visaApplicationsList"/,
  `| "destinationCountry"\n  | "minReturnDate"\n  | "visaFileUrl"`
);

// Revert blankVisaFields return object
content = content.replace(
  /visaApplicationsList: \[\{ id: \`new-visa-\$\{Date\.now\(\)\}\`, destinationCountry: "", minReturnDate: defaults\?\.minReturnDate \?\? "", visaFileUrl: "" \}\],/,
  `destinationCountry: "",
  minReturnDate: defaults?.minReturnDate ?? "",
  visaFileUrl: "",`
);

// Revert fetchData
content = content.replace(
  /const hasVisaApp = visaApps\.length > 0;\n\s+const presetMode: VisaMode = visaApps\.some\(\(a: any\) => a\.isSystemAssisted\)\n\s+\? "needs_support"\n\s+: hasPassport\n\s+\? "has_visa"\n\s+: "";\n\s+const visaApplicationsList = visaApps\.map\(\(a: any, i: number\) => \(\{\n\s+id: a\.id \|\| `visa-\$\{Date\.now\(\)\}-\$\{i\}`,\n\s+destinationCountry: a\.destinationCountry \?\? "",\n\s+minReturnDate: a\.minReturnDate \? a\.minReturnDate\.split\("T"\)\[0\] : returnDateIso,\n\s+visaFileUrl: a\.visaFileUrl \?\? "",\n\s+\}\)\);\n\s+if \(visaApplicationsList\.length === 0\) \{\n\s+visaApplicationsList\.push\(\{ id: `new-visa-\$\{Date\.now\(\)\}`, destinationCountry: "", minReturnDate: returnDateIso, visaFileUrl: "" \}\);\n\s+\}/,
  `const latestApp = visaApps[visaApps.length - 1];
        const hasVisaApp = !!latestApp;
        const presetMode: VisaMode = latestApp?.isSystemAssisted
          ? "needs_support"
          : hasPassport
            ? "has_visa"
            : "";`
);

content = content.replace(
  /visaApplicationsList,/,
  `destinationCountry: latestApp?.destinationCountry ?? "",
          minReturnDate: latestApp?.minReturnDate ? latestApp.minReturnDate.split("T")[0] : returnDateIso,
          visaFileUrl: latestApp?.visaFileUrl ?? "",`
);

// Revert addVisaApp etc
content = content.replace(
  /const updateVisaApp =.*?const updateParticipant = /s,
  `const updateParticipant = `
);

// Revert validateRow
content = content.replace(
  /if \(p\.visaMode === "has_visa"\) \{\n\s+if \(p\.visaApplicationsList\.length === 0\) return `\$\{p\.fullName\}: vui lòng thêm hồ sơ visa\.`;\n\s+for \(const v of p\.visaApplicationsList\) \{\n\s+if \(!v\.destinationCountry\.trim\(\)\) return `\$\{p\.fullName\}: thiếu quốc gia đến cho một trong các hồ sơ visa\.`;\n\s+\}\n\s+\}/,
  `if (p.visaMode === "has_visa") {
      if (!p.destinationCountry.trim()) return \`\${p.fullName}: thiếu quốc gia đến.\`;
    }`
);

// Revert handleSave
content = content.replace(
  /if \(p\.visaMode === "has_visa"\) \{\n\s+for \(const v of p\.visaApplicationsList\) \{\n\s+if \(v\.id\.startsWith\("new-visa-"\)\) \{\n\s+await bookingService\.submitVisaApplication\(bookingId, \{\n\s+bookingParticipantId: participantId,\n\s+destinationCountry: v\.destinationCountry,\n\s+minReturnDate: v\.minReturnDate \? new Date\(v\.minReturnDate\)\.toISOString\(\) : undefined,\n\s+visaFileUrl: v\.visaFileUrl \|\| undefined,\n\s+\}\);\n\s+\}\n\s+\}\n\s+\} else if \(p\.visaMode === "needs_support"\) \{\n\s+if \(!p\.hasVisaApp\) \{\n\s+await bookingService\.requestVisaSupport\(bookingId, participantId\);\n\s+\}\n\s+\}/,
  `if (p.visaMode === "has_visa") {
            if (!p.hasVisaApp) {
              await bookingService.submitVisaApplication(bookingId, {
                bookingParticipantId: participantId,
                destinationCountry: p.destinationCountry,
                minReturnDate: p.minReturnDate ? new Date(p.minReturnDate).toISOString() : undefined,
                visaFileUrl: p.visaFileUrl || undefined,
              });
            }
          } else if (p.visaMode === "needs_support") {
            if (!p.hasVisaApp) {
              await bookingService.requestVisaSupport(bookingId, participantId);
            }
          }`
);

// Revert UI block
const oldUi = `{p.visaMode === "has_visa" && (
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
                        )}`;

const newUi = `{p.visaMode === "has_visa" && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-sm font-bold text-slate-700 mb-4">Hồ sơ visa</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Destination Country (ISO)</label>
                                <input
                                  type="text"
                                  maxLength={3}
                                  value={p.destinationCountry}
                                  onChange={(e) => updateParticipant(p.id, "destinationCountry", e.target.value.toUpperCase())}
                                  placeholder="JP, US, KR..."
                                  disabled={!p.isNew && p.hasVisaApp}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-60"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Min Return Date</label>
                                <input
                                  type="date"
                                  value={p.minReturnDate}
                                  onChange={(e) => updateParticipant(p.id, "minReturnDate", e.target.value)}
                                  disabled={!p.isNew && p.hasVisaApp}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-60"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Visa File URL (tùy chọn)</label>
                                <input
                                  type="url"
                                  value={p.visaFileUrl}
                                  onChange={(e) => updateParticipant(p.id, "visaFileUrl", e.target.value)}
                                  placeholder="https://..."
                                  disabled={!p.isNew && p.hasVisaApp}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-60"
                                />
                              </div>
                            </div>
                          </div>
                        )}`;
                        
content = content.replace(oldUi, newUi);

fs.writeFileSync("pathora/frontend/src/features/bookings/components/CustomerAddParticipants.tsx", content, "utf-8");
