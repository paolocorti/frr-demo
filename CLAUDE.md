# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React + TypeScript + Vite application using React 19 with Fast Refresh. Uses `@vitejs/plugin-react` with Babel for HMR.

## Commands

```bash
npm run dev      # Start development server with HMR
npm run build    # Production build (runs tsc -b && vite build)
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

**Entry points:**
- `index.html` - HTML entry (references `/src/main.tsx`)
- `src/main.tsx` - React app entry, renders `App` component into root

**Source structure:**
- `src/` - All application source code
- `src/assets/` - Static assets imported in code
- `public/` - Static assets served directly

**Configuration:**
- TypeScript split config: `tsconfig.app.json` (app code) and `tsconfig.node.json` (build tooling)
- ESLint uses flat config (`eslint.config.js`) with React Hooks and React Refresh rules
- Vite config at `vite.config.ts` with React plugin

**Styling:**
- CSS files alongside components
- CSS custom properties for theming
- Dark/light mode support via `prefers-color-scheme`

## React Compiler

Not enabled by default due to dev/build performance impact. To add, see: https://react.dev/learn/react-compiler/installation
