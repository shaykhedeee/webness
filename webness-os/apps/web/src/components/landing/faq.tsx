"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Who is Webness for first?",
    a: "Premium founder-led businesses that need a serious website, app, portal, marketing system, or growth operating rhythm. The strongest early categories are ecommerce, healthcare, tech/manufacturing, interiors, construction, and premium local services.",
  },
  {
    q: "Is Signal Room a separate SaaS?",
    a: "Not yet. Signal Room is the proprietary Webness diagnosis and tracking engine. It supports scans, sprints, and retainers before becoming a separate SaaS later.",
  },
  {
    q: "Why start with a paid Signal Scan?",
    a: "The scan prevents random builds. It identifies whether the next serious move is website, app, marketing, automation, tracking, or retainer support.",
  },
  {
    q: "Do you guarantee rankings or leads?",
    a: "No. Webness guarantees the agreed scope, quality bar, reporting clarity, and priority implementation. Leads and rankings depend on market, offer, competition, and consistency.",
  },
  {
    q: "Can Webness still build websites and apps?",
    a: "Yes. That is the core business. Signal Room helps decide what should be built first and keeps the work connected to measurable improvement after launch.",
  },
  {
    q: "What must be fixed before serious outreach?",
    a: "The public domain must be live and trustworthy. The site should show portfolio proof, paid Signal Scan positioning, and clear application paths before premium outreach starts.",
  },
];

export function FAQ() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <section id="faq" className="section-padding bg-slate-950">
      <div className="container-md max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-black text-white sm:text-5xl">
            Practical questions before applying
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.q}
              className="overflow-hidden rounded-lg border border-white/10 bg-slate-900"
            >
              <button
                onClick={() => setExpanded(expanded === index ? null : index)}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition hover:bg-white/[0.03]"
              >
                <span className="text-lg font-bold text-white">{faq.q}</span>
                <span className="text-xl font-bold text-amber-200">
                  {expanded === index ? "-" : "+"}
                </span>
              </button>

              {expanded === index && (
                <div className="px-6 pb-6 text-base leading-7 text-slate-300">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
