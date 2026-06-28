import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Webness OS database...\n");

  // ---- Enable pgvector extension ----
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
  console.log("✅ pgvector extension enabled");

  // ---- Seed Tools ----
  const tools = [
    {
      slug: "seo_auditor",
      name: "SEO Auditor",
      description:
        "Comprehensive website SEO audit with 0-100 score, technical analysis, content analysis, and actionable recommendations.",
      category: "SEO" as const,
      creditCost: 10,
      isFree: true,
      minPlan: "FREE" as const,
      estimatedSeconds: 45,
      icon: "🔍",
      inputSchema: {
        type: "object",
        required: ["url"],
        properties: {
          url: { type: "string", description: "Website URL to audit" },
          keyword: {
            type: "string",
            description: "Target keyword (optional)",
          },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          score: { type: "number" },
          technical: { type: "object" },
          content: { type: "object" },
          recommendations: { type: "array" },
        },
      },
    },
    {
      slug: "researcher",
      name: "Deep Researcher",
      description:
        "Research any topic by scraping Google, analyzing competitors, and synthesizing findings into a structured brief.",
      category: "RESEARCH" as const,
      creditCost: 15,
      isFree: false,
      minPlan: "STARTER" as const,
      estimatedSeconds: 90,
      icon: "🧪",
      inputSchema: {
        type: "object",
        required: ["topic"],
        properties: {
          topic: { type: "string", description: "Research topic" },
          depth: {
            type: "string",
            enum: ["quick", "standard", "deep"],
            default: "standard",
          },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          brief: { type: "string" },
          sources: { type: "array" },
          gaps: { type: "array" },
        },
      },
    },
    {
      slug: "blog_writer",
      name: "Blog Writer",
      description:
        "Generate production-quality, SEO-optimized blog posts with research, outline, draft, polish, and publishing.",
      category: "CONTENT" as const,
      creditCost: 25,
      isFree: false,
      minPlan: "STARTER" as const,
      estimatedSeconds: 180,
      icon: "✍️",
      inputSchema: {
        type: "object",
        required: ["topic"],
        properties: {
          topic: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
          wordCount: { type: "number", default: 2000 },
          tone: {
            type: "string",
            enum: ["professional", "casual", "academic", "friendly"],
          },
          publish: { type: "boolean", default: false },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          seoScore: { type: "number" },
          wordCount: { type: "number" },
        },
      },
    },
    {
      slug: "social_writer",
      name: "Social Media Writer",
      description:
        "Repurpose blogs into social media posts for LinkedIn, Instagram, Twitter, and Facebook.",
      category: "SOCIAL" as const,
      creditCost: 8,
      isFree: false,
      minPlan: "STARTER" as const,
      estimatedSeconds: 30,
      icon: "📱",
      inputSchema: {
        type: "object",
        required: ["content"],
        properties: {
          content: { type: "string", description: "Source content to repurpose" },
          platforms: {
            type: "array",
            items: {
              type: "string",
              enum: ["linkedin", "instagram", "twitter", "facebook"],
            },
          },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          posts: { type: "array" },
        },
      },
    },
    {
      slug: "lead_scraper",
      name: "Lead Scraper",
      description:
        "Find businesses on Google Maps, enrich with website analysis, and generate personalized outreach drafts.",
      category: "OUTREACH" as const,
      creditCost: 20,
      isFree: false,
      minPlan: "PRO" as const,
      estimatedSeconds: 120,
      icon: "🎯",
      inputSchema: {
        type: "object",
        required: ["query", "location"],
        properties: {
          query: { type: "string", description: "Business type to search" },
          location: { type: "string", description: "City/area to search in" },
          limit: { type: "number", default: 10 },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          leads: { type: "array" },
          emails: { type: "array" },
        },
      },
    },
    {
      slug: "whatsapp_sender",
      name: "WhatsApp Business",
      description:
        "Send template messages, manage conversations, and set up auto-responses via WhatsApp Cloud API.",
      category: "WHATSAPP" as const,
      creditCost: 5,
      isFree: false,
      minPlan: "PRO" as const,
      estimatedSeconds: 10,
      icon: "💬",
      inputSchema: {
        type: "object",
        required: ["action"],
        properties: {
          action: {
            type: "string",
            enum: ["send_template", "send_message", "list_templates"],
          },
        },
      },
      outputSchema: {
        type: "object",
        properties: { result: { type: "object" } },
      },
    },
    {
      slug: "invoice_generator",
      name: "Invoice Generator",
      description:
        "Generate professional PDF invoices and receipts with company branding.",
      category: "INVOICING" as const,
      creditCost: 3,
      isFree: false,
      minPlan: "STARTER" as const,
      estimatedSeconds: 15,
      icon: "🧾",
      inputSchema: {
        type: "object",
        required: ["clientName", "items"],
        properties: {
          clientName: { type: "string" },
          items: { type: "array" },
          dueDate: { type: "string" },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          invoiceNumber: { type: "string" },
          pdfUrl: { type: "string" },
        },
      },
    },
    {
      slug: "linkedin_manager",
      name: "LinkedIn Manager",
      description:
        "Schedule posts, track engagement, and optimize LinkedIn profiles for clients.",
      category: "LINKEDIN" as const,
      creditCost: 8,
      isFree: false,
      minPlan: "PRO" as const,
      estimatedSeconds: 20,
      icon: "💼",
      inputSchema: {
        type: "object",
        required: ["action"],
        properties: {
          action: {
            type: "string",
            enum: ["create_post", "schedule_post", "get_analytics"],
          },
        },
      },
      outputSchema: {
        type: "object",
        properties: { result: { type: "object" } },
      },
    },
    {
      slug: "snapquote",
      name: "SnapQuote",
      description:
        "Multimodal visual-estimation tool. Upload a photograph of a job site or list details to generate an automated labor, plants, and materials quotation.",
      category: "INVOICING" as const,
      creditCost: 15,
      isFree: false,
      minPlan: "STARTER" as const,
      estimatedSeconds: 60,
      icon: "📸",
      inputSchema: {
        type: "object",
        required: ["description"],
        properties: {
          image: { type: "string", description: "Base64 image or public image URL representing the job site" },
          description: { type: "string", description: "Details or scope of the trade job" },
          clientName: { type: "string", description: "Client's name" },
          clientEmail: { type: "string", description: "Client's email" },
          projectName: { type: "string", description: "Name of the project" },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          projectName: { type: "string" },
          clientName: { type: "string" },
          estimation: { type: "object" },
          html: { type: "string" },
        },
      },
    },
  ];

  for (const tool of tools) {
    await prisma.tool.upsert({
      where: { slug: tool.slug },
      update: tool,
      create: tool,
    });
    console.log(`  ✅ Tool: ${tool.name} (${tool.slug})`);
  }

  // ---- Seed Agents ----
  const agents = [
    {
      name: "Router",
      role: "MANAGER" as const,
      model: "qwen2.5:7b",
      provider: "ollama",
      config: {
        temperature: 0.1,
        max_tokens: 2048,
        system_prompt:
          "You are a task router. Classify user requests into tool types and create execution plans.",
      },
    },
    {
      name: "Reasoner",
      role: "REASONER" as const,
      model: "deepseek-r1:8b",
      provider: "ollama",
      config: {
        temperature: 0.3,
        max_tokens: 8192,
        system_prompt:
          "You are a deep reasoning agent. Analyze problems thoroughly before providing solutions.",
      },
    },
    {
      name: "Writer",
      role: "WRITER" as const,
      model: "llama3.1:8b",
      provider: "ollama",
      config: {
        temperature: 0.7,
        max_tokens: 8192,
        system_prompt:
          "You are a professional content writer. Create engaging, SEO-optimized content.",
      },
    },
    {
      name: "Critic",
      role: "CRITIC" as const,
      model: "deepseek-r1:8b",
      provider: "ollama",
      config: {
        temperature: 0.2,
        max_tokens: 4096,
        system_prompt:
          "You are a quality critic. Evaluate content for SEO, readability, accuracy, and brand voice.",
      },
    },
    {
      name: "Researcher",
      role: "RESEARCHER" as const,
      model: "deepseek-r1:8b",
      provider: "ollama",
      config: {
        temperature: 0.3,
        max_tokens: 8192,
        system_prompt:
          "You are a deep researcher. Analyze information from multiple sources and synthesize findings.",
      },
    },
  ];

  for (const agent of agents) {
    const existing = await prisma.agent.findFirst({
      where: { name: agent.name },
    });
    if (!existing) {
      await prisma.agent.create({ data: agent });
      console.log(`  ✅ Agent: ${agent.name} (${agent.model})`);
    } else {
      console.log(`  ⏭️  Agent: ${agent.name} (already exists)`);
    }
  }

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
