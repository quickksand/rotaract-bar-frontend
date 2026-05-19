# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server with local backend (also regenerates API client)
npm run start:local-backend

# Regenerate API client from OpenAPI spec (run after changing api/rotaract-bar.openapi.yaml)
npm run openapi:all

# Production build
npm run build

# Run unit tests
npm test
```

There is no dedicated lint command. The dev server proxies `/api/*` to `http://localhost:8080`.

## Architecture

**Domain:** Point-of-sale system for a bar (Rotaract Altstadtfest). Handles drink ordering, preparation workflow, deposit tracking (Pfand), stamp cards (Stempelkarte), and tipping.

**Routes:**
- `/order` — customer-facing order placement
- `/preparation` — bartender order preparation workflow

### API Client (Generated — Do Not Edit)

The backend API is defined in `api/rotaract-bar.openapi.yaml`. Running `npm run openapi:all` regenerates the entire `src/app/api/generated-api/` directory. Never manually edit files there.

Application services consume the generated services:
- `PurchaseOrderControllerService` — create/read orders
- `ProductControllerService` — fetch products
- `IngredientControllerService` — fetch ingredients

### State & Business Logic

`OrderService` (`src/app/services/order.service.ts`) is the central state container using RxJS `BehaviorSubject`s and `combineLatest` for derived state. It owns:
- Cart items and quantities
- Deposit cup counts
- Stamp card state (every 4 drinks = 1 free drink)
- Tip amount
- Order preparation status tracking

### Services

All services live under `src/app/services/`.

- `order.service.ts` — central state container (cart, deposit, stamp card, tip, prep orders)
- `drinks/products.service.ts` — loads products from API; falls back to `localStorage` cache on failure
- `drinks/ingredients.service.ts` — loads ingredients from API; falls back to `localStorage` cache on failure
- `offline-capability/connection-status.service.ts` — combines browser `online/offline` events with HTTP polling every 30 s; exposes `isOnline$: Observable<boolean>`
- `offline-capability/offlineQueue.service.ts` — IndexedDB queue (`asf-offline-queue`) for offline order storage; infrastructure exists but is not yet wired into the order submission path (see `docs/us-5-offline-requirements.md`)

### Component Architecture

Uses Angular 21 standalone components (no NgModules). The order feature is split into sub-components:
- `OrderSummary` — basket view and totals
- `ProductCategorySection` — products grid per category
- `DepositSection` — cup deposit management
- `StampCardSection` — stamp card visualization
- `ShotQuantityDialog` — modal for custom quantity and bottle sale pricing

Product categories: `DRINKS`, `BEER_WINE_NONALC`, `SHOTS`.

### Styling

Tailwind CSS 4 + Angular Material (Azure Blue theme). Locale is set to German (`de`).

## Docs

AIUP artifacts are in `docs/`:

- `docs/use_cases.puml` — PlantUML use case diagram (two roles: Kassierer, Barkeeper; typically the same person)
- `docs/use_cases/` — one spec per use case (UC-001 through UC-005)
- `docs/entity_model.md` — Mermaid ER diagram + attribute tables for the four API entities
- `docs/us-5-offline-requirements.md` — offline capability requirements and work packages (partially implemented)
