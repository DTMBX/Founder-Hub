// B11 – Operations + Growth Automation Layer
// B11-07 — Content Ops (workflow dispatch, preview generation, publish pipeline)

import { getOpsAuditLogger } from '../audit/OpsAuditLogger';

// ─── Content Request Model ──────────────────────────────────────

export type ContentRequestStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'generating'
  | 'preview_ready'
  | 'published'
  | 'failed';

export type ContentType =
  | 'page'
  | 'blog_post'
  | 'landing_page'
  | 'legal_document'
  | 'update';

export interface ContentRequest {
  id: string;
  title: string;
  type: ContentType;
  status: ContentRequestStatus;
  description: string;
  /** Target path or slug for the generated content. */
  targetPath?: string;
  /** Actor who created the request. */
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Preview URL when available. */
  previewUrl?: string;
  /** Generated artifact paths. */
  artifacts: string[];
  /** Error detail if failed. */
  error?: string;
}

export type ContentRequestInput = Pick<ContentRequest, 'title' | 'type' | 'description' | 'targetPath'>;

// ─── Workflow Dispatcher Interface ───────────────────────────────

export interface IContentWorkflowDispatcher {
  readonly name: string;
  /** Trigger the content generation workflow. */
  dispatch(request: ContentRequest, safeMode: boolean): Promise<{ success: boolean; detail?: string }>;
  /** Check workflow health. */
  healthCheck(): Promise<boolean>;
}

// ─── Mock Dispatcher ─────────────────────────────────────────────

export class MockContentDispatcher implements IContentWorkflowDispatcher {
  readonly name = 'mock';
  readonly dispatched: ContentRequest[] = [];

  async dispatch(request: ContentRequest, safeMode: boolean): Promise<{ success: boolean; detail?: string }> {
    if (safeMode) {
      await getOpsAuditLogger().log({
        category: 'content.workflow_dispatched',
        severity: 'info',
        actor: request.createdBy,
        description: `Content workflow dispatch blocked (safe mode): ${request.title}`,
        payload: { requestId: request.id, type: request.type, blocked: true },
      });
      return { success: true, detail: 'Safe mode: dispatch recorded but not executed.' };
    }

    this.dispatched.push({ ...request });

    await getOpsAuditLogger().log({
      category: 'content.workflow_dispatched',
      severity: 'info',
      actor: request.createdBy,
      description: `Content workflow dispatched (mock): ${request.title}`,
      payload: { requestId: request.id, type: request.type },
    });

    return { success: true, detail: 'Mock dispatch recorded.' };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

// ─── GitHub Actions Dispatcher ───────────────────────────────────

export interface GitHubActionsConfig {
  /** Repository owner/name (e.g., 'org/repo'). */
  repo: string;
  /** Workflow file name (e.g., 'generate-content.yml'). */
  workflowId: string;
  /** Branch to dispatch on. */
  ref: string;
  /** GitHub API token (loaded from environment). */
  token: string;
}

export class GitHubActionsDispatcher implements IContentWorkflowDispatcher {
  readonly name = 'github-actions';
  private config: GitHubActionsConfig;

  constructor(config: GitHubActionsConfig) {
    this.config = config;
  }

  async dispatch(request: ContentRequest, safeMode: boolean): Promise<{ success: boolean; detail?: string }> {
    if (safeMode) {
      await getOpsAuditLogger().log({
        category: 'content.workflow_dispatched',
        severity: 'info',
        actor: request.createdBy,
        description: `GitHub Actions dispatch blocked (safe mode): ${request.title}`,
        payload: { requestId: request.id, blocked: true, repo: this.config.repo },
      });
      return { success: true, detail: 'Safe mode: dispatch not executed.' };
    }

    try {
      const url = `https://api.github.com/repos/${this.config.repo}/actions/workflows/${this.config.workflowId}/dispatches`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: this.config.ref,
          inputs: {
            request_id: request.id,
            title: request.title,
            type: request.type,
            target_path: request.targetPath ?? '',
          },
        }),
      });

      const success = response.status === 204;

      await getOpsAuditLogger().log({
        category: 'content.workflow_dispatched',
        severity: success ? 'info' : 'warn',
        actor: request.createdBy,
        description: `GitHub Actions dispatch ${success ? 'succeeded' : 'failed'}: ${request.title}`,
        payload: {
          requestId: request.id, repo: this.config.repo,
          httpStatus: response.status,
        },
      });

      return {
        success,
        detail: success ? 'Workflow dispatch accepted.' : `HTTP ${response.status}`,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      await getOpsAuditLogger().log({
        category: 'content.workflow_dispatched',
        severity: 'error',
        actor: request.createdBy,
        description: `GitHub Actions dispatch error: ${error}`,
        payload: { requestId: request.id, error },
      });
      return { success: false, detail: error };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `https://api.github.com/repos/${this.config.repo}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ─── Content Ops Manager ─────────────────────────────────────────

export class ContentOpsManager {
  private requests = new Map<string, ContentRequest>();
  private dispatcher: IContentWorkflowDispatcher;
  private safeMode: boolean;

  constructor(dispatcher?: IContentWorkflowDispatcher, safeMode = true) {
    this.dispatcher = dispatcher ?? new MockContentDispatcher();
    this.safeMode = safeMode;
  }

  setSafeMode(enabled: boolean): void {
    this.safeMode = enabled;
  }

  setDispatcher(dispatcher: IContentWorkflowDispatcher): void {
    this.dispatcher = dispatcher;
  }

  async createRequest(input: ContentRequestInput, actor: string): Promise<ContentRequest> {
    const now = new Date().toISOString();
    const request: ContentRequest = {
      id: crypto.randomUUID(),
      title: input.title,
      type: input.type,
      description: input.description,
      targetPath: input.targetPath,
      status: 'draft',
      createdBy: actor,
      createdAt: now,
      updatedAt: now,
      artifacts: [],
    };

    this.requests.set(request.id, request);

    await getOpsAuditLogger().log({
      category: 'content.request_created',
      severity: 'info',
      actor,
      description: `Content request created: ${request.title}`,
      payload: { requestId: request.id, type: request.type },
    });

    return { ...request };
  }

  async submitForReview(id: string, actor: string): Promise<ContentRequest> {
    const request = this.requests.get(id);
    if (!request) throw new Error(`Content request not found: ${id}`);

    request.status = 'pending_review';
    request.updatedAt = new Date().toISOString();

    return { ...request };
  }

  async approve(id: string, actor: string): Promise<ContentRequest> {
    const request = this.requests.get(id);
    if (!request) throw new Error(`Content request not found: ${id}`);
    if (request.status !== 'pending_review') {
      throw new Error(`Cannot approve request in status: ${request.status}`);
    }

    request.status = 'approved';
    request.updatedAt = new Date().toISOString();

    return { ...request };
  }

  async dispatchGeneration(id: string, actor: string): Promise<{ success: boolean; detail?: string }> {
    const request = this.requests.get(id);
    if (!request) throw new Error(`Content request not found: ${id}`);
    if (request.status !== 'approved' && request.status !== 'draft') {
      throw new Error(`Cannot dispatch request in status: ${request.status}`);
    }

    request.status = 'generating';
    request.updatedAt = new Date().toISOString();

    const result = await this.dispatcher.dispatch(request, this.safeMode);

    if (!result.success) {
      request.status = 'failed';
      request.error = result.detail;
    }

    return result;
  }

  async markPreviewReady(id: string, previewUrl: string, artifacts: string[]): Promise<ContentRequest> {
    const request = this.requests.get(id);
    if (!request) throw new Error(`Content request not found: ${id}`);

    request.status = 'preview_ready';
    request.previewUrl = previewUrl;
    request.artifacts = artifacts;
    request.updatedAt = new Date().toISOString();

    return { ...request };
  }

  async publish(id: string, actor: string): Promise<ContentRequest> {
    const request = this.requests.get(id);
    if (!request) throw new Error(`Content request not found: ${id}`);
    if (request.status !== 'preview_ready') {
      throw new Error(`Cannot publish request in status: ${request.status}`);
    }

    request.status = 'published';
    request.updatedAt = new Date().toISOString();

    await getOpsAuditLogger().log({
      category: 'content.publish_triggered',
      severity: 'info',
      actor,
      description: `Content published: ${request.title}`,
      payload: { requestId: request.id, type: request.type, artifacts: request.artifacts.length },
    });

    return { ...request };
  }

  getRequest(id: string): ContentRequest | null {
    const r = this.requests.get(id);
    return r ? { ...r } : null;
  }

  getAllRequests(): ContentRequest[] {
    return Array.from(this.requests.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => ({ ...r }));
  }

  async healthCheck(): Promise<boolean> {
    return this.dispatcher.healthCheck();
  }
}

// ─── Singleton ───────────────────────────────────────────────────

let _manager: ContentOpsManager | null = null;

export function getContentOpsManager(): ContentOpsManager {
  if (!_manager) {
    _manager = new ContentOpsManager();
  }
  return _manager;
}

export function resetContentOpsManager(): void {
  _manager = null;
}
