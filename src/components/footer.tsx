import { BackToTopButton } from "@/components/back-to-top-button";
import { siteConfig } from "@/lib/site-config";

const footerColumns: { title: string; links: string[] }[] = [
  { title: "Get to Know Us", links: ["About Us", "Careers", "Press Releases"] },
  {
    title: "Make Money with Us",
    links: [`Sell on ${siteConfig.name}`, "Become an Affiliate", "Advertise Your Products"],
  },
  { title: "Payment Products", links: ["Business Card", "Shop with Points", "Gift Cards"] },
  { title: "Let Us Help You", links: ["Your Account", "Returns & Orders", "Help Center"] },
];

export function Footer() {
  return (
    <footer className="mt-12 bg-brand text-white">
      <BackToTopButton />

      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 sm:grid-cols-4">
        {footerColumns.map((column) => (
          <div key={column.title}>
            <h3 className="mb-3 cursor-pointer text-sm font-semibold transition-colors hover:text-gray-300 hover:underline">
              {column.title}
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {column.links.map((link) => (
                <li
                  key={link}
                  className="cursor-pointer transition-colors hover:text-white hover:underline"
                >
                  {link}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} {siteConfig.name}. Built for demo purposes only.
      </div>
    </footer>
  );
}
