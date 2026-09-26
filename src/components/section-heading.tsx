import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  title,
  description,
  href,
  linkLabel = "See all",
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="min-w-0">
      <h2 className="text-2xl leading-tight font-semibold tracking-[-0.025em] text-ink sm:text-[1.75rem]">{title}</h2>
      {(description || href) && (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
          {description}
          {href && (
            <Link
              href={href}
              className="group inline-flex items-center gap-1.5 font-medium whitespace-nowrap text-link transition-colors hover:text-link-hover"
            >
              {linkLabel}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
