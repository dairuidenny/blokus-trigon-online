# GitHub Copilot Workspace Instructions

This file provides workspace-specific guidance for the `blokus-trigon-online` project.
Use it to understand the repo structure, build/test commands, and local conventions.

## Project overview

- React 19 + TypeScript + Vite application.
- Multiplayer Blokus-style game prototype using `playroomkit` for real-time sync.
- Primary source files are under `src/`.
- Core game and UI logic is concentrated in `src/App.tsx`.

## Key files

- `src/App.tsx` - main game state, turn flow, player interaction, and UI composition.
- `src/GameBoard.tsx` - board rendering and placement interaction.
- `src/PieceInventory.tsx` - player piece inventory UI.
- `src/ModeSelection.tsx` - game mode selection screen.
- `src/ClassicPieces.ts` - classic piece data definitions.
- `src/main.tsx` - React app entry point.
- `src/App.css`, `src/index.css` - application styling.
- `vite.config.ts` - Vite config; includes `base` path `/blokus-trigon-online/`.

## Build and test commands

- Install dependencies: `npm install`
- Run development server: `npm run dev`
- Build production bundle: `npm run build`
- Lint project: `npm run lint`

## Conventions and best practices

- Preserve multiplayer sync behavior when changing state or game flow.
- Prefer extracting UI and interaction logic into components instead of adding complexity to `App.tsx`.
- Keep TypeScript types accurate and fix type errors before submitting changes.
- Run `npm run lint` after modifying code.
- Avoid changing deployment-specific config (`vite.config.ts` base path) unless the hosting path changes.

## Notes for Copilot

- Use `README.md` for project goals and feature expectations.
- `AGENTS.md` currently contains a GameSpec helper entry and is not the main Copilot bootstrap guidance.
- Prioritize user-facing gameplay behavior and board interaction consistency.
- Make small, incremental edits when improving UI or logic.
