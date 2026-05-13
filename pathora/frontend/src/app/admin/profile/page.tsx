"use client";

import { Suspense } from "react";
import { ProfilePage as ProfilePageContent } from "@/features/user/profile/ProfilePage";

function ProfileLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );
}

export default function AdminProfilePage() {
  return (
    <div className="-mt-20"> {/* Negative margin to counteract the pt-20 in ProfilePage */}
      <Suspense fallback={<ProfileLoading />}>
        <ProfilePageContent />
      </Suspense>
    </div>
  );
}
