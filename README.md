# WildRoot

A trekking website for exploring Indian trails and planning a trip. Built with React, FastAPI, SQLite and TensorFlow.

## Features

- 30 Indian treks with real location photos, route details and seasonal information.
- Search and filters, saved treks, and side-by-side comparison.
- Trek matching based on fitness, experience, budget and available time.
- Day-wise itineraries with stays, meals and a budget breakdown.
- Packing checklists and a fitness preparation plan.
- A trek guide chat with conversation memory.
- User accounts, demo bookings and an admin dashboard.
- Responsive forest-green design, FAQ and a how-it-works page.

## Run locally

Use Python 3.11 and a recent Node.js version. Open two terminals from the project folder.

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python run.py
```

Open the URL shown by Vite, usually `http://127.0.0.1:5173`. The API runs on port 8000. API documentation is available at `http://127.0.0.1:8000/docs`.

## Project structure

```text
frontend/     React interface, trek data and photos
backend/      FastAPI routes, SQLite storage and trained model
Dockerfile    Production build for the full application
compose.yaml  Local container setup with persistent storage
```

## Recommendations and guide

Trek matching, fitness readiness and packing use rules based on the inputs you enter. Route suitability also uses a TensorFlow model trained on synthetic data. The trained model is included in `backend/ml/models`.

The guide uses a built-in trek knowledge engine with conversation memory. It does not connect to an external language model.

To retrain the suitability model:

```powershell
cd backend
python -m ml.train_model
```

## Admin account

Set `WILDROOT_ADMIN_EMAIL` and `WILDROOT_ADMIN_PASSWORD` before starting the backend, then sign in and visit `/admin`. Use an email that is not already registered. Keep passwords and other secrets out of Git.

## Checks

```powershell
cd frontend
npm run build
node --test tests/*.test.mjs
cd ../backend
python -m unittest discover -s tests -v
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting and phone access. The production container serves the frontend and API together. Mount persistent storage at `/data` to retain accounts and bookings.

## Photos and trek data

Trek photos come from Wikimedia Commons. Individual photographer and license credits are recorded in [credits.json](frontend/public/images/treks/credits.json) and displayed in trek details.

General background photos: [Rohit Tandon](https://unsplash.com/photos/9wg5jCEPBsw), [Sanjay Hona](https://unsplash.com/photos/a-mountain-range-with-snow-capped-mountains-in-the-background-S-5fn0pPpp8) and [Mary Brennan](https://unsplash.com/photos/a-mountain-covered-in-trees-and-fog-uCcCAf6hGQU), under the [Unsplash License](https://unsplash.com/license).

Costs and itineraries are sample planning estimates. Bookings are demonstrations and do not reserve a trip or process payments.
