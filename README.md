# TW Boilerplate

Lightweight static website boilerplate using Nunjucks and Tailwind CSS.

## Requirements

- Node.js 22.16+
- npm 10+

Use `.nvmrc` if you use nvm.

## Install

```bash
npm install
```

> The repository intentionally does not use `--legacy-peer-deps` or `--force`.

## Development

```bash
npm run dev
```

Open `http://127.0.0.1:3000`.

The dev server watches `src/` and `public/`, rebuilds automatically, and refreshes the browser through a tiny SSE endpoint. It does not use BrowserSync or Chokidar.

## Production build

```bash
npm run build
```

Output is written to `build/`.

## Quality checks

```bash
npm run format:check
npm run lint
npm run validate
npm run build
npm audit
```

Or run the complete check:

```bash
npm run check
```

## Structure

```text
src/
├── html/
│   ├── pages/
│   ├── partials/
│   └── templates/
├── scripts/
└── styles/

public/
├── fonts/
└── images/

scripts/
├── build.mjs
├── dev.mjs
└── validate.mjs
```

## Tooling

- Nunjucks: static HTML templating.
- Tailwind CSS 4 + Tailwind CLI: CSS generation without a PostCSS layer.
- Babel 8 + preset-env: browser-targeted JavaScript transpilation.
- esbuild: JS bundling/minification.
- Biome: JS formatting and linting.
- html-validate: generated HTML validation.
- Native Node.js APIs: build orchestration, watching, and development server.

Browser compatibility is controlled by the `browserslist` entry in `package.json`, rather than targeting obsolete browsers such as IE11.
