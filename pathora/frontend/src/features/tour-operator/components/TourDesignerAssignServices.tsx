"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Handshake, Star, CheckCircle, PlusCircle } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { SAMPLE_SERVICE_OPTIONS } from "./TourOperatorAssignServicesData";

export function TourOperatorAssignServices({ instanceId }: { instanceId: string }) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const formatCurrency = (amount: number) => `${amount.toLocaleString('vi-VN')} VND`;

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-8 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <Link
          href={`/tour-operator/tour-instances/${instanceId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft weight="bold" className="size-4" />
          Back to Tour Instance
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-100">
              <Handshake weight="bold" className="size-4" />
              Additional Services
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 leading-none">
              Assign Services
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Tour Instance: {instanceId}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:scale-[0.98] transition-transform shadow-lg shadow-slate-900/20">
              Confirm Assignments ({selectedServices.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SAMPLE_SERVICE_OPTIONS.map((option) => {
            const isSelected = selectedServices.includes(option.id) || option.status === "assigned";
            const isPreAssigned = option.status === "assigned";

            return (
              <motion.div 
                key={option.id}
                whileHover={{ y: -2 }}
                onClick={() => !isPreAssigned && toggleService(option.id)}
                className={`relative bg-white rounded-[2rem] border transition-all ${!isPreAssigned && 'cursor-pointer'} overflow-hidden p-6 lg:p-8 flex flex-col justify-between ${
                  isSelected 
                    ? "border-emerald-500 shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500" 
                    : "border-slate-200/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:border-emerald-300"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-6 right-6 text-emerald-500">
                    <CheckCircle weight="fill" className="size-6" />
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-md">
                      {option.serviceType}
                    </span>
                    {isPreAssigned && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Already Assigned</span>
                    )}
                  </div>
                  
                  <h4 className="text-xl font-bold tracking-tight text-slate-900 mb-2">{option.providerName}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6">
                    {option.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Star weight="fill" className="size-4 text-orange-400" />
                    <span className="text-sm font-bold text-slate-600">{option.rating}</span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 border-dashed flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Pricing</p>
                      <p className="text-lg font-bold font-mono text-slate-900">{formatCurrency(option.pricePerUnit)}</p>
                      <p className="text-xs text-slate-500 mt-1">{option.unit}</p>
                    </div>
                    
                    {!isSelected && (
                      <div className="text-slate-300">
                        <PlusCircle weight="bold" className="size-8" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
