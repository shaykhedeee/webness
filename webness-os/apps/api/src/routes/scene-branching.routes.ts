import { Router } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { tenantScope } from "../middleware/tenant.js";

export const sceneBranchingRoutes = Router();

/**
 * Recursive function to invalidate downstream nodes in the dependency graph
 */
export async function invalidateStateNode(orgId: string, nodeType: string, nodeId: string): Promise<void> {
  // 1. Mark target node as stale
  if (nodeType === "scene_branch") {
    await prisma.sceneBranch.updateMany({
      where: { id: nodeId, orgId },
      data: { isStale: true },
    });
  } else if (nodeType === "drawing") {
    await prisma.drawing.updateMany({
      where: { id: nodeId, orgId },
      data: { isStale: true },
    });
  } else if (nodeType === "render") {
    await prisma.render.updateMany({
      where: { id: nodeId, orgId },
      data: { isStale: true },
    });
  }

  // 2. Fetch children dependent on this node
  const dependents = await prisma.stateDependency.findMany({
    where: { parentId: nodeId, parentType: nodeType, orgId },
  });

  // 3. Recurse down the tree
  for (const dep of dependents) {
    await invalidateStateNode(orgId, dep.nodeType, dep.nodeId);
  }
}

// GET /api/scene-branches - List all branches for organization
sceneBranchingRoutes.get("/", authenticate, tenantScope, async (req, res, next) => {
  try {
    const branches = await prisma.sceneBranch.findMany({
      where: { orgId: req.user!.orgId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: branches });
  } catch (err) {
    next(err);
  }
});

// POST /api/scene-branches - Create a new branch
sceneBranchingRoutes.post("/", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { name, description, parentId, state } = req.body;
    const branch = await prisma.sceneBranch.create({
      data: {
        orgId: req.user!.orgId,
        name,
        description,
        parentId: (parentId as string) || null,
        state: state || {},
      },
    });
    res.json({ success: true, data: branch });
  } catch (err) {
    next(err);
  }
});

// GET /api/scene-branches/:id - Get branch detail
sceneBranchingRoutes.get("/:id", authenticate, tenantScope, async (req, res, next) => {
  try {
    const branch = await prisma.sceneBranch.findFirst({
      where: { id: req.params.id as string, orgId: req.user!.orgId },
      include: {
        parent: true,
        children: true,
        proposals: { orderBy: { createdAt: "desc" } },
        drawings: true,
        renders: true,
      },
    });

    if (!branch) {
      return res.status(404).json({ success: false, error: "Branch not found" });
    }

    res.json({ success: true, data: branch });
  } catch (err) {
    next(err);
  }
});

// PUT /api/scene-branches/:id - Update branch state
sceneBranchingRoutes.put("/:id", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { name, description, state, isStale } = req.body;
    
    const originalBranch = await prisma.sceneBranch.findFirst({
      where: { id: req.params.id as string, orgId: req.user!.orgId },
    });

    if (!originalBranch) {
      return res.status(404).json({ success: false, error: "Branch not found" });
    }

    const updated = await prisma.sceneBranch.update({
      where: { id: req.params.id as string },
      data: {
        name: name !== undefined ? name : originalBranch.name,
        description: description !== undefined ? description : originalBranch.description,
        state: state !== undefined ? state : originalBranch.state,
        isStale: isStale !== undefined ? isStale : originalBranch.isStale,
      },
    });

    // If state changes, we invalidate downstream items!
    if (state !== undefined) {
      await invalidateStateNode(req.user!.orgId, "scene_branch", req.params.id as string);
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/scene-branches/:id/invalidate - Manually trigger invalidation
sceneBranchingRoutes.post("/:id/invalidate", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { nodeType } = req.body; // "scene_branch", "drawing", "render"
    await invalidateStateNode(req.user!.orgId, (nodeType as string) || "scene_branch", req.params.id as string);
    res.json({ success: true, message: "Node and dependent state nodes marked as STALE recursively." });
  } catch (err) {
    next(err);
  }
});

// POST /api/scene-branches/:id/proposal - Draft a new proposal
sceneBranchingRoutes.post("/:id/proposal", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { title, description, changes, disposition, wagerMetrics } = req.body;
    const proposal = await prisma.proposal.create({
      data: {
        orgId: req.user!.orgId,
        branchId: req.params.id as string,
        title,
        description,
        changes: changes || {},
        disposition: (disposition as string) || "ADVANCED_AI",
        wagerMetrics: wagerMetrics || {},
        status: "PENDING",
      },
    });
    res.json({ success: true, data: proposal });
  } catch (err) {
    next(err);
  }
});

// GET /api/scene-branches/:id/proposals - List proposals on this branch
sceneBranchingRoutes.get("/:id/proposals", authenticate, tenantScope, async (req, res, next) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { branchId: req.params.id as string, orgId: req.user!.orgId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: proposals });
  } catch (err) {
    next(err);
  }
});

// POST /api/scene-branches/proposals/:proposalId/approve - Approve / Reject proposal
sceneBranchingRoutes.post("/proposals/:proposalId/approve", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { decision, comments } = req.body; // decision: "APPROVED", "REJECTED"
    
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.proposalId as string, orgId: req.user!.orgId },
      include: { branch: true },
    });

    if (!proposal) {
      return res.status(404).json({ success: false, error: "Proposal not found" });
    }

    // 1. Create Approval Record
    await prisma.approval.create({
      data: {
        proposalId: proposal.id,
        approvedBy: req.user!.email,
        decision,
        comments,
      },
    });

    // 2. If approved, merge changes into the branch state
    let updatedBranch = null;
    if (decision === "APPROVED") {
      const mergedState = {
        ...((proposal as any).branch?.state as Record<string, any>),
        ...(proposal.changes as Record<string, any>),
      };

      updatedBranch = await prisma.sceneBranch.update({
        where: { id: proposal.branchId },
        data: {
          state: mergedState,
          isStale: false, // Reset stale state on successful merge approval
        },
      });

      // 3. Trigger stale state invalidation for downstream dependencies
      await invalidateStateNode(req.user!.orgId, "scene_branch", proposal.branchId);
    }

    // 4. Update Proposal Status
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: (decision as string) === "APPROVED" ? "APPROVED" : "REJECTED" },
    });

    res.json({
      success: true,
      data: { proposal: updatedProposal, branch: updatedBranch },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/scene-branches/:id/drawings - Save a drawing
sceneBranchingRoutes.post("/:id/drawings", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { name, canvasData } = req.body;
    const drawing = await prisma.drawing.create({
      data: {
        orgId: req.user!.orgId,
        branchId: req.params.id as string,
        name: name || "Untitled Drawing",
        canvasData: canvasData || {},
      },
    });
    res.json({ success: true, data: drawing });
  } catch (err) {
    next(err);
  }
});

// GET /api/scene-branches/:id/drawings - Get drawings
sceneBranchingRoutes.get("/:id/drawings", authenticate, tenantScope, async (req, res, next) => {
  try {
    const drawings = await prisma.drawing.findMany({
      where: { branchId: req.params.id as string, orgId: req.user!.orgId },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ success: true, data: drawings });
  } catch (err) {
    next(err);
  }
});

// POST /api/scene-branches/:id/renders - Trigger Stable Diffusion/ComfyUI Render
sceneBranchingRoutes.post("/:id/renders", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { drawingId, prompt, parameters } = req.body;
    
    // Create rendering record
    const render = await prisma.render.create({
      data: {
        orgId: req.user!.orgId,
        branchId: req.params.id as string,
        drawingId: (drawingId as string) || null,
        prompt: prompt || "Modern interior room rendering",
        parameters: parameters || { width: 1024, height: 1024, steps: 25 },
        status: "COMPLETED", // Simulated rendering output
        url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80", // Premium render seed
      },
    });

    // If drawingId exists, link dependency
    if (drawingId) {
      await prisma.stateDependency.upsert({
        where: {
          nodeId_parentId: {
            nodeId: render.id,
            parentId: drawingId as string,
          },
        },
        create: {
          orgId: req.user!.orgId,
          nodeType: "render",
          nodeId: render.id,
          parentType: "drawing",
          parentId: drawingId as string,
          parentHash: JSON.stringify(parameters || {}),
        },
        update: {
          parentHash: JSON.stringify(parameters || {}),
        },
      });
    }

    res.json({ success: true, data: render });
  } catch (err) {
    next(err);
  }
});

// GET /api/scene-branches/:id/renders - List renders
sceneBranchingRoutes.get("/:id/renders", authenticate, tenantScope, async (req, res, next) => {
  try {
    const renders = await prisma.render.findMany({
      where: { branchId: req.params.id as string, orgId: req.user!.orgId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: renders });
  } catch (err) {
    next(err);
  }
});

// POST /api/scene-branches/:id/dependencies - Register state dependencies
sceneBranchingRoutes.post("/:id/dependencies", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { nodeId, nodeType, parentId, parentType, parentHash } = req.body;
    const dep = await prisma.stateDependency.upsert({
      where: {
        nodeId_parentId: {
          nodeId: nodeId as string,
          parentId: parentId as string,
        },
      },
      create: {
        orgId: req.user!.orgId,
        nodeType: nodeType as string,
        nodeId: nodeId as string,
        parentType: parentType as string,
        parentId: parentId as string,
        parentHash: (parentHash as string) || "initial",
      },
      update: {
        parentHash: (parentHash as string) || "updated",
      },
    });
    res.json({ success: true, data: dep });
  } catch (err) {
    next(err);
  }
});

// GET /api/scene-branches/:id/dependencies - Get dependencies list
sceneBranchingRoutes.get("/:id/dependencies", authenticate, tenantScope, async (req, res, next) => {
  try {
    const deps = await prisma.stateDependency.findMany({
      where: { orgId: req.user!.orgId },
    });
    res.json({ success: true, data: deps });
  } catch (err) {
    next(err);
  }
});
