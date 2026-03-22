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

### Component Architecture

Uses Angular 20 standalone components (no NgModules). The order feature is split into sub-components:
- `OrderSummary` — basket view and totals
- `ProductCategorySection` — products grid per category
- `DepositSection` — cup deposit management
- `StampCardSection` — stamp card visualization

Product categories: `DRINKS`, `BEER_WINE_NONALC`, `SHOTS`.

### Styling

Tailwind CSS 4 + Angular Material (Azure Blue theme). Locale is set to German (`de`).
