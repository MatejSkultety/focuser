# Branch Protection Configuration

This document outlines the branch protection rules that should be configured for the `main` branch of this repository to ensure code quality and stability.

## GitHub Repository Settings

### Branch Protection Rules for `main` branch

To configure these settings, go to: **Settings** → **Branches** → **Add rule** (for `main` branch)

#### Required Settings:

1. **Branch name pattern**: `main`

2. **Protect matching branches**: ✅ Enabled

3. **Restrict pushes that create files over 100MB**: ✅ Enabled

4. **Require a pull request before merging**: ✅ Enabled
   - **Require approvals**: ✅ Enabled (minimum: 1)
   - **Dismiss stale reviews when new commits are pushed**: ✅ Enabled
   - **Require review from code owners**: ✅ Enabled (if CODEOWNERS file exists)

5. **Require status checks to pass before merging**: ✅ Enabled
   - **Require branches to be up to date before merging**: ✅ Enabled
   - **Status checks that are required**:
     - `lint-and-build`
     - `test`

6. **Require conversation resolution before merging**: ✅ Enabled

7. **Require signed commits**: ⚠️ Optional (recommended for enhanced security)

8. **Require linear history**: ⚠️ Optional (prevents merge commits)

9. **Require deployments to succeed before merging**: ❌ Disabled (not applicable)

10. **Lock branch**: ❌ Disabled (allows authorized changes)

11. **Do not allow bypassing the above settings**: ✅ Enabled

12. **Restrict pushes that create tags**: ❌ Disabled

### Additional Recommended Settings:

#### Repository Settings:
- **Allow merge commits**: ✅ Enabled
- **Allow squash merging**: ✅ Enabled  
- **Allow rebase merging**: ✅ Enabled
- **Always suggest updating pull request branches**: ✅ Enabled
- **Allow auto-merge**: ⚠️ Optional
- **Automatically delete head branches**: ✅ Enabled

#### Security Settings:
- **Enable vulnerability alerts**: ✅ Enabled
- **Enable Dependabot security updates**: ✅ Enabled
- **Enable Dependabot version updates**: ✅ Enabled

## How This Protects the Repository

1. **No Direct Pushes**: Prevents anyone from pushing directly to `main`
2. **Pull Request Workflow**: All changes must go through pull requests
3. **Code Review**: At least one approval required before merging
4. **Automated Checks**: CI/CD must pass before merging
5. **Up-to-date Branches**: Ensures PRs are current with latest main
6. **Conversation Resolution**: All review comments must be addressed

## For Repository Administrators

Only repository administrators can bypass these rules in emergency situations. However, the "Do not allow bypassing" setting should prevent this unless specifically needed.

## Workflow for Contributors

1. Fork the repository or create a feature branch
2. Make changes in the feature branch
3. Ensure all tests pass locally
4. Create a pull request to `main`
5. Wait for automated checks to pass
6. Address any review comments
7. Get approval from a maintainer
8. Maintainer merges the PR

This configuration ensures that `main` always contains stable, reviewed code.