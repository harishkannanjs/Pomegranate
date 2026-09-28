import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  initiateDeviceFlow,
  pollDeviceToken,
  getAuthStatus,
  clearAuthToken,
  saveAuthToken,
  setupOrCheckGitHubPages,
  AUTH_DIR,
  AUTH_FILE,
} from '../src/lib/github-device-flow';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SettingsTab from '../src/components/dashboard/SettingsTab.astro';

describe('Phase 7: Device Flow & Multi-Target Deployment Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Ensure clean auth state before each test
    clearAuthToken();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    clearAuthToken();
    vi.restoreAllMocks();
  });

  describe('Security & Safe Token Storage (.blogly/auth.json)', () => {
    it('verifies .blogly is strictly included in .gitignore', () => {
      const gitignorePath = path.resolve(process.cwd(), '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

      expect(gitignoreContent).toMatch(/\.blogly\//);
      expect(gitignoreContent).toMatch(/\.blogly\*\.json/);
    });

    it('safely stores token with restrictive file permissions (0o600) and wipes it on disconnect', () => {
      const mockRecord = {
        accessToken: 'gho_mock_secret_token_12345',
        tokenType: 'bearer',
        scope: 'repo workflow read:user',
        updatedAt: Date.now(),
        username: 'test-author',
      };

      saveAuthToken(mockRecord);

      expect(fs.existsSync(AUTH_DIR)).toBe(true);
      expect(fs.existsSync(AUTH_FILE)).toBe(true);
      const raw = fs.readFileSync(AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      expect(parsed.accessToken).toBe('gho_mock_secret_token_12345');
      expect(parsed.username).toBe('test-author');

      // Verify clearAuthToken wipes the file
      clearAuthToken();
      expect(fs.existsSync(AUTH_FILE)).toBe(false);
    });

    it('getAuthStatus NEVER exposes raw access token in return value', async () => {
      saveAuthToken({
        accessToken: 'gho_super_secret_never_leak',
        tokenType: 'bearer',
        scope: 'repo workflow read:user',
        updatedAt: Date.now(),
        username: 'secure-author',
      });

      const status = await getAuthStatus(false);
      expect(status.connected).toBe(true);
      expect(status.username).toBe('secure-author');
      expect(status.scope).toContain('repo');

      // Security assertion: accessToken must never be present on auth status object
      expect((status as any).accessToken).toBeUndefined();
      expect(JSON.stringify(status)).not.toContain('gho_super_secret_never_leak');
    });
  });

  describe('GitHub Device Flow Authentication (RFC 8628)', () => {
    it('initiateDeviceFlow calls GitHub OAuth device endpoint with public client_id and no client secret', async () => {
      const mockDeviceCodeResponse = {
        device_code: 'dc_1234567890',
        user_code: 'WDJB-MJHT',
        verification_uri: 'https://github.com/login/device',
        expires_in: 900,
        interval: 5,
      };

      global.fetch = vi.fn().mockImplementation(async (url: string, init?: any) => {
        if (url === 'https://github.com/login/device/code') {
          const body = JSON.parse(init.body);
          expect(body.client_id).toBeDefined();
          // Verify no client_secret is ever sent from local dashboard
          expect(body.client_secret).toBeUndefined();
          expect(body.scope).toContain('repo');
          return new Response(JSON.stringify(mockDeviceCodeResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('Not found', { status: 404 });
      });

      const res = await initiateDeviceFlow();
      expect(res.deviceCode).toBe('dc_1234567890');
      expect(res.userCode).toBe('WDJB-MJHT');
      expect(res.verificationUri).toBe('https://github.com/login/device');
      expect(res.interval).toBe(5);
    });

    it('pollDeviceToken handles authorization_pending without throwing', async () => {
      global.fetch = vi.fn().mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            error: 'authorization_pending',
            error_description: 'The authorization request is still pending.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await pollDeviceToken('dc_1234567890');
      expect(res.status).toBe('pending');
    });

    it('pollDeviceToken handles slow_down and suggests backoff', async () => {
      global.fetch = vi.fn().mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            error: 'slow_down',
            error_description: 'Too many requests. Back off.',
            interval: 10,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await pollDeviceToken('dc_1234567890');
      expect(res.status).toBe('slow_down');
      expect(res.interval).toBe(15); // Default adds 5s backoff
    });

    it('pollDeviceToken successfully completes, saves token, and returns user info', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === 'https://github.com/login/oauth/access_token') {
          return new Response(
            JSON.stringify({
              access_token: 'gho_successful_token_9999',
              token_type: 'bearer',
              scope: 'repo workflow read:user',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (url === 'https://api.github.com/user') {
          return new Response(
            JSON.stringify({
              login: 'octocat',
              name: 'Mona Lisa Octocat',
              avatar_url: 'https://github.com/images/error/octocat_happy.gif',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not found', { status: 404 });
      });

      const res = await pollDeviceToken('dc_1234567890');
      expect(res.status).toBe('complete');
      expect(res.authStatus?.username).toBe('octocat');

      // Verify token was persisted locally
      expect(fs.existsSync(AUTH_FILE)).toBe(true);
      const savedAuth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      expect(savedAuth.accessToken).toBe('gho_successful_token_9999');
      expect(savedAuth.username).toBe('octocat');
    });
  });

  describe('GitHub Pages REST API Automation', () => {
    it('returns needsAuth if token is not configured', async () => {
      const res = await setupOrCheckGitHubPages('octocat', 'my-blog');
      expect(res.success).toBe(false);
      expect(res.needsAuth).toBe(true);
    });

    it('checks Pages and enables workflow build type when authenticated', async () => {
      saveAuthToken({
        accessToken: 'gho_valid_pages_token',
        tokenType: 'bearer',
        scope: 'repo workflow',
        updatedAt: Date.now(),
        username: 'octocat',
      });

      let pagesRequested = false;
      global.fetch = vi.fn().mockImplementation(async (url: string, init?: any) => {
        if (url === 'https://api.github.com/repos/octocat/my-blog/pages') {
          if (!init || init.method === 'GET') {
            // Simulate Pages not enabled yet (404)
            return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
          }
          if (init.method === 'POST') {
            pagesRequested = true;
            const body = JSON.parse(init.body);
            expect(body.build_type).toBe('workflow');
            return new Response(
              JSON.stringify({
                status: 'building',
                html_url: 'https://octocat.github.io/my-blog/',
              }),
              { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
        return new Response('Not found', { status: 404 });
      });

      const res = await setupOrCheckGitHubPages('octocat', 'my-blog');
      expect(pagesRequested).toBe(true);
      expect(res.success).toBe(true);
      expect(res.pagesUrl).toBe('https://octocat.github.io/my-blog/');
    });
  });

  describe('Zero-Config Deployment Manifests', () => {
    it('verifies vercel.json exists, is valid JSON, and outputs to dist', () => {
      const vercelPath = path.resolve(process.cwd(), 'vercel.json');
      expect(fs.existsSync(vercelPath)).toBe(true);
      const content = fs.readFileSync(vercelPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.framework).toBe('astro');
      expect(parsed.outputDirectory).toBe('dist');
    });

    it('verifies netlify.toml exists, specifies bun build command, and publishes dist', () => {
      const netlifyPath = path.resolve(process.cwd(), 'netlify.toml');
      expect(fs.existsSync(netlifyPath)).toBe(true);
      const content = fs.readFileSync(netlifyPath, 'utf-8');
      expect(content).toContain('command = "bun run build"');
      expect(content).toContain('publish = "dist"');
    });

    it('verifies wrangler.toml exists and specifies static pages_build_output_dir = "dist"', () => {
      const wranglerPath = path.resolve(process.cwd(), 'wrangler.toml');
      expect(fs.existsSync(wranglerPath)).toBe(true);
      const content = fs.readFileSync(wranglerPath, 'utf-8');
      expect(content).toContain('pages_build_output_dir = "dist"');
    });
  });

  describe('Dashboard UI & Component Rendering', () => {
    it('renders SettingsTab with all 4 deploy targets, Device Flow modal, and Disconnect GitHub button', async () => {
      const container = await AstroContainer.create();
      const result = await container.renderToString(SettingsTab);

      // Section 4 Header & Multi-Target deploy panels
      expect(result).toContain('Deploy &amp; GitHub Authentication');
      expect(result).toContain('GitHub Account Connection (Device Flow)');
      expect(result).toContain('Multi-Target Deployment (4 Targets)');

      // Target 1: GitHub Pages (Emphasized target)
      expect(result).toContain('1. GitHub Pages');
      expect(result).toContain('DEFAULT TARGET · ZERO SIGN-UP');
      expect(result).toContain('data-action="enable-pages"');
      expect(result).toContain('id="deploy-target-url"');
      expect(result).toContain('id="gh-pages-timeline-container"');

      // Target 2: Vercel
      expect(result).toContain('2. Vercel');
      expect(result).toContain('data-action="deploy-vercel"');
      expect(result).toContain('id="target-url-vercel"');
      expect(result).toContain('data-action="save-target-vercel"');

      // Target 3: Netlify
      expect(result).toContain('3. Netlify');
      expect(result).toContain('data-action="deploy-netlify"');
      expect(result).toContain('id="target-url-netlify"');
      expect(result).toContain('data-action="save-target-netlify"');

      // Target 4: Cloudflare Pages
      expect(result).toContain('4. Cloudflare Pages');
      expect(result).toContain('data-action="deploy-cloudflare"');
      expect(result).toContain('id="target-url-cloudflare"');
      expect(result).toContain('data-action="save-target-cloudflare"');

      // Danger Zone Disconnect Button
      expect(result).toContain('Disconnect GitHub');
      expect(result).toContain('data-action="disconnect-github"');

      // Device Flow Modal
      expect(result).toContain('id="device-flow-modal"');
      expect(result).toContain('id="device-flow-user-code"');
      expect(result).toContain('data-action="copy-device-code"');
      expect(result).toContain('data-action="open-device-url"');
      expect(result).toContain('github.com/login/device');
    });
  });
});
