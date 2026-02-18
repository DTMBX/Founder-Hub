/**
 * ops/integrations/github/RepoAllowlist.ts
 *
 * Enforces GitHub repository allowlisting.
 * Fail-closed: if a repo is not in the allowlist, it is blocked.
 * No wildcards allowed — every repo must be explicitly listed.
 */

export interface RepoAllowlistConfig {
  readonly allowedRepos: readonly string[]
}

export class RepoAllowlist {
  private readonly _allowed: ReadonlySet<string>

  constructor(config: RepoAllowlistConfig) {
    // Normalize to lowercase for consistent comparison
    this._allowed = new Set(config.allowedRepos.map(r => r.toLowerCase()))
  }

  /** Check if a repo (owner/name format) is allowed. Fail-closed. */
  isAllowed(repo: string): boolean {
    if (!repo || !repo.includes('/')) return false
    return this._allowed.has(repo.toLowerCase())
  }

  /** Get the list of allowed repos. */
  getAllowed(): readonly string[] {
    return [...this._allowed]
  }

  /** Number of repos in allowlist. */
  get size(): number {
    return this._allowed.size
  }

  /** Returns true if the allowlist is empty (= all repos blocked). */
  get isEmpty(): boolean {
    return this._allowed.size === 0
  }
}
