import cron from 'node-cron';

console.log('Workflow Engine initialized.');

export interface TaskDefinition {
  id: string;
  name: string;
  cronExpression?: string; // e.g., '0 0 * * *' for daily
  action: (context: any) => Promise<any>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  tasks: string[]; // Order of task execution
  budgetLimitDollars?: number;
}

export class WorkflowEngine {
  private tasks: Map<string, TaskDefinition> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private currentSpending: number = 0;

  registerTask(task: TaskDefinition) {
    this.tasks.set(task.id, task);
    console.log(`Registered task: ${task.name} (${task.id})`);

    if (task.cronExpression) {
      const job = cron.schedule(task.cronExpression, async () => {
        console.log(`Executing scheduled task: ${task.name}`);
        try {
          await this.runTaskImmediately(task.id);
        } catch (error) {
          console.error(`Task ${task.name} failed:`, error);
        }
      });
      this.scheduledJobs.set(task.id, job);
      console.log(`Scheduled task ${task.name} with cron: ${task.cronExpression}`);
    }
  }

  registerWorkflow(workflow: WorkflowDefinition) {
    this.workflows.set(workflow.id, workflow);
    console.log(`Registered workflow: ${workflow.name} (${workflow.id})`);
  }

  async runWorkflow(workflowId: string, initialContext: any = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    console.log(`Starting workflow: ${workflow.name}`);
    let context = { ...initialContext, _workflowId: workflowId, outputs: {} };

    for (const taskId of workflow.tasks) {
      // Budget Guard check
      if (workflow.budgetLimitDollars && this.currentSpending >= workflow.budgetLimitDollars) {
        console.warn(`Workflow execution aborted: Budget limit of $${workflow.budgetLimitDollars} exceeded.`);
        throw new Error(`BudgetExceeded: Limit of $${workflow.budgetLimitDollars} hit.`);
      }

      console.log(`Executing stage: ${taskId}`);
      const output = await this.runTaskImmediately(taskId, context);
      context.outputs[taskId] = output;
      // Propagate output into global pipeline context memory
      context = { ...context, ...output };
    }

    console.log(`Workflow ${workflow.name} completed successfully.`);
    return context;
  }

  async runTaskImmediately(taskId: string, context: any = {}) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    console.log(`Running task: ${task.name}`);
    // Simulate cost increment tracking
    this.currentSpending += 0.002;
    return await task.action(context);
  }

  stopTaskSchedule(taskId: string) {
    const job = this.scheduledJobs.get(taskId);
    if (job) {
      job.stop();
      this.scheduledJobs.delete(taskId);
      console.log(`Stopped schedule for task ${taskId}`);
    }
  }
}

// Instantiate and register default workflows
const engine = new WorkflowEngine();

engine.registerTask({
  id: 'scrape-seo',
  name: 'SEO Audit Scraper',
  action: async (ctx) => {
    console.log(`Scraping SEO content. URL context: ${ctx.targetUrl || 'default'}`);
    return { seoGaps: ['Missing meta description', 'H1 mismatch'] };
  }
});

engine.registerTask({
  id: 'generate-copy',
  name: 'Gemini Copywriter Writer',
  action: async (ctx) => {
    console.log('Writing content based on SEO gaps:', ctx.seoGaps);
    return { generatedDraft: 'Introducing the ultimate Agentic OS... Optimized for modern workflows.' };
  }
});

engine.registerTask({
  id: 'build-preview',
  name: 'Coder Agent Builder',
  action: async (ctx) => {
    console.log('Building preview files for: ', ctx.generatedDraft);
    return { previewPort: 3000, buildSuccess: true };
  }
});

engine.registerWorkflow({
  id: 'seo-content-pipeline',
  name: 'SEO → Content Pipeline',
  tasks: ['scrape-seo', 'generate-copy', 'build-preview'],
  budgetLimitDollars: 5.0
});

export default engine;

