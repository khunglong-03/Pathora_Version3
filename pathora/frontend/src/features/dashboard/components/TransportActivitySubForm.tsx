import React from "react";
import { isExternalOnlyTransportation } from "@/types/tour";

export interface TransportFields {
  transportationType: string;
  requestedVehicleType: string;
  requestedSeatCount: string;
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  arrivalTime: string;
  externalTransportReference: string;
  transportationName: string;
}

interface TransportActivitySubFormProps {
  fields: TransportFields;
  onChange: (updates: Partial<TransportFields>) => void;
  isEditing: boolean;
}

const inputCls = "w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-sm transition-all";
const labelCls = "block text-xs font-semibold text-slate-700 mb-1.5";

export function TransportActivitySubForm({ fields, onChange }: TransportActivitySubFormProps) {
  const isExternal = isExternalOnlyTransportation(fields.transportationType);
  const isGround = fields.transportationType && !isExternal;

  return (
    <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Điểm đi</label>
          <input
            className={inputCls}
            value={fields.fromLocation}
            onChange={(e) => onChange({ fromLocation: e.target.value })}
            placeholder="VD: Sân bay Nội Bài"
          />
        </div>
        <div>
          <label className={labelCls}>Điểm đến</label>
          <input
            className={inputCls}
            value={fields.toLocation}
            onChange={(e) => onChange({ toLocation: e.target.value })}
            placeholder="VD: Khách sạn Hà Nội"
          />
        </div>
      </div>

      {isGround && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Loại xe yêu cầu *</label>
            <select
              className={inputCls}
              value={fields.requestedVehicleType}
              onChange={(e) => onChange({ requestedVehicleType: e.target.value })}
            >
              <option value="">-- Chọn loại xe --</option>
              <option value="1">Car</option>
              <option value="2">Bus</option>
              <option value="3">Minibus</option>
              <option value="4">Van</option>
              <option value="5">Coach</option>
              <option value="6">Motorbike</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Số ghế yêu cầu *</label>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={fields.requestedSeatCount}
              onChange={(e) => onChange({ requestedSeatCount: e.target.value })}
              placeholder="VD: 16"
            />
          </div>
        </div>
      )}

      {isExternal && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tên hãng chuyến / Phương tiện</label>
              <input
                className={inputCls}
                value={fields.transportationName}
                onChange={(e) => onChange({ transportationName: e.target.value })}
                placeholder="VD: Vietnam Airlines VN245"
              />
            </div>
            <div>
              <label className={labelCls}>Số hiệu chuyến bay / Chuyến tàu dự kiến</label>
              <input
                className={inputCls}
                value={fields.externalTransportReference}
                onChange={(e) => onChange({ externalTransportReference: e.target.value })}
                placeholder="VD: VN245, SE3..."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Giờ khởi hành dự kiến</label>
              <input
                type="time"
                className={inputCls}
                value={fields.departureTime}
                onChange={(e) => onChange({ departureTime: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Giờ đến dự kiến</label>
              <input
                type="time"
                className={inputCls}
                value={fields.arrivalTime}
                onChange={(e) => onChange({ arrivalTime: e.target.value })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
