# GitHub App Setup Guide

## Overview

The GitHub PR publish target requires a GitHub App installation. This guide
covers setup steps. No secrets are stored in source — all credentials are
environment variables.

## Step 1: Create a GitHub App

1. Go to Settings → Developer settings → GitHub Apps → New GitHub App
2. Set the following:
   - App name: `evident-site-publisher` (or your preferred name)
   - Homepage URL: your org URL
   - Webhook: uncheck "Active" (not needed)

3. Permissions:
   - Repository permissions:
     - Contents: Read & Write
     - Pull requests: Read & Write
   - No organization permissions needed

4. Save and note the App ID.

## Step 2: Generate a Private Key

1. In the App settings, scroll to "Private keys"
2. Click "Generate a private key"
3. Save the `.pem` file securely — do NOT commit it

## Step 3: Install the App

1. Go to the App settings → Install App
2. Select your organization
3. Choose "Only select repositories" and pick your target repo(s)
4. Note the Installation ID from the URL after installation

## Step 4: Configure Environment Variables

Set the following environment variables (server-side only):

```
GITHUB_APP_ID=<your-app-id>
GITHUB_APP_PRIVATE_KEY=<path-to-pem-file-or-base64-content>
GITHUB_APP_INSTALLATION_ID=<installation-id>
```

## Step 5: Configure Allowlist

Update the target configuration with your allowlisted repos:

```json
{
  "allowed_repos": ["your-org/your-site-repo"],
  "base_branch": "main"
}
```

## Security Reminders

- Never commit the private key or any tokens
- Use environment variables exclusively
- The allowlist is fail-closed: empty list = all repos blocked
- Demo tenants cannot use GitHub publishing
- Safe Mode blocks GitHub publishing
