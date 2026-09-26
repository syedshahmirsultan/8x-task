"use client";

import { AlertCircle, CheckCircle2, Info, Loader2, X } from "lucide-react";
import { Toaster } from "sonner";

/**
 * App-wide toasts: white cards with a coloured status icon, a clear close
 * button, and room for an action ("View cart", "Undo"). They sit top-right
 * just under the navbar, clear of the page content and the chat button.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      offset={{ top: 84, right: 20 }}
      mobileOffset={{ top: 72, left: 12, right: 12 }}
      gap={10}
      visibleToasts={3}
      closeButton
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-success" />,
        error: <AlertCircle className="h-5 w-5 text-accent-strong" />,
        info: <Info className="h-5 w-5 text-link" />,
        loading: <Loader2 className="h-5 w-5 animate-spin text-ink-2" />,
        close: <X className="h-3.5 w-3.5" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!w-full !items-start !gap-3 !rounded-2xl !border-0 !bg-white !py-3.5 !pr-10 !pl-4 !text-ink !shadow-[0_20px_44px_-18px_rgb(19_25_33/0.4)] !ring-1 !ring-ink/[0.07]",
          icon: "!mt-0.5 !h-5 !w-5 !shrink-0",
          content: "!gap-0.5",
          title: "!text-sm !leading-snug !font-semibold !text-ink",
          description: "!text-[0.8rem] !leading-snug !text-ink-2",
          actionButton:
            "!ml-2 !h-8 !self-center !rounded-full !bg-accent-cart !px-3.5 !text-xs !font-semibold !text-ink hover:!bg-accent-cart-hover",
          cancelButton: "!h-8 !self-center !rounded-full !bg-paper-2 !px-3 !text-xs !font-medium !text-ink",
          closeButton:
            "!top-3 !right-2.5 !left-auto !h-6 !w-6 !translate-x-0 !translate-y-0 !border-0 !bg-transparent !text-muted hover:!bg-paper-2 hover:!text-ink",
        },
      }}
    />
  );
}
