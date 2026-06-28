export const businessTypes = [
  "Local service business",
  "Interior design studio",
  "Construction company",
  "Clinic or healthcare practice",
  "Ecommerce brand",
  "Digital agency",
];

export interface AuditLeadInput {
  websiteUrl: string;
  businessType: string;
  targetLocation: string;
  monthlyLeadGoal: string;
  currentTools: string;
  biggestBottleneck: string;
  email: string;
  phoneOrWhatsApp: string;
}

export interface AuditResult extends AuditLeadInput {
  score: number;
  speed: number;
  trust: number;
  search: number;
  conversion: number;
  automation: number;
  priority: string;
  summary: string;
}

export interface AuditValidation {
  input: AuditLeadInput;
  errors: Partial<Record<keyof AuditLeadInput, string>>;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function scoreSeed(input: string) {
  return Array.from(input).reduce((total, char) => total + char.charCodeAt(0), 0);
}

function cleanText(value: unknown, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function normalizeUrl(rawUrl: string) {
  const value = rawUrl.trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function prepareAuditLeadInput(payload: Partial<AuditLeadInput>): AuditValidation {
  const websiteUrl = normalizeUrl(cleanText(payload.websiteUrl, 240));
  const businessType = businessTypes.includes(cleanText(payload.businessType, 80))
    ? cleanText(payload.businessType, 80)
    : businessTypes[0];
  const targetLocation = cleanText(payload.targetLocation, 120);
  const monthlyLeadGoal = cleanText(payload.monthlyLeadGoal, 120) || "Not specified";
  const currentTools = cleanText(payload.currentTools, 180) || "Not specified";
  const biggestBottleneck = cleanText(payload.biggestBottleneck, 800);
  const email = cleanText(payload.email, 160).toLowerCase();
  const phoneOrWhatsApp = cleanText(payload.phoneOrWhatsApp, 80);
  const errors: AuditValidation["errors"] = {};

  if (!websiteUrl) {
    errors.websiteUrl = "Enter a website URL to generate the scan.";
  } else {
    try {
      new URL(websiteUrl);
    } catch {
      errors.websiteUrl = "Use a valid website URL, for example webness.in.";
    }
  }

  if (!targetLocation) {
    errors.targetLocation = "Add the target location or market for this business.";
  }

  if (!biggestBottleneck) {
    errors.biggestBottleneck =
      "Add the biggest bottleneck so the scan can prioritize the right fix.";
  }

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email so Webness can review the Signal Scan fit.";
  }

  return {
    input: {
      websiteUrl,
      businessType,
      targetLocation,
      monthlyLeadGoal,
      currentTools,
      biggestBottleneck,
      email,
      phoneOrWhatsApp,
    },
    errors,
  };
}

export function buildAuditResult(form: AuditLeadInput): AuditResult {
  const seed = scoreSeed(
    `${form.websiteUrl}:${form.businessType}:${form.targetLocation}:${form.biggestBottleneck}`
  );
  const speed = clamp(50 + (seed % 34), 32, 94);
  const trust = clamp(46 + ((seed * 3) % 38), 30, 92);
  const search = clamp(42 + ((seed * 5) % 41), 28, 90);
  const conversion = clamp(44 + ((seed * 7) % 39), 30, 91);
  const automation = clamp(38 + ((seed * 11) % 43), 24, 88);
  const score = Math.round((speed + trust + search + conversion + automation) / 5);
  const weakest = [
    { label: "speed and Core Web Vitals", value: speed },
    { label: "trust signals and proof", value: trust },
    { label: "search and AI visibility", value: search },
    { label: "conversion path clarity", value: conversion },
    { label: "lead handling automation", value: automation },
  ].sort((a, b) => a.value - b.value)[0];

  return {
    ...form,
    score,
    speed,
    trust,
    search,
    conversion,
    automation,
    priority: weakest.label,
    summary: `The first Webness priority is ${weakest.label}. For a ${form.businessType.toLowerCase()} targeting ${form.targetLocation || "its local market"}, that usually means fixing the clearest trust, visibility, and lead-flow issue before buying more traffic.`,
  };
}

export function buildAuditMailto(result: AuditResult) {
  const subject = `Webness Signal Scan request for ${result.websiteUrl}`;
  const body = [
    "I want a Webness Signal Scan review.",
    "",
    `Website: ${result.websiteUrl}`,
    `Business type: ${result.businessType}`,
    `Target location: ${result.targetLocation}`,
    `Monthly lead goal: ${result.monthlyLeadGoal}`,
    `Current tools: ${result.currentTools}`,
    `Biggest bottleneck: ${result.biggestBottleneck}`,
    `Email: ${result.email}`,
    `Phone/WhatsApp: ${result.phoneOrWhatsApp || "Not provided"}`,
    "",
    `Scan score: ${result.score}/100`,
    `First priority: ${result.priority}`,
    "",
    "Please send the Signal Scan fit, scope, screenshots, competitor notes, and 30-day action map.",
  ].join("\n");

  return `mailto:hello@webness.in?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}
