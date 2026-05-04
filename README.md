# VentureSpan

Startup-investor matching platform with ML-powered success prediction.

## Project structure

```
venturespan/
├── frontend/          # Vite + React + TypeScript
├── backend/           # Node.js + Express + TypeScript
└── ml-service/        # Python 3.12 + FastAPI + CatBoost
```

---

## Prerequisites

- Node.js 18+
- Python **3.12 exactly** — the pretrained CatBoost model and encoders were built with specific library versions that only work on 3.12
- PostgreSQL 15+

---

## First-time setup

### 1. Install Node dependencies

From the root of the project:

```bash
npm install
```

### 2. Set up the Python virtual environment

The ML service must run inside a Python 3.12 venv. Do this once:

```bash
cd ml-service

# Windows
py -3.12 -m venv venv
venv\Scripts\activate

# macOS / Linux
python3.12 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
cd ..
```

> The venv folder is gitignored. You only need to recreate it if you clone the repo fresh on a new machine.

### 3. Environment variables

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
cp ml-service/.env.example ml-service/.env
```

Edit each `.env` file:

**backend/.env** — the most important one:

```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/venturespan
JWT_SECRET=pick-a-long-random-string
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://localhost:8000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

**frontend/.env:**

```
VITE_API_URL=http://localhost:3001/api
```

**ml-service/.env:**

```
PORT=8000
MODELS_DIR=./models
MAPPINGS_DIR=./mappings
```

### 4. Database

Create the database and run migrations:

```bash
createdb venturespan
npm run db:migrate --workspace=backend
```

> Only needed once. Do not re-run migrations on an existing database unless you want to reset it.

### 5. ML model files

Your trained model and mapping files should already be in place if you cloned from the repo. If setting up fresh, copy them into:

```
ml-service/models/
  gradient_boosting_startup_model.joblib
  category_ohe.joblib

ml-service/mappings/
  category_list_display.json
  category_display_to_original.json
  country_list.json
  dice_meta.json
  dice_train_df.csv
```

---

## Running the platform

### All three services together

```bash
npm run dev
```

This starts:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- ML service: http://localhost:8000

### Running services individually

```bash
npm run dev:frontend
npm run dev:backend
```

For the ML service, always activate the venv first:

```bash
cd ml-service

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

uvicorn main:app --reload --port 8000
```

---

## Known setup notes

- `backend/src/config/db.ts` imports `dotenv/config` as its first line — this is required so the database connection can read `DATABASE_URL` from `.env` before the pool initialises
- The ML service runs as a separate process and is called internally by the backend. If the ML service is down, the rest of the platform still works — prediction just won't run
- PostgreSQL must be running before starting the backend

---

## Ongoing development workflow

Changes are made on the development machine and communicated as individual file updates. When a file changes:

1. Open the specified file in your local project
2. Replace its contents with the updated version provided
3. Save — no restart needed for frontend (Vite hot reloads), restart the backend process for backend changes, restart uvicorn for ML service changes

No need to re-download the full zip or redo any setup.
