"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserCirclePlus, UploadSimple, WarningCircle, CheckCircle, Trash } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

interface Participant {
  id: string;
  fullName: string;
  dob: string;
  documentUploaded: boolean;
}

export function CustomerAddParticipants({ bookingId }: { bookingId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", fullName: "John Doe", dob: "1985-05-15", documentUploaded: true },
    { id: "2", fullName: "", dob: "", documentUploaded: false },
  ]);

  const updateParticipant = (id: string, field: keyof Participant, value: any) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addParticipant = () => {
    setParticipants(prev => [...prev, { id: Date.now().toString(), fullName: "", dob: "", documentUploaded: false }]);
  };

  const removeParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="pt-24 pb-12 bg-white border-b border-slate-200/50">
        <div className="max-w-[1000px] mx-auto px-4 md:px-8">
          <Link
            href={`/bookings/${bookingId}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
          >
            <ArrowLeft weight="bold" className="size-4" />
            Back to Booking
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 leading-none"
              >
                Add Participants
              </motion.h1>
              <p className="text-slate-500 mt-4 max-w-lg">
                Please provide information and required documents (passport/ID) for all guests travelling on booking <span className="font-bold text-slate-900">{bookingId}</span>.
              </p>
            </div>
            <div className="shrink-0 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200 text-center">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Guests</p>
              <p className="text-3xl font-bold text-slate-900">{participants.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 gap-8">
          <AnimatePresence>
            {participants.map((p, index) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 lg:p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Guest {index + 1}</h3>
                  {participants.length > 1 && (
                    <button 
                      onClick={() => removeParticipant(p.id)}
                      className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors"
                      title="Remove Participant"
                    >
                      <Trash weight="bold" className="size-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={p.fullName}
                      onChange={(e) => updateParticipant(p.id, "fullName", e.target.value)}
                      placeholder="As shown on passport"
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Date of Birth</label>
                    <input 
                      type="date" 
                      value={p.dob}
                      onChange={(e) => updateParticipant(p.id, "dob", e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 border-dashed">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Identification Document</p>
                      <p className="text-xs text-slate-500 mt-1">Upload a clear photo of your passport or national ID.</p>
                    </div>
                    {p.documentUploaded ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-bold text-sm">
                        <CheckCircle weight="fill" className="size-5" />
                        Document Verified
                      </div>
                    ) : (
                      <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:scale-[0.98] transition-transform">
                        <UploadSimple weight="bold" className="size-5" />
                        Upload File
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={addParticipant}
            className="w-full py-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center gap-3"
          >
            <UserCirclePlus weight="fill" className="size-6" />
            Add Another Guest
          </motion.button>
        </div>

        <div className="mt-12 flex justify-end gap-4">
          <Link href={`/bookings/${bookingId}`} className="px-8 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </Link>
          <button className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 hover:scale-[0.98] transition-all">
            Save Participants
          </button>
        </div>
      </div>
    </div>
  );
}
