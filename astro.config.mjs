import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';
import { exec as execCb } from 'node:child_process';
import yaml from 'js-yaml';
import { slug as githubSlug } from 'github-slugger';

const exec = promisify(execCb);

let site = 'https://example.github.io';
let productionBase = '/glyph.sh';

try {
  const profileRaw = fs.readFileSync(path.resolve(process.cwd(), 'profile.json'), 'utf-8');
  const profileData = JSON.parse(profileRaw);
  if (profileData.siteUrl && profileData.siteUrl.trim()) {
    let raw = profileData.siteUrl.trim();
    if (!/^https?:\/\//i.test(raw)) {
      raw = `https://${raw}`;
    }
    const parsed = new URL(raw);
    site = parsed.origin;
    if (parsed.pathname && parsed.pathname !== '/') {
      productionBase = parsed.pathname.replace(/\/+$/, '');
    } else {
      productionBase = undefined;
    }
  }
} catch {}

// Critical distinction for seamless developer and user experience:
// 1. In development ('astro dev' / 'bun run dev'), base must be root (undefined / '/') so localhost serves natively
//    without asset 404s, Vite HMR failures, or Tailwind stylesheet loading issues.
// 2. In production ('astro build' / 'astro preview'), base uses the repository subpath ('/glyph.sh') for GitHub Pages.
const isDev = (process.env.NODE_ENV === 'development' || process.argv.includes('dev') || process.env.npm_lifecycle_event === 'dev') && !process.argv.includes('build');
const base = isDev ? undefined : productionBase;
const currentBase = (base || '').replace(/\/+$/, '');

function profileDevMiddleware() {
  return {
    name: 'profile-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        const pathname = url.split('?')[0];
        const query = url.includes('?') ? url.slice(url.indexOf('?')) : '';

        // If base is configured (e.g. preview)
        if (currentBase) {
          if (pathname === '/' || pathname === '') {
            res.writeHead(302, { Location: `${currentBase}/${query}` });
            res.end();
            return;
          }
          if (pathname === '/profile' || pathname === '/profile/') {
            res.writeHead(302, { Location: `${currentBase}/profile/${query}` });
            res.end();
            return;
          }
          if (pathname === `${currentBase}/profile`) {
            res.writeHead(302, { Location: `${currentBase}/profile/${query}` });
            res.end();
            return;
          }
          if (pathname.startsWith('/blog') || pathname.startsWith('/about')) {
            res.writeHead(302, { Location: `${currentBase}${pathname}${query}` });
            res.end();
            return;
          }
        } else {
          // Dev mode on localhost (base is root):
          // If developer enters /glyph.sh or /glyph.sh/... on localhost, forward to root route
          if (productionBase && (pathname === productionBase || pathname.startsWith(`${productionBase}/`))) {
            const forwardPath = pathname.slice(productionBase.length) || '/';
            res.writeHead(302, { Location: `${forwardPath}${query}` });
            res.end();
            return;
          }
          // Prevent Vite dev server from resolving /profile to root profile.json ES module
          if (pathname === '/profile') {
            res.writeHead(302, { Location: `/profile/${query}` });
            res.end();
            return;
          }
        }
        next();
      });

      const registerApi = (endpoint, handler) => {
        server.middlewares.use(endpoint, handler);
        if (productionBase) {
          server.middlewares.use(`${productionBase}${endpoint}`, handler);
        }
      };

      registerApi('/api/get-profile', (req, res) => {
        if (req.method === 'GET') {
          try {
            const profilePath = path.resolve(process.cwd(), 'profile.json');
            let profileData = {};
            if (fs.existsSync(profilePath)) {
              profileData = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, profile: profileData }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/save-profile', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const profilePath = path.resolve(process.cwd(), 'profile.json');
              let existing = {};
              if (fs.existsSync(profilePath)) {
                try {
                  existing = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
                } catch {}
              }
              const merged = { ...existing, ...data };
              if (data.giscus && typeof existing.giscus === 'object') {
                merged.giscus = { ...existing.giscus, ...data.giscus };
              }
              if (data.appearance && typeof existing.appearance === 'object') {
                merged.appearance = { ...existing.appearance, ...data.appearance };
              }
              if (data.features && typeof existing.features === 'object') {
                merged.features = { ...existing.features, ...data.features };
              }
              if (data.privacy && typeof existing.privacy === 'object') {
                merged.privacy = { ...existing.privacy, ...data.privacy };
              }
              if (data.deployTargets && typeof existing.deployTargets === 'object') {
                merged.deployTargets = { ...existing.deployTargets, ...data.deployTargets };
              } else if (data.deployTargets) {
                merged.deployTargets = data.deployTargets;
              }
              fs.writeFileSync(profilePath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Saved to profile.json in repository!', profile: merged }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/upload-logo', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 10 * 1024 * 1024) {
              res.writeHead(413, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Payload exceeds 10MB limit' }));
              req.destroy();
            }
          });
          req.on('end', () => {
            try {
              const { image, filename } = JSON.parse(body);
              if (!image || typeof image !== 'string' || !image.includes(',')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Valid image base64 data URL is required' }));
                return;
              }

              // Determine file extension
              let ext = '.png';
              if (filename && path.extname(filename)) {
                const parsedExt = path.extname(filename).toLowerCase();
                if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(parsedExt)) {
                  ext = parsedExt === '.jpeg' ? '.jpg' : parsedExt;
                }
              } else {
                const mimeMatch = image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/);
                if (mimeMatch) {
                  const mime = mimeMatch[1].toLowerCase();
                  if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
                  else if (mime.includes('svg')) ext = '.svg';
                  else if (mime.includes('webp')) ext = '.webp';
                  else if (mime.includes('gif')) ext = '.gif';
                }
              }

              const publicDir = path.resolve(process.cwd(), 'public');
              if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
              }

              // Remove any existing profile-logo.* files with different extensions
              const existingFiles = fs.readdirSync(publicDir);
              for (const f of existingFiles) {
                if (/^profile-logo\.(png|jpe?g|webp|svg|gif)$/i.test(f)) {
                  try {
                    fs.unlinkSync(path.join(publicDir, f));
                  } catch {}
                }
              }

              const logoFilename = `profile-logo${ext}`;
              const targetPath = path.join(publicDir, logoFilename);
              const base64Content = image.replace(/^data:[^;]+;base64,/, '');
              fs.writeFileSync(targetPath, Buffer.from(base64Content, 'base64'));

              // Update profile.json
              const profilePath = path.resolve(process.cwd(), 'profile.json');
              let profileData = {};
              if (fs.existsSync(profilePath)) {
                try {
                  profileData = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
                } catch {}
              }
              const logoUrl = `/${logoFilename}`;
              profileData.avatar = logoUrl;
              profileData.logo = logoUrl;
              fs.writeFileSync(profilePath, JSON.stringify(profileData, null, 2) + '\n', 'utf-8');

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                url: logoUrl,
                message: `Logo saved to repository at public/${logoFilename} and updated in profile.json!`
              }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      function getFileEpisode(filePath, filename) {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          if (frontmatterMatch) {
            const parsed = yaml.load(frontmatterMatch[1]);
            if (parsed) {
              if (typeof parsed.seriesPart === 'number' && parsed.seriesPart > 0) {
                return parsed.seriesPart;
              }
              if (Array.isArray(parsed.tags)) {
                const epTag = parsed.tags.find((t) => typeof t === 'string' && /^episode-\d+$/i.test(t));
                if (epTag) {
                  const num = parseInt(epTag.replace(/^episode-/i, ''), 10);
                  if (!isNaN(num) && num > 0) return num;
                }
              }
            }
          }
        } catch {}
        const match = filename.match(/^(?:part[-_]?)?(\d+)(?:[-_]|$)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > 0) return num;
        }
        return null;
      }

      registerApi('/api/series-info', (req, res) => {
        if (req.method === 'GET') {
          try {
            const seriesDir = path.resolve(process.cwd(), 'Blogs', 'series');
            const result = {};
            if (fs.existsSync(seriesDir)) {
              const folders = fs.readdirSync(seriesDir, { withFileTypes: true })
                .filter((d) => d.isDirectory())
                .map((d) => d.name);

              for (const folder of folders) {
                const folderPath = path.join(seriesDir, folder);
                const files = fs.readdirSync(folderPath)
                  .filter((f) => /\.(md|mdx)$/i.test(f))
                  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

                const episodes = {};
                let maxEp = 0;
                let maxSeriesTotal = 0;
                let lastlyUpdatedTotal = 0;
                let latestFileMtime = 0;

                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const filePath = path.join(folderPath, file);
                  let fileMtime = 0;
                  try {
                    const st = fs.statSync(filePath);
                    fileMtime = st.mtimeMs || 0;
                  } catch {}

                  let epNum = getFileEpisode(filePath, file);
                  if (epNum === null) {
                    epNum = i + 1;
                  }
                  if (epNum > maxEp) maxEp = epNum;

                  let title = file.replace(/\.(md|mdx)$/i, '');
                  try {
                    const raw = fs.readFileSync(filePath, 'utf-8');
                    const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
                    if (frontmatterMatch) {
                      const parsed = yaml.load(frontmatterMatch[1]);
                      if (parsed && parsed.title) title = parsed.title;
                      if (parsed && parsed.seriesTotal) {
                        const t = parseInt(parsed.seriesTotal, 10);
                        if (!isNaN(t) && t > 0) {
                          if (t > maxSeriesTotal) maxSeriesTotal = t;
                          if (fileMtime >= latestFileMtime) {
                            latestFileMtime = fileMtime;
                            lastlyUpdatedTotal = t;
                          }
                        }
                      }
                    } else {
                      const h1Match = raw.match(/^#\s+(.+)$/m);
                      if (h1Match) title = h1Match[1].trim();
                    }
                  } catch {}

                  episodes[epNum] = {
                    episode: epNum,
                    filename: file,
                    title: title,
                  };
                }

                const displayName = folder
                  .split(/[-_]+/)
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');

                const establishedTotal = Math.max(
                  lastlyUpdatedTotal || maxSeriesTotal || 1,
                  maxEp,
                  Object.keys(episodes).length
                );

                result[folder] = {
                  name: folder,
                  displayName,
                  totalEpisodes: establishedTotal,
                  nextEpisode: maxEp + 1,
                  episodes,
                };
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/upload-blog', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 25 * 1024 * 1024) {
              res.writeHead(413, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'File exceeds 25MB limit' }));
              req.destroy();
            }
          });
          req.on('end', () => {
            try {
              const { type, seriesName, episode, totalEpisodes, filename, content, title, tags: explicitTags, pubDate: explicitPubDate, description: explicitDescription } = JSON.parse(body);

              if (!filename || typeof filename !== 'string') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing or invalid filename' }));
                return;
              }

              // Validate extension: strictly .md or .mdx
              const ext = path.extname(filename).toLowerCase();
              if (ext !== '.md' && ext !== '.mdx') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Only .md and .mdx files are allowed' }));
                return;
              }

              // Sanitize filename to prevent directory traversal
              const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '-');
              if (!cleanFilename || cleanFilename === '.' || cleanFilename === '..') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid file name' }));
                return;
              }

              // Determine target folder
              const blogsRoot = path.resolve(process.cwd(), 'Blogs');
              let targetDir = '';
              let relDir = '';
              let cleanSeries = '';
              let episodeNum = 1;

              if (type === 'series') {
                if (!seriesName || typeof seriesName !== 'string' || !seriesName.trim()) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Series name is required for series articles' }));
                  return;
                }
                cleanSeries = seriesName
                  .trim()
                  .toLowerCase()
                  .replace(/[^a-z0-9_-]+/g, '-')
                  .replace(/^-+|-+$/g, '');

                if (!cleanSeries) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Invalid series name' }));
                  return;
                }

                episodeNum = parseInt(episode, 10);
                if (isNaN(episodeNum) || episodeNum < 1) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Episode must be a valid positive number (1, 2, 3...)' }));
                  return;
                }

                targetDir = path.resolve(blogsRoot, 'series', cleanSeries);
                relDir = `Blogs/series/${cleanSeries}`;

                // Check if another file in this series already uses this episode number
                if (fs.existsSync(targetDir)) {
                  const siblingFiles = fs.readdirSync(targetDir).filter((f) => /\.(md|mdx)$/i.test(f));
                  for (const sib of siblingFiles) {
                    if (sib.toLowerCase() === cleanFilename.toLowerCase()) {
                      continue; // Updating the same file is allowed
                    }
                    const sibPath = path.join(targetDir, sib);
                    const sibEp = getFileEpisode(sibPath, sib);
                    if (sibEp === episodeNum) {
                      res.writeHead(400, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({
                        error: `Episode ${episodeNum} is already assigned to "${sib}" in series "${cleanSeries}". Each episode in a series must be unique.`
                      }));
                      return;
                    }
                  }
                }
              } else {
                targetDir = path.resolve(blogsRoot, 'standalone');
                relDir = 'Blogs/standalone';
              }

              // Security check: ensure targetDir stays within Blogs
              if (!targetDir.startsWith(blogsRoot)) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid target path' }));
                return;
              }

              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }

              // Process and inject frontmatter
              let frontmatter = {};
              let bodyContent = content || '';
              const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
              const fmMatch = bodyContent.match(frontmatterRegex);

              if (fmMatch) {
                try {
                  const parsed = yaml.load(fmMatch[1]);
                  if (parsed && typeof parsed === 'object') {
                    frontmatter = parsed;
                  }
                } catch {}
                bodyContent = bodyContent.slice(fmMatch[0].length);
              }

              if (type === 'series') {
                const seriesDisplayName = cleanSeries
                  .split(/[-_]+/)
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');

                frontmatter.series = seriesDisplayName;
                frontmatter.seriesPart = episodeNum;

                let totalEpNum = parseInt(totalEpisodes, 10);
                if (isNaN(totalEpNum) || totalEpNum < 1) {
                  totalEpNum = episodeNum;
                }
                if (totalEpNum < episodeNum) {
                  totalEpNum = episodeNum;
                }
                frontmatter.seriesTotal = totalEpNum;

                // Add episode tag and series tag
                const epTag = `episode-${episodeNum}`;
                let tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
                tags = tags.filter((t) => typeof t === 'string' && !/^episode-\d+$/i.test(t));
                tags.push(epTag);
                if (!tags.includes(cleanSeries)) {
                  tags.unshift(cleanSeries);
                }
                frontmatter.tags = tags;
              } else {
                // Standalone writeup - remove any series fields
                delete frontmatter.series;
                delete frontmatter.seriesPart;
                delete frontmatter.seriesTotal;
                if (Array.isArray(frontmatter.tags)) {
                  frontmatter.tags = frontmatter.tags.filter((t) => typeof t === 'string' && !/^episode-\d+$/i.test(t));
                }
              }

              // Apply explicit metadata overrides if provided from dashboard
              if (title && typeof title === 'string' && title.trim()) {
                frontmatter.title = title.trim();
              }
              if (explicitDescription && typeof explicitDescription === 'string' && explicitDescription.trim()) {
                frontmatter.description = explicitDescription.trim();
              }
              if (explicitPubDate && typeof explicitPubDate === 'string' && explicitPubDate.trim()) {
                frontmatter.pubDate = explicitPubDate.trim();
              }
              if (explicitTags && Array.isArray(explicitTags) && explicitTags.length > 0) {
                frontmatter.tags = explicitTags.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim());
              }

              // Ensure title exists
              if (!frontmatter.title) {
                const headingMatch = bodyContent.match(/^#\s+(.+)$/m);
                if (headingMatch) {
                  frontmatter.title = headingMatch[1].trim();
                } else {
                  frontmatter.title = cleanFilename
                    .replace(/\.(md|mdx)$/i, '')
                    .replace(/^[0-9]+[-_]?/, '')
                    .split(/[-_]+/)
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');
                }
              }

              // Ensure pubDate exists
              if (!frontmatter.pubDate) {
                frontmatter.pubDate = new Date().toISOString().split('T')[0];
              }

              // Ensure tags exists
              if (!Array.isArray(frontmatter.tags) || frontmatter.tags.length === 0) {
                frontmatter.tags = type === 'series' ? [cleanSeries, `episode-${episodeNum}`] : ['standalone'];
              }

              const finalContent = `---\n${yaml.dump(frontmatter, { lineWidth: -1 }).trim()}\n---\n\n${bodyContent.trimStart()}`;

              const targetFilePath = path.resolve(targetDir, cleanFilename);
              fs.writeFileSync(targetFilePath, finalContent, 'utf-8');

              // Synchronize seriesTotal across all files in this series folder
              if (type === 'series') {
                try {
                  const siblingFiles = fs.readdirSync(targetDir).filter((f) => /\.(md|mdx)$/i.test(f));
                  for (const sib of siblingFiles) {
                    const sibPath = path.resolve(targetDir, sib);
                    if (sibPath === targetFilePath) continue;
                    const sibRaw = fs.readFileSync(sibPath, 'utf-8');
                    const sibFmMatch = sibRaw.match(frontmatterRegex);
                    if (sibFmMatch) {
                      const sibFm = yaml.load(sibFmMatch[1]);
                      if (sibFm && typeof sibFm === 'object') {
                        if (sibFm.seriesTotal !== totalEpNum) {
                          sibFm.seriesTotal = totalEpNum;
                          const sibBody = sibRaw.slice(sibFmMatch[0].length);
                          const newSibContent = `---\n${yaml.dump(sibFm, { lineWidth: -1 }).trim()}\n---\n\n${sibBody.trimStart()}`;
                          fs.writeFileSync(sibPath, newSibContent, 'utf-8');
                        }
                      }
                    }
                  }
                } catch {}
              }

              const relFilePath = `${relDir}/${cleanFilename}`;
              const rawBase = cleanFilename.replace(/\.(md|mdx)$/i, '');
              const fileSlug = githubSlug(rawBase);
              const postSlug = type === 'series'
                ? `series/${githubSlug(cleanSeries)}/${fileSlug}`
                : `standalone/${fileSlug}`;

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: type === 'series'
                  ? `Stored in ${relDir}/${cleanFilename} (Series: "${cleanSeries}", Part ${episodeNum} of ${frontmatter.seriesTotal})`
                  : `Stored in ${relDir}/${cleanFilename}`,
                filePath: relFilePath,
                postSlug: postSlug,
                url: currentBase ? `${currentBase}/blog/${postSlug}` : `/blog/${postSlug}`,
                series: cleanSeries,
                episode: episodeNum,
                totalEpisodes: frontmatter.seriesTotal,
              }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/convert-file', async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
            // Allow up to 75MB payload to support 50MB binary files encoded in base64
            if (body.length > 75 * 1024 * 1024) {
              res.writeHead(413, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Request payload exceeds 75MB limit' }));
              req.destroy();
            }
          });
          req.on('end', async () => {
            try {
              const { filename, fileBase64, mimeType, groqApiKey } = JSON.parse(body);
              if (!filename || typeof filename !== 'string') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing or invalid filename' }));
                return;
              }
              if (!fileBase64 || typeof fileBase64 !== 'string') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing file content' }));
                return;
              }

              const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              if (buffer.length > 50 * 1024 * 1024) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Decoded file exceeds 50MB limit' }));
                return;
              }

              // Dynamically load converter module using Vite's ssrLoadModule
              const converterPath = path.resolve(process.cwd(), 'src', 'lib', 'conversion', 'converter.ts');
              const { convertFileToMarkdown } = await server.ssrLoadModule(converterPath);

              const result = await convertFileToMarkdown({
                buffer,
                filename,
                mimeType,
                groqApiKey,
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                markdown: result.markdown,
                title: result.title,
                description: result.description,
                filename: result.filename,
                tier: result.tier,
                format: result.format,
                warning: result.warning,
              }));
            } catch (err) {
              if (err.name === 'MissingGroqApiKeyError' || err.message?.includes('Add a Groq API key in Settings')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: false,
                  error: 'NO_GROQ_KEY',
                  message: err.message || 'Add a Groq API key in Settings to convert audio files',
                }));
                return;
              }
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: err.message || 'Failed to convert file',
              }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/list-blogs', (req, res) => {
        if (req.method === 'GET') {
          try {
            const blogsRoot = path.resolve(process.cwd(), 'Blogs');
            const blogs = [];

            // Scan standalone directory
            const standaloneDir = path.join(blogsRoot, 'standalone');
            if (fs.existsSync(standaloneDir)) {
              const files = fs.readdirSync(standaloneDir)
                .filter((f) => /\.(md|mdx)$/i.test(f))
                .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

              for (const file of files) {
                const filePath = path.join(standaloneDir, file);
                let title = file.replace(/\.(md|mdx)$/i, '');
                let date = '';
                try {
                  const raw = fs.readFileSync(filePath, 'utf-8');
                  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
                  if (fmMatch) {
                    const parsed = yaml.load(fmMatch[1]);
                    if (parsed && parsed.title) title = parsed.title;
                    if (parsed && parsed.pubDate) date = String(parsed.pubDate).split('T')[0];
                  } else {
                    const h1 = raw.match(/^#\s+(.+)$/m);
                    if (h1) title = h1[1].trim();
                  }
                } catch {}

                const rawBase = file.replace(/\.(md|mdx)$/i, '');
                const fileSlug = githubSlug(rawBase);
                const postSlug = `standalone/${fileSlug}`;

                blogs.push({
                  type: 'standalone',
                  relPath: `Blogs/standalone/${file}`,
                  directory: 'Blogs/standalone',
                  filename: file,
                  title,
                  date,
                  slug: postSlug,
                  url: currentBase ? `${currentBase}/blog/${postSlug}` : `/blog/${postSlug}`,
                });
              }
            }

            // Scan series directory
            const seriesDir = path.join(blogsRoot, 'series');
            if (fs.existsSync(seriesDir)) {
              const seriesFolders = fs.readdirSync(seriesDir, { withFileTypes: true })
                .filter((d) => d.isDirectory())
                .map((d) => d.name)
                .sort();

              for (const folder of seriesFolders) {
                const folderPath = path.join(seriesDir, folder);
                const files = fs.readdirSync(folderPath)
                  .filter((f) => /\.(md|mdx)$/i.test(f))
                  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const filePath = path.join(folderPath, file);
                  let epNum = getFileEpisode(filePath, file);
                  if (epNum === null) epNum = i + 1;
                  let title = file.replace(/\.(md|mdx)$/i, '');
                  let date = '';

                  let totalEpCount = epNum;
                  try {
                    const raw = fs.readFileSync(filePath, 'utf-8');
                    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
                    if (fmMatch) {
                      const parsed = yaml.load(fmMatch[1]);
                      if (parsed && parsed.title) title = parsed.title;
                      if (parsed && parsed.pubDate) date = String(parsed.pubDate).split('T')[0];
                      if (parsed && parsed.seriesTotal) {
                        const st = parseInt(parsed.seriesTotal, 10);
                        if (!isNaN(st)) totalEpCount = st;
                      }
                    } else {
                      const h1 = raw.match(/^#\s+(.+)$/m);
                      if (h1) title = h1[1].trim();
                    }
                  } catch {}

                  const rawBase = file.replace(/\.(md|mdx)$/i, '');
                  const folderSlug = githubSlug(folder);
                  const fileSlug = githubSlug(rawBase);
                  const postSlug = `series/${folderSlug}/${fileSlug}`;

                  blogs.push({
                    type: 'series',
                    seriesName: folder,
                    relPath: `Blogs/series/${folder}/${file}`,
                    directory: `Blogs/series/${folder}`,
                    filename: file,
                    episode: epNum,
                    totalEpisodes: totalEpCount,
                    title,
                    date,
                    slug: postSlug,
                    url: currentBase ? `${currentBase}/blog/${postSlug}` : `/blog/${postSlug}`,
                  });
                }
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, blogs }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/delete-blog', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { relPath } = JSON.parse(body);
              if (!relPath || typeof relPath !== 'string') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing or invalid file path' }));
                return;
              }

              // Normalize and security check path
              const normalized = path.normalize(relPath).replace(/\\/g, '/');
              if (
                (!normalized.startsWith('Blogs/standalone/') && !normalized.startsWith('Blogs/series/')) ||
                normalized.includes('..') ||
                !/\.(md|mdx)$/i.test(normalized)
              ) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Access denied: Path must be a .md or .mdx file inside Blogs/standalone or Blogs/series' }));
                return;
              }

              const absolutePath = path.resolve(process.cwd(), normalized);
              const blogsRoot = path.resolve(process.cwd(), 'Blogs');

              if (!absolutePath.startsWith(blogsRoot)) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Access denied outside Blogs directory' }));
                return;
              }

              if (!fs.existsSync(absolutePath)) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `File not found on disk: ${normalized}` }));
                return;
              }

              const stat = fs.statSync(absolutePath);
              if (stat.isDirectory()) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Cannot delete directory; only files may be deleted' }));
                return;
              }

              // Delete only the file alone, keeping parent folder and siblings untouched!
              fs.unlinkSync(absolutePath);

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: `Successfully deleted file "${path.basename(normalized)}" from repository. Directory structure preserved.`,
                deletedPath: normalized,
              }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/get-blog', (req, res) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const relPath = urlObj.searchParams.get('relPath');
        if (!relPath || typeof relPath !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing relPath query parameter' }));
          return;
        }
        const normalized = path.normalize(relPath).replace(/\\/g, '/');
        if (
          (!normalized.startsWith('Blogs/standalone/') && !normalized.startsWith('Blogs/series/')) ||
          normalized.includes('..') ||
          !/\.(md|mdx)$/i.test(normalized)
        ) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Access denied: Must be inside Blogs/standalone or Blogs/series' }));
          return;
        }
        const absPath = path.resolve(process.cwd(), normalized);
        if (!fs.existsSync(absPath)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'File not found' }));
          return;
        }
        try {
          const content = fs.readFileSync(absPath, 'utf-8');
          let frontmatter = {};
          const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          if (fmMatch) {
            try {
              frontmatter = yaml.load(fmMatch[1]) || {};
            } catch {}
          }
          const isSeries = normalized.startsWith('Blogs/series/');
          let sName = '';
          if (isSeries) {
            const parts = normalized.split('/');
            sName = parts[2] || '';
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            relPath: normalized,
            filename: path.basename(normalized),
            content,
            isSeries,
            seriesName: frontmatter.series || sName,
            seriesPart: frontmatter.seriesPart,
            seriesTotal: frontmatter.seriesTotal,
            title: frontmatter.title,
            description: frontmatter.description,
            tags: frontmatter.tags,
            pubDate: frontmatter.pubDate,
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      registerApi('/api/reorder-series', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (c) => { body += c; });
          req.on('end', () => {
            try {
              const { seriesName, episodeOrder } = JSON.parse(body || '{}');
              if (!seriesName || !Array.isArray(episodeOrder) || episodeOrder.length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'seriesName and episodeOrder array are required' }));
                return;
              }
              const cleanSeries = seriesName.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
              const seriesDir = path.resolve(process.cwd(), 'Blogs', 'series', cleanSeries);
              if (!fs.existsSync(seriesDir)) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Series folder "${cleanSeries}" not found` }));
                return;
              }
              const allSeriesFiles = fs.readdirSync(seriesDir).filter((f) => /\.(md|mdx)$/i.test(f));
              if (episodeOrder.length !== allSeriesFiles.length) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  error: `Incomplete episode list: received ${episodeOrder.length} episodes, but series directory contains ${allSeriesFiles.length} files.`
                }));
                return;
              }
              const totalCount = allSeriesFiles.length;
              const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
              episodeOrder.forEach((item, index) => {
                const filename = typeof item === 'string' ? item : item.filename;
                const newEpisodeNum = index + 1;
                const filePath = path.join(seriesDir, path.basename(filename));
                if (fs.existsSync(filePath)) {
                  const raw = fs.readFileSync(filePath, 'utf-8');
                  const fmMatch = raw.match(frontmatterRegex);
                  let frontmatter = {};
                  let bodyContent = raw;
                  if (fmMatch) {
                    try {
                      frontmatter = yaml.load(fmMatch[1]) || {};
                    } catch {}
                    bodyContent = raw.slice(fmMatch[0].length);
                  }
                  frontmatter.seriesPart = newEpisodeNum;
                  frontmatter.seriesTotal = totalCount;
                  let tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
                  tags = tags.filter((t) => typeof t === 'string' && !/^episode-\d+$/i.test(t));
                  tags.push(`episode-${newEpisodeNum}`);
                  frontmatter.tags = tags;
                  const updated = `---\n${yaml.dump(frontmatter, { lineWidth: -1 }).trim()}\n---\n\n${bodyContent.trimStart()}`;
                  fs.writeFileSync(filePath, updated, 'utf-8');
                }
              });
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: `Reordered ${totalCount} episodes in series "${cleanSeries}".` }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/git-revert', async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (c) => { body += c; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              if (!payload.confirm) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Confirmation required: body must include { confirm: true }' }));
                return;
              }
              const cwd = process.cwd();
              const { stdout: statusOut } = await exec('git status --porcelain', { cwd });
              if (statusOut.trim().length > 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Working tree has uncommitted changes. Please commit or stash before reverting.' }));
                return;
              }
              const { stdout, stderr } = await exec('git revert HEAD --no-edit', { cwd });
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Successfully reverted last commit.', output: stdout || stderr }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: (err.stderr || err.message || '').toString().trim() }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/export-zip', async (req, res) => {
        if (req.method === 'GET') {
          const cwd = process.cwd();
          const uniqueName = `blogly-export-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.zip`;
          const tmpZip = path.resolve(os.tmpdir(), uniqueName);
          try {
            const itemsToZip = ['Blogs', 'public', 'profile.json', 'src', 'package.json', 'README.md'].filter((item) =>
              fs.existsSync(path.resolve(cwd, item))
            );
            let zipped = false;

            // 1. Try standard zip command (macOS, Linux)
            try {
              await exec(`zip -r "${tmpZip}" ${itemsToZip.join(' ')}`, { cwd });
              if (fs.existsSync(tmpZip)) zipped = true;
            } catch {}

            // 2. Try tar command (cross-platform, built into Windows & Unix)
            if (!zipped) {
              try {
                const tarCmd = process.platform === 'win32' ? 'tar.exe' : 'tar';
                await exec(`${tarCmd} -a -c -f "${tmpZip}" ${itemsToZip.join(' ')}`, { cwd });
                if (fs.existsSync(tmpZip)) zipped = true;
              } catch {}
            }

            // 3. Fallback to PowerShell Compress-Archive on Windows
            if (!zipped && process.platform === 'win32') {
              try {
                const psItems = itemsToZip.join(', ');
                await exec(`powershell -NoProfile -Command "Compress-Archive -Path ${psItems} -DestinationPath '${tmpZip}' -Force"`, { cwd });
                if (fs.existsSync(tmpZip)) zipped = true;
              } catch {}
            }

            if (!zipped || !fs.existsSync(tmpZip)) {
              throw new Error('Failed to generate archive: No compatible zip/tar archiver available');
            }

            const zipBuffer = fs.readFileSync(tmpZip);
            res.writeHead(200, {
              'Content-Type': 'application/zip',
              'Content-Disposition': 'attachment; filename="blogly-site-export.zip"',
              'Content-Length': zipBuffer.length,
            });
            res.end(zipBuffer);
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          } finally {
            if (fs.existsSync(tmpZip)) {
              try { fs.unlinkSync(tmpZip); } catch {}
            }
          }
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/auth-status', async (req, res) => {
        if (req.method === 'GET') {
          try {
            const deviceFlowPath = path.resolve(process.cwd(), 'src', 'lib', 'github-device-flow.ts');
            const { getAuthStatus } = await server.ssrLoadModule(deviceFlowPath);
            const url = new URL(req.url, 'http://localhost');
            const verify = url.searchParams.get('verify') === 'true';
            const status = await getAuthStatus(verify);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, ...status }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/device-code', async (req, res) => {
        if (req.method === 'POST') {
          try {
            const deviceFlowPath = path.resolve(process.cwd(), 'src', 'lib', 'github-device-flow.ts');
            const { initiateDeviceFlow } = await server.ssrLoadModule(deviceFlowPath);
            const codeData = await initiateDeviceFlow();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, ...codeData }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/device-poll', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { deviceCode } = JSON.parse(body || '{}');
              if (!deviceCode) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'deviceCode is required' }));
                return;
              }
              const deviceFlowPath = path.resolve(process.cwd(), 'src', 'lib', 'github-device-flow.ts');
              const { pollDeviceToken } = await server.ssrLoadModule(deviceFlowPath);
              const pollResult = await pollDeviceToken(deviceCode);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, ...pollResult }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/disconnect-github', async (req, res) => {
        if (req.method === 'POST') {
          try {
            const deviceFlowPath = path.resolve(process.cwd(), 'src', 'lib', 'github-device-flow.ts');
            const { clearAuthToken } = await server.ssrLoadModule(deviceFlowPath);
            clearAuthToken();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, connected: false, message: 'Disconnected GitHub authentication.' }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/enable-pages', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              let payload = {};
              try { payload = JSON.parse(body || '{}'); } catch {}
              const cwd = process.cwd();
              let remote = '';
              try {
                const { stdout } = await exec('git remote get-url origin', { cwd });
                remote = stdout.trim();
              } catch {}
              let owner = payload.owner || '';
              let repo = payload.repo || '';
              if ((!owner || !repo) && remote) {
                const clean = remote.replace(/\.git$/i, '').replace(/\/+$/, '');
                const parts = clean.split(/[\/:]/);
                if (parts.length >= 2) {
                  repo = parts[parts.length - 1];
                  owner = parts[parts.length - 2];
                }
              }
              if (!owner || !repo) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Could not determine repository owner and name.' }));
                return;
              }
              const deviceFlowPath = path.resolve(process.cwd(), 'src', 'lib', 'github-device-flow.ts');
              const { setupOrCheckGitHubPages } = await server.ssrLoadModule(deviceFlowPath);
              const result = await setupOrCheckGitHubPages(owner, repo);
              res.writeHead(result.success ? 200 : 500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(result));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/save-deploy-target', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const { target, url } = JSON.parse(body || '{}');
              if (!target || !['vercel', 'netlify', 'cloudflare'].includes(target)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid deploy target name.' }));
                return;
              }
              const profilePath = path.resolve(process.cwd(), 'profile.json');
              let existing = {};
              if (fs.existsSync(profilePath)) {
                try { existing = JSON.parse(fs.readFileSync(profilePath, 'utf-8')); } catch {}
              }
              if (!existing.deployTargets || typeof existing.deployTargets !== 'object') {
                existing.deployTargets = {};
              }
              if (url && typeof url === 'string' && url.trim()) {
                existing.deployTargets[target] = url.trim();
              } else {
                delete existing.deployTargets[target];
              }
              fs.writeFileSync(profilePath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: `Saved ${target} live URL to profile.json.`,
                deployTargets: existing.deployTargets,
              }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/deploy-status', async (req, res) => {
        if (req.method === 'GET') {
          try {
            const cwd = process.cwd();
            let remote = '';
            try {
              const { stdout } = await exec('git remote get-url origin', { cwd });
              remote = stdout.trim();
            } catch {}
            let siteUrl = '';
            let deployTargets = {};
            try {
              const pRaw = fs.readFileSync(path.resolve(cwd, 'profile.json'), 'utf-8');
              const pData = JSON.parse(pRaw);
              siteUrl = pData.siteUrl || '';
              deployTargets = pData.deployTargets || {};
            } catch {}
            let repoName = 'glyph.sh';
            let owner = 'username';
            if (remote) {
              const clean = remote.replace(/\.git$/i, '').replace(/\/+$/, '');
              const parts = clean.split(/[\/:]/);
              if (parts.length >= 2) {
                repoName = parts[parts.length - 1];
                owner = parts[parts.length - 2];
              }
            }
            const pagesUrl = siteUrl || `https://${owner}.github.io/${repoName}/`;
            const workflowUrl = `https://github.com/${owner}/${repoName}/actions/workflows/deploy.yml`;

            let authStatus = { connected: false };
            try {
              const deviceFlowPath = path.resolve(process.cwd(), 'src', 'lib', 'github-device-flow.ts');
              const { getAuthStatus } = await server.ssrLoadModule(deviceFlowPath);
              authStatus = await getAuthStatus(false);
            } catch {}

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              remote,
              pagesUrl,
              workflowUrl,
              owner,
              repoName,
              deployTargets,
              authStatus,
            }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/git-status', async (req, res) => {
        if (req.method === 'GET') {
          try {
            const cwd = process.cwd();
            let branch = 'master';
            try {
              const { stdout } = await exec('git branch --show-current', { cwd });
              branch = stdout.trim() || 'master';
            } catch {}

            let remote = '';
            try {
              const { stdout } = await exec('git remote get-url origin', { cwd });
              remote = stdout.trim();
            } catch {}

            let changedFiles = [];
            try {
              const { stdout } = await exec('git status --porcelain', { cwd });
              const raw = stdout.trim();
              if (raw) {
                changedFiles = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
              }
            } catch {}

            let unpushedCommits = 0;
            try {
              const { stdout } = await exec(`git log origin/${branch}..HEAD --oneline`, { cwd });
              const raw = stdout.trim();
              if (raw) {
                unpushedCommits = raw.split(/\r?\n/).length;
              }
            } catch {}

            let lastCommit = '';
            try {
              const { stdout } = await exec('git log -1 --oneline', { cwd });
              lastCommit = stdout.trim();
            } catch {}

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              branch,
              remote,
              changedFiles,
              unpushedCommits,
              lastCommit,
              isClean: changedFiles.length === 0 && unpushedCommits === 0,
            }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      registerApi('/api/git-push', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              let payload = {};
              try {
                payload = JSON.parse(body || '{}');
              } catch {}
              const customMsg = typeof payload.message === 'string' ? payload.message.trim() : '';
              const targetBranch = (payload.branch === 'main' || payload.branch === 'master') ? payload.branch : 'master';
              const targetRepo = typeof payload.repoUrl === 'string' ? payload.repoUrl.trim() : '';
              const cwd = process.cwd();

              // 1. If targetRepo is specified, ensure remote origin is set to it
              if (targetRepo && (/^https?:\/\//i.test(targetRepo) || targetRepo.startsWith('git@'))) {
                try {
                  const { stdout: currentRemote } = await exec('git remote get-url origin', { cwd });
                  if (currentRemote.trim() !== targetRepo) {
                    await exec(`git remote set-url origin ${JSON.stringify(targetRepo)}`, { cwd });
                  }
                } catch {
                  try {
                    await exec(`git remote add origin ${JSON.stringify(targetRepo)}`, { cwd });
                  } catch {}
                }
              }

              // 2. Switch/rename branch to targetBranch (main or master)
              try {
                await exec(`git branch -M ${targetBranch}`, { cwd });
              } catch (bErr) {
                console.warn('git branch -M warning:', bErr.message);
              }

              // 3. Stage all changes
              await exec('git add -A', { cwd, maxBuffer: 20 * 1024 * 1024 });

              // 4. Commit if any changes exist
              const { stdout: statusOut } = await exec('git status --porcelain', { cwd, maxBuffer: 20 * 1024 * 1024 });
              let commitOutput = 'Working tree was clean, no new commit needed.';
              let hasNewCommit = false;

              if (statusOut.trim()) {
                if (customMsg) {
                  const { stdout } = await exec(`git commit -m ${JSON.stringify(customMsg)}`, { cwd, maxBuffer: 20 * 1024 * 1024 });
                  commitOutput = stdout.trim();
                } else {
                  const { stdout } = await exec('git commit --allow-empty-message -m ""', { cwd, maxBuffer: 20 * 1024 * 1024 });
                  commitOutput = stdout.trim();
                }
                hasNewCommit = true;
              }

              // 5. Push to origin with selected branch & upstream tracking
              let pushStdout = '';
              let pushStderr = '';

              let resolvedRemote = targetRepo;
              if (!resolvedRemote) {
                try {
                  const { stdout } = await exec('git remote get-url origin', { cwd });
                  resolvedRemote = stdout.trim();
                } catch {}
              }

              let token = null;
              try {
                const deviceFlowPath = path.resolve(process.cwd(), 'src', 'lib', 'github-device-flow.ts');
                const { getStoredToken } = await server.ssrLoadModule(deviceFlowPath);
                token = getStoredToken();
              } catch {}

              if (token && resolvedRemote && /^https?:\/\//i.test(resolvedRemote)) {
                // In-memory HTTP extraHeader authentication (token is never written to disk or .git/config)
                const basicAuth = Buffer.from(`x-access-token:${token}`).toString('base64');
                const pushResult = await exec(`git -c http.extraHeader="AUTHORIZATION: basic ${basicAuth}" push -u origin ${targetBranch}`, {
                  cwd,
                  timeout: 90000,
                  maxBuffer: 20 * 1024 * 1024,
                });
                pushStdout = pushResult.stdout;
                pushStderr = pushResult.stderr;
              } else {
                // Machine / Codespaces credential fallback
                const pushResult = await exec(`git push -u origin ${targetBranch}`, {
                  cwd,
                  timeout: 90000,
                  maxBuffer: 20 * 1024 * 1024,
                });
                pushStdout = pushResult.stdout;
                pushStderr = pushResult.stderr;
              }

              // 6. Get last commit
              let lastCommit = '';
              try {
                const { stdout } = await exec('git log -1 --oneline', { cwd });
                lastCommit = stdout.trim();
              } catch {}

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                branch: targetBranch,
                remote: resolvedRemote,
                hasNewCommit,
                commitOutput,
                pushOutput: (pushStdout + '\n' + pushStderr).trim(),
                lastCommit,
                message: `Successfully pushed to origin/${targetBranch}!`,
              }));
            } catch (err) {
              const errText = (err.stderr || err.stdout || err.message || '').toString().trim();
              const isAuthError = /authentication failed|could not read Username|Permission to .* denied|HTTP 401|HTTP 403|terminal prompts disabled/i.test(errText);
              res.writeHead(isAuthError ? 401 : 500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: errText,
                needsAuth: isAuthError,
                message: isAuthError
                  ? 'GitHub authentication required to push. Please connect GitHub in Settings via Device Flow.'
                  : 'Git push encountered an issue. You can run the terminal command shown below.',
              }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

    },
  };
}

// https://astro.build/config

// https://astro.build/config
export default defineConfig({
  site: site,
  base: base,
  output: 'static',
  devToolbar: {
    enabled: false,
  },
  integrations: [
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: {
        themes: {
          light: 'catppuccin-latte',
          dark: 'catppuccin-mocha',
        },
        wrap: true,
      },
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss(), profileDevMiddleware()],
  },
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: {
        light: 'catppuccin-latte',
        dark: 'catppuccin-mocha',
      },
      wrap: true,
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
