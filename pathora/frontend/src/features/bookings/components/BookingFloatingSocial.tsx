"use client";
import React from "react";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";
import { SOCIAL_MEDIA } from "@/configs/urls";

export function BookingFloatingSocial() {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3">
      <a
        href={SOCIAL_MEDIA.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="size-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <Icon icon="mdi:facebook" className="size-5 text-blue-600" />
      </a>
      <Button
        type="button"
        className="size-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <Icon
          icon="heroicons:chat-bubble-oval-left-ellipsis"
          className="size-5 text-gray-600"
        />
      </Button>
    </div>
  );
}
