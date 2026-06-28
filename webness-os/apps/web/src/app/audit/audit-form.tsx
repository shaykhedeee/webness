"use client";

import { FormEvent, useMemo, useState } from "react";
import type { AuditResult } from "@/lib/audit";
import {
  buildAuditMailto,
  buildAuditResult,
  businessTypes,
  prepareAuditLeadInput,
} from "@/lib/audit";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-bold text-slate-200">{label}</span>
        <span className="font-bold text-emerald-300">{value}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function AuditForm() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [phoneOrWhatsApp, setPhoneOrWhatsApp] = useState("");
  const [businessType, setBusinessType] = useState(businessTypes[0]);
  const [targetLocation, setTargetLocation] = useState("");
  const [monthlyLeadGoal, setMonthlyLeadGoal] = useState("");
  const [currentTools, setCurrentTools] = useState("");
  const [biggestBottleneck, setBiggestBottleneck] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [requestPrepared, setRequestPrepared] = useState(false);
  const [leadRequestStatus, setLeadRequestStatus] = useState<
    "idle" | "submitting" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [leadRequestError, setLeadRequestError] = useState("");

  const mailto = useMemo(() => (result ? buildAuditMailto(result) : ""), [result]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setRequestPrepared(false);
    setLeadRequestStatus("idle");
    setLeadRequestError("");

    const prepared = prepareAuditLeadInput({
      websiteUrl,
      businessType,
      targetLocation,
      monthlyLeadGoal,
      currentTools,
      biggestBottleneck,
      email,
      phoneOrWhatsApp,
    });
    const firstError = Object.values(prepared.errors)[0];

    if (firstError) {
      setError(firstError);
      return;
    }

    setResult(buildAuditResult(prepared.input));
  }

  async function handleAuditRequest() {
    if (!result) return;

    setLeadRequestStatus("submitting");
    setLeadRequestError("");
    setRequestPrepared(false);

    try {
      const response = await fetch("/api/audit-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: result.websiteUrl,
          businessType: result.businessType,
          targetLocation: result.targetLocation,
          monthlyLeadGoal: result.monthlyLeadGoal,
          currentTools: result.currentTools,
          biggestBottleneck: result.biggestBottleneck,
          email: result.email,
          phoneOrWhatsApp: result.phoneOrWhatsApp,
        }),
      });
      const payload = (await response.json()) as {
        id?: string;
        error?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        const firstApiError =
          payload.error || Object.values(payload.errors || {})[0] || "The audit request could not be saved.";
        throw new Error(firstApiError);
      }

      window.location.assign(
        `/audit/thank-you?lead=${encodeURIComponent(payload.id || "")}`
      );
    } catch (requestError) {
      setLeadRequestStatus("error");
      setLeadRequestError(
        requestError instanceof Error
          ? requestError.message
          : "The audit request could not be saved. Use the email fallback below."
      );
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-white/10 bg-slate-900 p-6 sm:p-8"
      >
        <h2 className="text-2xl font-black text-white">Run the growth scan</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Capture the minimum data needed to decide whether the next move is a
          paid Signal Scan, build sprint, app/portal sprint, or growth retainer.
        </p>

        <div className="mt-8 grid gap-5">
          <label className="block" htmlFor="websiteUrl">
            <span className="mb-2 block text-sm font-bold text-slate-200">
              Website URL
            </span>
            <input
              id="websiteUrl"
              name="websiteUrl"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              placeholder="yourbusiness.com"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block" htmlFor="businessType">
              <span className="mb-2 block text-sm font-bold text-slate-200">
                Business type
              </span>
              <select
                id="businessType"
                name="businessType"
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              >
                {businessTypes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="block" htmlFor="targetLocation">
              <span className="mb-2 block text-sm font-bold text-slate-200">
                Target location
              </span>
              <input
                id="targetLocation"
                name="targetLocation"
                value={targetLocation}
                onChange={(event) => setTargetLocation(event.target.value)}
                placeholder="Bangalore, India"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block" htmlFor="monthlyLeadGoal">
              <span className="mb-2 block text-sm font-bold text-slate-200">
                Monthly lead goal
              </span>
              <input
                id="monthlyLeadGoal"
                name="monthlyLeadGoal"
                value={monthlyLeadGoal}
                onChange={(event) => setMonthlyLeadGoal(event.target.value)}
                placeholder="20 qualified leads"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block" htmlFor="currentTools">
              <span className="mb-2 block text-sm font-bold text-slate-200">
                Current tools
              </span>
              <input
                id="currentTools"
                name="currentTools"
                value={currentTools}
                onChange={(event) => setCurrentTools(event.target.value)}
                placeholder="WordPress, Shopify, GA4"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              />
            </label>
          </div>

          <label className="block" htmlFor="biggestBottleneck">
            <span className="mb-2 block text-sm font-bold text-slate-200">
              Biggest bottleneck
            </span>
            <textarea
              id="biggestBottleneck"
              name="biggestBottleneck"
              value={biggestBottleneck}
              onChange={(event) => setBiggestBottleneck(event.target.value)}
              placeholder="Visitors do not call, pages do not rank, leads are missed..."
              rows={4}
              className="w-full resize-none rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block" htmlFor="email">
              <span className="mb-2 block text-sm font-bold text-slate-200">
                Email
              </span>
              <input
                id="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="founder@business.com"
                type="email"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block" htmlFor="phoneOrWhatsApp">
              <span className="mb-2 block text-sm font-bold text-slate-200">
                Phone or WhatsApp
              </span>
              <input
                id="phoneOrWhatsApp"
                name="phoneOrWhatsApp"
                value={phoneOrWhatsApp}
                onChange={(event) => setPhoneOrWhatsApp(event.target.value)}
                placeholder="+91..."
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              />
            </label>
          </div>
        </div>

        {error && <p className="mt-5 text-sm font-bold text-red-300">{error}</p>}

        <button type="submit" className="btn-primary mt-7 w-full">
          Generate Growth Snapshot
        </button>
      </form>

      <div className="rounded-xl border border-white/10 bg-slate-900 p-6 sm:p-8">
        {result ? (
          <>
            <div className="border-b border-white/10 pb-7">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">
                Growth Snapshot
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-5xl font-black text-white">
                  {result.score}/100
                </h2>
                <p className="max-w-sm text-sm text-slate-400">
                  {result.websiteUrl}
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <ScoreBar label="Speed readiness" value={result.speed} />
              <ScoreBar label="Trust and proof" value={result.trust} />
              <ScoreBar label="Search and AI visibility" value={result.search} />
              <ScoreBar label="Conversion clarity" value={result.conversion} />
              <ScoreBar label="Automation readiness" value={result.automation} />
            </div>

            <div className="mt-8 rounded-lg bg-slate-950 p-5">
              <h3 className="font-black text-white">First priority</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {result.summary}
              </p>
            </div>

            <div className="mt-8 grid gap-3 rounded-lg border border-emerald-300/30 bg-emerald-400/10 p-5 text-sm leading-6 text-emerald-50">
              <p className="font-bold text-emerald-200">Recommended next step</p>
              <p>
                Apply for a paid Signal Scan if this priority is worth
                validating with screenshots, competitor notes, and a 30-day
                action map.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAuditRequest}
              disabled={leadRequestStatus === "submitting"}
              className="btn-primary mt-7 w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {leadRequestStatus === "submitting"
                ? "Saving Audit Request..."
                : "Request Signal Scan Review"}
            </button>

            {leadRequestStatus === "error" && (
              <div className="mt-5 rounded-lg border border-red-300/30 bg-red-400/10 p-4 text-sm leading-6 text-red-100">
                {leadRequestError}
              </div>
            )}

            <a
              href={mailto}
              onClick={() => setRequestPrepared(true)}
              className="mt-4 inline-flex w-full justify-center rounded-md border border-white/15 px-5 py-3 text-sm font-bold text-slate-100 transition hover:bg-white/10"
            >
              Email the same request instead
            </a>

            {requestPrepared && (
              <div className="mt-5 rounded-lg border border-amber-200/30 bg-amber-200/10 p-4 text-sm leading-6 text-amber-100">
                Request prepared. Send the email that opened, then Webness can
                reply with the Signal Scan fit, scope, and payment next step.
              </div>
            )}
          </>
        ) : (
          <div className="flex min-h-[620px] flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">
              Sample deliverable
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-white">
              A serious business gets one page of truth before paying for
              implementation.
            </h2>
            <div className="mt-8 space-y-4 text-sm leading-6 text-slate-300">
              <p>1. Score the website across five practical growth signals.</p>
              <p>2. Name the first revenue bottleneck in plain English.</p>
              <p>3. Route the lead into Signal Scan, build sprint, or monthly growth.</p>
              <p>4. Keep internal tooling behind the service until the workflow is proven.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
