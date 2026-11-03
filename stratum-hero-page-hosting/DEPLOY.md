# Deploying the Stratum hero page

The site is already a finished, self-contained static build: `index.html` plus
the `assets/` folder. There is nothing to install, compile or configure — any
static file host will serve it as-is.

**Do not edit `index.html` or the `assets/` folder when deploying.** The page
makes no external requests at runtime, so hosting only needs to serve these
files unchanged.

## What to upload

Upload everything in this folder, keeping the structure intact:

```
index.html
favicon.ico
README.md
DEPLOY.md
assets/
  fonts/inter-s-400.woff2
  fonts/inter-s-700.woff2
  fonts/chakra-s-700.woff2
  img/background.webp
  video/background.mp4
  video/expression.mp4
  video/craftsmanship.mp4
  video/refinement.mp4
  video/balance.mp4
  video/origin.mp4
```

If your host asks for a folder to upload, upload the folder that contains
`index.html` (not the ZIP itself, and not a wrapper folder inside it).
`README.md`, `DEPLOY.md` and `favicon.ico` are optional extras — only
`index.html` and `assets/` are required for the page to work.

## Option 1 — Netlify (drag and drop, free)

1. Go to https://app.netlify.com/drop.
2. Drag the unzipped site folder onto the page.
3. The site is live immediately at a `*.netlify.app` URL. A custom domain can
   be added later under Domain settings.

## Option 2 — Cloudflare Pages (free)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Upload assets.
2. Name the project and drag the unzipped site folder in.
3. Deploy. The site is live at `<project>.pages.dev`.

## Option 3 — Vercel (free)

1. Install the Vercel CLI (`npm i -g vercel`) and run `vercel` inside the site
   folder, or create a "Other / Static" project in the Vercel dashboard and
   upload the folder.
2. No framework preset, build command or output directory is needed — leave
   them all empty; the folder root is the site.

## Option 4 — GitHub Pages (free)

1. Create a repository and push the site files to its main branch.
2. Repository Settings → Pages → Source: "Deploy from a branch" → main / root.
3. The site appears at `https://<username>.github.io/<repo>/` within a few
   minutes. Note: this serves the site under a subpath; the page uses
   relative asset URLs, so it works there unchanged.

## Option 5 — Your own server (nginx, Apache, S3, any host)

- Copy the folder contents into the web root (e.g. `/var/www/html` or an S3
  bucket configured for static website hosting) and ensure `index.html` is the
  default document for `/`.
- No server-side code is required. Any web server works, including a plain
  file host, cPanel "Upload", or object storage.
- Serve over HTTPS if you can (all hosts above provide it automatically).

## After deploying — quick checks

- Open the live URL: the stone-arch scene should autoplay and loop.
- Click the chapter names on the left (EXPRESSION, CRAFTSMANSHIP, …): each
  loads its own clip and swaps the headline and paragraph on first use.
- Check the browser console (F12): there should be no errors and no requests
  to anything other than your own domain.
