"use client";

import React from "react";
import Link from "next/link";
import ErrorImage from "@/assets/images/all-img/404-2.svg";

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center py-20 dark:bg-slate-900">
      <img src={ErrorImage.src || ErrorImage} alt="" />
      <div className="max-w-136.5 mx-auto w-full mt-12">
        <h4 className="text-slate-900 mb-4">Page not found</h4>
        <div className="dark:text-white text-base font-normal mb-10">
          The page you are looking for might have been removed had its name
          changed or is temporarily unavailable.
        </div>
      </div>
      <div className="max-w-75 mx-auto w-full">
        <Link
          href="/home"
          className="btn btn-dark dark:bg-slate-800 block text-center">
          Go to homepage
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
