import fs from 'node:fs';
import path from 'node:path';

export interface DeviceCodeResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export interface StoredAuth {
  accessToken: string;
  tokenType: string;
  scope: string;
  username?: string;
  avatarUrl?: string;
  updatedAt: number;
}

export interface AuthStatus {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  scope?: string;
  expired?: boolean;
}

export interface DevicePollResult {
  status: 'pending' | 'slow_down' | 'complete' | 'expired' | 'denied' | 'error';
  interval?: number;
  error?: string;
  authStatus?: AuthStatus;
}

export interface PagesStatusResult {
  success: boolean;
  enabled: boolean;
  status?: string;
  htmlUrl?: string;
  pagesUrl?: string;
  workflowPresent?: boolean;
  workflowRuns?: Array<{ id: number; status: string; conclusion: string | null; htmlUrl: string }>;
  error?: string;
  needsAuth?: boolean;
}

const GITHUB_DEVICE_CODE_URL = 'https://github.com/login/device/code';
const GITHUB_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_BASE = 'https://api.github.com';
const USER_AGENT = 'Blogly-Local-Dashboard/1.0.0 (https://blogly.sh)';

// Default public GitHub App client ID (OAuth Device Flow allows public client_id)
export const DEFAULT_CLIENT_ID = 'Ov23li7vQ1bBloglyApp';
export const DEFAULT_SCOPES = 'repo workflow read:user';

export const AUTH_DIR = path.resolve(process.cwd(), '.blogly');
export const AUTH_FILE = path.resolve(AUTH_DIR, 'auth.json');

/**
 * Path to store uncommitted local authentication token.
 * Added to .gitignore to ensure it is NEVER committable.
 */
function getAuthFilePath(): string {
  if (!fs.existsSync(AUTH_DIR)) {
    try {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    } catch {}
  }
  return AUTH_FILE;
}

/**
 * Returns configured client_id from process.env or fallback default.
 */
export function getClientId(): string {
  return process.env.GITHUB_CLIENT_ID || DEFAULT_CLIENT_ID;
}

/**
 * Saves authentication data to local file with restrictive permissions.
 */
export function saveAuthToken(data: StoredAuth): void {
  const filePath = getAuthFilePath();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {}
}

/**
 * Reads local authentication data if present.
 */
export function readStoredAuth(): StoredAuth | null {
  const filePath = getAuthFilePath();
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.accessToken === 'string' && parsed.accessToken.trim()) {
      return parsed as StoredAuth;
    }
  } catch {}
  return null;
}

/**
 * Retrieves the raw access token for internal local backend actions (git-push, Pages API).
 * Never exposed to UI or returned to client.
 */
export function getStoredToken(): string | null {
  const auth = readStoredAuth();
  return auth ? auth.accessToken : null;
}

/**
 * Clears local token and returns disconnected state.
 */
export function clearAuthToken(): void {
  const filePath = getAuthFilePath();
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {}
  }
}

/**
 * Initiates GitHub Device Flow by requesting a user_code and device_code.
 */
export async function initiateDeviceFlow(clientId?: string): Promise<DeviceCodeResponse> {
  const resolvedClientId = clientId || getClientId();
  const res = await fetch(GITHUB_DEVICE_CODE_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      client_id: resolvedClientId,
      scope: DEFAULT_SCOPES,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Device code request failed (HTTP ${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  if (!data.device_code || !data.user_code) {
    throw new Error(data.error_description || data.error || 'Failed to obtain device code from GitHub');
  }

  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri || 'https://github.com/login/device',
    expiresIn: data.expires_in || 900,
    interval: data.interval || 5,
  };
}

/**
 * Polls GitHub token endpoint for completion.
 */
export async function pollDeviceToken(deviceCode: string, clientId?: string): Promise<DevicePollResult> {
  const resolvedClientId = clientId || getClientId();

  const res = await fetch(GITHUB_ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      client_id: resolvedClientId,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });

  const data = (await res.json()) as any;

  if (data.error) {
    if (data.error === 'authorization_pending') {
      return { status: 'pending', interval: data.interval };
    }
    if (data.error === 'slow_down') {
      return { status: 'slow_down', interval: (data.interval || 5) + 5 };
    }
    if (data.error === 'expired_token') {
      return { status: 'expired', error: 'The device authorization code has expired. Please generate a new code.' };
    }
    if (data.error === 'access_denied') {
      return { status: 'denied', error: 'Authorization request was declined by user.' };
    }
    return { status: 'error', error: data.error_description || data.error };
  }

  if (data.access_token) {
    // Query user profile
    let username = '';
    let avatarUrl = '';
    try {
      const userRes = await fetch(`${GITHUB_API_BASE}/user`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': USER_AGENT,
        },
      });
      if (userRes.ok) {
        const userData = (await userRes.json()) as any;
        username = userData.login || '';
        avatarUrl = userData.avatar_url || '';
      }
    } catch {}

    try {
      saveAuthToken({
        accessToken: data.access_token,
        tokenType: data.token_type || 'bearer',
        scope: data.scope || DEFAULT_SCOPES,
        username,
        avatarUrl,
        updatedAt: Date.now(),
      });
    } catch (saveErr: any) {
      return {
        status: 'error',
        error: `Failed to safely persist credentials to disk: ${saveErr.message}`,
      };
    }

    return {
      status: 'complete',
      authStatus: {
        connected: true,
        username,
        avatarUrl,
        scope: data.scope,
      },
    };
  }

  return { status: 'error', error: 'Unexpected response from GitHub token endpoint' };
}

/**
 * Returns safe authentication status (never exposes raw token to frontend).
 */
export async function getAuthStatus(verifyWithApi = false): Promise<AuthStatus> {
  const auth = readStoredAuth();
  if (!auth) {
    return { connected: false };
  }

  if (verifyWithApi) {
    try {
      const res = await fetch(`${GITHUB_API_BASE}/user`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': USER_AGENT,
        },
      });
      if (res.status === 401) {
        // Token expired or revoked on GitHub
        clearAuthToken();
        return { connected: false, expired: true };
      }
      if (res.ok) {
        const user = (await res.json()) as any;
        return {
          connected: true,
          username: user.login || auth.username,
          avatarUrl: user.avatar_url || auth.avatarUrl,
          scope: auth.scope,
        };
      }
    } catch {}
  }

  return {
    connected: true,
    username: auth.username,
    avatarUrl: auth.avatarUrl,
    scope: auth.scope,
  };
}

/**
 * Enables GitHub Pages and checks status for the user's repository using Device Flow token.
 */
export async function setupOrCheckGitHubPages(owner: string, repo: string): Promise<PagesStatusResult> {
  const token = getStoredToken();
  if (!token) {
    return {
      success: false,
      enabled: false,
      needsAuth: true,
      error: 'GitHub authentication token required. Connect GitHub via Device Flow in Settings.',
    };
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': USER_AGENT,
    Authorization: `Bearer ${token}`,
  };

  try {
    // 1. Check if Pages is enabled
    let pagesRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/pages`, { headers });
    let pagesData = pagesRes.ok ? await pagesRes.json() : null;

    // 2. If not enabled (404) and token has permissions, enable with build_type = 'workflow'
    if (pagesRes.status === 404 && token) {
      const enableRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/pages`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          build_type: 'workflow',
        }),
      });

      if (enableRes.ok || enableRes.status === 201) {
        pagesData = await enableRes.json().catch(() => null);
        if (!pagesData) {
          pagesRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/pages`, { headers });
          if (pagesRes.ok) {
            pagesData = await pagesRes.json();
          }
        }
      } else if (enableRes.status === 409) {
        // Re-check
        pagesRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/pages`, { headers });
        if (pagesRes.ok) {
          pagesData = await pagesRes.json();
        }
      } else {
        const errData = (await enableRes.json().catch(() => ({}))) as any;
        const errMsg = errData?.message || enableRes.statusText || 'Access denied or invalid build configuration';
        return {
          success: false,
          enabled: false,
          error: `GitHub Pages setup rejected (${enableRes.status}): ${errMsg}`,
        };
      }
    }

    if (!pagesData) {
      const errData = (await pagesRes.json().catch(() => ({}))) as any;
      const errMsg =
        errData?.message ||
        (pagesRes.status === 404 ? 'GitHub Pages is not enabled on this repository' : pagesRes.statusText);
      return {
        success: false,
        enabled: false,
        error: `GitHub Pages not enabled (${pagesRes.status}): ${errMsg}`,
      };
    }

    // 3. Check for deploy workflow
    let workflowPresent = false;
    let workflowRuns: any[] = [];
    try {
      const wfRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/workflows/deploy.yml`, { headers });
      if (wfRes.ok) {
        workflowPresent = true;
        const runsRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/workflows/deploy.yml/runs?per_page=3`, { headers });
        if (runsRes.ok) {
          const runsData = (await runsRes.json()) as any;
          workflowRuns = (runsData.workflow_runs || []).map((r: any) => ({
            id: r.id,
            status: r.status,
            conclusion: r.conclusion,
            htmlUrl: r.html_url,
          }));
        }
      }
    } catch {}

    const defaultHtmlUrl = `https://${owner}.github.io/${repo}/`;
    const finalUrl = pagesData.html_url || defaultHtmlUrl;
    return {
      success: true,
      enabled: true,
      status: pagesData.status || (workflowRuns.length > 0 ? workflowRuns[0].status : 'configured'),
      htmlUrl: finalUrl,
      pagesUrl: finalUrl,
      workflowPresent,
      workflowRuns,
    };
  } catch (err: any) {
    return {
      success: false,
      enabled: false,
      error: err.message,
    };
  }
}
