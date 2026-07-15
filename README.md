# TraceLock

Fleet intelligence platform — real-time vehicle tracking, geofencing, alerts, and route history playback.

Built with Angular 17 (standalone components, signals), Leaflet maps, and SweetAlert2.

## Features

- **Dashboard** — live fleet map with vehicle markers, status indicators, KPI cards, and geofence overlays.
- **Fleet Management** — sortable/filterable vehicle table with battery gauges, driver assignments, and status badges.
- **Geofences** — create and manage permitted/prohibited zones with interactive map preview and severity levels.
- **Alerts** — real-time alert timeline with read/unread state and quick navigation to related logs.
- **History** — time-travel playback of vehicle routes with scrubber, speed control, and route statistics.
- **Theme System** — dark/light mode with system preference detection and localStorage persistence.

## Tech Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Framework        | Angular 17 (standalone components, signals)     |
| Maps             | Leaflet + CARTO tile layers                     |
| Notifications    | SweetAlert2                                      |
| State management | Angular signals + computed effects              |
| Styling          | SCSS with custom design system + CSS variables  |
| Testing         | Jasmine + Karma                                 |

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/        # Vehicle, Geofence, Alert, Telemetry interfaces
│   │   └── services/      # VehicleService, GeofenceService, AlertService, ThemeService, etc.
│   ├── features/
│   │   ├── dashboard/     # Live fleet map + KPI cards
│   │   ├── fleet/         # Vehicle table management
│   │   ├── geofences/     # Geofence CRUD + map preview
│   │   ├── alerts/        # Alert timeline feed
│   │   └── history/       # Route playback with scrubber
│   ├── shared/
│   │   └── components/
│   │       ├── layout/    # Shell: sidebar, header, toasts
│   │       └── tl-select/ # Custom select component
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── environments/
│   ├── environment.ts
│   └── environment.development.ts
└── styles.scss            # TraceLock design system
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
npm install
npm start
```

Navigate to `http://localhost:4200/`. The app reloads automatically on source changes.

### Environment Configuration

The app uses Angular environment files (`src/environments/`), not `.env` files. The default API URL is `http://localhost:8080/api/v1`. Adjust it in:

- `src/environments/environment.development.ts` — dev
- `src/environments/environment.ts` — production builds

See `.env.example` for reference if wiring environment variables into a CI pipeline.

### Build

```bash
npm run build
```

Artifacts are output to `dist/`.

### Tests

```bash
npm test
```

Runs unit tests via Karma + Jasmine in Chrome.

### Code Scaffolding

```bash
ng generate component features/feature-name
ng generate service core/services/service-name
```

## Architecture Notes

- **Standalone components** — no NgModules; all components use `standalone: true`.
- **Signals** — reactive state via `signal()`, `computed()`, and `effect()` (Dashboard, ThemeService, Fleet).
- **Lazy loading** — feature routes use `loadComponent` for code-splitting per feature.
- **BaseApiService** — central HTTP wrapper with typed CRUD methods and error handling.
- **ThemeService** — manages dark/light mode via signals, persists to `localStorage`, respects `prefers-color-scheme`.

## License

Proprietary — All rights reserved.