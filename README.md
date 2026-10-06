# ⛰ WildRoot

**Rooted in Nature. Guided by Intelligence.**

WildRoot is a full-stack trekking intelligence and adventure management portfolio project. A React application combines a realistic 30-trail Indian catalog with traveler profiles, personalized recommendations, readiness estimates, planning, demo bookings and an authenticated management interface. FastAPI persists accounts and user records in SQLite and serves a trained TensorFlow suitability model.

## Problem statement

Travelers need more than a list of attractive destinations: they need to compare a route with their own fitness, experience, available time and preferences. WildRoot makes these inputs explicit, supports preparation, and distinguishes educational machine learning predictions from transparent rules.

## Features

- Cinematic responsive homepage, mobile navigation, restrained motion and reduced-motion CSS.
- Thirty trek detail routes with duration, altitude, distance, season, route highlights and illustrative itineraries.
- Search plus difficulty, duration, altitude, location, terrain and season filters.
- RootProfile: ten editable traveler characteristics, stored on the device for guests and in SQLite for accounts.
- Adventure DNA: five-axis Recharts radar visualization and six possible explorer identities.
- WildMatch: profile-dependent ranking, budget/time/terrain preferences and match percentages.
- RootScore: personalized, rule-based readiness with factor progress bars.
- **Real TensorFlow suitability inference:** eight normalized inputs, three dense layers, saved `.keras` model and FastAPI integration.
- TrailPulse: rule-based weather scenario and risk guidance; admin-published operator alerts.
- RootPack: weather/altitude-sensitive categorized checklist with account persistence.
- Compact itinerary planner: month-aware destination suggestions, named day-wise routes, altitudes, stays, meals, budget components, risks and neural suitability.
- WildGuide: trail knowledge responses with session-persisted multi-turn trail/month memory; no LLM is connected.
- EcoScore: a heuristic incorporating ecosystem sensitivity, popularity proxy, group size and transport distance.
- Email/password registration, PBKDF2 password hashing, 24-hour opaque sessions and server-side role checks.
- Device-persisted favorites, a Saved filter, up-to-three-trail comparison, demo bookings and a personal dashboard.
- Natural-language home search parses difficulty, duration, budget, month, state and terrain and explains each exact match.
- Fitness readiness uses 5 km time, age, exercise frequency and preparation weeks to generate a gradual weekly plan.
- Month-aware gear advisor skips owned items and saves your checklist locally.
- Global trek popups include neural suitability briefs and altitude exposure levels.
- Compact toolkit tabs, announcement bar, catalog-driven stats, forest-green light/dark themes, and 30 distinct real destination photographs with source credits.
- Admin trek CRUD, user list, booking statuses, alerts and data-derived analytics.

## Technology

React 19 · Vite 6 · Tailwind CSS 4 · React Router · Framer Motion · Lucide · Recharts · Python 3.10+ · FastAPI · SQLite · TensorFlow/Keras · NumPy · scikit-learn. Pandas is included for future dataset ingestion. Maps and paid APIs are not needed.

## Repository structure

```text
wildroot/
  frontend/
    src/
      components/          shared UI and application context
      pages/               all routed product screens
      services/            API client and transparent scoring functions
      data/treks.json      offline catalog fallback
    public/images/         bundled nature photography
    vite.config.js         API proxy and vendor chunk splitting
  backend/
    main.py                validated API routes, authentication and permissions
    database/repository.py SQLite initialization and repository boundary
    ml/
      train_model.py       reproducible synthetic-data training
      predict.py           cached model loading and inference
      models/
        suitability.keras  trained model
        metadata.json      feature scales and measured evaluation
    tests/test_api.py      isolated integration tests
    data.json              initial catalog seed
    run.py                 local API launcher
    requirements.txt
```

## Quick start

Open two terminals from `wildroot`.

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Backend (recommended, isolated environment):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python run.py
```

Visit **http://127.0.0.1:5173/**. The frontend proxies `/api` to port 8000. FastAPI's interactive documentation is at **http://127.0.0.1:8000/docs**.

This prepared workspace also contains ignored local Python dependencies in `backend/.deps`; `run.py` can use them without installing into your global Python. For a normal clone use the virtual environment instructions. Delete `.deps` if you want `run.py` to use only the active environment.

### Admin setup

Admin privileges cannot be selected during public registration. Before starting the backend, set a unique test account:

```powershell
$env:WILDROOT_ADMIN_EMAIL = 'your-admin@example.com'
$env:WILDROOT_ADMIN_PASSWORD = 'choose-a-unique-password-at-least-8-characters'
python run.py
```

Sign in with that account and open `/admin`. The account is inserted only if the email does not already exist; an existing ordinary account is never silently promoted. Restart with a different unused email if needed. Do not commit credentials.

### Model training

The trained model is included. To reproduce it:

```powershell
cd backend
python -m ml.train_model
```

Training uses seed 42, 6,000 synthetic samples, a fixed 80/20 train/test split, 15% validation from the training split, 45 epochs and a batch size of 64. Features are divided by fixed domain scales; no test data is used to learn preprocessing. Architecture:

```text
fitness, experience, age category, difficulty, altitude,
elevation gain, duration, weather risk
              ↓ fixed normalization
Dense(32, ReLU) → Dense(16, ReLU) → Dense(1, sigmoid)
              ↓ ×100
suitability score and descriptive class
```

The synthetic target deliberately favors fitness and experience and penalizes difficult routes, altitude, ascent, duration and weather risk. The trained network approximates this labeling policy. **It has not learned from observed expedition outcomes.** Recorded test mean absolute error is **1.81 / 100 score points** on 1,200 synthetic test examples (see `metadata.json`). This is evidence of learning the synthetic policy, not evidence of medical validity or real-world safety prediction. Scores classify as Highly Suitable (≥80), Suitable (≥60), Challenging (≥40) or Not Recommended (<40).

### Prediction API example

```json
POST /api/predict-suitability
{
  "fitness": 80,
  "experience": 50,
  "age": 1,
  "difficulty": 2,
  "altitude": 3810,
  "elevation_gain": 1000,
  "duration": 6,
  "weather_risk": 0.2
}
```

Age categories: 0 under 18, 1 age 18–35, 2 age 36–55, 3 age 56+. Difficulty: 1 Easy, 2 Moderate, 3 Challenging. These simplified categories are educational assumptions, not validated health predictors. Out-of-domain inputs return validation errors. If the model is missing, the API returns 503 and the UI displays the error; it never silently substitutes a rule and calls it neural inference.

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | API and model availability |
| GET | `/api/treks` | Persistent trek catalog |
| POST | `/api/auth/register`, `/api/auth/login` | Account and session |
| GET | `/api/auth/me` | Current identity |
| POST | `/api/auth/logout` | Revoke current session |
| GET, PUT | `/api/profile` | Account traveler profile |
| POST | `/api/predict-suitability` | Neural model inference |
| GET | `/api/saved` | Account saved trail IDs |
| POST | `/api/saved/{trek_id}` | Toggle saved trek |
| GET, POST | `/api/bookings` | Own demo bookings |
| GET, PUT | `/api/packing/{trek_id}` | Own checklist |
| GET | `/api/alerts` | Operator safety alerts |
| GET | `/api/admin/overview` | Protected users, treks and booking analytics |
| POST | `/api/admin/treks` | Add trek |
| PUT, DELETE | `/api/admin/treks/{id}` | Edit/delete trek |
| PATCH | `/api/admin/bookings/{id}` | Change booking status |
| POST | `/api/admin/alerts` | Add safety alert |
| DELETE | `/api/admin/alerts/{id}` | Remove alert |

## Verification

```powershell
cd frontend
npm run build
node --test tests/*.test.mjs
cd ../backend
python -m unittest discover -s tests -v
```

Integration tests create a temporary SQLite database and cover auth rejection, password hashing, account isolation, duplicate registration, saved toggles, packing persistence, invalid bookings, admin CRUD and restrictions, status transitions, and actual neural inference with input validation. They do not mutate your application database.

## Screenshots

The live local preview is the current visual reference. Browser-tool access was blocked in the build environment, so screenshots and desktop/mobile visual verification are not claimed. To add portfolio screenshots, capture the homepage, Explore filters, Adventure DNA and RootScore at desktop and mobile widths, then add them to `docs/screenshots/`.

## Data and photography

The 30 catalog entries are realistic illustrative planning data. Distances, durations, pricing, elevation gain, weather risk, ratings and itineraries are sample estimates rather than operator offers. Conditions, access and permits change; confirm the route independently. No verified user reviews or live weather are connected.

The general hero and background photographs are provided under the [Unsplash License](https://unsplash.com/license):

- Hero: [Rohit Tandon, Ama Dablam](https://unsplash.com/photos/9wg5jCEPBsw).
- Mountain cards: [Sanjay Hona, Yak Kharka](https://unsplash.com/photos/a-mountain-range-with-snow-capped-mountains-in-the-background-S-5fn0pPpp8).
- Forest cards: [Mary Brennan, Olympic National Forest](https://unsplash.com/photos/a-mountain-covered-in-trees-and-fog-uCcCAf6hGQU).

All 30 trek cards, popups, booking summaries and detail covers use distinct real destination or trail photographs sourced from Wikimedia Commons. Photographer, source and reuse license metadata is included in each catalog entry and in `frontend/public/images/treks/credits.json`; source and license links appear in trek details. These images retain their individual Creative Commons or public-domain terms. CSS crops them for presentation. Failed card photos show a neutral unavailable state. Generated artwork is not displayed.

Expanded trail names are grounded in [Himachal Tourism](https://himachaltourism.gov.in/destination/adventure-trekking/), [Uttarakhand Tourism](https://www.uttarakhandtourism.gov.in/adventures/trekking), [Gangotri National Park](https://www.uttarakhandtourism.gov.in/destination/gangotri-national-park), and [Maharashtra Tourism](https://aai-portal.maharashtratourism.gov.in/tourist-intrests/traking-sites/). Numerical costs, route altitudes and itineraries remain planning examples and need local confirmation.

Images are stored locally to avoid broken runtime image URLs. Google Fonts has a system sans-serif fallback.

## Deployment and future improvements

`npm run build` creates `frontend/dist`. Serve the frontend with SPA history fallback and host FastAPI separately on a Python-capable host. Set `VITE_API_URL` before the frontend build when using a separate API origin; update CORS for the actual frontend origin. HTTPS is required for any real deployment. SQLite is intended for one local application instance; the repository boundary is the migration point for PostgreSQL/Supabase. Sites/Cloudflare Workers cannot run this Python/TensorFlow backend as-is, so no complete hosted deployment is claimed.

Future improvements: real consented outcome datasets, independent model calibration, better age-independent readiness measures, professionally reviewed guidance, route maps, real weather integration, verified reviews, persistent itineraries, email verification, password recovery, rate limiting, HttpOnly cookie sessions with CSRF protection, production monitoring and database migrations. Browser-stored session tokens and the demo auth flow are suitable for this classroom project, not production security requirements.

Admin analytics use actual database rows. Adventure progress uses completed demo bookings. Empty accounts display empty states instead of fabricated history. The admin average RootScore is calculated from saved profiles against the named first catalog trail, excluding users without profiles.

Safety preparation references: [CDC high-altitude travel](https://wwwnc.cdc.gov/travel/page/travel-to-high-altitudes) and [National Park Service Ten Essentials](https://www.nps.gov/articles/10essentials.htm). These general references do not validate this application’s scoring models.

## Disclaimer

WildRoot is an educational demonstration. TrailPulse is not emergency monitoring. EcoScore is not a certified carbon footprint. **Demo Project — No Real Payment Required.** Bookings do not reserve actual travel services.

## Resume-ready description

Developed WildRoot, a full-stack AI-powered trekking intelligence platform using React, FastAPI and TensorFlow, featuring neural-network-based trek suitability prediction trained on synthetic data, personalized adventure profiling, intelligent recommendations, preparation insights, planning and authenticated trek-management capabilities.
