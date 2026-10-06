# Publishing WildRoot

This project has a single-container production setup. FastAPI serves the built React app, all photos, and the API from one HTTPS origin. Direct page links work on desktop and phones. The trained model is included.

## Before publishing

Create a GitHub repository called `wildroot`, choosing public or private visibility. Push the local `main` branch to its HTTPS GitHub URL. Never add the local database or environment secrets; both are ignored.

## Container hosting

Connect that repository to a Docker-capable host. Build the root `Dockerfile`. The server binds to `0.0.0.0` and honors the host's `PORT` variable (default 8000). Set the health check to `/api/health`. Attach persistent storage at `/data`; the SQLite database lives at `/data/wildroot.db`. Keep one application instance while using SQLite. Choose the hosting plan only after reviewing its cost and memory allowance for TensorFlow.

Render supports Docker web services and persistent disks on paid services. Its free filesystem is ephemeral; do not rely on it to retain accounts or bookings. See https://render.com/docs/docker and https://render.com/docs/disks.

Optional environment variables: `WILDROOT_ADMIN_EMAIL` and `WILDROOT_ADMIN_PASSWORD`. Set these in the hosting dashboard, never in Git. Use a strong unique administrator password.

For local container testing, run `docker compose up --build`. Open http://localhost:8000. A named Docker volume preserves account data.

## Phones

After deployment, open the same HTTPS URL in Android Chrome or iPhone Safari. Use the browser's Add to Home Screen option for a shortcut. The manifest provides standalone display where supported. Internet access is required; this is not an offline app or an App Store / Play Store package.

## Checks completed locally

Production frontend build, backend integration checks, SPA deep links, API 404 routing, and local photograph delivery. Docker is not installed on this workstation, so the container must also be checked by the hosting build before the public link is considered live.
