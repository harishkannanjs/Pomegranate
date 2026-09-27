# Blogly — Terminal Aesthetic Technical Publishing Platform

> A production-ready, ultra-fast personal blog and technical research platform built with **Astro 5**, **Tailwind CSS v4**, **MDX**, and **Pagefind**, featuring swappable theme packs and dual TUI/Standard UI modes.

---

## Table of Contents

1. [Features & Design Philosophy](#1-features--design-philosophy)
2. [Step 1: Local Setup (Zero to Running in 60s)](#step-1-local-setup-zero-to-running-in-60s)
3. [Step 2: Customizing Your Profile & Branding](#step-2-customizing-your-profile--branding)
4. [Step 3: Setting Up Giscus Comments (GitHub Discussions)](#step-3-setting-up-giscus-comments-github-discussions)
5. [Step 4: Writing & Managing Articles](#step-4-writing--managing-articles)
6. [Step 5: Deploying to GitHub Pages](#step-5-deploying-to-github-pages)
7. [Step 6: Pushing Updates with One Click](#step-6-pushing-updates-with-one-click)
8. [Comprehensive Troubleshooting & Remediation](#comprehensive-troubleshooting--remediation)
9. [Project Architecture & File Tree](#project-architecture--file-tree)

---

## 1. Features & Design Philosophy

- **Authentic Terminal Aesthetic**: Powered by **Catppuccin Mocha** (dark) and synchronized **Catppuccin Latte** (light) palettes. Depth is established through tonal stepping and 1px hairline borders (`#45475a`) with zero distracting drop-shadows.
- **Typography**: 100% self-hosted **JetBrains Mono** across UI chrome, headings, body text, and code snippets.
- **Lightning-Fast Client Search**: Instant search and tag exploration (`Ctrl+K` or `/`) backed by an offline-capable **Pagefind** static index.
- **Interactive Markdown Components**:
  - Code blocks with line highlighting, diffs (`+`/`-`), and 1-click copy buttons via **Shiki**.
  - Interactive sequence and architecture diagrams with `<Mermaid />`.
  - Terminal replays with `<Asciinema />`.
  - LaTeX mathematical equations with **KaTeX** ($E = mc^2$).
  - Collapsible spoilers, side notes, reading progress indicators, and estimated reading time.
- **In-Browser Localhost Dashboard**:
  - Edit your author identity, social links, and bio right in your browser at `http://localhost:4321/profile`.
  - Drag-and-drop new articles with the built-in blog uploader.
  - Push all local codebase changes directly to your GitHub repository with one click.
- **Serverless Comments**: Built on **Giscus** and GitHub Discussions — zero databases, zero tracking, and spam-free.

---

## Step 1: Local Setup (Zero to Running in 60s)

### Prerequisites

You only need **one** of the following JavaScript runtimes installed on your machine:

- **[Bun](https://bun.sh)** (recommended for blazing speed, v1.2+):
  - **Windows (PowerShell)**: `powershell -c "irm bun.sh/install.ps1 | iex"`
  - **macOS / Linux**: `curl -fsSL https://bun.sh/install | bash`
- *or* **[Node.js](https://nodejs.org)** (v20+ with `npm` or `pnpm`).

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/glyph.sh.git
cd glyph.sh
```

### 2. Install Dependencies

Using Bun:
```bash
bun install
```
*(Or using npm: `npm install`)*

### 3. Start the Development Server

```bash
bun run dev
```
*(Or using npm: `npm run dev`)*

Open **[http://localhost:4321](http://localhost:4321)** in your web browser. You will see your terminal blog running locally with native Hot Module Replacement (HMR).

---

### ⚠️ Common Errors & Remediation (Step 1)

> **Problem: `Port 4321 is in use, trying another one...`**
> - **Cause**: A previous terminal session or dev server is still running on port 4321.
> - **Remediation**:
>   - Astro will automatically fallback to `http://localhost:4322/`. You can view it there.
>   - To free port 4321 on Windows: Open PowerShell and run `Stop-Process -Id (Get-NetTCPConnection -LocalPort 4321).OwningProcess -Force`.
>   - On macOS/Linux: Run `kill -9 $(lsof -t -i:4321)`.

> **Problem: `Scripts disabled on this system` (PowerShell on Windows)**
> - **Cause**: Windows Execution Policy blocks unsigned scripts by default.
> - **Remediation**: Run PowerShell as Administrator and execute `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, then restart your terminal.

---

## Step 2: Customizing Your Profile & Branding

All author details, site titles, social links, and comment configurations are stored in **[`profile.json`](profile.json)** at the root of the repository.

You can customize your details in two ways:

### Method A: Using the Localhost Dashboard (Recommended)

1. Start your local server (`bun run dev`) and visit **[http://localhost:4321/profile](http://localhost:4321/profile)**.
2. In the top dev toolbar, click **`$ edit-profile`** (or press the **`e`** key).
3. Update your details in the modal:
   - **Author Name**: Your name or handle.
   - **Tagline / Role**: Your job title or technical focus.
   - **Bio**: Short description for your profile.
   - **GitHub / Twitter / Email**: Your contact coordinates.
   - **Site URL**: Your planned live deployment URL (e.g. `https://username.github.io/glyph.sh` or `https://yourdomain.com`).
4. Click **Save to profile.json**. Your changes are immediately written to disk and visible on the page.
5. **Change Your Logo/Avatar**: Hover over the avatar image on the profile page and click **Upload Logo**. Pick your PNG or JPG file; it will be saved to `public/profile-logo.png` and update automatically.

### Method B: Directly in `profile.json`

Open `profile.json` in your favorite code editor and edit the fields:

```json
{
  "author": "Alice Reed",
  "handle": "@alicereed",
  "avatar": "/profile-logo.png",
  "logo": "/profile-logo.png",
  "role": "Systems Engineer & Security Researcher",
  "twitterHandle": "@alicereed",
  "title": "Blogly",
  "description": "Explorations into low-level systems, kernel development, and distributed consensus.",
  "siteUrl": "https://alice.github.io/glyph.sh",
  "githubUrl": "https://github.com/alice",
  "twitterUrl": "https://x.com/alice",
  "email": "alice@example.com",
  "postsPerPage": 10,
  "giscus": {
    "enabled": false,
    "repo": "",
    "repoId": "",
    "category": "General",
    "categoryId": ""
  }
}
```

---

## Step 3: Setting Up Giscus Comments (GitHub Discussions)

Comments are powered by **[Giscus](https://giscus.app)** — a modern commenting engine built on **GitHub Discussions**. No third-party accounts, no ads, and no external databases are required.

Follow these 4 steps to configure comments:

### 1. Ensure Your Repository is Public
Giscus connects to GitHub Discussions via the public API. Your repository must be set to **Public** on GitHub. *(Private repositories cannot load Giscus comments without OAuth proxying).*

### 2. Turn On GitHub Discussions
1. Go to your repository on GitHub (`https://github.com/<your-username>/glyph.sh`).
2. Click **Settings** (top navigation bar).
3. Scroll down to the **Features** section.
4. Check the box next to **Discussions**.

### 3. Install the Giscus GitHub App
1. Visit the **[Giscus GitHub App](https://github.com/apps/giscus)** page.
2. Click **Install** (or **Configure** if already installed on your account).
3. Under **Repository access**, select **Only select repositories** and choose your blog repository.
4. Click **Install & Authorize**.

### 4. Obtain Your Repository and Category IDs
1. Open **[giscus.app](https://giscus.app)** in your browser.
2. Under **Repository**, enter your repo as `username/repository-name` (e.g. `alice/glyph.sh`). Giscus will verify your repo in green.
3. Under **Page ↔ Discussions Mapping**, leave the default selection (**Discussion title contains page `pathname`**).
4. Under **Discussion Category**, select **General** (or **Announcements**).
5. Scroll down to **Enable giscus**. In the generated snippet, look for these two attributes:
   - `data-repo-id="..."` (e.g. `R_kgDOUZ...`)
   - `data-category-id="..."` (e.g. `DIC_kwDOU...`)
6. Copy both IDs.

### 5. Save to `profile.json`
Update the `giscus` block in [`profile.json`](profile.json) (or in the `$ edit-profile` modal):

```json
"giscus": {
  "enabled": true,
  "repo": "alice/glyph.sh",
  "repoId": "R_kgDOUZ5NPw",
  "category": "General",
  "categoryId": "DIC_kwDOUZ5NP84DFjkr"
}
```

---

### ⚠️ Common Errors & Remediation (Step 3)

> **Problem: "Discussion not found" or comments don't appear.**
> - **Cause 1**: The repository is set to Private. (Must be Public).
> - **Cause 2**: GitHub Discussions was not enabled in repo Settings.
> - **Cause 3**: The Giscus app was not installed or granted access to this specific repository. Visit `https://github.com/apps/giscus` and ensure repository access is granted.
> - **Cause 4**: Mismatched `repoId` or `categoryId`. Verify the strings match the output from `giscus.app`.

---

## Step 4: Writing & Managing Articles

Articles live in the root `/Blogs` directory. The custom dynamic content engine takes care of routing, table of contents, reading time calculation, and series progression automatically:

```
Blogs/
├── series/                          <-- Multi-part serial write-ups
│   └── kernel-exploitation/
│       ├── 01-alpc-race-condition.md
│       └── 02-token-stealing.mdx
└── standalone/                      <-- Individual posts & notes
    └── welcome-to-glyph.md
```

### Writing a Standalone Post

Create a new file in `Blogs/standalone/my-new-post.md`:

```markdown
---
title: "Understanding Memory Safety in Modern Systems"
description: "A comprehensive look at spatial and temporal memory safety primitives."
pubDate: 2026-09-14
tags: ["systems", "c", "rust", "security"]
draft: false
---

## Introduction

Your article content goes here. You can use standard Markdown, code blocks, lists, and images.
```

### Writing a Multi-Part Series

1. Create a folder inside `Blogs/series/` (e.g. `Blogs/series/reverse-engineering/`).
2. Add your parts prefixed with a number:
   - `01-introduction-and-tooling.md`
   - `02-disassembling-binary.md`
   - `03-hooking-apis.mdx`
3. The blog automatically detects:
   - The series name from the folder name.
   - Part numbering and sibling counts (e.g. *Part 2 of 3*).
   - Dynamic navigation strips connecting previous and next episodes.

### Using the In-Browser Uploader

If you prefer a graphical workflow:
1. Open `http://localhost:4321/profile/`.
2. Scroll to the **Publish New Article** section.
3. Drag and drop your `.md` or `.mdx` file.
4. Choose whether it is a **Standalone Article** or belongs to a **Series**.
5. Click **Publish Article**. It will be saved into `Blogs/` immediately and appear in your article feed!

---

## Step 5: Deploying to GitHub Pages

The repository includes a ready-to-use GitHub Actions deployment workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

Follow these steps once to configure automated deployment:

### 1. Set GitHub Pages Source to "GitHub Actions"
1. Open your repository on GitHub.
2. Go to **Settings** $\rightarrow$ **Pages** (in the left sidebar).
3. Under **Build and deployment** $\rightarrow$ **Source**, change the dropdown from **Deploy from a branch** to **GitHub Actions**.

> [!IMPORTANT]
> **Do NOT select "Deploy from a branch".** The site is built dynamically using Astro and Pagefind through GitHub Actions.

### 2. Verify Workflow Permissions
1. In your GitHub repository, navigate to **Settings** $\rightarrow$ **Actions** $\rightarrow$ **General**.
2. Scroll to the bottom to **Workflow permissions**.
3. Select **Read and write permissions** and click **Save**.

### 3. Configure Your `siteUrl` in `profile.json`
- **If deploying to `<username>.github.io/<repo>`** (default project page):
  ```json
  "siteUrl": "https://<your-username>.github.io/glyph.sh"
  ```
- **If deploying to `<username>.github.io`** (user page, repository named `<username>.github.io`):
  ```json
  "siteUrl": "https://<your-username>.github.io"
  ```
- **If using a custom domain** (e.g. `https://myblog.com`):
  ```json
  "siteUrl": "https://myblog.com"
  ```

---

## Step 6: Pushing Updates with One Click

Whenever you write articles or update your profile, you can push changes to GitHub in two ways:

### Method A: One-Click Push in Localhost (Easiest)

1. Open `http://localhost:4321/profile/`.
2. In the top dev toolbar, click **`↑ push to github`** (at the right side of `profile.json`).
3. An interactive modal will show:
   - Your remote repository and active branch (`master` or `main`).
   - A list of pending local changes ready to be committed.
   - An optional commit message field (leave blank for default).
4. Click **Push to GitHub**.
5. The console will execute `git add -A`, commit, and push directly to GitHub.
6. A green confirmation badge with your new commit hash will appear, and GitHub Actions will automatically start building and deploying your update!

### Method B: Terminal Command

Run in your terminal:
```bash
git add -A
git commit --allow-empty-message -m "Update site content"
git push origin master
```

---

## Comprehensive Troubleshooting & Remediation

| Issue | Cause | Proven Solution |
| :--- | :--- | :--- |
| **GitHub Action fails at `actions/jekyll-build-pages`** | GitHub Pages is set to "Deploy from a branch", causing GitHub to try building your Astro site as a legacy Jekyll site. | Go to your GitHub repository $\rightarrow$ **Settings** $\rightarrow$ **Pages** $\rightarrow$ change **Source** to **GitHub Actions**. |
| **Site looks unstyled or CSS/JS gives 404 on GitHub Pages** | `siteUrl` in `profile.json` does not include the repository subpath. | If your repository is `https://github.com/alice/glyph.sh`, set `"siteUrl": "https://alice.github.io/glyph.sh"` in `profile.json`. |
| **Workflow fails with `Permission denied to github-actions[bot]`** | Repository Actions permissions do not permit deployments. | In repository **Settings** $\rightarrow$ **Actions** $\rightarrow$ **General** $\rightarrow$ set **Workflow permissions** to **Read and write permissions**. |
| **`bun run dev` shows broken styles on localhost** | An outdated server was running with a subpath base in memory. | Stop all dev processes and start fresh with `bun run dev`. In development, Astro serves from root (`/`) natively with Vite HMR. |
| **Git Push fails with `Permission denied (publickey)` or asks for credentials** | Git on your local machine requires authentication credentials. | Create a GitHub Personal Access Token (classic) with `repo` scope at `github.com/settings/tokens`, or configure your SSH key: `ssh-keygen -t ed25519`. |
| **Avatar or logo image is broken / returns 404** | Image file is missing from `public/` or path is relative. | Ensure your image is located in `public/profile-logo.png` and referenced in `profile.json` with a leading slash: `"avatar": "/profile-logo.png"`. |
| **Typecheck errors during `bun run build`** | Article frontmatter is missing required fields like `title`, `description`, or `pubDate`. | Run `bun run astro check` locally to see exact file line numbers and missing fields. |

---

## Project Architecture & File Tree

```
blogly/ (repo: glyph.sh)
├── .github/
│   └── workflows/
│       └── deploy.yml            <-- Automated GitHub Pages build & deploy
├── Blogs/
│   ├── series/                   <-- Multi-part series subdirectories
│   └── standalone/               <-- Individual technical articles
├── public/
│   ├── .nojekyll                 <-- Prevents GitHub Pages Jekyll interference
│   ├── favicon.ico               <-- Tab icon
│   ├── favicon.png               <-- High-res tab icon
│   └── profile-logo.png          <-- Brand & author profile logo
├── src/
│   ├── components/
│   │   ├── BlogUploader.astro    <-- Drag-and-drop localhost article publisher
│   │   ├── CommandPalette.astro  <-- Ctrl+K search & tag explorer
│   │   ├── GiscusComments.astro  <-- GitHub Discussions comments component
│   │   ├── Header.astro          <-- Top navigation & theme toggle
│   │   ├── ProfileEditor.astro   <-- Localhost profile & 1-click git push modal
│   │   └── ...
│   ├── layouts/
│   │   ├── BaseLayout.astro      <-- Main HTML wrapper, SEO & OpenGraph tags
│   │   └── BlogPostLayout.astro  <-- Article layout with TOC & reading time
│   ├── lib/
│   │   ├── blog-loader.ts        <-- Astro 5 dynamic Content Layer loader
│   │   └── og-image.ts           <-- Satori OpenGraph image generator
│   ├── pages/
│   │   ├── index.astro           <-- Home feed
│   │   ├── profile.astro         <-- Author profile page & dashboard
│   │   ├── feed.xml.ts           <-- RSS 2.0 XML feed
│   │   └── blog/[...slug].astro  <-- Dynamic article route handler
│   └── styles/
│       └── global.css            <-- Catppuccin color scheme & JetBrains Mono
├── astro.config.mjs              <-- Vite middlewares & build configuration
├── package.json                  <-- Scripts & dependencies
├── profile.json                  <-- Single source of truth for user config
└── tsconfig.json                 <-- TypeScript path aliases & strict checks
```

---

## License

MIT License. Feel free to use this template for your personal blog, research notes, engineering documentation, or portfolio.
