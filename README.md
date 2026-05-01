# NutriScan AI — Smart Food Label &amp; Health Analyzer

![.NET](https://img.shields.io/badge/.NET_8-512BD4?style=for-the-badge&logo=.net&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Azure OpenAI](https://img.shields.io/badge/Azure_OpenAI-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Azure Vision](https://img.shields.io/badge/Azure_Vision_(OCR)-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Azure Blob](https://img.shields.io/badge/Azure_Blob-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Azure SQL](https://img.shields.io/badge/Azure_SQL-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

> **Snap a food label → get an instant 0–100 health score, allergen &amp; risk breakdown, expiry alert, and AI-suggested healthier alternatives.**
> A full-stack, cloud-native AI product engineered with ASP.NET Core 8 (Clean Architecture), React + Vite + Tailwind, and four Azure AI services.

---

## Table of Contents

1. [Highlights](#highlights)
2. [Live Demo &amp; Credentials](#demo)
3. [Architecture](#architecture)
4. [Feature Walkthrough](#features)
5. [Tech Stack](#tech-stack)
6. [API Reference](#api)
7. [Project Structure](#structure)
8. [Setup &amp; Run](#setup)
9. [Engineering Notes](#engineering)
10. [Roadmap](#roadmap)
11. [Author](#author)

---

<a id="highlights"></a>
## Highlights

-  **Real-time camera scan** — `navigator.mediaDevices.getUserMedia` powered live viewfinder; snap &amp; analyze without leaving the page.
-  **OCR → AI pipeline** — Azure Computer Vision extracts ingredient text, which is parsed by Azure OpenAI into a strict JSON contract (`healthScore`, `allergens`, `flaggedIngredients`, `alternatives`, `summary`…).
-  **Expiry-aware** — regex-based detector reads *EXP / Best Before / Use By* from OCR text, computes `daysRemaining`, and surfaces a color-coded alert (red ≤3 days, amber ≤7, green otherwise).
-  **Secure multi-tenant** — JWT auth; every query is scoped by `UserId` from claims so users only see and modify their own scans.
-  **User-controlled history** — one-tap delete with confirmation dialog and instant UI removal.
-  **Fully responsive** — mobile-first layouts, hamburger navigation, adaptive charts on Dashboard.
-  **Clean architecture** — Controllers → Services → Repositories → EF Core; DTOs isolate wire contracts from persistence models.

---

<a id="demo"></a>
## Live URL - <a href="https://nutriscan-web.azurewebsites.net">https://nutriscan-web.azurewebsites.net</a>

## Demo Credentials

```
Email:    demo@nutriscan.ai
Password: Demo@123
```

The seed user is created automatically on first run via `DbSeeder.Seed()`.

---

<a id="architecture"></a>
## Architecture

```
                  +-----------------------------+
                  |   React + Vite + Tailwind   |
                  |  • Camera / Upload toggle   |
                  |  • Hamburger responsive nav |
                  |  • ExpiryAlert (RAG color)  |
                  +--------------+--------------+
                                 |  JWT
                                 v
             +----------------------------------------+
             |        ASP.NET Core 8 Web API          |
             |      (Clean Architecture layers)       |
             |  Controllers → Services → Repos → EF   |
             +--+----------+-----------+-------------++
                |          |           |             |
                v          v           v             v
         Azure Blob   Azure Vision  Azure OpenAI   Azure SQL
         (image)       (OCR text)  (JSON analysis)   (data)
                            |
                            v
                  ExpiryDetector (regex)
                  → ExpiryDate, DaysRemaining
```

**Data flow on scan:**

```
Camera / Upload  →  Blob Storage  →  OCR (Vision)  →  Expiry Detection  →  OpenAI Analysis  →  UI
```

---

<a id="features"></a>
## Feature Walkthrough

### 1. Real-Time Camera Scan
`frontend/src/components/CameraScanner.jsx`
- Prefers the rear camera on mobile (`facingMode: 'environment'`).
- Visual viewfinder overlay with vignette for framing.
- Capture draws the current video frame to an offscreen canvas, converts to JPEG Blob, and posts it to `/api/food/analyze`.
- Stream is automatically stopped after capture &amp; on unmount to save battery.

### 2. Upload ↔ Camera Toggle
`frontend/src/pages/Analyze.jsx` exposes a pill-style segmented control so users can switch modes on the fly. Backend accepts both `File` and `Blob` uploads transparently — only the multipart `file` part is required.

### 3. Expiry Detection
`backend/Helpers/ExpiryDetector.cs`
- Detects formats: `DD/MM/YYYY`, `DD-MM-YYYY`, `DD.MM.YYYY`, `MM/YYYY`, `MM-YYYY`, `MM.YYYY`, `YYYY-MM-DD`, `MM/YY`, `DD/MM/YY`.
- Prefers dates following keywords: `EXP`, `EXPIRY`, `EXPIRES`, `BEST BEFORE`, `BEST BY`, `USE BY`, `USE BEFORE`, `CONSUME BEFORE`, `VALID UPTO/UNTIL/TILL`.
- Fallback: picks the **latest future date** anywhere in the OCR text.
- `MFG / MANUFACTURED / PKD` are **deliberately excluded** to avoid false positives.
- Response adds:
  ```json
  { "expiryDetected": true, "expiryDate": "2026-05-01T00:00:00Z", "daysRemaining": 5 }
  ```

### 4. Color-Coded Expiry Alert
`frontend/src/components/ExpiryAlert.jsx`
| Status           | Color  | Threshold         |
|------------------|--------|-------------------|
| Expired          | Red    | `daysRemaining < 0` |
| Expires today    | Red    | `= 0`             |
| Expires in 1-3 d | Red    | `≤ 3`             |
| Expires in 4-7 d | Amber  | `≤ 7`             |
| Safe             | Green  | `> 7`             |

Rendered as a full banner on the Result page and as a compact pill on each History card.

### 5. User-Controlled Delete
- Backend: `DELETE /api/food/history/{id}` — JWT-scoped, returns 404 for foreign rows (never leaks existence).
- Frontend: trash-icon button on each history card + Result page → confirmation modal → instant removal from UI with toast feedback.

### 6. Fully Responsive UI
- Mobile-first Tailwind grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Collapsible hamburger navbar on screens `&lt;md`.
- Charts use Recharts `ResponsiveContainer` so they resize down to 320 px.
- Tap-target-safe 40 px+ buttons, stacked action bars on mobile Result page.

### 7. AI-Powered Analysis (existing, preserved)
Strict JSON schema enforced via `response_format = { type: "json_object" }`, server-side clamping/normalization of `healthScore`, `healthCategory`, `riskLevel`, allergen lowercasing, and safe fallbacks when OpenAI isn't configured.

---

<a id="tech-stack"></a>
## Tech Stack

| Layer       | Tech                                                       |
|-------------|------------------------------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS, React Router, Recharts, Lucide icons |
| Backend     | ASP.NET Core 8 Web API, EF Core, Clean Architecture        |
| AI / Cloud  | Azure OpenAI (GPT-4o), Azure Computer Vision (Read v4), Azure Blob Storage, Azure SQL |
| Auth        | JWT Bearer (HS256), BCrypt password hashing                |
| Tooling     | Swagger / OpenAPI, Serilog-style ILogger, dotnet user-secrets |

---

<a id="api"></a>
## API Reference

All endpoints are under `/api` and — except `auth/*` — require `Authorization: Bearer &lt;JWT&gt;`.

### Auth
| Method | Path               | Description                |
|--------|--------------------|----------------------------|
| POST   | `/auth/register`   | Register a new user        |
| POST   | `/auth/login`      | Returns JWT + user profile |

### Food
| Method | Path                         | Description                                                   |
|--------|------------------------------|---------------------------------------------------------------|
| POST   | `/food/analyze`              | Multipart image → Blob → OCR → Expiry → OpenAI → DB → JSON    |
| GET    | `/food/history`              | Current user's scans, newest-first                            |
| GET    | `/food/history/{id}`         | Full scan detail (owner-scoped)                               |
| **DELETE** | **`/food/history/{id}`**     | **NEW — delete a scan (owner-scoped, JWT UserId validated)**  |
| GET    | `/food/dashboard`            | Aggregate metrics (totals, pie, top categories &amp; allergens)   |

### Example response (`POST /food/analyze`)
```json
{
  {
  "id": 42,
  "imageUrl": "https://…/label.jpg",
  "extractedText": "…INGREDIENTS… BEST BEFORE 05/2026…",
  "createdAt": "2026-01-15T10:22:11Z",
  "analysis": {
    "productName": "Multigrain Crackers",
    "category": "Snacks",
    "healthScore": 72,
    "healthCategory": "Healthy",
    "riskLevel": "Low",
    "flaggedIngredients": ["Palm Oil"],
    "riskExplanation": "Contains refined palm oil, otherwise minimally processed.",
    "allergens": ["gluten", "soy"],
    "warnings": ["Contains soy lecithin"],
    "alternatives": ["Whole-grain rye crackers", "Roasted chickpeas"],
    "summary": "A reasonably healthy whole-grain snack; watch portion size.",
    "expiryDetected": true,
    "expiryDate": "2026-05-31T00:00:00Z",
    "daysRemaining": 136
    }
  }
}
```

---

<a id="structure"></a>
## Project Structure

```
nutriscan-ai/
├── backend/                         # ASP.NET Core 8 API
│   ├── Controllers/FoodController.cs         # + DELETE /history/{id}, expiry in response
│   ├── DTOs/FoodDtos.cs                      # + ExpiryDetected / ExpiryDate / DaysRemaining
│   ├── Helpers/
│   │   ├── ExpiryDetector.cs                  # NEW — regex-based expiry parser
│   │   ├── JwtHelper.cs
│   │   └── UserContext.cs
│   ├── Models/FoodScanHistory.cs             # + ExpiryDate column (nullable)
│   ├── Repositories/
│   │   ├── IFoodScanRepository.cs            # + DeleteAsync
│   │   └── FoodScanRepository.cs             # + DeleteAsync impl
│   ├── Services/ComputerVisionService.cs
│   ├── Services/FoodAnalysisService.cs
│   ├── Services/BlobStorageService.cs
│   ├── Program.cs
│   └── appsettings.json
│
├── frontend/                        # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── CameraScanner.jsx             # NEW — live camera + capture
│   │   │   ├── ExpiryAlert.jsx               # NEW — colored expiry banner/pill
│   │   │   ├── ImageUploader.jsx
│   │   │   ├── AllergenBadge.jsx
│   │   │   └── HealthScoreRing.jsx
│   │   ├── pages/
│   │   │   ├── Analyze.jsx                   # Upload ↔ Camera toggle
│   │   │   ├── History.jsx                   # Delete + confirmation + responsive grid
│   │   │   ├── Result.jsx                    # Expiry banner + Delete button
│   │   │   ├── Dashboard.jsx                 # Responsive polish
│   │   │   ├── Home.jsx                      # Responsive polish
│   │   │   └── Login.jsx
│   │   ├── services/api.js                   # + deleteHistoryItem, blob upload support
│   │   └── App.jsx                           # Responsive hamburger navbar
│   └── tailwind.config.js
│
└── README.md
```

---

<a id="setup"></a>
## Setup &amp; Run

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- Yarn (or npm)
- Azure resources: OpenAI, Computer Vision, Blob Storage, SQL Database  _(optional — the app degrades gracefully to mocked analysis when keys are missing)_

### Backend
```bash
cd backend
dotnet restore
dotnet run
# Swagger → http://localhost:5001/swagger
```

### Frontend
```bash
cd frontend
yarn install
yarn dev
# App  → http://localhost:5173
```

### Configuration (`backend/appsettings.json`)
```jsonc
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=…;Database=NutriScan;…"
  },
  "Jwt": {
    "Key": "<32+ char secret>",
    "Issuer": "NutriScan",
    "Audience": "NutriScanClient"
  },
  "AzureOpenAI": {
    "Endpoint": "https://<YOUR-RESOURCE>.openai.azure.com/",
    "ApiKey": "…",
    "DeploymentName": "gpt-4o"
  },
  "AzureVision": {
    "Endpoint": "https://<YOUR-RESOURCE>.cognitiveservices.azure.com/",
    "ApiKey": "…"
  },
  "AzureBlob": {
    "ConnectionString": "…",
    "Container": "nutriscan"
  }
}
```

Frontend base URL comes from `VITE_API_BASE_URL` (defaults to `http://localhost:5001/api`).

---

<a id="engineering"></a>
## Engineering Notes

- **Authorization correctness** — every repository method filters by `UserId`; the controller reads `UserId` from JWT claims via `UserContext.GetUserId(User)`, never trusting query/body input.
- **Delete returns 404, not 403, for foreign IDs** — avoids leaking whether a row exists for another user.
- **Defensive AI parsing** — `FoodAnalysisService` clamps `healthScore` to 0–100, normalizes `healthCategory` against the score, and falls back to a `BuildMock(...)` response if OpenAI is misconfigured or returns malformed JSON.
- **Camera resource hygiene** — `CameraScanner.jsx` tracks the `MediaStream` in a ref and releases all tracks on unmount and after capture.
- **Expiry edge cases** — past dates are ignored by the "latest-future" fallback; `MFG`-style keywords are excluded; `MM/YY` forms assume the last day of the month.
- **Backwards-compatible DB migration** — `ExpiryDate` is nullable, so existing rows remain valid. `EnsureCreated()` is used in the current codebase; switch to `dotnet ef migrations add AddExpiryDate` before production.
- **Clean-architecture boundaries preserved** — zero changes to `BlobStorageService`, `AuthService`, or any auth flow.

---

<a id="roadmap"></a>
## Roadmap

- [ ] Barcode + QR scanning via camera
- [ ] Personalized scoring based on user diet profile (diabetic, keto, vegan…)
- [ ] Push notifications for soon-to-expire items (background worker + SignalR)
- [ ] Multi-language OCR + analysis
- [ ] Daily diet journal &amp; streak tracking
- [ ] Shareable "scan card" (Open Graph image) for social

---

<a id="author"></a>
## Author

**Built by** 
- Yash Gohel
- _Full-stack engineer · .NET + React + Cloud AI_

- Portfolio: https://ironman-yash-stark.vercel.app
- Email: gohelyash11@gmail.com

> **Resume one-liner:**
> *Built NutriScan AI — a full-stack AI food-label analyzer on ASP.NET Core 8 + React, integrating Azure OpenAI, Vision OCR, Blob Storage and SQL; Shipped real-time camera scanning, regex-based expiry detection, JWT-secured history management, and a mobile-first responsive UI.*
