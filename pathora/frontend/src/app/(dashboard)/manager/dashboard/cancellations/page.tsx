"use client";

import React from "react";
import { ManagerCancellationList } from "@/features/cancellations/components/ManagerCancellationList";

export default function ManagerCancellationsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Cancellation Requests</h1>
        <p className="text-stone-500 mt-1">Review and process booking cancellation requests from customers.</p>
      </div>
      <ManagerCancellationList />
    </div>
  );
}
