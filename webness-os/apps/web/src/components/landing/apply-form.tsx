"use client";

import { FormEvent, useState } from "react";

const budgetRanges = [
  "Rs. 9,999-Rs. 24,999 Signal Scan",
  "Rs. 75,000-Rs. 2.5L website/build sprint",
  "Rs. 2.5L-Rs. 8L app/portal/product sprint",
  "Rs. 25,000+/mo growth retainer",
  "Rs. 75,000+/mo premium systems retainer",
];

const timelines = [
  "This month",
  "30-60 days",
  "60-90 days",
  "Planning ahead",
];

const businessTypes = [
  "Ecommerce brand",
  "Healthcare or clinic",
  "Tech or manufacturing",
  "Interior, construction, or local service",
  "Founder-led service business",
  "Startup app or SaaS",
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ApplyForm() {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [website, setWebsite] = useState("");
  const [businessType, setBusinessType] = useState(businessTypes[0]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [budgetRange, setBudgetRange] = useState(budgetRanges[0]);
  const [problem, setProblem] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [timeline, setTimeline] = useState(timelines[0]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("idle");

    if (!name.trim()) {
      setError("Add your name.");
      return;
    }
    if (!business.trim()) {
      setError("Add the business name.");
      return;
    }
    if (!website.trim()) {
      setError("Add the website or product URL.");
      return;
    }
    if (!targetLocation.trim()) {
      setError("Add the target market or location.");
      return;
    }
    if (!problem.trim()) {
      setError("Describe the problem Webness should diagnose.");
      return;
    }
    if (!desiredOutcome.trim()) {
      setError("Describe the outcome you want.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email.");
      return;
    }

    setStatus("submitting");

    const bottleneck = [
      `Applicant: ${name.trim()}`,
      `Business: ${business.trim()}`,
      `Budget range: ${budgetRange}`,
      `Timeline: ${timeline}`,
      `Problem: ${problem.trim()}`,
      `Desired outcome: ${desiredOutcome.trim()}`,
    ].join("\n");

    try {
      const response = await fetch("/api/audit-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: website,
          businessType,
          targetLocation,
          monthlyLeadGoal: budgetRange,
          currentTools: `Business: ${business.trim()}; Timeline: ${timeline}`,
          biggestBottleneck: bottleneck,
          email,
          phoneOrWhatsApp: phone,
        }),
      });

      const payload = (await response.json()) as {
        id?: string;
        error?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        const firstError =
          payload.error ||
          Object.values(payload.errors || {})[0] ||
          "The application could not be saved.";
        throw new Error(firstError);
      }

      window.location.assign(`/audit/thank-you?lead=${encodeURIComponent(payload.id || "")}`);
    } catch (submitError) {
      setStatus("error");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The application could not be saved."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/10 bg-slate-900 p-6 sm:p-8">
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block" htmlFor="name">
            <span className="mb-2 block text-sm font-bold text-slate-200">Name</span>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              placeholder="Your name"
            />
          </label>
          <label className="block" htmlFor="business">
            <span className="mb-2 block text-sm font-bold text-slate-200">Business</span>
            <input
              id="business"
              value={business}
              onChange={(event) => setBusiness(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              placeholder="Company or brand"
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block" htmlFor="website">
            <span className="mb-2 block text-sm font-bold text-slate-200">Website or product URL</span>
            <input
              id="website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              placeholder="yourbusiness.com"
            />
          </label>
          <label className="block" htmlFor="businessType">
            <span className="mb-2 block text-sm font-bold text-slate-200">Business type</span>
            <select
              id="businessType"
              value={businessType}
              onChange={(event) => setBusinessType(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
            >
              {businessTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block" htmlFor="email">
            <span className="mb-2 block text-sm font-bold text-slate-200">Email</span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              placeholder="founder@business.com"
            />
          </label>
          <label className="block" htmlFor="phone">
            <span className="mb-2 block text-sm font-bold text-slate-200">Phone or WhatsApp</span>
            <input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              placeholder="+91..."
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block" htmlFor="targetLocation">
            <span className="mb-2 block text-sm font-bold text-slate-200">Target market</span>
            <input
              id="targetLocation"
              value={targetLocation}
              onChange={(event) => setTargetLocation(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              placeholder="Bangalore, India"
            />
          </label>
          <label className="block" htmlFor="budgetRange">
            <span className="mb-2 block text-sm font-bold text-slate-200">Budget range</span>
            <select
              id="budgetRange"
              value={budgetRange}
              onChange={(event) => setBudgetRange(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
            >
              {budgetRanges.map((range) => (
                <option key={range}>{range}</option>
              ))}
            </select>
          </label>
          <label className="block" htmlFor="timeline">
            <span className="mb-2 block text-sm font-bold text-slate-200">Timeline</span>
            <select
              id="timeline"
              value={timeline}
              onChange={(event) => setTimeline(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
            >
              {timelines.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block" htmlFor="problem">
          <span className="mb-2 block text-sm font-bold text-slate-200">Problem to diagnose</span>
          <textarea
            id="problem"
            value={problem}
            onChange={(event) => setProblem(event.target.value)}
            rows={4}
            className="w-full resize-none rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
            placeholder="Website is not converting, app idea is unclear, marketing stopped performing..."
          />
        </label>

        <label className="block" htmlFor="desiredOutcome">
          <span className="mb-2 block text-sm font-bold text-slate-200">Desired outcome</span>
          <textarea
            id="desiredOutcome"
            value={desiredOutcome}
            onChange={(event) => setDesiredOutcome(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
            placeholder="A premium website, dashboard, app, retainer, or clear 30-day growth plan..."
          />
        </label>
      </div>

      {error && <p className="mt-5 text-sm font-bold text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary mt-7 w-full disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "submitting" ? "Submitting Application..." : "Apply For Signal Scan"}
      </button>

      {status === "success" && (
        <p className="mt-5 text-sm font-bold text-emerald-300">
          Application received. Webness will review fit before recommending the next step.
        </p>
      )}
    </form>
  );
}

