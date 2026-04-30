const fs = require('fs');
const file = '/Users/mac/Documents/GitHub/Pathora_Version3/pathora/frontend/src/features/dashboard/components/ExternalTicketAssignmentPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const [dataLoading, setDataLoading] = useState(false);',
  `const [dataLoading, setDataLoading] = useState(false);
  const [commonDetails, setCommonDetails] = useState({
    flightNumber: "",
    seatClass: "Economy",
    departureAt: "",
    arrivalAt: "",
  });`
);

content = content.replace(
  /for \(const t of fetched\) \{[\s\S]*?loadedIds\.add\(lowerBookingId\);\n\s*\}/,
  `let firstTicket = null;
          for (const t of fetched) {
            console.log("Processing ticket:", t);
            if (!firstTicket) firstTicket = t;
            const lowerBookingId = t.bookingId?.toLowerCase();
            if (!lowerBookingId) continue;
            loadedEntries[lowerBookingId] = {
              seatNumbers: t.seatNumbers || "",
              eTicketNumbers: t.eTicketNumbers || "",
              note: t.note || "",
            };
            loadedIds.add(lowerBookingId);
          }

          if (firstTicket) {
            setCommonDetails({
              flightNumber: firstTicket.flightNumber || "",
              seatClass: firstTicket.seatClass || "Economy",
              departureAt: firstTicket.departureAt ? new Date(firstTicket.departureAt).toISOString().slice(0, 16) : "",
              arrivalAt: firstTicket.arrivalAt ? new Date(firstTicket.arrivalAt).toISOString().slice(0, 16) : "",
            });
          }`
);

// Remove applyTransportToAll
content = content.replace(/const applyTransportToAll = useCallback\([\s\S]*?toast\.success\("Đã sao chép thông tin chuyến đi cho tất cả booking"\);\n\s*\}, \[entries\]\);\n/, '');

// Replace handleSave
content = content.replace(/const handleSave = async \([\s\S]*?setSavingId\(null\);\n\s*\};\n/,
  `const handleSave = async (bookingId: string) => {
    const entry = entries[bookingId.toLowerCase()];
    if (!entry) return;

    if (!commonDetails.flightNumber.trim()) {
      toast.error("Vui lòng nhập số hiệu chuyến bay/tàu");
      return;
    }

    if (!commonDetails.departureAt || !commonDetails.arrivalAt) {
      toast.error("Vui lòng nhập đầy đủ giờ đi và giờ đến");
      return;
    }

    const depDate = new Date(commonDetails.departureAt);
    const arrDate = new Date(commonDetails.arrivalAt);

    if (arrDate <= depDate) {
      toast.error("Giờ đến phải lớn hơn giờ đi");
      return;
    }

    if (activityDate) {
      const actDate = new Date(activityDate);
      actDate.setHours(0, 0, 0, 0);
      if (depDate < actDate) {
        toast.error(\`Giờ khởi hành không được trước ngày hoạt động diễn ra (\${new Date(activityDate).toLocaleDateString("vi-VN")})\`);
        return;
      }
    }

    try {
      setSavingId(bookingId);
      const fullEntry = {
        ...entry,
        flightNumber: commonDetails.flightNumber,
        seatClass: commonDetails.seatClass,
        departureAt: commonDetails.departureAt,
        arrivalAt: commonDetails.arrivalAt,
      };
      await onSave?.(fullEntry);
      setSavedIds((prev) => new Set([...prev, bookingId.toLowerCase()]));
      toast.success(\`Đã lưu vé cho \${entry.customerName}\`);
    } catch {
      toast.error("Lưu vé thất bại. Vui lòng thử lại.");
    } finally {
      setSavingId(null);
    }
  };\n`
);

// Remove the common fields from the grid inside map
// Let's use regex to remove the first 4 columns (flight, class, dep, arr)
// We will replace the entire "div className="space-y-5" up to "Số ghế"
const jsxRegex = /<div className="grid grid-cols-1 md:grid-cols-4 gap-5">[\s\S]*?\{\/\* Seat numbers \*\/\}/;
content = content.replace(jsxRegex, `<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Seat numbers */}`);

// We also need to add the common form at the top, just before the "{/* Booking list */}"
const commonFormHtml = `
      {/* Thông tin chuyến đi (Common) */}
      <div className="p-6 bg-stone-50 border-t border-stone-100">
        <h4 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <Icon icon="heroicons:paper-airplane" className="size-4 text-stone-500" />
          Thông tin chung cho cả đoàn
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              {transportType === "Flight" ? "Chuyến bay *" : transportType === "Train" ? "Chuyến tàu *" : "Tàu thuyền *"}
            </label>
            <input
              type="text"
              value={commonDetails.flightNumber}
              onChange={(e) => setCommonDetails(prev => ({ ...prev, flightNumber: e.target.value }))}
              placeholder={transportType === "Flight" ? "VN 123" : "SE1"}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Hạng ghế</label>
            <select
              value={commonDetails.seatClass}
              onChange={(e) => setCommonDetails(prev => ({ ...prev, seatClass: e.target.value }))}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              {seatClassOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Giờ đi *</label>
            <input
              type="datetime-local"
              value={commonDetails.departureAt}
              onChange={(e) => setCommonDetails(prev => ({ ...prev, departureAt: e.target.value }))}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Giờ đến *</label>
            <input
              type="datetime-local"
              value={commonDetails.arrivalAt}
              onChange={(e) => setCommonDetails(prev => ({ ...prev, arrivalAt: e.target.value }))}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>
        </div>
      </div>

`;

content = content.replace('{/* Booking list */}', commonFormHtml + '      {/* Booking list */}');

// Finally remove the copy button if it exists
const copyBtnRegex = /<div className="flex items-center gap-3">[\s\S]*?<button[\s\S]*?onClick=\{\(\) => applyTransportToAll[\s\S]*?<\/button>[\s\S]*?<\/div>/;
content = content.replace(copyBtnRegex, '');

// Also remove duplicate "Sao chép" button if it was in the JSX somewhere else:
content = content.replace(/<button[^>]*onClick=\{\(\) => applyTransportToAll[^>]*>[^<]*<\/button>/g, '');

fs.writeFileSync(file, content);
console.log("Done");
