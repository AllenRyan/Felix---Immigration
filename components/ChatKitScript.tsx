"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const isDev = process.env.NODE_ENV !== "production";

export function ChatKitScript() {
  const [loadAttempted, setLoadAttempted] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    if (window.customElements?.get("openai-chatkit")) {
      if (isDev) {
        console.log("[ChatKitScript] ChatKit already loaded");
      }
      window.dispatchEvent(new Event("chatkit-script-loaded"));
    }
  }, []);

  return (
    <Script
      src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
      strategy="beforeInteractive"
      onLoad={() => {
        if (isDev) {
          console.log("[ChatKitScript] ChatKit script loaded successfully");
        }
        setLoadAttempted(true);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("chatkit-script-loaded"));
        }
      }}
      onError={(e) => {
        console.error("[ChatKitScript] ChatKit script failed to load", e);
        setLoadAttempted(true);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("chatkit-script-error", {
              detail: "Failed to load ChatKit script from CDN",
            })
          );
        }
      }}
    />
  );
}
