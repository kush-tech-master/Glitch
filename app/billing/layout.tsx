"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "./lib/auth";
import Image from "next/image";

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  // Show clean subtle loader while verifying authentication
  if (!checked) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <div className="w-16 h-16 relative rounded-full overflow-hidden border border-zinc-700 animate-pulse bg-zinc-900">
          <Image
            src="/glitch-original.jpeg"
            alt="GLITCH"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs font-bold text-zinc-300">GLITCH AUTHENTICATED SESSION</p>
          <p className="text-[10px] font-mono text-zinc-500">Checking credentials & loading POS...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
