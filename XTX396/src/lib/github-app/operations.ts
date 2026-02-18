/**
 * GitHub App Repo Operations
 *
 * Abstracts Git operations using installation tokens.
 * Provides: branches, commits, PRs, checks, deployments.
 *
 * CHAIN B2: Least privilege GitHub integration
 *
 * All operations use the minimum required permissions:
 * - contents: write (for commits)
 * - pull_requests: write (for PRs)
 * - checks: read (for status)
 * - deployments: write (optional)
 */

import type {
  RepoConfig,
  FileChange,
  CommitResult,
  BranchResult,
  PullRequestResult,
  CheckStatus,
  DeploymentRecord,
} from './types'
import { authenticatedFetch } from './cache'
import { getInstallation } from './auth'

// ─── Branch Operations ──────────────────────────────────────────────────────

/**
 * Create a new branch from a base ref
 */
export async function createBranch(
  config: RepoConfig,
  branchName: string,
  baseBranch?: string
): Promise<BranchResult> {
  const { owner, repo, branch: defaultBranch } = config
  const base = baseBranch || defaultBranch || 'main'
  const repoBase = `https://api.github.com/repos/${owner}/${repo}`

  try {
    // Get base branch SHA
    const refRes = await authenticatedFetch(`${repoBase}/git/ref/heads/${base}`)
    if (!refRes.ok) {
      return { success: false, error: `Base branch '${base}' not found` }
    }

    const refData = await refRes.json()
    const baseSha = refData.object.sha

    // Create new branch ref
    const createRes = await authenticatedFetch(`${repoBase}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.json()
      return { success: false, error: `Failed to create branch: ${err.message}` }
    }

    return {
      success: true,
      branchName,
      sha: baseSha,
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Delete a branch
 */
export async function deleteBranch(
  config: RepoConfig,
  branchName: string
): Promise<{ success: boolean; error?: string }> {
  const { owner, repo } = config
  const repoBase = `https://api.github.com/repos/${owner}/${repo}`

  try {
    const res = await authenticatedFetch(`${repoBase}/git/refs/heads/${branchName}`, {
      method: 'DELETE',
    })

    if (!res.ok && res.status !== 404) {
      const err = await res.json()
      return { success: false, error: `Failed to delete branch: ${err.message}` }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ─── Commit Operations ──────────────────────────────────────────────────────

/**
 * Create a commit with multiple file changes
 * Uses Git Trees API for atomic multi-file commits
 */
export async function createCommit(
  config: RepoConfig,
  files: FileChange[],
  message: string,
  targetBranch?: string
): Promise<CommitResult> {
  const { owner, repo, branch: defaultBranch } = config
  const branch = targetBranch || defaultBranch || 'main'
  const repoBase = `https://api.github.com/repos/${owner}/${repo}`

  try {
    // 1. Get latest commit SHA on target branch
    const refRes = await authenticatedFetch(`${repoBase}/git/ref/heads/${branch}`)
    if (!refRes.ok) {
      return { success: false, error: `Branch '${branch}' not found` }
    }
    const refData = await refRes.json()
    const latestCommitSha = refData.object.sha

    // 2. Get the tree SHA
    const commitRes = await authenticatedFetch(`${repoBase}/git/commits/${latestCommitSha}`)
    if (!commitRes.ok) {
      return { success: false, error: `Failed to read commit: ${commitRes.status}` }
    }
    const commitData = await commitRes.json()
    const baseTreeSha = commitData.tree.sha

    // 3. Create blobs for each file
    const treeItems: Array<{
      path: string
      mode: string
      type: string
      sha?: string | null
    }> = []

    for (const file of files) {
      if (file.action === 'delete') {
        // To delete, set sha to null (handled differently in tree)
        treeItems.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: null,
        })
      } else {
        // Create blob
        const blobRes = await authenticatedFetch(`${repoBase}/git/blobs`, {
          method: 'POST',
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8',
          }),
        })

        if (!blobRes.ok) {
          const err = await blobRes.json()
          return { success: false, error: `Failed to create blob for ${file.path}: ${err.message}` }
        }

        const blobData = await blobRes.json()
        treeItems.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha,
        })
      }
    }

    // 4. Create new tree
    const treeRes = await authenticatedFetch(`${repoBase}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    })

    if (!treeRes.ok) {
      const err = await treeRes.json()
      return { success: false, error: `Failed to create tree: ${err.message}` }
    }

    const treeData = await treeRes.json()

    // 5. Create commit
    const newCommitRes = await authenticatedFetch(`${repoBase}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    })

    if (!newCommitRes.ok) {
      const err = await newCommitRes.json()
      return { success: false, error: `Failed to create commit: ${err.message}` }
    }

    const newCommitData = await newCommitRes.json()

    // 6. Update branch ref
    const updateRefRes = await authenticatedFetch(`${repoBase}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: false,
      }),
    })

    if (!updateRefRes.ok) {
      const err = await updateRefRes.json()
      return { success: false, error: `Failed to update branch: ${err.message}` }
    }

    return {
      success: true,
      commitSha: newCommitData.sha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitData.sha}`,
      branch,
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Create branch and commit (common workflow)
 */
export async function createBranchWithCommit(
  config: RepoConfig,
  branchName: string,
  files: FileChange[],
  message: string
): Promise<CommitResult> {
  // Create the branch first
  const branchResult = await createBranch(config, branchName)
  if (!branchResult.success) {
    return { success: false, error: branchResult.error }
  }

  // Then commit to it
  const commitResult = await createCommit(config, files, message, branchName)
  if (!commitResult.success) {
    // Clean up branch on failure
    await deleteBranch(config, branchName)
  }

  return commitResult
}

// ─── Pull Request Operations ────────────────────────────────────────────────

/**
 * Create a pull request
 */
export async function createPullRequest(
  config: RepoConfig,
  options: {
    title: string
    body: string
    head: string
    base?: string
    draft?: boolean
  }
): Promise<PullRequestResult> {
  const { owner, repo, branch: defaultBranch } = config
  const base = options.base || defaultBranch || 'main'
  const repoBase = `https://api.github.com/repos/${owner}/${repo}`

  try {
    const res = await authenticatedFetch(`${repoBase}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title: options.title,
        body: options.body,
        head: options.head,
        base,
        draft: options.draft || false,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: `Failed to create PR: ${err.message}` }
    }

    const data = await res.json()

    return {
      success: true,
      number: data.number,
      url: data.html_url,
      state: data.state,
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Get PR status
 */
export async function getPullRequestStatus(
  config: RepoConfig,
  prNumber: number
): Promise<PullRequestResult> {
  const { owner, repo } = config
  const repoBase = `https://api.github.com/repos/${owner}/${repo}`

  try {
    const res = await authenticatedFetch(`${repoBase}/pulls/${prNumber}`)

    if (!res.ok) {
      return { success: false, error: `PR #${prNumber} not found` }
    }

    const data = await res.json()

    return {
      success: true,
      number: data.number,
      url: data.html_url,
      state: data.state,
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ─── Check Status ───────────────────────────────────────────────────────────

/**
 * Get check runs for a commit
 */
export async function getCheckRuns(
  config: RepoConfig,
  ref: string
): Promise<{ success: boolean; checks?: CheckStatus[]; error?: string }> {
  const { owner, repo } = config
  const repoBase = `https://api.github.com/repos/${owner}/${repo}`

  try {
    const res = await authenticatedFetch(`${repoBase}/commits/${ref}/check-runs`)

    if (!res.ok) {
      return { success: false, error: `Failed to get checks: ${res.status}` }
    }

    const data = await res.json()

    const checks: CheckStatus[] = data.check_runs.map(
      (run: Record<string, unknown>) => ({
        id: run.id as number,
        name: run.name as string,
        status: run.status as CheckStatus['status'],
        conclusion: run.conclusion as CheckStatus['conclusion'],
        startedAt: run.started_at as string,
        completedAt: run.completed_at as string,
        detailsUrl: run.details_url as string,
      })
    )

    return { success: true, checks }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Wait for all checks to complete
 */
export async function waitForChecks(
  config: RepoConfig,
  ref: string,
  timeoutMs: number = 300000
): Promise<{ success: boolean; allPassed?: boolean; checks?: CheckStatus[] }> {
  const startTime = Date.now()
  const pollInterval = 10000 // 10 seconds

  while (Date.now() - startTime < timeoutMs) {
    const result = await getCheckRuns(config, ref)
    if (!result.success) {
      return { success: false }
    }

    const checks = result.checks || []
    const allCompleted = checks.every((c) => c.status === 'completed')

    if (allCompleted) {
      const allPassed = checks.every(
        (c) => c.conclusion === 'success' || c.conclusion === 'skipped'
      )
      return { success: true, allPassed, checks }
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  return { success: false }
}

// ─── Deployment Operations ──────────────────────────────────────────────────

/**
 * Create a deployment record
 */
export async function createDeployment(
  config: RepoConfig,
  options: {
    ref: string
    environment: string
    description?: string
    autoMerge?: boolean
  }
): Promise<{ success: boolean; deployment?: DeploymentRecord; error?: string }> {
  const { owner, repo } = config
  const repoBase = `https://api.github.com/repos/${owner}/${repo}`

  try {
    const res = await authenticatedFetch(`${repoBase}/deployments`, {
      method: 'POST',
      body: JSON.stringify({
        ref: options.ref,
        environment: options.environment,
        description: options.description || `Deploy to ${options.environment}`,
        auto_merge: options.autoMerge ?? false,
        required_contexts: [], // Skip status checks (handled separately)
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: `Failed to create deployment: ${err.message}` }
    }

    const data = await res.json()

    return {
      success: true,
      deployment: {
        id: data.id,
        environment: data.environment,
        ref: data.ref,
        sha: data.sha,
        state: 'pending',
        createdAt: data.created_at,
      },
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Update deployment status
 */
export async function updateDeploymentStatus(
  config: RepoConfig,
  deploymentId: number,
  state: DeploymentRecord['state'],
  options?: {
    environmentUrl?: string
    logUrl?: string
    description?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const { owner, repo } = config
  const repoBase = `https://api.github.com/repos/${owner}/${repo}`

  try {
    const res = await authenticatedFetch(`${repoBase}/deployments/${deploymentId}/statuses`, {
      method: 'POST',
      body: JSON.stringify({
        state,
        environment_url: options?.environmentUrl,
        log_url: options?.logUrl,
        description: options?.description || `Deployment ${state}`,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: `Failed to update deployment: ${err.message}` }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ─── High-Level Workflows ───────────────────────────────────────────────────

/**
 * Publish changes: create branch, commit, open PR
 * Main workflow for admin panel data updates
 */
export async function publishChanges(
  config: RepoConfig,
  files: FileChange[],
  options?: {
    branchPrefix?: string
    prTitle?: string
    prBody?: string
  }
): Promise<CommitResult> {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const branchName = `${options?.branchPrefix || 'admin/data-update'}-${Date.now()}`

  // Create branch + commit
  const commitResult = await createBranchWithCommit(
    config,
    branchName,
    files,
    `chore(admin): update ${files.length} data files [${timestamp}]`
  )

  if (!commitResult.success) {
    return commitResult
  }

  // Open PR
  const prResult = await createPullRequest(config, {
    title: options?.prTitle || `Admin Panel: Update ${files.length} data files [${timestamp}]`,
    body:
      options?.prBody ||
      [
        `## Data Update from Admin Panel`,
        ``,
        `**Files changed:** ${files.length}`,
        `**Timestamp:** ${timestamp}`,
        `**Mode:** GitHub App (installation token)`,
        ``,
        `### Files Updated`,
        ...files.map((f) => `- \`${f.path}\``),
        ``,
        `---`,
        `*This PR was auto-created via GitHub App integration.*`,
      ].join('\n'),
    head: branchName,
  })

  return {
    ...commitResult,
    pullRequestUrl: prResult.url,
    pullRequestNumber: prResult.number,
  }
}

/**
 * Get repo info (for testing connection)
 */
export async function getRepoInfo(
  config: RepoConfig
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  const { owner, repo } = config
  const repoBase = `https://api.github.com/repos/${owner}/${repo}`

  try {
    const res = await authenticatedFetch(repoBase)

    if (!res.ok) {
      return { success: false, error: `Repository not accessible: ${res.status}` }
    }

    const data = await res.json()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
