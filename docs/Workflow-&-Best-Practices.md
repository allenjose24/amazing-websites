# Git Workflow & Deployment Best Practices 🚀

This document outlines the standard Git development lifecycle, automated quality checks, and best practices for managing code, database, and edge function deployments in the **Amazing Websites (The Vault)** repository.

---

## 🔁 1. The Local-to-Remote Development Lifecycle

Follow these steps for every feature, bug fix, or style adjustment:

```
[Local main] ──(git pull)──► [Local main (synced)] ──(git checkout -b)──► [Feature Branch]
                                                                                │
[Merged main] ◄──(Merge PR)── [Review & CI Checks] ◄──(Open PR)──[Push Remote]◄─┘
```

### Step 1: Claim & Start a Task
1. Drag the issue card from **Todo** to **In Progress** on your GitHub Kanban project board.
2. Switch to your local `main` branch:
   ```bash
   git checkout main
   ```
3. **Crucial**: Pull the latest remote updates to prevent merge conflicts:
   ```bash
   git pull origin main
   ```

### Step 2: Create a Feature Branch
Create a new branch naming it after the feature or task (e.g. `feat/search-bar` or `fix/card-overlap`):
```bash
git checkout -b feat/search-bar
```

### Step 3: Write Code & Test Locally
Develop your features and run the local development server:
```bash
npm run dev
```
Before committing, verify that your code compiles and passes linter checks locally:
```bash
npm run lint
npm run build
```

### Step 4: Commit & Push Changes
Stage and commit your changes, then push your feature branch to the remote repository:
```bash
git add .
git commit -m "feat: implement search and filter bar on dashboard"
git push origin feat/search-bar
```

### Step 5: Open a Pull Request & Link the Issue
1. Open your repository on GitHub.com and click **Compare & pull request** on the banner.
2. In the PR description, link it to the issue so it closes automatically upon merging:
   > "This PR implements a search bar on the Dashboard. **Closes #1**."
3. Under the **Projects** section on the right, select your Kanban project board.

---

## 🛡️ 2. CI/CD, Review Rules, and Automations

Once a Pull Request is opened, the automated pipelines and repository policies take control:

* **Automated CI Checks**: GitHub Actions triggers [.github/workflows/ci.yml](file:///d:/antigravity/amazing-websites/.github/workflows/ci.yml) which boots up a Node.js v22 environment, installs dependencies, verifies ESLint quality standards, and builds the production bundle.
* **Vulnerability Audits**: Dependabot scans dependencies weekly and creates PRs to patch security flaws.
* **Code Owners**: The [.github/CODEOWNERS](file:///d:/antigravity/amazing-websites/.github/CODEOWNERS) file automatically assigns `@allenjose24` to review all incoming pull requests.
* **Safe Merging**:
  * Ensure the automated check has a **green checkmark** (meaning linter and build compiled successfully).
  * Review the diff changes.
  * Merge the PR. This will close the issue, merge the branch into `main`, and move the Kanban card to **Done**.

---

## ⚠️ 3. Crucial Workflow Details (Common Pitfalls)

### 1. The "Outdated Base" Trap
Always pull changes (`git pull origin main`) *before* creating a new branch. If you create a branch from an outdated `main` copy, your branch will conflict with recent changes made by Dependabot or other merges, requiring complex manual rebasing.

### 2. Environment Variables are Not Automated
* **Local**: Configuration keys live in `.env.local` (which is excluded from Git via `.gitignore`).
* **Production**: When deploying to hosting platforms like Vercel or Netlify, **you must manually add** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the environment settings panel in their dashboard.

### 3. Database Schema Sync is Manual
Git tracks source files but **does not track database tables or database functions**.
* If you modify a database schema, RLS policies, trigger constraints, or PostgreSQL RPC functions:
  * Merging the code PR **will not** update your database.
  * You must copy the SQL changes and run them manually in the remote **Supabase SQL Editor** (or use the Supabase CLI migration system) to sync the production database.

### 4. Edge Functions require Manual Deployment
Modifying files inside `supabase/functions/` and pushing them to GitHub does not update the live edge functions.
* After merging a change to an edge function, deploy it manually using the CLI:
  ```bash
  npx supabase functions deploy log-ip-visit
  ```

---

## 📏 4. Synchronizing Branches (Linear Sync)

To keep development branches (e.g. `feat`) on the same commit page as `main` locally and remotely:

```bash
# 1. Switch to feat branch
git checkout feat

# 2. Merge main branch (fast-forward)
git merge main

# 3. Push feat branch to GitHub
git push origin feat

# 4. Switch back to main
git checkout main
```

To prevent local merge commits when pulling remote changes, configure Git to rebase by default:
```bash
git config --global pull.rebase true
```
