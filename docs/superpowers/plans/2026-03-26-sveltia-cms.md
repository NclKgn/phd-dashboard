# Sveltia CMS Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sveltia CMS to the site so all markdown content can be created and edited from any browser with GitHub OAuth authentication.

**Architecture:** Two static files (`admin/index.html` + `config.yml`) load Sveltia CMS from CDN. CMS runs entirely client-side, commits to GitHub via API. A free Cloudflare Worker handles the OAuth token exchange. Drafts use a frontmatter boolean field filtered at build time.

**Tech Stack:** Sveltia CMS (CDN), GitHub OAuth, Cloudflare Workers (`sveltia-cms-auth`), Astro 5

**Scope note:** This plan covers the 5 markdown collections (lab-entries, meetings, newsletter, projects, misc). The 4 YAML data collections (cv, stack, labs, phd-progress) require restructuring their file format and are deferred to a follow-up plan.

---

## File Map

### Create
```
public/admin/index.html     — Sveltia CMS entry point (loads from CDN)
public/admin/config.yml      — Backend settings + collection definitions
```

### Modify
```
src/content.config.ts                        — Add draft field to 5 markdown schemas
src/pages/phd/lab/index.astro                — Filter drafts from listing
src/pages/phd/meetings/index.astro           — Filter drafts from listing
src/pages/phd/newsletter/index.astro         — Filter drafts from listing
src/pages/phd/newsletter/[...slug].astro     — Exclude drafts from generated routes
src/pages/projects/index.astro               — Filter drafts from listing
src/pages/projects/[...slug].astro           — Exclude drafts from generated routes
src/pages/misc.astro                         — Filter drafts from listing
src/pages/rss.xml.js                         — Filter drafts from RSS feed
astro.config.mjs                             — Exclude /admin from sitemap
```

---

### Task 1: Create CMS Admin Entry Point

**Files:**
- Create: `public/admin/index.html`

- [ ] **Step 1: Create the admin directory**

```bash
mkdir -p public/admin
```

- [ ] **Step 2: Create `public/admin/index.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>Content Manager</title>
</head>
<body>
  <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
</body>
</html>
```

- [ ] **Step 3: Build and verify the file is served**

Run: `npm run build && ls dist/works/admin/index.html`
Expected: File exists in build output

- [ ] **Step 4: Commit**

```bash
git add public/admin/index.html
git commit -m "feat: add Sveltia CMS admin entry point"
```

---

### Task 2: Create CMS Collection Configuration

**Files:**
- Create: `public/admin/config.yml`

- [ ] **Step 1: Create `public/admin/config.yml`**

```yaml
backend:
  name: github
  repo: nclkgn/works
  branch: main
  base_url: https://PLACEHOLDER.workers.dev

media_folder: public/uploads
public_folder: /works/uploads

collections:
  # ── Lab Entries (private) ──────────────────────────

  - name: lab-entries
    label: "Lab Entries"
    label_singular: "Lab Entry"
    folder: src/content/lab-entries
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    sortable_fields: [date, title]
    summary: "{{year}}-{{month}}-{{day}} — {{title}}"
    fields:
      - { label: Title, name: title, widget: string }
      - { label: Date, name: date, widget: datetime, format: YYYY-MM-DD, date_format: YYYY-MM-DD, time_format: false }
      - { label: Tags, name: tags, widget: list, default: [] }
      - { label: Draft, name: draft, widget: boolean, default: false }
      - { label: Body, name: body, widget: markdown, modes: [rich_text, raw] }

  # ── Meetings (private) ─────────────────────────────

  - name: meetings
    label: "Meetings"
    label_singular: "Meeting"
    folder: src/content/meetings
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    sortable_fields: [date, title]
    summary: "{{year}}-{{month}}-{{day}} — {{title}}"
    fields:
      - { label: Title, name: title, widget: string }
      - { label: Date, name: date, widget: datetime, format: YYYY-MM-DD, date_format: YYYY-MM-DD, time_format: false }
      - { label: Attendees, name: attendees, widget: list, default: [] }
      - { label: Decisions, name: decisions, widget: list, default: [] }
      - { label: Actions, name: actions, widget: list, default: [] }
      - { label: Draft, name: draft, widget: boolean, default: false }
      - { label: Body, name: body, widget: markdown, modes: [rich_text, raw] }

  # ── Newsletter (public) ────────────────────────────

  - name: newsletter
    label: "Newsletter"
    label_singular: "Newsletter Post"
    folder: src/content/newsletter
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    sortable_fields: [date, title]
    summary: "{{year}}-{{month}}-{{day}} — {{title}}"
    fields:
      - { label: Title, name: title, widget: string }
      - { label: Date, name: date, widget: datetime, format: YYYY-MM-DD, date_format: YYYY-MM-DD, time_format: false }
      - { label: Summary, name: summary, widget: text }
      - { label: Tags, name: tags, widget: list, default: [] }
      - { label: Draft, name: draft, widget: boolean, default: false }
      - { label: Body, name: body, widget: markdown, modes: [rich_text, raw] }

  # ── Projects (public) ──────────────────────────────

  - name: projects
    label: "Projects"
    label_singular: "Project"
    folder: src/content/projects
    create: true
    slug: "{{slug}}"
    sortable_fields: [order, title]
    fields:
      - { label: Title, name: title, widget: string }
      - { label: Status, name: status, widget: select, options: [ongoing, completed, upcoming] }
      - { label: Domain, name: domain, widget: select, multiple: true, options: [research, clinical, engineering] }
      - { label: Summary, name: summary, widget: text }
      - { label: Collaborators, name: collaborators, widget: list, default: [] }
      - { label: Order, name: order, widget: number, default: 0, value_type: int }
      - { label: Draft, name: draft, widget: boolean, default: false }
      - { label: Body, name: body, widget: markdown, modes: [rich_text, raw] }

  # ── Misc (public) ──────────────────────────────────

  - name: misc
    label: "Misc"
    label_singular: "Misc Entry"
    folder: src/content/misc
    create: true
    slug: "{{slug}}"
    fields:
      - { label: Title, name: title, widget: string }
      - { label: Category, name: category, widget: string }
      - { label: Date, name: date, widget: datetime, format: YYYY-MM-DD, date_format: YYYY-MM-DD, time_format: false, required: false }
      - { label: Draft, name: draft, widget: boolean, default: false }
      - { label: Body, name: body, widget: markdown, modes: [rich_text, raw] }
```

**Note:** `backend.repo` must match your GitHub repo. Verify with:
```bash
git remote get-url origin
```
If the remote is `git@github.com:nclkgn/PhD-Dashboard.git`, change `repo` to `nclkgn/PhD-Dashboard`. The `base_url` placeholder is filled in during Task 7 (external setup).

- [ ] **Step 2: Build and verify config is served**

Run: `npm run build && ls dist/works/admin/config.yml`
Expected: File exists in build output

- [ ] **Step 3: Commit**

```bash
git add public/admin/config.yml
git commit -m "feat: add Sveltia CMS collection configuration"
```

---

### Task 3: Add Draft Field to Content Schemas

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Add `draft` to `labEntries` schema**

In `src/content.config.ts`, find the `lab-entries` collection schema and add the draft field:

```ts
const labEntries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lab-entries' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});
```

- [ ] **Step 2: Add `draft` to `meetings` schema**

```ts
const meetings = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/meetings' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    attendees: z.array(z.string()).default([]),
    decisions: z.array(z.string()).default([]),
    actions: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});
```

- [ ] **Step 3: Add `draft` to `newsletter` schema**

```ts
const newsletter = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/newsletter' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});
```

- [ ] **Step 4: Add `draft` to `projects` schema**

```ts
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    status: z.enum(['ongoing', 'completed', 'upcoming']),
    domain: z.array(z.enum(['research', 'clinical', 'engineering'])),
    summary: z.string(),
    collaborators: z.array(z.string()).default([]),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});
```

- [ ] **Step 5: Add `draft` to `misc` schema**

```ts
const misc = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/misc' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    date: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});
```

- [ ] **Step 6: Build and verify schemas validate**

Run: `npm run build`
Expected: Build succeeds. Existing content files work because `draft` defaults to `false` when missing.

- [ ] **Step 7: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: add draft field to all markdown collection schemas"
```

---

### Task 4: Add Draft Filtering to Listing Pages

**Files:**
- Modify: `src/pages/phd/lab/index.astro`
- Modify: `src/pages/phd/meetings/index.astro`
- Modify: `src/pages/phd/newsletter/index.astro`
- Modify: `src/pages/projects/index.astro`
- Modify: `src/pages/misc.astro`

Draft filtering logic: in production, hide entries where `draft: true`. In dev mode, show all entries (drafts get a visual badge).

- [ ] **Step 1: Filter drafts in `src/pages/phd/lab/index.astro`**

Replace lines 6-7:

```astro
const entries = (await getCollection('lab-entries'))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
```

With:

```astro
const isDev = import.meta.env.DEV;
const entries = (await getCollection('lab-entries'))
  .filter((e) => isDev || !e.data.draft)
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
```

Then inside the template, after `<h3>{entry.data.title}</h3>` (line 24), add the draft badge:

```astro
{entry.data.draft && <span class="draft-badge mono">Draft</span>}
```

Add this to the `<style>` block:

```css
.draft-badge {
  font-size: 0.6rem;
  padding: 1px 6px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 99px;
  margin-left: 6px;
  vertical-align: middle;
}
```

- [ ] **Step 2: Filter drafts in `src/pages/phd/meetings/index.astro`**

Replace lines 6-7:

```astro
const meetingEntries = (await getCollection('meetings'))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
```

With:

```astro
const isDev = import.meta.env.DEV;
const meetingEntries = (await getCollection('meetings'))
  .filter((e) => isDev || !e.data.draft)
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
```

After `<h3>{meeting.data.title}</h3>` (line 24), add:

```astro
{meeting.data.draft && <span class="draft-badge mono">Draft</span>}
```

Add the same `.draft-badge` CSS from Step 1 to this file's `<style>` block.

- [ ] **Step 3: Filter drafts in `src/pages/phd/newsletter/index.astro`**

Replace lines 8-9:

```astro
const posts = (await getCollection('newsletter'))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
```

With:

```astro
const isDev = import.meta.env.DEV;
const posts = (await getCollection('newsletter'))
  .filter((e) => isDev || !e.data.draft)
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
```

After `<h3>{post.data.title}</h3>` (line 28), add:

```astro
{post.data.draft && <span class="draft-badge mono">Draft</span>}
```

Add the same `.draft-badge` CSS to this file's `<style>` block.

- [ ] **Step 4: Filter drafts in `src/pages/projects/index.astro`**

Replace lines 8-9:

```astro
const projects = (await getCollection('projects'))
  .sort((a, b) => a.data.order - b.data.order);
```

With:

```astro
const isDev = import.meta.env.DEV;
const projects = (await getCollection('projects'))
  .filter((e) => isDev || !e.data.draft)
  .sort((a, b) => a.data.order - b.data.order);
```

- [ ] **Step 5: Filter drafts in `src/pages/misc.astro`**

Replace lines 7-12:

```astro
const entries = (await getCollection('misc'))
  .sort((a, b) => {
    const dateA = a.data.date?.getTime() ?? 0;
    const dateB = b.data.date?.getTime() ?? 0;
    return dateB - dateA;
  });
```

With:

```astro
const isDev = import.meta.env.DEV;
const entries = (await getCollection('misc'))
  .filter((e) => isDev || !e.data.draft)
  .sort((a, b) => {
    const dateA = a.data.date?.getTime() ?? 0;
    const dateB = b.data.date?.getTime() ?? 0;
    return dateB - dateA;
  });
```

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: Build succeeds with no errors. All pages render as before (no content is draft yet).

- [ ] **Step 7: Commit**

```bash
git add src/pages/phd/lab/index.astro src/pages/phd/meetings/index.astro src/pages/phd/newsletter/index.astro src/pages/projects/index.astro src/pages/misc.astro
git commit -m "feat: add draft filtering to all listing pages"
```

---

### Task 5: Add Draft Filtering to Dynamic Routes and RSS

**Files:**
- Modify: `src/pages/phd/newsletter/[...slug].astro`
- Modify: `src/pages/projects/[...slug].astro`
- Modify: `src/pages/rss.xml.js`

- [ ] **Step 1: Exclude drafts from newsletter routes**

In `src/pages/phd/newsletter/[...slug].astro`, replace `getStaticPaths` (lines 6-12):

```astro
export async function getStaticPaths() {
  const posts = await getCollection('newsletter');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}
```

With:

```astro
export async function getStaticPaths() {
  const posts = (await getCollection('newsletter'))
    .filter((post) => !post.data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}
```

- [ ] **Step 2: Exclude drafts from project routes**

In `src/pages/projects/[...slug].astro`, replace `getStaticPaths` (lines 7-13):

```astro
export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map((project) => ({
    params: { slug: project.id },
    props: { project },
  }));
}
```

With:

```astro
export async function getStaticPaths() {
  const projects = (await getCollection('projects'))
    .filter((project) => !project.data.draft);
  return projects.map((project) => ({
    params: { slug: project.id },
    props: { project },
  }));
}
```

- [ ] **Step 3: Filter drafts from RSS feed**

In `src/pages/rss.xml.js`, replace lines 6-18:

```js
export async function GET(context) {
  const posts = await getCollection('newsletter');
  return rss({
    title: 'Nicolas Kogane — PhD Newsletter',
    description: 'Weekly digests of PhD research on skull base synchondroses.',
    site: context.site,
    items: posts
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.summary,
        link: `${import.meta.env.BASE_URL}phd/newsletter/${post.id}/`,
      })),
  });
}
```

With:

```js
export async function GET(context) {
  const posts = await getCollection('newsletter');
  return rss({
    title: 'Nicolas Kogane — PhD Newsletter',
    description: 'Weekly digests of PhD research on skull base synchondroses.',
    site: context.site,
    items: posts
      .filter((post) => !post.data.draft)
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.summary,
        link: `${import.meta.env.BASE_URL}phd/newsletter/${post.id}/`,
      })),
  });
}
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds. All pages and RSS render as before.

- [ ] **Step 5: Commit**

```bash
git add src/pages/phd/newsletter/[...slug].astro src/pages/projects/[...slug].astro src/pages/rss.xml.js
git commit -m "feat: filter drafts from dynamic routes and RSS feed"
```

---

### Task 6: Exclude Admin From Sitemap and Final Build

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Update sitemap filter**

In `astro.config.mjs`, replace the sitemap filter (line 10):

```js
filter: (page) => !page.includes('/phd/lab') && !page.includes('/phd/meetings'),
```

With:

```js
filter: (page) =>
  !page.includes('/phd/lab') &&
  !page.includes('/phd/meetings') &&
  !page.includes('/admin'),
```

- [ ] **Step 2: Full build and verify**

Run: `npm run build`
Expected: Build succeeds. Verify:
```bash
ls dist/works/admin/index.html dist/works/admin/config.yml
```
Both files should exist.

Run: `grep -c "admin" dist/works/sitemap-0.xml`
Expected: `0` — admin page is not in sitemap.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "chore: exclude admin from sitemap"
```

---

### Task 7: External Service Setup

This task is done manually — not automated code. Follow these steps after the code is deployed.

- [ ] **Step 1: Verify GitHub repo name**

Run:
```bash
git remote get-url origin
```

Extract `owner/repo` from the URL (e.g., `nclkgn/PhD-Dashboard` or `nclkgn/works`). Update `backend.repo` in `public/admin/config.yml` if it differs from `nclkgn/works`.

- [ ] **Step 2: Register a GitHub OAuth App**

Go to: GitHub → Settings → Developer settings → OAuth Apps → "New OAuth App"

Fill in:
- **Application name:** `PhD Dashboard CMS`
- **Homepage URL:** `https://nclkgn.github.io/works/`
- **Authorization callback URL:** `https://YOUR-WORKER-NAME.workers.dev/callback`
  (replace after Step 3)

After registering:
- Note the **Client ID**
- Generate and note the **Client Secret**

- [ ] **Step 3: Deploy the Cloudflare Worker**

Prerequisites: A free Cloudflare account.

1. Go to [github.com/sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) and follow the deploy instructions
2. Deploy the Worker to Cloudflare (use the "Deploy to Cloudflare Workers" button or Wrangler CLI)
3. Set environment variables on the Worker:
   - `GITHUB_CLIENT_ID` = the Client ID from Step 2
   - `GITHUB_CLIENT_SECRET` = the Client Secret from Step 2
   - `ALLOWED_DOMAINS` = `nclkgn.github.io`
4. Note the Worker URL (e.g., `https://sveltia-cms-auth.your-account.workers.dev`)

- [ ] **Step 4: Update callback URL**

Go back to the GitHub OAuth App settings and update the **Authorization callback URL** to:
```
https://YOUR-WORKER-NAME.workers.dev/callback
```
(using the actual Worker URL from Step 3)

- [ ] **Step 5: Update CMS config with actual URLs**

In `public/admin/config.yml`, replace the `base_url` placeholder:

```yaml
backend:
  name: github
  repo: nclkgn/works          # ← verified in Step 1
  branch: main
  base_url: https://YOUR-WORKER-NAME.workers.dev  # ← actual Worker URL
```

- [ ] **Step 6: Commit, push, and test**

```bash
git add public/admin/config.yml
git commit -m "feat: configure CMS backend with OAuth proxy URL"
git push origin main
```

Wait ~2 minutes for GitHub Actions to deploy, then:

1. Open `https://nclkgn.github.io/works/admin/`
2. Click "Sign in with GitHub"
3. Authorize the OAuth App
4. Verify the CMS loads with all 5 collections visible
5. Create a test lab entry, save it, verify it appears as a commit on GitHub
6. Delete the test entry

---

## Deferred: YAML Data Collections

The 4 YAML data collections (CV, Stack, Labs, PhD Progress) are not included in this CMS setup because:

- Sveltia CMS file collections expect YAML with named top-level keys
- The current YAML files are bare arrays (e.g., `- id: phd\n  section: education\n  ...`)
- Exposing them requires restructuring the files and updating Astro's content loaders

**To add later:**
1. Wrap each YAML file's array under an `items:` key
2. Write a custom Astro inline loader or use `file()` with a parser to unwrap `items`
3. Add file collections to `config.yml` with a `list` widget for the `items` field

These files change rarely (CV, lab affiliations, methodology stack) and can be edited via GitHub's web editor or locally until CMS support is added.
