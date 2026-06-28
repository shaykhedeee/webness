import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────

interface EbookConfig {
  topic: string;
  subtitle: string;
  audience: string;
  offer: string;
  authorName: string;
  chapterCount: number;
  wordsPerChapter: number;
  tone: "professional" | "conversational" | "academic" | "storytelling";
  genre: string;
  keywords: string;
  includeImages: boolean;
  includeCta: boolean;
  enableResearch: boolean; // Live niche research grounding toggle
}

interface PipelineStep {
  id: string;
  action: string;
  detail: string;
  progress: number;
  status: "pending" | "running" | "done" | "error";
}

interface ChapterResult {
  number: number;
  title: string;
  wordCount: number;
  keyTakeaways: string[];
  hasSvg: boolean;
}

interface EbookResult {
  title: string;
  subtitle: string;
  author: string;
  totalWordCount: number;
  chapters: ChapterResult[];
  markdown: string;
  html: string;
  epub: { compiled: boolean; path: string | null; chapterCount: number; fileCount: number };
  kdpMetadata: { description: string; keywords: string[]; categories: string[]; targetAge: string };
  tokenUsage: { researchTokens?: number; outlineTokens: number; draftTokens: number; polishTokens: number; matterTokens: number; illustrationTokens: number; totalEstimated: number };
  obsidian: { configured: boolean; targetPath: string | null; writeMode: string };
  coverImage: string | null; // base64 encoded JPEG cover image
  researchDossier: string | null; // markdown research dossier
}

// ─── Constants ──────────────────────────────────────────────

const GENRES = [
  "Business & Technology", "Self-Help & Personal Development", "Marketing & Sales",
  "Finance & Investing", "Health & Wellness", "Education & Training",
  "Science & Innovation", "Leadership & Management", "Entrepreneurship",
  "Real Estate", "E-Commerce", "Artificial Intelligence",
];

const TONES: Array<{ value: EbookConfig["tone"]; label: string; icon: string }> = [
  { value: "professional", label: "Professional", icon: "🏢" },
  { value: "conversational", label: "Conversational", icon: "💬" },
  { value: "academic", label: "Academic", icon: "🎓" },
  { value: "storytelling", label: "Storytelling", icon: "📖" },
];

const PIPELINE_PHASES = [
  { key: "research", label: "Grounded Research", icon: "🔍", model: "Flash + Search" },
  { key: "outline", label: "Outline & Structure", icon: "🗂️", model: "Flash" },
  { key: "drafting", label: "Chapter Drafting", icon: "✍️", model: "Pro" },
  { key: "polishing", label: "Edit & Polish", icon: "✨", model: "Groq" },
  { key: "matter", label: "Front & Back Matter", icon: "📋", model: "Flash" },
  { key: "cover", label: "AI Cover Design", icon: "🖼️", model: "Imagen" },
  { key: "illustrations", label: "SVG Illustrations", icon: "🎨", model: "Flash" },
  { key: "compiling", label: "EPUB Compilation", icon: "📦", model: "Compiler" },
];

// ─── Component ──────────────────────────────────────────────

export default function EbookWriter() {
  const [config, setConfig] = useState<EbookConfig>({
    topic: "",
    subtitle: "",
    audience: "",
    offer: "",
    authorName: "",
    chapterCount: 5,
    wordsPerChapter: 1500,
    tone: "professional",
    genre: "Business & Technology",
    keywords: "",
    includeImages: true,
    includeCta: true,
    enableResearch: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [currentPhase, setCurrentPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<EbookResult | null>(null);
  const [isPublishingKdp, setIsPublishingKdp] = useState(false);
  const [activeTab, setActiveTab] = useState<"config" | "progress" | "result">("config");
  const [previewTab, setPreviewTab] = useState<"overview" | "research" | "chapters" | "metadata" | "markdown" | "html">("overview");
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const handlePublishKDP = async (ebookResult: EbookResult) => {
    if (!ebookResult.epub?.compiled) return;
    setIsPublishingKdp(true);
    addLog("🚀 Initiating Amazon KDP Web Automation Publisher...");
    try {
      const token = localStorage.getItem("webness_token");
      const res = await fetch("/api/tools/kdp_publish/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          title: ebookResult.title,
          subtitle: ebookResult.subtitle,
          author: ebookResult.author,
          description: ebookResult.kdpMetadata?.description || "",
          keywords: ebookResult.kdpMetadata?.keywords || [],
          epubPath: ebookResult.epub.path,
          coverPath: ebookResult.coverImage // this would need to be saved to a file first in real scenario
        }),
      });
      if (!res.ok) throw new Error("Failed to start KDP publish task");
      addLog("✅ KDP Publisher Job started! Check terminal for browser automation window.");
    } catch (err: any) {
      addLog(`❌ KDP Publish failed: ${err.message}`);
    } finally {
      setIsPublishingKdp(false);
    }
  };

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${ts}] ${msg}`]);
  }, []);

  const handleGenerate = async () => {
    if (!config.topic.trim()) return;

    setIsGenerating(true);
    setActiveTab("progress");
    setSteps([]);
    setLogs([]);
    setResult(null);
    setProgress(0);
    setCurrentPhase("research");
    addLog("🚀 Starting KDP-grade multi-model ebook pipeline...");

    try {
      const body = {
        topic: config.topic,
        subtitle: config.subtitle,
        audience: config.audience || "business professionals",
        offer: config.offer || "our premium services",
        authorName: config.authorName || "Webness AI",
        chapters: config.chapterCount,
        wordsPerChapter: config.wordsPerChapter,
        tone: config.tone,
        genre: config.genre,
        keywords: config.keywords,
        includeImages: config.includeImages,
        includeCta: config.includeCta,
        enableResearch: config.enableResearch,
      };

      const token = localStorage.getItem("webness_token");
      // Submit task
      const res = await fetch("/api/tools/ebook_pipeline/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ input: body }),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      const taskId = data.data.taskId;
      addLog(`📌 Task created: ${taskId}`);

      // Connect SSE for real-time updates
      if (eventSourceRef.current) eventSourceRef.current.close();

      const sse = new EventSource(`/api/stream?taskId=${taskId}&token=${token}`);
      eventSourceRef.current = sse;

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.event === "step:created" || payload.event === "step:progress") {
            const { action, detail, progress: p } = payload.data;
            addLog(`${getPhaseIcon(action)} ${detail}`);
            if (p) setProgress(p);
            setCurrentPhase(action?.toLowerCase() || "");

            setSteps((prev) => {
              const existing = prev.find((s) => s.action === action);
              if (existing) {
                return prev.map((s) =>
                  s.action === action ? { ...s, detail, progress: p || s.progress, status: "running" } : s
                );
              }
              return [...prev, { id: action, action, detail, progress: p || 0, status: "running" }];
            });
          }

          if (payload.event === "step:updated") {
            const { action, status } = payload.data;
            setSteps((prev) =>
              prev.map((s) => (s.action === action ? { ...s, status: status === "SUCCESS" ? "done" : "error" } : s))
            );
          }

          if (payload.event === "task:completed") {
            addLog("✅ Ebook generation complete!");
            setResult(payload.data.outputData);
            setActiveTab("result");
            setProgress(100);
            setIsGenerating(false);
            sse.close();
          }

          if (payload.event === "task:failed") {
            addLog(`❌ Pipeline failed: ${payload.data.error}`);
            setIsGenerating(false);
            sse.close();
          }
        } catch {}
      };

      sse.onerror = () => {
        addLog("⚠️ SSE connection lost, polling for result...");
        sse.close();
        // Poll for result
        setTimeout(async () => {
          try {
            const pollRes = await fetch(`/api/projects/${taskId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (pollRes.ok) {
              const taskData = await pollRes.json();
              if (taskData.success && taskData.data && taskData.data.status === "COMPLETED" && taskData.data.outputData) {
                setResult(taskData.data.outputData);
                setActiveTab("result");
                setProgress(100);
              }
            }
          } catch {}
          setIsGenerating(false);
        }, 5000);
      };
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);

      // Demo mode — simulate for UI preview
      addLog("🎭 Running in demo mode (API offline)...");
      await simulatePipeline(config, addLog, setProgress, setCurrentPhase, setSteps);
      setResult(createDemoResult(config));
      setActiveTab("result");
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "2rem" }}>📚</span>
            Ebook Engine
            <span style={{
              fontSize: "0.65rem", padding: "3px 10px", borderRadius: 12,
              background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "#fff", fontWeight: 600,
              letterSpacing: "0.05em",
            }}>KDP-GRADE v2</span>
          </h1>
          <p style={{ color: "#71717a", fontSize: "0.9rem", margin: "6px 0 0" }}>
            Multi-model AI pipeline · Chapter-by-chapter drafting · Amazon KDP-compliant EPUB 3.0
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4, background: "#18181b", borderRadius: 10, padding: 4 }}>
          {(["config", "progress", "result"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                background: activeTab === tab ? "#27272a" : "transparent",
                color: activeTab === tab ? "#fff" : "#71717a",
                fontSize: "0.82rem", fontWeight: 600, textTransform: "capitalize",
                transition: "all 0.2s",
              }}
            >
              {tab === "config" ? "⚙️ Configure" : tab === "progress" ? "📊 Progress" : "📄 Result"}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ CONFIG TAB ═══ */}
      {activeTab === "config" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
          {/* Left — Main config */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Topic & Subtitle */}
            <Card title="📖 Book Details">
              <InputField label="Topic / Title *" value={config.topic}
                onChange={(v) => setConfig({ ...config, topic: v })}
                placeholder="e.g., AI Automation for Small Businesses" />
              <InputField label="Subtitle" value={config.subtitle}
                onChange={(v) => setConfig({ ...config, subtitle: v })}
                placeholder="e.g., A Practical Guide to 10x Your Productivity" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <InputField label="Author Name" value={config.authorName}
                  onChange={(v) => setConfig({ ...config, authorName: v })}
                  placeholder="Your name or brand" />
                <SelectField label="Genre" value={config.genre}
                  onChange={(v) => setConfig({ ...config, genre: v })}
                  options={GENRES} />
              </div>
            </Card>

            {/* Audience & Offer */}
            <Card title="🎯 Target Audience & CTA">
              <InputField label="Target Audience *" value={config.audience}
                onChange={(v) => setConfig({ ...config, audience: v })}
                placeholder="e.g., SaaS founders, marketing managers" />
              <InputField label="Lead Capture Offer" value={config.offer}
                onChange={(v) => setConfig({ ...config, offer: v })}
                placeholder="e.g., Free AI automation audit" />
              <InputField label="KDP Keywords (comma-separated)" value={config.keywords}
                onChange={(v) => setConfig({ ...config, keywords: v })}
                placeholder="e.g., AI automation, business efficiency, productivity" />
            </Card>

            {/* Tone selector */}
            <Card title="🎨 Writing Tone">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setConfig({ ...config, tone: t.value })}
                    style={{
                      padding: "14px 10px", borderRadius: 10, border: "2px solid",
                      borderColor: config.tone === t.value ? "#6366f1" : "#27272a",
                      background: config.tone === t.value ? "rgba(99,102,241,0.1)" : "#18181b",
                      color: config.tone === t.value ? "#a5b4fc" : "#a1a1aa",
                      cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{t.icon}</div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>{t.label}</div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right — Settings + Launch */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Chapter settings */}
            <Card title="📐 Book Structure">
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>Chapters</label>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#a5b4fc" }}>{config.chapterCount}</span>
                </div>
                <input type="range" min={3} max={15} value={config.chapterCount}
                  onChange={(e) => setConfig({ ...config, chapterCount: Number(e.target.value) })}
                  style={{ width: "100%" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#52525b" }}>
                  <span>3 (Short)</span><span>15 (Comprehensive)</span>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>Words per Chapter</label>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#a5b4fc" }}>~{config.wordsPerChapter.toLocaleString()}</span>
                </div>
                <input type="range" min={500} max={4000} step={250} value={config.wordsPerChapter}
                  onChange={(e) => setConfig({ ...config, wordsPerChapter: Number(e.target.value) })}
                  style={{ width: "100%" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#52525b" }}>
                  <span>500</span><span>4,000</span>
                </div>
              </div>

              <div style={{ marginTop: 12, padding: 12, background: "#0f0f11", borderRadius: 8, fontSize: "0.78rem", color: "#71717a" }}>
                📊 Estimated: <strong style={{ color: "#a5b4fc" }}>{(config.chapterCount * config.wordsPerChapter).toLocaleString()}</strong> words
                · ~{Math.ceil((config.chapterCount * config.wordsPerChapter) / 250)} pages
                · ~{Math.ceil((config.chapterCount * config.wordsPerChapter) / 1000 * 1.3)}k tokens
              </div>
            </Card>

            {/* Options */}
            <Card title="⚡ Options">
              <ToggleField label="Grounded Live Research" sublabel="Live Google Search niche analysis"
                checked={config.enableResearch} onChange={(v) => setConfig({ ...config, enableResearch: v })} />
              <ToggleField label="Generate SVG Illustrations" sublabel="AI-generated chapter graphics"
                checked={config.includeImages} onChange={(v) => setConfig({ ...config, includeImages: v })} />
              <ToggleField label="Include CTA Pages" sublabel="Lead capture call-to-action"
                checked={config.includeCta} onChange={(v) => setConfig({ ...config, includeCta: v })} />
            </Card>

            {/* Model Pipeline Info */}
            <Card title="🧠 Multi-Model Pipeline">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {PIPELINE_PHASES.map((phase) => (
                  <div key={phase.key} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "6px 10px", borderRadius: 6, background: "#0f0f11", fontSize: "0.78rem",
                  }}>
                    <span>{phase.icon}</span>
                    <span style={{ flex: 1, color: "#d4d4d8" }}>{phase.label}</span>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4, fontSize: "0.68rem", fontWeight: 600,
                      background: phase.model === "Pro" ? "rgba(168,85,247,0.15)" :
                        phase.model === "Groq" ? "rgba(34,197,94,0.15)" :
                          phase.model === "Flash" ? "rgba(99,102,241,0.15)" : "rgba(245,158,11,0.15)",
                      color: phase.model === "Pro" ? "#c084fc" :
                        phase.model === "Groq" ? "#4ade80" :
                          phase.model === "Flash" ? "#818cf8" : "#fbbf24",
                    }}>
                      {phase.model}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !config.topic.trim()}
              style={{
                width: "100%", padding: "16px", borderRadius: 12, border: "none",
                background: isGenerating ? "#27272a" : "linear-gradient(135deg, #6366f1, #a855f7)",
                color: "#fff", fontSize: "1rem", fontWeight: 700, cursor: isGenerating ? "not-allowed" : "pointer",
                transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              {isGenerating ? (
                <><span className="animate-pulse-glow">⏳</span> Generating...</>
              ) : (
                <>🚀 Generate KDP Ebook</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══ PROGRESS TAB ═══ */}
      {activeTab === "progress" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Pipeline visualization */}
          <Card title="⚡ Pipeline Progress">
            {/* Overall progress bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>Overall Progress</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#a5b4fc" }}>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: 8, background: "#27272a", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4, transition: "width 0.5s ease-out",
                  width: `${progress}%`,
                  background: progress === 100
                    ? "linear-gradient(90deg, #22c55e, #4ade80)"
                    : "linear-gradient(90deg, #6366f1, #a855f7)",
                }} />
              </div>
            </div>

            {/* Phase cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PIPELINE_PHASES.map((phase) => {
                const step = steps.find((s) => s.action === phase.key.toUpperCase() || s.action === phase.key);
                const isActive = currentPhase === phase.key || currentPhase === phase.key.toUpperCase();
                const isDone = step?.status === "done";

                return (
                  <div key={phase.key} style={{
                    padding: "12px 14px", borderRadius: 10,
                    background: isDone ? "rgba(34,197,94,0.06)" : isActive ? "rgba(99,102,241,0.08)" : "#18181b",
                    border: `1px solid ${isDone ? "rgba(34,197,94,0.2)" : isActive ? "rgba(99,102,241,0.3)" : "#27272a"}`,
                    display: "flex", alignItems: "center", gap: 12,
                    transition: "all 0.3s",
                  }}>
                    <span style={{ fontSize: "1.3rem" }}>
                      {isDone ? "✅" : isActive ? phase.icon : "⬜"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: isDone ? "#4ade80" : isActive ? "#a5b4fc" : "#71717a" }}>
                        {phase.label}
                      </div>
                      {step && (
                        <div style={{ fontSize: "0.72rem", color: "#52525b", marginTop: 2 }}>
                          {step.detail}
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                      background: phase.model === "Pro" ? "rgba(168,85,247,0.15)" :
                        phase.model === "Groq" ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.15)",
                      color: phase.model === "Pro" ? "#c084fc" :
                        phase.model === "Groq" ? "#4ade80" : "#818cf8",
                    }}>{phase.model}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Live logs */}
          <Card title="📋 Live Logs">
            <div ref={logRef} style={{
              height: 460, overflow: "auto", fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.72rem", lineHeight: 1.8, padding: 8, background: "#0f0f11", borderRadius: 8,
            }}>
              {logs.map((log, i) => (
                <div key={i} style={{ color: log.includes("❌") ? "#f87171" : log.includes("✅") ? "#4ade80" : "#a1a1aa" }}>
                  {log}
                </div>
              ))}
              {isGenerating && (
                <div className="animate-pulse-glow" style={{ color: "#818cf8" }}>
                  ▊ Processing...
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ═══ RESULT TAB ═══ */}
      {activeTab === "result" && result && (
        <div>
          {/* Result header */}
          <div style={{
            padding: 24, borderRadius: 16, marginBottom: 24,
            background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))",
            border: "1px solid rgba(99,102,241,0.15)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "#e5e7eb" }}>{result.title}</h2>
                {result.subtitle && <p style={{ fontSize: "1rem", color: "#818cf8", margin: "4px 0 0", fontStyle: "italic" }}>{result.subtitle}</p>}
                <p style={{ fontSize: "0.85rem", color: "#71717a", margin: "8px 0 0" }}>by {result.author}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <StatBadge label="Words" value={result.totalWordCount?.toLocaleString() || "—"} color="#6366f1" />
                <StatBadge label="Chapters" value={String(result.chapters?.length || 0)} color="#a855f7" />
                <StatBadge label="Pages" value={String(Math.ceil((result.totalWordCount || 0) / 250))} color="#22c55e" />
                <StatBadge label="Tokens" value={`~${Math.round((result.tokenUsage?.totalEstimated || 0) / 1000)}k`} color="#f59e0b" />
              </div>
            </div>
          </div>

          {/* Preview tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#18181b", borderRadius: 10, padding: 4, width: "fit-content" }}>
            {(["overview", "research", "chapters", "metadata", "markdown", "html"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPreviewTab(tab)}
                style={{
                  padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                  background: previewTab === tab ? "#27272a" : "transparent",
                  color: previewTab === tab ? "#fff" : "#71717a",
                  fontSize: "0.78rem", fontWeight: 600, textTransform: "capitalize", transition: "all 0.15s",
                }}
              >{tab}</button>
            ))}
          </div>

          {/* Preview content */}
          <div style={{ display: "grid", gridTemplateColumns: previewTab === "html" ? "1fr" : "1fr 340px", gap: 24 }}>
            <Card title="">
              {previewTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: result.coverImage ? "260px 1fr" : "1fr", gap: 24 }}>
                  {/* Left Column — Cover Art Card */}
                  {result.coverImage && (
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#d4d4d8", marginTop: 0, marginBottom: 12 }}>🖼️ Cover Design</h3>
                      <div style={{
                        position: "relative",
                        borderRadius: 12,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 15px rgba(99,102,241,0.15)",
                        background: "#09090b",
                        aspectRatio: "2/3",
                        width: "100%",
                      }}>
                        <img
                          src={result.coverImage.startsWith("data:")
                            ? result.coverImage
                            : result.coverImage.includes("PHN2Zy") || result.coverImage.startsWith("PD94bWw")
                              ? `data:image/svg+xml;base64,${result.coverImage}`
                              : `data:image/jpeg;base64,${result.coverImage}`
                          }
                          alt="Book Cover"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Right Column — Chapters */}
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#d4d4d8", marginTop: 0, marginBottom: 12 }}>📖 Chapters</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 500, overflowY: "auto", paddingRight: 4 }}>
                      {result.chapters?.map((ch) => (
                        <div key={ch.number} style={{
                          padding: "12px 14px", background: "#0f0f11", borderRadius: 8,
                          display: "flex", alignItems: "center", gap: 12,
                        }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(99,102,241,0.15)", color: "#818cf8", fontWeight: 800, fontSize: "0.85rem",
                          }}>{ch.number}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#d4d4d8" }}>{ch.title}</div>
                            <div style={{ fontSize: "0.7rem", color: "#52525b" }}>
                              {ch.wordCount?.toLocaleString()} words · {ch.keyTakeaways?.length || 0} takeaways
                              {ch.hasSvg && " · 🎨 SVG"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {previewTab === "research" && (
                <div style={{ maxHeight: 600, overflow: "auto" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#d4d4d8", marginTop: 0, marginBottom: 12 }}>🔍 Grounded Niche Research Dossier</h3>
                  <pre style={{
                    whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", fontSize: "0.9rem",
                    lineHeight: 1.8, color: "#cbd5e1", margin: 0,
                  }}>
                    {result.researchDossier || "No research dossier available."}
                  </pre>
                </div>
              )}

              {previewTab === "chapters" && (
                <div style={{ maxHeight: 600, overflow: "auto" }}>
                  <pre style={{
                    whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", fontSize: "0.9rem",
                    lineHeight: 1.8, color: "#d4d4d8", margin: 0,
                  }}>
                    {result.markdown?.substring(0, 10000) || "No content"}
                    {(result.markdown?.length || 0) > 10000 && "\n\n... [truncated for preview]"}
                  </pre>
                </div>
              )}

              {previewTab === "metadata" && result.kdpMetadata && (
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#d4d4d8", marginTop: 0 }}>🏷️ Amazon KDP Metadata</h3>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: "0.75rem", color: "#71717a", display: "block", marginBottom: 4 }}>Description (for KDP listing)</label>
                    <div style={{ padding: 12, background: "#0f0f11", borderRadius: 8, fontSize: "0.85rem", color: "#a1a1aa", lineHeight: 1.6 }}>
                      {result.kdpMetadata.description}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: "0.75rem", color: "#71717a", display: "block", marginBottom: 4 }}>Keywords (max 7 for KDP)</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {result.kdpMetadata.keywords?.map((kw, i) => (
                        <span key={i} style={{
                          padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 500,
                          background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)",
                        }}>{kw}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", color: "#71717a", display: "block", marginBottom: 4 }}>Categories (max 3 for KDP)</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {result.kdpMetadata.categories?.map((cat, i) => (
                        <span key={i} style={{
                          padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 500,
                          background: "rgba(168,85,247,0.1)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.2)",
                        }}>{cat}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {previewTab === "markdown" && (
                <div style={{ maxHeight: 600, overflow: "auto" }}>
                  <pre style={{
                    whiteSpace: "pre-wrap", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem",
                    lineHeight: 1.6, color: "#a1a1aa", margin: 0,
                  }}>
                    {result.markdown || "No markdown content"}
                  </pre>
                </div>
              )}

              {previewTab === "html" && (
                <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}>
                  <iframe
                    srcDoc={result.html || "<p>No HTML content</p>"}
                    style={{ width: "100%", height: 700, border: "none" }}
                    title="Ebook Preview"
                  />
                </div>
              )}
            </Card>

            {/* Right sidebar — Export & Stats */}
            {previewTab !== "html" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Export buttons */}
                <Card title="📥 Export">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <ExportButton
                      icon="📦" label="Download EPUB"
                      sublabel={result.epub?.compiled ? `${result.epub.fileCount} files · KDP-ready` : "Not compiled"}
                      disabled={!result.epub?.compiled}
                      onClick={() => downloadFile(result.markdown || "", `${result.title}.epub`, "application/epub+zip")}
                    />
                    <ExportButton
                      icon="📝" label="Download Markdown"
                      sublabel={`${(result.totalWordCount || 0).toLocaleString()} words`}
                      onClick={() => downloadFile(result.markdown || "", `${result.title}.md`, "text/markdown")}
                    />
                    <ExportButton
                      icon="🌐" label="Download HTML"
                      sublabel="Print-ready format"
                      onClick={() => downloadFile(result.html || "", `${result.title}.html`, "text/html")}
                    />
                    <ExportButton
                      icon="🛒" label="Publish to Amazon KDP"
                      sublabel={isPublishingKdp ? "Publishing..." : (result.epub?.compiled ? "Launch Web Automation" : "EPUB required")}
                      disabled={!result.epub?.compiled || isPublishingKdp}
                      onClick={() => handlePublishKDP(result)}
                    />
                  </div>
                </Card>

                {/* Token usage */}
                {result.tokenUsage && (
                  <Card title="⚡ Token Usage">
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {result.tokenUsage.researchTokens && (
                        <TokenRow label="Research (Flash + Search)" tokens={result.tokenUsage.researchTokens} color="#34d399" />
                      )}
                      <TokenRow label="Outline (Flash)" tokens={result.tokenUsage.outlineTokens} color="#818cf8" />
                      <TokenRow label="Drafting (Pro)" tokens={result.tokenUsage.draftTokens} color="#c084fc" />
                      <TokenRow label="Polishing (Groq)" tokens={result.tokenUsage.polishTokens} color="#4ade80" />
                      <TokenRow label="Matter (Flash)" tokens={result.tokenUsage.matterTokens} color="#818cf8" />
                      <TokenRow label="SVGs (Flash)" tokens={result.tokenUsage.illustrationTokens} color="#fbbf24" />
                      <div style={{ borderTop: "1px solid #27272a", paddingTop: 8, marginTop: 4 }}>
                        <TokenRow label="Total" tokens={result.tokenUsage.totalEstimated} color="#a5b4fc" bold />
                      </div>
                    </div>
                  </Card>
                )}

                {/* EPUB status */}
                <Card title="📦 EPUB Status">
                  <div style={{ fontSize: "0.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: "#71717a" }}>Compiled</span>
                      <span style={{ color: result.epub?.compiled ? "#4ade80" : "#f87171" }}>
                        {result.epub?.compiled ? "✅ Yes" : "❌ No"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: "#71717a" }}>Chapters</span>
                      <span style={{ color: "#d4d4d8" }}>{result.epub?.chapterCount || 0}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: "#71717a" }}>Files</span>
                      <span style={{ color: "#d4d4d8" }}>{result.epub?.fileCount || 0}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#71717a" }}>Obsidian Sync</span>
                      <span style={{ color: result.obsidian?.configured ? "#4ade80" : "#71717a" }}>
                        {result.obsidian?.configured ? "✅ Synced" : "⬜ Not configured"}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state for result tab */}
      {activeTab === "result" && !result && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#52525b" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>📚</div>
          <p style={{ fontSize: "1rem", fontWeight: 600 }}>No ebook generated yet</p>
          <p style={{ fontSize: "0.85rem" }}>Configure your book and hit Generate to create a KDP-ready ebook</p>
          <button
            onClick={() => setActiveTab("config")}
            style={{
              marginTop: 16, padding: "10px 24px", borderRadius: 8, border: "1px solid #27272a",
              background: "#18181b", color: "#a1a1aa", cursor: "pointer", fontSize: "0.85rem",
            }}
          >← Back to Configure</button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: 20, borderRadius: 14, background: "#18181b", border: "1px solid #27272a",
    }}>
      {title && <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#d4d4d8", marginTop: 0, marginBottom: 14 }}>{title}</h3>}
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: "0.75rem", color: "#a1a1aa", display: "block", marginBottom: 4 }}>{label}</label>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #27272a",
          background: "#0f0f11", color: "#e5e7eb", fontSize: "0.85rem", outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: "0.75rem", color: "#a1a1aa", display: "block", marginBottom: 4 }}>{label}</label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #27272a",
          background: "#0f0f11", color: "#e5e7eb", fontSize: "0.85rem", outline: "none",
          boxSizing: "border-box",
        }}
      >
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, sublabel, checked, onChange }: {
  label: string; sublabel: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 0", borderBottom: "1px solid #1f1f23",
    }}>
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#d4d4d8" }}>{label}</div>
        <div style={{ fontSize: "0.7rem", color: "#52525b" }}>{sublabel}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
          background: checked ? "#6366f1" : "#3f3f46", position: "relative",
          transition: "background 0.2s",
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: checked ? 22 : 2,
          width: 20, height: 20, borderRadius: 10, background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </button>
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: "8px 14px", borderRadius: 10, background: `${color}11`,
      border: `1px solid ${color}33`, textAlign: "center", minWidth: 60,
    }}>
      <div style={{ fontSize: "1rem", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: "0.65rem", color: "#71717a", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ExportButton({ icon, label, sublabel, disabled, onClick }: {
  icon: string; label: string; sublabel: string; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #27272a",
        background: disabled ? "#18181b" : "#1f1f23", color: disabled ? "#52525b" : "#d4d4d8",
        cursor: disabled ? "not-allowed" : "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s",
      }}
    >
      <span style={{ fontSize: "1.2rem" }}>{icon}</span>
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: "0.68rem", color: "#52525b" }}>{sublabel}</div>
      </div>
    </button>
  );
}

function TokenRow({ label, tokens, color, bold }: { label: string; tokens: number; color: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
      <span style={{ color: "#71717a", fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ color, fontWeight: bold ? 700 : 600, fontFamily: "'JetBrains Mono', monospace" }}>
        {tokens > 1000 ? `${(tokens / 1000).toFixed(1)}k` : tokens}
      </span>
    </div>
  );
}

// ─── Utilities ──────────────────────────────────────────────

function getPhaseIcon(action: string): string {
  const icons: Record<string, string> = {
    RESEARCH: "🔍", OUTLINE: "🗂️", DRAFT: "✍️", POLISH: "✨",
    FRONT_BACK_MATTER: "📋", COVER: "🖼️", ILLUSTRATIONS: "🎨",
    COMPILE: "📦", COMPLETE: "🎉", EPUB: "📦",
  };
  return icons[action] || "📌";
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}

// ─── Demo Mode Simulation ───────────────────────────────────

async function simulatePipeline(
  config: EbookConfig,
  addLog: (msg: string) => void,
  setProgress: (p: number) => void,
  setCurrentPhase: (p: string) => void,
  setSteps: React.Dispatch<React.SetStateAction<PipelineStep[]>>,
) {
  const phases = [
    { key: "research", delay: 1500, msg: "Grounded Google Search niche research completed" },
    { key: "outline", delay: 1000, msg: "Outline & TOC structured with 7 KDP keywords" },
    { key: "drafting", delay: 1800, msg: `Drafted ${config.chapterCount} chapters` },
    { key: "polishing", delay: 1200, msg: "All chapters polished" },
    { key: "matter", delay: 800, msg: "Front & back matter generated" },
    { key: "cover", delay: 1000, msg: "AI book cover designed using Imagen 3" },
    { key: "illustrations", delay: 1000, msg: "SVG illustrations created" },
    { key: "compiling", delay: 600, msg: "EPUB 3.0 compiled" },
  ];

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    setCurrentPhase(phase.key);
    addLog(`${getPhaseIcon(phase.key.toUpperCase())} ${phase.msg}`);
    setProgress(((i + 1) / phases.length) * 100);
    setSteps((prev) => [...prev, {
      id: phase.key, action: phase.key.toUpperCase(),
      detail: phase.msg, progress: ((i + 1) / phases.length) * 100, status: "done",
    }]);
    await new Promise((r) => setTimeout(r, phase.delay));
  }

  addLog("✅ Demo ebook complete!");
  setProgress(100);
}

function createDemoResult(config: EbookConfig): EbookResult {
  const chapters = Array.from({ length: config.chapterCount }, (_, i) => ({
    number: i + 1,
    title: `Chapter ${i + 1}: ${["The Foundation", "Building Blocks", "Advanced Strategies", "Implementation Guide", "Scaling Up", "Case Studies", "Future Trends", "Action Plan", "Best Practices", "Conclusion"][i % 10]}`,
    wordCount: config.wordsPerChapter + Math.floor(Math.random() * 300) - 150,
    keyTakeaways: ["Key insight from this chapter", "Actionable strategy to implement", "Important concept to remember"],
    hasSvg: config.includeImages,
  }));

  const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="200" cy="300" r="120" fill="#fff" opacity="0.1"/>
  <rect x="40" y="60" width="320" height="480" rx="12" fill="#ffffff" opacity="0.12" stroke="#ffffff" stroke-width="1"/>
  <text x="200" y="200" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="0.05em">${config.topic.toUpperCase()}</text>
  <text x="200" y="240" font-family="system-ui, -apple-system, sans-serif" font-weight="400" font-size="14" fill="#cbd5e1" text-anchor="middle" font-style="italic">${config.subtitle || "The Definitive Guide"}</text>
  <line x1="120" y1="300" x2="280" y2="300" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
  <text x="200" y="340" font-family="system-ui, -apple-system, sans-serif" font-weight="300" font-size="16" fill="#f8fafc" text-anchor="middle">BY ${config.authorName.toUpperCase()}</text>
  <rect x="140" y="460" width="120" height="32" rx="6" fill="#ffffff" opacity="0.2"/>
  <text x="200" y="480" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" fill="#ffffff" text-anchor="middle" letter-spacing="0.1em">WEBNESS PRESS</text>
</svg>`;

  const base64Cover = typeof window !== "undefined" ? window.btoa(unescape(encodeURIComponent(mockSvg))) : null;

  const mockResearchDossier = `# Research Dossier: ${config.topic}

## I. Industry Benchmarks & Live Data Points
* **Market Expansion:** The global market for ${config.topic} reached an estimated $14.2 Billion in late 2025, showing a compounded annual growth rate (CAGR) of 24.8%.
* **Sovereign Efficiency:** Enterprise deployments report a 35% to 50% decrease in manual operations after adopting multi-agent orchestration frameworks.
* **Customer Value:** 82% of small-to-medium business owners identify workflow automation as their primary structural priority for 2026.

## II. Real-World Case Studies & Examples
1. **The Sovereign Firm Agency (SFA):** Scaled its content pipeline using a chapter-by-chapter drafting structure, reducing delivery cycles from 14 days to 4 hours while preserving professional editorial standards.
2. **Vertex Global Operations:** Integrated local Hermes 3 LLM clusters alongside cloud fallback nodes to handle deep contextual research, reducing external API dependencies by 62%.

## III. Core Terminology & Technical Definitions
* **Google Search Grounding:** The live runtime injection of web-derived search results into the model context to prevent logical hallucinations.
* **Medium-Context Dossier Orchestration:** Injecting structured research guides into the prompting chain of draft agents to produce authoritative, fact-aligned books.

## IV. Strategic Actionable Frameworks
* **Stage 1 (Research):** Aggregate niche benchmarks and verified case study definitions.
* **Stage 2 (Design):** Formulate the outline targeting KDP-grade index search criteria.
* **Stage 3 (Drafting):** Author chapters citing structural research dossier data points.`;

  return {
    title: `${config.topic}: The Complete Guide`,
    subtitle: config.subtitle || `A Comprehensive Resource for ${config.audience}`,
    author: config.authorName || "Webness AI",
    totalWordCount: chapters.reduce((s, c) => s + c.wordCount, 0),
    chapters,
    markdown: `# ${config.topic}: The Complete Guide\n\nGenerated by Webness OS Ebook Engine v3.\n\n${chapters.map((ch) => `## ${ch.title}\n\nContent for ${ch.title}...\n`).join("\n---\n\n")}`,
    html: `<html><body><h1>${config.topic}</h1><p>Demo preview. Run with API connected for full output.</p></body></html>`,
    epub: { compiled: true, path: "/vault/books/demo.epub", chapterCount: config.chapterCount, fileCount: config.chapterCount + 9 },
    kdpMetadata: {
      description: `${config.topic} is the definitive guide for ${config.audience}. Learn proven strategies and actionable frameworks.`,
      keywords: config.keywords.split(",").map((k) => k.trim()).filter(Boolean).slice(0, 7),
      categories: ["Business & Money", "Self-Help", "Computers & Technology"],
      targetAge: "18-65",
    },
    tokenUsage: {
      researchTokens: 3500, outlineTokens: 2500, draftTokens: config.chapterCount * 3000, polishTokens: config.chapterCount * 2000,
      matterTokens: 2000, illustrationTokens: config.includeImages ? config.chapterCount * 500 : 0,
      totalEstimated: 3500 + 2500 + config.chapterCount * 5500,
    },
    obsidian: { configured: true, targetPath: "/vault/Webness/Ebooks/demo.md", writeMode: "direct-local-sync" },
    coverImage: base64Cover,
    researchDossier: mockResearchDossier,
  };
}
