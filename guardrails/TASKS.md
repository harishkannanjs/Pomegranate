# TASKS.md — Current phase only: Phase 5 (File-Conversion Pipeline)

> Per `ROADMAP.md` Phase 5 and prompt instructions. Each item is scoped to be one reviewable unit of work.

- [x] Initialize Phase 5 task checklist and create feature branch `feat/phase-5-file-conversion-pipeline`.
- [x] Install and configure conversion dependencies (`turndown`, `mammoth`, `pdf-parse`, `papaparse`, `tesseract.js`, types).
- [x] Build backend conversion dispatcher module (`src/lib/conversion/converter.ts`):
  - Tier 1: `.md`/`.txt` (passthrough), `.html` (Turndown), `.docx` (Mammoth -> Turndown), `.pdf` (PDFParse), `.csv`/`.json` (Papaparse/JSON -> Markdown table), images (Tesseract.js OCR).
  - Tier 2: audio (`.mp3`/`.wav`/`.m4a`) via Groq-hosted Whisper Large V3 (BYOK).
- [x] Implement `/api/convert-file` endpoint in `astro.config.mjs` running in local Node/Bun backend without external network calls for Tier 1.
- [x] Add Groq API Key (BYOK) management in `src/components/dashboard/SettingsTab.astro` with privacy explainer.
- [x] Wire the real conversion dispatcher into the existing seam (`convertToMarkdown`) in `src/components/dashboard/FileUploadTab.astro`:
  - Enforce explicit consent prompt before sending audio to Groq.
  - Show plain-language message with Settings link if no Groq API key is configured.
  - Populate raw/preview split editor upon successful conversion.
- [x] Build automated test suite (`tests/conversion.test.ts`) covering all Tier 1 handlers with fixtures, zero-network verification for Tier 1, and Tier 2 BYOK consent/error handling.
- [x] Run full repository verification suite (`bun run astro check`, `bun run lint`, `bun run format:check`, `bun run test`, `bun run build`), open PR, verify CI, resolve review comments, and merge.
