import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} home`}
      className={`inline-flex flex-col leading-none text-white ${className}`}
    >
      <span className="text-2xl font-bold tracking-tight">
        {siteConfig.name}
        <span className="text-accent-buy">.</span>
      </span>
      <svg
        viewBox="0 0 80 10"
        aria-hidden="true"
        className="mt-0.5 h-2 w-20 text-accent-cart"
      >
        <path
          d="M2 2 Q 40 12 78 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  );
}
