import { prisma } from "@webness/db";
import { logger } from "./logger.js";

export interface MemoryEntry {
  orgId: string;
  contentType: string; // e.g. "ebook", "blog", "research", "user_interaction"
  content: string;
  metadata?: any;
}

/**
 * Unified Memory Store for AI OS
 * Interacts with PostgreSQL pgvector via Prisma raw queries since 
 * Prisma's native vector support is still evolving.
 */

// Dummy embedding function - in production this calls an embedding model API (like nomic-embed-text or text-embedding-3-small)
async function generateEmbedding(text: string): Promise<number[]> {
  // Simulating a 768-dimension vector
  return Array(768).fill(0).map(() => Math.random() * 2 - 1);
}

export async function storeMemory(entry: MemoryEntry): Promise<string> {
  logger.info({ orgId: entry.orgId, type: entry.contentType }, "Storing new memory in pgvector Unified Brain");
  try {
    const vector = await generateEmbedding(entry.content);
    
    // We use a raw query because Prisma's Unsupported("vector") requires raw SQL for inserts
    const result = await prisma.$queryRaw`
      INSERT INTO "Embedding" ("id", "orgId", "contentType", "content", "embedding", "metadata", "createdAt")
      VALUES (
        gen_random_uuid(),
        ${entry.orgId},
        ${entry.contentType},
        ${entry.content},
        ${`[${vector.join(",")}]`}::vector,
        ${entry.metadata ? JSON.stringify(entry.metadata) : null}::jsonb,
        NOW()
      )
      RETURNING id;
    `;
    
    const id = Array.isArray(result) && result.length > 0 ? result[0].id : "unknown";
    return id;
  } catch (error) {
    logger.error({ error }, "Failed to store memory");
    throw error;
  }
}

export async function retrieveRelevantMemory(orgId: string, query: string, limit: number = 3): Promise<any[]> {
  logger.info({ orgId, query }, "Retrieving from Unified Memory Brain");
  try {
    const queryVector = await generateEmbedding(query);
    
    // Perform vector similarity search using the <-> operator (L2 distance) or <=> (Cosine distance)
    // We use <=> for cosine distance which is standard for text embeddings.
    const results = await prisma.$queryRaw<any[]>`
      SELECT id, "contentType", content, metadata, 1 - (embedding <=> ${`[${queryVector.join(",")}]`}::vector) as similarity
      FROM "Embedding"
      WHERE "orgId" = ${orgId}
      ORDER BY embedding <=> ${`[${queryVector.join(",")}]`}::vector
      LIMIT ${limit};
    `;
    
    return results;
  } catch (error) {
    logger.error({ error }, "Failed to retrieve memory");
    throw error;
  }
}
