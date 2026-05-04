"use client";

import React from "react";
import { ManagerCancellationList } from "@/features/cancellations/components/ManagerCancellationList";

export default function ManagerCancellationsPage() {
  return (
    <div className="p-6 md:p-8 v-stack gap-6">
      <div className="v-stack gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cancellation Requests</h1>
        <p className="text-slate-500 text-sm">Review and process booking cancellation requests from customers.</p>
      </div>
      <ManagerCancellationList />
    </div>
  );
}
