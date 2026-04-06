"use client";
import React from "react";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";

const FloatingButtons = () => (
  <div className="fixed right-4 bottom-[40%] z-50 flex flex-col gap-3 items-center">
    <a
      href="#"
      aria-label="Facebook"
      className="w-11 h-11 rounded-full bg-[#1877f2] shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity">
      <Icon icon="mdi:facebook" className="w-5 h-5 text-white" />
    </a>
    <Button
      aria-label="Chat"
      className="w-11 h-11 rounded-full bg-[#fa8b02] shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity">
      <Icon
        icon="heroicons-outline:chat-bubble-oval-left"
        className="w-5 h-5 text-white"
      />
    </Button>
  </div>
);

export { FloatingButtons };
