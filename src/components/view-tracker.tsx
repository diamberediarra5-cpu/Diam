"use client";

import { useEffect } from "react";
import { markViewedAction } from "@/actions/quotes";

export function ViewTracker({ token }: { token: string }) {
  useEffect(() => {
    void markViewedAction(token);
  }, [token]);
  return null;
}
