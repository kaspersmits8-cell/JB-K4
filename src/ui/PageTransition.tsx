"use client";

import { ViewTransition, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ViewTransition key={pathname} name="page" default="none" enter="quick-fade" exit="quick-fade" share="quick-fade">
      <div className="page-transition">{children}</div>
    </ViewTransition>
  );
}
