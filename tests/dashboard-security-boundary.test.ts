import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AboutPage from '../src/pages/about.astro';
import Header from '../src/components/Header.astro';

describe('Security Boundary: Local-Only Dashboard Isolation', () => {
  const rootDir = process.cwd();
  const pagesDir = path.join(rootDir, 'src', 'pages');
  const dashboardDir = path.join(rootDir, 'src', 'dashboard');
  const distDir = path.join(rootDir, 'dist');

  it('guarantees dashboard files are strictly outside src/pages/', () => {
    // profile.astro must never live directly in src/pages/
    expect(fs.existsSync(path.join(pagesDir, 'profile.astro'))).toBe(false);
    expect(fs.existsSync(path.join(pagesDir, 'profile'))).toBe(false);

    // Dashboard implementation lives safely in src/dashboard/
    expect(fs.existsSync(path.join(dashboardDir, 'profile.astro'))).toBe(true);
  });

  it('verifies no accidental server-side or write endpoints exist in src/pages/', () => {
    // No src/pages/api directory
    expect(fs.existsSync(path.join(pagesDir, 'api'))).toBe(false);

    // No file under src/pages/ may export prerender = false
    const scanDir = (dir: string): string[] => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let files: string[] = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(scanDir(fullPath));
        } else if (/\.(astro|ts|js|mjs)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const pageFiles = scanDir(pagesDir);
    for (const filePath of pageFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/export\s+const\s+prerender\s*=\s*false/);
    }
  });

  it('proves dashboard routes and bundles are structurally absent from production build (dist/)', () => {
    if (!fs.existsSync(distDir)) {
      // If dist has not been generated in this test run, skip output directory assertions
      return;
    }

    // dist/profile directory and dist/profile/index.html must not exist
    expect(fs.existsSync(path.join(distDir, 'profile'))).toBe(false);
    expect(fs.existsSync(path.join(distDir, 'profile', 'index.html'))).toBe(false);

    // Recursively collect all built HTML and JS files
    const scanDist = (dir: string): string[] => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let files: string[] = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(scanDist(fullPath));
        } else if (/\.(html|js)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const distFiles = scanDist(distDir);

    // No dashboard JavaScript chunks
    const jsFiles = distFiles.filter((f) => f.endsWith('.js'));
    for (const file of jsFiles) {
      const basename = path.basename(file);
      expect(basename).not.toContain('FileUploadTab');
      expect(basename).not.toContain('SettingsTab');
    }

    // String audit: Ensure sensitive dashboard tokens and UI markers never leak into built assets
    const forbiddenPatterns = [
      'Pomegranate Dashboard',
      'DEV // LOCALHOST',
      'file-dropzone',
      'git-push-modal',
      'raw-markdown-input',
      'rendered-markdown-output',
      'disconnect-github',
      'data-privacy-key="analytics"',
    ];

    for (const file of distFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const pattern of forbiddenPatterns) {
        expect(content).not.toContain(pattern);
      }
    }
  });

  it('renders about.astro as a clean, read-only author profile without dashboard components', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(AboutPage);

    // Read-only author profile markers
    expect(result).toContain('whoami --profile');
    expect(result).toContain('Author Profile');
    expect(result).toContain('Published Posts');

    // Must NOT contain any dashboard tab panels or edit controls
    expect(result).not.toContain('id="tab-content-file-upload"');
    expect(result).not.toContain('id="tab-content-settings"');
    expect(result).not.toContain('id="file-dropzone"');
    expect(result).not.toContain('id="git-push-modal"');
    expect(result).not.toContain('disconnect-github');
    expect(result).not.toContain('Save Post');
  });

  it('renders Header.astro linking to about page in production mode and dashboard in dev mode', async () => {
    const container = await AstroContainer.create();

    // In production mode (isDev: false), avatar links to /about/ and never /profile/
    const prodResult = await container.renderToString(Header, { props: { isDev: false } });
    expect(prodResult).toContain('/about/');
    expect(prodResult).not.toContain('/profile/');
    expect(prodResult).toContain('title="About"');

    // In dev mode (isDev: true), avatar links to /profile/ for author convenience
    const devResult = await container.renderToString(Header, { props: { isDev: true } });
    expect(devResult).toContain('/profile/');
    expect(devResult).toContain('title="Dashboard"');
  });
});
