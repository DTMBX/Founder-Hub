# Private Package Registry Strategy — B13-P6

**Status:** Planning
**Owner:** Engineering / DevOps
**Classification:** Internal

---

## 1. Objective

Establish a private package registry to host internal packages, ensuring:

- Supply chain integrity (no dependency on third-party registries for critical
  packages)
- Version pinning and audit trail for all internal dependencies
- Protection against typosquatting and dependency confusion attacks
- Controlled distribution of shared tooling across repositories

## 2. Registry Evaluation

### 2.1 Options Considered

| Option | Type | Cost | Verdict |
|--------|------|------|---------|
| GitHub Packages (npm) | Managed | Included with GitHub plan | **Recommended** |
| Verdaccio (self-hosted) | Self-managed | Infrastructure cost | Viable backup |
| npm Enterprise | Managed | Per-seat licensing | Rejected (cost) |
| Artifactory | Self-managed | License cost | Rejected (complexity) |

### 2.2 Recommendation

**GitHub Packages** for Phase 1:

- Already integrated with existing GitHub infrastructure
- Supports npm, Docker, Maven, NuGet, RubyGems
- Scoped to organization — eliminates dependency confusion
- Free for private packages in GitHub plans

**Verdaccio** as fallback:

- Lightweight self-hosted option
- Can proxy public npm + serve private packages
- Useful for air-gapped or on-premise deployments

## 3. Package Candidates

Internal packages that should be published privately:

| Package | Purpose | Current Location |
|---------|---------|-----------------|
| `@evident/audit-logger` | Ops audit logging | `ops/automation/audit/` |
| `@evident/policy-engine` | Copilot policy engine | `ops/copilot/policy/` |
| `@evident/backup-tools` | Backup/restore services | `ops/backup/` |
| `@evident/runner` | Command runner | `ops/runner/` |
| `@evident/escrow` | Artifact escrow | `ops/backup/` |
| `@evident/ui-tokens` | Design tokens | `src/core/theme/` |

## 4. Implementation Plan

### Phase 1: GitHub Packages Setup

1. Configure `.npmrc` for organization scope
2. Set up GitHub Actions workflow for publishing
3. Pin `@evident/*` scope to private registry
4. Publish first package (`@evident/audit-logger`)

### Phase 2: Dependency Lockdown

1. Enable `npm audit` in CI pipeline
2. Configure Dependabot for private packages
3. Lock all production dependencies (exact versions)
4. Review and approve all new dependencies

### Phase 3: Advanced Protections

1. Configure SBOM generation for all builds
2. Enable provenance attestations (npm provenance)
3. Set up dependency scanning with GitHub Advisory Database
4. Periodic review of unused or outdated dependencies

## 5. .npmrc Template

```ini
# .npmrc — Private registry configuration
@evident:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}

# Public registry for everything else
registry=https://registry.npmjs.org

# Security settings
audit=true
fund=false
save-exact=true
```

## 6. Publishing Workflow (Draft)

```yaml
# .github/workflows/publish-package.yml
name: Publish Package
on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      packages: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://npm.pkg.github.com'
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 7. Security Considerations

- All published packages must pass lint and tests before publish
- Version bumps require PR review
- Packages must not contain secrets, credentials, or .env files
- SBOM must be generated for every published version
- Provenance attestations recommended for supply chain trust

## 8. Timeline

| Phase | Target | Dependencies |
|-------|--------|-------------|
| Phase 1 | After B15 completion | GitHub Packages access |
| Phase 2 | Phase 1 + 2 weeks | npm audit integration |
| Phase 3 | Phase 2 + 1 month | SBOM tooling |

## 9. Out of Scope

- Publishing to the public npm registry
- Docker container registry (separate strategy)
- PyPI packages (Python — separate track)
