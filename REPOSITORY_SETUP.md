# Repository Setup Guide

This guide outlines the complete setup for protecting the main branch and implementing a proper PR workflow.

## 🛡️ Branch Protection Implementation

### Files Added/Modified:

1. **`.github/workflows/ci.yml`** - Automated CI/CD pipeline
2. **`.github/pull_request_template.md`** - PR template for consistency
3. **`.github/CODEOWNERS`** - Defines code review ownership
4. **`.github/BRANCH_PROTECTION.md`** - Detailed branch protection configuration guide
5. **`package.json`** - Updated with proper lint/test/build scripts
6. **`README.md`** - Updated contributing guidelines
7. **`package-lock.json`** - Dependency lock file for CI

### ⚙️ GitHub Repository Settings to Configure

**Go to Repository Settings → Branches → Add rule for `main`:**

#### Core Protection Rules:
- ✅ **Require a pull request before merging**
  - Require approvals: **1**
  - Dismiss stale reviews when new commits are pushed
  - Require review from code owners
- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging
  - Required status checks: `lint-and-build` and `test`
- ✅ **Require conversation resolution before merging**
- ✅ **Do not allow bypassing the above settings**

#### Additional Recommended Settings:
- ✅ **Restrict pushes that create files over 100MB**
- ⚠️ **Require signed commits** (optional, for enhanced security)
- ⚠️ **Require linear history** (optional, prevents merge commits)

### 🔄 Automated Checks (CI/CD)

The GitHub Actions workflow will automatically run on:
- All pushes to `main` branch
- All pull requests targeting `main` branch

**Checks performed:**
1. **Linting** - Code style and manifest validation
2. **Build** - Extension structure and manifest validation  
3. **Tests** - Basic functionality tests (expandable)
4. **Security** - NPM audit for vulnerabilities

### 👥 Code Ownership

- **@MatejSkultety** is the primary code owner
- All PRs automatically request review from code owners
- At least 1 approval required from a code owner

### 📝 Pull Request Workflow

1. **Create feature branch** from `main`
2. **Make changes** following development guidelines
3. **Run validation** locally: `npm run validate`
4. **Create PR** using the provided template
5. **Automated checks** must pass (CI/CD)
6. **Code review** and approval required
7. **Merge** by maintainer

### 🚀 Benefits

- **No accidental pushes** to main branch
- **Consistent code quality** through automated checks
- **Proper code review** process enforced
- **Clear contribution guidelines** for new contributors
- **Automated validation** prevents broken code in main
- **Security auditing** for dependencies

### 🛠️ Local Development Commands

```bash
# Validate everything before creating PR
npm run validate

# Individual checks
npm run lint      # Code style and manifest validation
npm run build     # Build and structure validation  
npm run test      # Run tests

# Install dependencies
npm install       # For development
npm ci           # For CI (with package-lock.json)
```

### 📋 Checklist for Repository Admin

- [ ] Configure branch protection rules in GitHub Settings
- [ ] Verify CI/CD workflow runs successfully
- [ ] Test PR workflow with a dummy change
- [ ] Confirm status checks are required
- [ ] Verify code owner review requirements
- [ ] Enable repository security features (Dependabot, etc.)

This setup ensures that the `main` branch is fully protected and all changes go through a proper review process with automated quality checks.