import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { siteConfig } from '@/site.config';
import { getTheme } from './themes';

let fontData: Buffer | null = null;
let fontBoldData: Buffer | null = null;

function loadFonts() {
  if (!fontData) {
    const fontPath = path.resolve(
      process.cwd(),
      'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff'
    );
    fontData = fs.readFileSync(fontPath);
  }
  if (!fontBoldData) {
    const fontBoldPath = path.resolve(
      process.cwd(),
      'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff'
    );
    fontBoldData = fs.readFileSync(fontBoldPath);
  }
  return { fontData, fontBoldData };
}

export interface OgImageOptions {
  title: string;
  description?: string;
  tags?: string[];
  pubDate?: Date;
  themeId?: string;
}

export async function generateOgImage({
  title,
  description = 'Security research, reverse engineering, and low-level systems.',
  tags = [],
  pubDate,
  themeId,
}: OgImageOptions): Promise<Buffer> {
  const { fontData, fontBoldData } = loadFonts();
  const activeTheme = getTheme(themeId || 'pomegranate');
  const tokens = activeTheme.tokens.dark.read;

  const formattedDate = pubDate
    ? new Date(pubDate).toISOString().split('T')[0]
    : '2026';

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: tokens['bg-base'],
          padding: '60px',
          fontFamily: 'JetBrains Mono',
          border: `1px solid ${tokens.border}`,
        },
        children: [
          // Top bar
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${tokens['bg-surface-raised']}`,
                paddingBottom: '20px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: { color: tokens.accent, fontSize: '24px', fontWeight: 700 },
                          children: '>',
                        },
                      },
                      {
                        type: 'span',
                        props: {
                          style: { color: tokens['text-primary'], fontSize: '20px', fontWeight: 600 },
                          children: `${siteConfig.githubUsername}@research:~$ cat writeup.md`,
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      color: tokens['text-secondary'],
                      fontSize: '16px',
                    },
                    children: formattedDate,
                  },
                },
              ],
            },
          },
          // Center title & description
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                marginTop: '20px',
                marginBottom: '20px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      color: tokens['text-primary'],
                      fontSize: '44px',
                      fontWeight: 700,
                      lineHeight: 1.25,
                    },
                    children: title,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      color: tokens['text-secondary'],
                      fontSize: '22px',
                      lineHeight: 1.5,
                    },
                    children: description.length > 140 ? description.slice(0, 137) + '...' : description,
                  },
                },
              ],
            },
          },
          // Bottom bar: tags & terminal prompt
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: `1px solid ${tokens['bg-surface-raised']}`,
                paddingTop: '20px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap',
                    },
                    children: tags.slice(0, 4).map((tag) => ({
                      type: 'span',
                      props: {
                        style: {
                          backgroundColor: tokens['bg-surface-raised'],
                          border: `1px solid ${tokens.border}`,
                          color: tokens['text-primary'],
                          padding: '6px 14px',
                          borderRadius: '2px',
                          fontSize: '14px',
                        },
                        children: `#${tag}`,
                      },
                    })),
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      color: tokens.accent,
                      fontSize: '16px',
                      fontWeight: 600,
                    },
                    children: `${siteConfig.name} // Technical Research`,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'JetBrains Mono',
          data: fontData,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'JetBrains Mono',
          data: fontBoldData,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });

  const pngData = resvg.render();
  return pngData.asPng();
}
