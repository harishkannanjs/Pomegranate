import profileData from '../profile.json';

export interface GiscusConfig {
  enabled: boolean;
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
}

export interface FeaturesConfig {
  audioReader?: boolean;
  readerMode?: boolean;
  textMagnifier?: boolean;
  copyLink?: boolean;
  copyMarkdown?: boolean;
  tableOfContents?: boolean;
  readingProgressBar?: boolean;
  relatedPosts?: boolean;
  highlighter?: boolean;
}

export interface PrivacyConfig {
  analytics?: boolean;
  footerNote?: boolean;
}

export interface DeployTargetsConfig {
  vercel?: string;
  netlify?: string;
  cloudflare?: string;
}

export interface SiteConfig {
  name: string;
  author: string;
  githubUsername: string;
  handle: string;
  avatar?: string;
  logo?: string;
  role: string;
  twitterHandle: string;
  title: string;
  description: string;
  siteUrl: string;
  githubUrl: string;
  twitterUrl: string;
  email: string;
  postsPerPage: number;
  giscus: GiscusConfig;
  features?: FeaturesConfig;
  privacy?: PrivacyConfig;
  deployTargets?: DeployTargetsConfig;
}

function extractGithubUsername(githubUrl?: string, handle?: string): string {
  if (githubUrl) {
    const match = githubUrl.match(/github\.com\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
  }
  if (handle) {
    return handle.replace(/^@/, '');
  }
  return '';
}

const githubUsername = extractGithubUsername(profileData.githubUrl, profileData.handle);

export const siteConfig: SiteConfig = {
  name: "Pomegranate",
  author: profileData.author || "Author",
  githubUsername: githubUsername || "user",
  handle: profileData.handle || (githubUsername ? `@${githubUsername}` : "@user"),
  avatar: (profileData as any).avatar || (profileData as any).logo || '',
  logo: (profileData as any).logo || (profileData as any).avatar || '',
  role: profileData.role || "",
  twitterHandle: profileData.twitterHandle || "",
  title: profileData.title || "Pomegranate",
  description: profileData.description || "",
  siteUrl: profileData.siteUrl || "https://example.com",
  githubUrl: profileData.githubUrl || "",
  twitterUrl: profileData.twitterUrl || "",
  email: profileData.email || "",
  postsPerPage: profileData.postsPerPage || 10,
  giscus: (profileData as any).giscus || {
    enabled: false,
    repo: "",
    repoId: "",
    category: "General",
    categoryId: "",
  },
  features: {
    audioReader: true,
    readerMode: true,
    textMagnifier: true,
    copyLink: true,
    copyMarkdown: true,
    tableOfContents: true,
    readingProgressBar: true,
    relatedPosts: true,
    highlighter: true,
    ...((profileData as any).features || {}),
  },
  privacy: {
    analytics: false,
    footerNote: true,
    ...((profileData as any).privacy || {}),
  },
  deployTargets: (profileData as any).deployTargets || {},
};

/**
 * Safely resolves an internal route or asset path respecting Astro's base URL.
 * Handles both root deployments ('/') and GitHub Pages subpaths (e.g. '/glyph.sh/').
 */
export function getRelativePath(path: string = '/'): string {
  if (!path) return '';
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('tel:') || path.startsWith('#')) {
    return path;
  }
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/+$/, '');
  const clean = path.replace(/^\/+/, '');
  if (!clean) return base ? `${base}/` : '/';
  return base ? `${base}/${clean}` : `/${clean}`;
}

