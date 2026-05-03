"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { tourInstanceService, GuideConflict } from "@/api/services/tourInstanceService";
import { userService } from "@/api/services/userService";
import { NormalizedTourInstanceDto } from "@/types/tour";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

// Since UserInfo in types/tour.ts might lack fullName/email depending on how it's used, we can just use any for now or cast properly.
export function TourOperatorAssignServices({ instanceId, backUrl }: { instanceId: string; backUrl?: string }) {
  const [instance, setInstance] = useState<NormalizedTourInstanceDto | null>(null);
  const [availableGuides, setAvailableGuides] = useState<any[]>([]);
  const [selectedGuideIds, setSelectedGuideIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [conflicts, setConflicts] = useState<GuideConflict[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const [instanceData, guidesData] = await Promise.all([
          tourInstanceService.getInstanceDetail(instanceId),
          userService.getTeamGuides(),
        ]);
        
        if (isMounted) {
          const inst = instanceData as any;
          setInstance(inst);
          setAvailableGuides(guidesData);
          
          // Extract currently assigned guides
          const currentGuides = (inst.managers || [])
            .filter((m: any) => m.role === "Guide")
            .map((m: any) => m.userId);
            
          setSelectedGuideIds(currentGuides);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError("Failed to load tour instance or guides data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [instanceId]);

  const toggleGuide = (id: string) => {
    setSaveSuccess(false);
    setConflicts([]);
    setSelectedGuideIds(prev => 
      prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!instance) return;
    setSaving(true);
    setError(null);
    setConflicts([]);
    setSaveSuccess(false);

    try {
      // Check availability if any guides are selected
      if (selectedGuideIds.length > 0) {
        const availResult = await tourInstanceService.checkGuideAvailability(selectedGuideIds, instance.startDate, instance.endDate);
        if (availResult?.conflicts && availResult.conflicts.length > 0) {
          setConflicts(availResult.conflicts);
          setSaving(false);
          return; // Stop saving if conflicts exist
        }
      }

      // No conflicts, proceed to save
      await tourInstanceService.assignGuides({ id: instanceId, guideUserIds: selectedGuideIds });

      setSaveSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to assign guides");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f9fafb] p-8 max-w-[1200px] mx-auto"><SkeletonCard /></div>;
  if (error || !instance) return <div className="min-h-screen bg-[#f9fafb] p-8 text-rose-500 font-medium center flex-col gap-4">
    <WarningCircle weight="bold" className="size-10" />
    {error || "Instance not found"}
  </div>;

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-8 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Navigation */}
        <Link
          href={backUrl || `/tour-operator/tour-instances/${instanceId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft weight="bold" className="size-4" />
          Back to Tour Instance
        </Link>

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-100">
              <Users weight="bold" className="size-4" />
              Service Assignment
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 leading-none">
              Assign Tour Guides
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Tour: {instance.tourName} &bull; Dates: {new Date(instance.startDate).toLocaleDateString()} - {new Date(instance.endDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:scale-[0.98] transition-transform shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              {saving ? "Saving..." : `Confirm Assignments (${selectedGuideIds.length})`}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {saveSuccess && (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-[1.5rem] flex items-center gap-3">
            <CheckCircle weight="fill" className="size-6 text-emerald-500 shrink-0" />
            <p className="font-medium">Guide assignments updated successfully.</p>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="mb-8 bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-[1.5rem]">
            <div className="flex items-center gap-3 mb-4">
              <WarningCircle weight="fill" className="size-6 text-rose-500 shrink-0" />
              <h3 className="font-bold text-lg">Schedule Conflicts Detected</h3>
            </div>
            <div className="space-y-4">
              {conflicts.map(c => {
                const guideName = availableGuides.find(g => g.id === c.guideId)?.fullName || availableGuides.find(g => g.id === c.guideId)?.username || c.guideId;
                return (
                  <div key={c.guideId} className="bg-white/50 p-4 rounded-xl border border-rose-100">
                    <p className="font-bold mb-2">Guide: {guideName}</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {c.conflictingInstances.map(ci => (
                        <li key={ci.instanceId}>
                          Already assigned to: <Link href={`/tour-operator/tour-instances/${ci.instanceId}`} className="font-semibold underline hover:text-rose-900">{ci.title}</Link> 
                          ({new Date(ci.startDate).toLocaleDateString()} - {new Date(ci.endDate).toLocaleDateString()})
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm font-medium">Please resolve conflicts by selecting different guides before saving.</p>
          </div>
        )}

        {/* Guides Grid */}
        {availableGuides.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] border border-slate-200/50 p-12 center text-slate-500 font-medium">
            No tour guides available in the system.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableGuides.map((guide) => (
              <motion.div 
                key={guide.id}
                whileHover={{ y: -2 }}
                onClick={() => toggleGuide(guide.id)}
                className={`relative bg-white rounded-[1.5rem] border transition-all cursor-pointer overflow-hidden p-6 ${
                  selectedGuideIds.includes(guide.id)
                    ? "border-emerald-500 shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500" 
                    : "border-slate-200/50 shadow-sm hover:border-emerald-300"
                }`}
              >
                {selectedGuideIds.includes(guide.id) && (
                  <div className="absolute top-4 right-4 text-emerald-500">
                    <CheckCircle weight="fill" className="size-6" />
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {guide.avatarUrl ? (
                      <img src={guide.avatarUrl} alt={guide.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-slate-400">
                        {(guide.fullName || guide.username || "G")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="pt-1 pr-8">
                    <h4 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                      {guide.fullName || guide.username || "Unnamed Guide"}
                    </h4>
                    <p className="text-sm font-medium text-slate-500 mt-1">{guide.email || "No email"}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                        Internal Staff
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
