import Link from "next/link";
import { SERVICES } from "@/data/services";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="container-md py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-base font-black text-slate-950">
                W
              </span>
              <span className="text-xl font-bold text-white">Webness</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-400">
              Founder-led digital systems studio for websites, apps, portals,
              growth systems, and Signal Room diagnosis.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white">Offers</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <Link href="/apply" className="transition hover:text-white">
                  Apply For Signal Scan
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="transition hover:text-white">
                  Offer Ladder
                </Link>
              </li>
              <li>
                <Link href="/retainers" className="transition hover:text-white">
                  Managed Growth
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="transition hover:text-white">
                  Work
                </Link>
              </li>
              <li>
                <Link href="/signal-room" className="transition hover:text-white">
                  Signal Room
                </Link>
              </li>
              <li>
                <Link href="/compare" className="transition hover:text-white">
                  Comparisons
                </Link>
              </li>
              <li>
                <Link href="/resources" className="transition hover:text-white">
                  Resources
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white">Services</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="transition hover:text-white"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white">Proof</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <a
                  href="https://dribbble.com/webness"
                  className="transition hover:text-white"
                >
                  Dribbble portfolio
                </a>
              </li>
              <li>
                <a href="mailto:hello@webness.in" className="transition hover:text-white">
                  hello@webness.in
                </a>
              </li>
              <li>Premium businesses</li>
              <li>Founder-led, India-first</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 Webness. All rights reserved.</p>
          <p>Domain recovery is a launch blocker before serious outreach.</p>
        </div>
      </div>
    </footer>
  );
}
