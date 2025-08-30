# Branch Protection Setup

This guide explains how to set up basic branch protection for the main branch to require pull request reviews.

## Required GitHub Settings

1. Go to **Settings** → **Branches** in your GitHub repository
2. Click **Add rule** or **Edit** for the main branch
3. Configure these settings:

### Basic Protection
- ✅ **Require a pull request before merging**
- ✅ **Require approvals**: Set to 1
- ✅ **Require review from CODEOWNERS** (this ensures @MatejSkultety reviews all changes)

### Optional (Recommended)
- ✅ **Restrict pushes that create files larger than 100 MB**
- ✅ **Allow force pushes: Nobody**

## What This Achieves

- **No direct pushes** to the main branch
- **All changes must go through pull requests**
- **@MatejSkultety automatically gets review requests** (via CODEOWNERS)
- **At least 1 approval required** before merging

## CODEOWNERS File

The `.github/CODEOWNERS` file is already configured to make @MatejSkultety the owner of all files, ensuring automatic review requests on all pull requests.