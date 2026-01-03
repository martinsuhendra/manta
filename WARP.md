# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Manta is a modern admin dashboard template built with Next.js 15, TypeScript, and Shadcn UI. It's designed as a starter template for SaaS applications, admin panels, and internal tools with multiple dashboard variants, customizable themes, and authentication layouts.

## Development Commands

### Core Development

- `npm run dev` - Start development server with Turbopack (fast refresh)
- `npm run build` - Build production application
- `npm start` - Start production server

### Code Quality & Formatting

- `npm run lint` - Lint codebase with ESLint (includes extensive ruleset)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without writing

### Theme Generation

- `npm run generate:presets` - Generate theme preset constants from CSS files
- Run this after adding new theme presets in `src/styles/presets/`

### Git Hooks

- Husky pre-commit hook runs ESLint with auto-fix on staged files
- Theme presets are automatically generated on pre-push

## Architecture Overview

### File Structure Pattern

This project uses a **colocation file system architecture** where pages, components, and logic are grouped by feature. Each route folder contains everything it needs, while shared utilities live at the top level.

### Core Directories

- `src/app/` - Next.js 15 App Router with route groups
  - `(main)/dashboard/` - Main dashboard layouts and pages
  - `(external)/` - External pages (landing, auth)
- `src/components/` - Shared UI components
  - `ui/` - Shadcn UI components (auto-generated, avoid editing)
  - `data-table/` - Reusable data table components with TanStack Table
- `src/stores/` - Zustand state management
- `src/types/preferences/` - TypeScript definitions for layout and theme preferences

### Key Architecture Concepts

#### Theme System

- **Multi-preset theming** with light/dark mode support
- Theme presets defined in `src/styles/presets/` as CSS files
- Automatic theme generation via `generate:presets` script
- Themes are applied via `data-theme-preset` attribute on HTML element

#### Layout Preferences

- **Configurable sidebar**: inset/sidebar variants, collapsible options
- **Content layout**: centered/full-width options
- Preferences persist via server actions and cookies
- Layout state managed through Zustand store

#### Route Groups

- `(main)` - Authenticated dashboard area with shared layout
- `(external)` - Public pages with independent layouts
- Authentication screens in `/auth/v1/` and `/auth/v2/` variants

#### Component Strategy

- **Shadcn UI** for base components (managed via components.json)
- **Compound components** for complex UI (sidebars, data tables)
- **Server components by default** with client components marked explicitly

#### Data Management

- **TanStack Query** for server state management
- **TanStack Table** for complex data tables with sorting/filtering
- **React Hook Form + Zod** for form validation
- **Zustand** for client-side preferences state

### Important Files

- `src/config/app-config.ts` - Application metadata and configuration
- `src/navigation/sidebar/sidebar-items.ts` - Navigation structure definition
- `src/lib/utils.ts` - Utility functions (Tailwind merge, etc.)
- `src/server/server-actions.ts` - Next.js server actions for preferences

### ESLint Configuration

The project uses a comprehensive ESLint setup with:

- Security rules (eslint-plugin-security)
- Code quality rules (sonarjs)
- Import organization with specific grouping
- File naming conventions (kebab-case)
- TypeScript strict rules with custom overrides
- React best practices and performance rules

### Development Notes

- **Hot reload** enabled via Turbopack in development
- **Console removal** in production builds
- **Strict TypeScript** with path aliases (`@/*` → `./src/*`)
- **Tailwind CSS v4** with custom component utilities
- **Automatic redirects** from `/dashboard` to `/dashboard/home`

### Theme Development

When creating new theme presets:

1. Add CSS file to `src/styles/presets/`
2. Include `label:` and `value:` comments in CSS
3. Define `--primary` colors for light and dark modes
4. Run `npm run generate:presets` to update TypeScript types

### Data Table Pattern

For creating new data tables:

- Use `useDataTableInstance` hook for consistent behavior
- Implement drag-and-drop via `@dnd-kit/sortable` if needed
- Follow the pattern in `src/components/data-table/`

### Authentication Routes

- Login/Register screens available in v1 and v2 variants
- Authentication layouts are separate from main dashboard layout
- Auth components in `src/app/(main)/auth/_components/`
