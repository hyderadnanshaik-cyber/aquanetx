# AQUANET X — Complete Technical Guide & System Architecture

> **Comprehensive Onboarding, Hydrological Intelligence, AI/ML Pipelines & Codebase Reference**  
> *Target Audience: Core Engineering Team, Data Scientists, Evaluators & Contributors*  
> *Repository: [hyderadnanshaik-cyber/aquanetx](https://github.com/hyderadnanshaik-cyber/aquanetx)*  
> *Current Release: Production v2.4 (Multi-Service Architecture on Vercel)*

---

## Table of Contents
1. [Application Overview](#1-application-overview)
2. [Detailed Explanation of Every Page](#2-detailed-explanation-of-every-page)
3. [Dashboard Breakdown & Metrics Calculation](#3-dashboard-breakdown--metrics-calculation)
4. [AI, Machine Learning & Hydrological Data Processing](#4-ai-machine-learning--hydrological-data-processing)
5. [Dataset Documentation & Provenance](#5-dataset-documentation--provenance)
6. [System Architecture & End-to-End Data Flow](#6-system-architecture--end-to-end-data-flow)
7. [Technology Stack & Component Justification](#7-technology-stack--component-justification)
8. [Database Architecture & Data Storage](#8-database-architecture--data-storage)
9. [Complete End-to-End User Workflows](#9-complete-end-to-end-user-workflows)
10. [Comprehensive REST API Documentation](#10-comprehensive-rest-api-documentation)
11. [Project Directory & File Structure](#11-project-directory--file-structure)
12. [Local Setup, Environment & Deployment Guide](#12-local-setup-environment--deployment-guide)
13. [Current Implementation Status Matrix](#13-current-implementation-status-matrix)
14. [Roadmap & Future Scope](#14-roadmap--future-scope)

---

## 1. Application Overview

### 1.1 What is AQUANET X?
**AQUANET X** is an urban hydrological intelligence and disaster resilience web platform engineered to bridge the critical gap between macro-level meteorological forecasts and street-level civic reality. It synthesizes real-time satellite telemetry, municipal hydrological models, machine learning flood classifiers, groundwater contamination data (CGWB), and crowdsourced citizen incident reports into a single, offline-first operational command interface.

### 1.2 The Problem It Solves
Modern Indian and global metropolitan areas face a catastrophic dual crisis:
1. **Urban Flash Flooding & Inundation:** Rapid concretization and impervious surface expansion have destroyed natural infiltration basins. When rainfall strikes, water cannot infiltrate the soil, overwhelming stormwater drains and transforming underpasses, arterial transit corridors, and low-lying residential sectors into flash-flood hazard zones within 15–30 minutes. Conventional weather apps only report *"rain expected"*, without telling citizens or municipal disaster cells *which streets will waterlog*, *how much runoff will generate*, or *which culverts will surcharge*.
2. **Groundwater Depletion & Chemical Stress:** Simultaneously, municipal water supply networks operate under chronic deficits. Citizens rely heavily on borewells that tap contaminated groundwater containing hazardous concentrations of Fluoride ($> 1.5\text{ mg/L}$), Nitrate ($> 45\text{ mg/L}$), and elevated Total Dissolved Solids (TDS). Millions drink or bathe in substandard water without knowing its chemical potability.
3. **Communication Breakdown During Emergencies:** In peak disaster events (e.g., Chennai 2015, Hyderabad 2020, Bengaluru 2022), cellular data networks and power grids fail. Traditional cloud-only emergency apps turn into blank white screens because they lack local offline storage, local heuristics, and SMS fallback.

### 1.3 How AQUANET X Solves This
- **Physics-Informed Runoff Modeling:** Uses the United States Department of Agriculture (USDA) Soil Conservation Service Curve Number (**SCS-CN**) method calibrated with Antecedent Moisture Condition (**AMC-I/II/III**) to model actual millimeter-level surface runoff rather than raw rainfall volume.
- **Trained Machine Learning Inference:** Deploys a **HistGradientBoostingClassifier** trained on 31,274 observations from Central Water Commission (CWC) telemetry river gauges (2021–2025) with chronological test split validation ($F_1 = 0.998$, $\text{Recall} = 0.9986$, $\text{ROC-AUC} = 1.0$).
- **Pan-India Groundwater Quality Index:** Integrates 15,177 parsed monitoring stations from the Central Ground Water Board (**CGWB 2024**) evaluated against **BIS IS 10500:2012** drinking water standards.
- **Strictly Grounded Water AI (AQUA AI):** Powered by Google Gemini 1.5/Flash with an automated 4-key failover manager, strict water/hydrology system prompts, real-time sensor injection, and zero-latency local fallback protocols.
- **Offline-First Resilience:** Client-side **Dexie.js (IndexedDB)** caching guarantees that map tiles, emergency contacts, incident reports, and safety protocols remain 100% accessible during cellular network outages. Reports queue locally and sync automatically when internet connectivity restores.
- **One-Tap Emergency SOS:** Acquires high-accuracy device GPS coordinates, formats a standardized emergency dispatch payload with a direct Google Maps pin, and triggers native device SMS clients to alert pre-configured family contacts even when 4G/5G mobile data is offline.

### 1.4 Target Users
1. **Urban Citizens & Commuters:** Seeking real-time hyper-local waterlogging advisories, safe evacuation corridors, tap-water potability metrics, and one-tap emergency SOS dispatch.
2. **Municipal Engineers & Disaster Management Authorities (GHMC, NDMA, CWC):** Tracking stormwater culvert surcharges, deploying de-watering pumps to predicted arterial bottlenecks, and reviewing crowdsourced citizen incident reports.
3. **Environmental Researchers & Hydrologists:** Analyzing multi-year river gauge discharge, groundwater chemical trends, and catchment soil saturation curves.

### 1.5 What Makes AQUANET X Different?
| Dimension | Conventional Weather / Water Apps | AQUANET X |
|---|---|---|
| **Prediction Focus** | Generic precipitation probability (e.g., "70% rain") | Hydrological runoff volume (mm), culvert inundation index, and SCS-CN soil saturation physics |
| **Offline Capability** | Fails completely without active 4G/WiFi | Full offline read/write capability via IndexedDB (Dexie), local safety heuristic fallback, and SMS dispatch |
| **Groundwater Insight** | None | 15,177 CGWB stations with Fluoride, Nitrate, TDS, and BIS IS 10500 compliance ratings |
| **AI Reliability** | Hallucinates or gives generic tips; single API key crashes under rate limits | 4-Key round-robin failover manager, real-time sensor injection, and strict water domain constraints |
| **Data Verification** | Simulated or synthetic mocks | Real CWC 2021–2025 hourly telemetry + official CGWB 2024 Government of India dataset |

---

## 2. Detailed Explanation of Every Page

AQUANET X routes are declared in [`frontend/src/App.tsx`](file:///frontend/src/App.tsx) and managed through React Router v6.

```
/                             -> LandingPage.tsx (Public WebGL Environment)
/login                        -> LoginPage.tsx (Public Only)
/register                     -> RegisterPage.tsx (Public Only)
/forgot-password              -> ForgotPasswordPage.tsx (Public Only)
/dashboard                    -> DashboardLayout.tsx (Protected Shell)
  ├── (index)                 -> DashboardOverview.tsx
  ├── /floodsense             -> FloodSensePage.tsx
  ├── /water-stress           -> WaterStressPage.tsx
  ├── /smart-recovery         -> SmartRecoveryPage.tsx
  ├── /citizen-reports        -> CitizenReportsPage.tsx
  ├── /alerts                 -> AlertsPage.tsx
  ├── /weather                -> WeatherPage.tsx
  ├── /aqua-ai                -> AquaAIPage.tsx
  ├── /emergency              -> EmergencyPage.tsx
  ├── /profile                -> ProfilePage.tsx
  └── /settings               -> SettingsPage.tsx
```

---

### 2.1 Landing Page (`/` — `LandingPage.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** Public portal introducing the AQUANET X platform through a photorealistic ocean WebGL environment and interactive narrative sections.
- **Visuals & Mechanics:**
  - **Custom WebGL Fragment Shader:** Compiles a raw GLSL ocean lighting and caustics shader (`FS`) on an HTML5 `<canvas>`, computing refractive underwater lighting modulated by scroll position.
  - **Boid Simulation Canvas:** A secondary 2D canvas simulates schooling fish behavior (separation, alignment, cohesion) with dynamic swarm tracking around cursor movement.
  - **Depth Scroll Tracker:** A custom progress bar tracks the user's descent from the ocean surface to the deep abyss (`0m` to `3,800m`), transitioning page aesthetics from bright cyan to midnight navy.
- **Sections:**
  - *Hero Header:* Brand logo, quick login/register links, primary CTA "Launch Dashboard".
  - *The Triple Threat:* Explains urban flash floods, groundwater exhaustion, and emergency blackout risks.
  - *Core Capabilities:* Highlights FloodSense, CGWB Water Stress, AQUA AI, and Offline SOS.
  - *Interactive Metrics:* Live simulation of telemetry feeds.
- **State & Actions:**
  - Authenticated users clicking "Launch Dashboard" or "Sign In" are automatically redirected directly to `/dashboard` without re-authenticating.
  - Unauthenticated users are routed to `/register` or `/login`.

---

### 2.2 Authentication Pages (`/login`, `/register`, `/forgot-password`)
- **Status:** **Fully Implemented**
- **Components:** [`LoginPage.tsx`](file:///frontend/src/pages/auth/LoginPage.tsx), [`RegisterPage.tsx`](file:///frontend/src/pages/auth/RegisterPage.tsx), [`ForgotPasswordPage.tsx`](file:///frontend/src/pages/auth/ForgotPasswordPage.tsx).
- **Functionality:**
  - **Firebase Authentication:** Handles email/password sign-in, user registration with `displayName`, password reset emails, and Google OAuth popup authentication (`signInWithPopup`).
  - **Demo Mode Fallback:** If Firebase credentials are not yet configured in the environment or if an evaluator wants to inspect the app without signing up, clicking **"Continue as Guest / Demo"** initializes an ephemeral `demo-user-001` session in `localStorage` (`aquanetx_demo_session = '1'`), granting instant access to all protected dashboard tabs.
  - **Form Validation:** Validates email format, password minimum length (6 characters), and password match with descriptive error alerts.

---

### 2.3 Dashboard Shell (`/dashboard/*` — `DashboardLayout.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** Persistent responsive application shell wrapping all authenticated dashboard views.
- **Components & Features:**
  - **Adaptive Sidebar:** Collapsible navigation drawer containing the AQUANET X logo, primary navigation links with active indicators, account settings, and Sign Out button. On viewports $\le 768\text{px}$, it collapses into an off-canvas drawer controlled by a hamburger toggle and backdrop overlay.
  - **Mobile Bottom Navigation Bar:** Displays 5 high-priority quick actions (Overview, FloodSense, AQUA AI, Weather, SOS) on mobile screens ($\le 768\text{px}$) for thumb-friendly one-handed navigation.
  - **Global Topbar:**
    - Page Title synced to the active route.
    - **Interactive Location Switcher Modal:** Allows switching the active monitoring point between GPS acquisition, pre-configured city presets (Hyderabad, Mumbai, Delhi, Bengaluru, Chennai, Kolkata, Warangal, Nizamabad), or a free-text geocoding search querying the Open-Meteo Geocoding API.
    - **Connectivity Badge:** Real-time Online/Offline indicator connected to `ConnectivityContext`.
    - **Demo Badge:** Indicates whether the active session is a demo or authenticated user.
    - **User Avatar:** Displays user initials; links directly to `/dashboard/profile`.
  - **Interactive Onboarding Mascot (`OnboardingMascot.tsx`):** A floating AI mascot named **AQUA** guides first-time users through a 10-step guided tour of the platform features. State is stored in `localStorage` (`aquanetx_onboarding_done`).

---

### 2.4 Dashboard Overview (`/dashboard` — `DashboardOverview.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** Command and control executive summary aggregating real-time hydrological conditions, active alerts, and quick actions.
- **Displayed Data & Calculations:**
  - *Flood Risk Card:* Displays calibrated risk level (Low, Moderate, High, Critical) and risk index ($0\text{--}100$) fetched dynamically from `/api/flood/predict`.
  - *Water Stress Card:* Displays municipal stress percentage ($42\%$) based on catchment demand vs. reservoir buffer.
  - *24h Rainfall Card:* Displays live millimeter accumulation fetched from `/api/weather` via Open-Meteo satellite feed.
  - *Active Alerts Card:* Summarizes active municipal watches (e.g., "2 active alerts").
  - *Citizen Reports Card:* Counts open crowdsourced incidents in the sector.
  - *Recovery Potential:* Displays catchment yield capability ($78\%$).
- **Sections:**
  - *Recent Activity Feed:* Displays chronological audit log of river gauge telemetry, citizen incident reports, and radar passes.
  - *Quick Navigation Banners:* Direct deep-links to FloodSense mapping, Water Stress analysis, and Emergency SOS.

---

### 2.5 FloodSense Hydrological Inundation (`/dashboard/floodsense` — `FloodSensePage.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** Geospatial mapping and machine learning flood risk prediction engine for urban catchments.
- **Key Features & Interactive Controls:**
  - **Interactive Leaflet Radar Map:**
    - Renders high-contrast OpenStreetMap cartography centered on the user's active location.
    - Layer Toggles: **Flood Risk Zones** (inundation radius circles colored by severity: Green = Low, Yellow = Moderate, Orange = High, Red = Critical), **Precipitation Feeds** (live rainfall radar markers), and **CWC River Gauges** (CWC telemetry stations with water level and discharge data).
    - Map markers update dynamically whenever the location or simulated storm surge changes.
  - **Storm Surge Simulator:**
    - An interactive simulation drawer allowing users to inject artificial storm surges ($+0\text{ mm}$ to $+120\text{ mm}$ of rainfall) via quick preset pills ($+10\text{mm}$, $+25\text{mm}$, $+50\text{mm}$, $+75\text{mm}$, $+100\text{mm}$) or a continuous range slider.
    - Triggers instantaneous client-side recalculation of the SCS-CN runoff volume, soil infiltration capacity, and calibrated flood risk index, allowing disaster managers to test *"what-if"* storm scenarios.
  - **ML Benchmark & Transparency Panel:**
    - Exposes evaluation metrics of the trained champion model: Model Type (`HistGradientBoostingClassifier`), Holdout $F_1$-Score ($0.998$), Holdout Recall ($0.9986$), ROC-AUC Score ($1.0$), and Train/Test Split count ($25,423$ train / $5,851$ test).
  - **Nearest CWC Telemetry Gauges Table:**
    - Lists real Central Water Commission monitoring stations (e.g., Srisailam Reservoir, Nagarjuna Sagar, Hyderabad Musi Basin) with geographic coordinates, recorded precipitation, and river discharge rate ($\text{m}^3/\text{s}$).
  - **CSV Export:** One-click download of all CWC telemetry observations formatted for GIS analysis.

---

### 2.6 Water Stress & Groundwater Quality (`/dashboard/water-stress` — `WaterStressPage.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** Pan-India chemical potability analyzer and water scarcity monitoring tool powered by the Central Ground Water Board (**CGWB 2024**) dataset.
- **Key Features & Functionality:**
  - **15,177 Pan-India Monitoring Stations:** Evaluates groundwater chemical composition across 37 Indian states and Union Territories.
  - **BIS IS 10500:2012 Compliance Evaluation:**
    - *Fluoride ($F^-$):* Acceptable limit $\le 1.0\text{ mg/L}$, Permissible limit $\le 1.5\text{ mg/L}$. High concentrations cause dental and skeletal fluorosis.
    - *Nitrate ($NO_3^-$):* Acceptable limit $\le 45\text{ mg/L}$. High concentrations cause infant methemoglobinemia ("blue baby syndrome").
    - *Total Dissolved Solids (TDS):* Acceptable limit $\le 500\text{ mg/L}$, Permissible limit $\le 2000\text{ mg/L}$.
    - *Total Hardness:* Acceptable limit $\le 200\text{ mg/L}$, Permissible limit $\le 600\text{ mg/L}$.
    - *pH:* Acceptable range $6.5\text{--}8.5$.
  - **Interactive Filtering & Search:**
    - *Sort Nearest to Me:* Uses Euclidean/Haversine distance calculation to sort all 15,177 stations relative to the user's active geographic coordinates.
    - *State Filter Dropdown:* Filters stations by state (Telangana, Andhra Pradesh, Maharashtra, Karnataka, Tamil Nadu, Delhi, Rajasthan, etc.).
    - *Search Bar:* Free-text search matching station name, district, or mandal.
  - **National Overview KPI Cards:** Displays real-time Average TDS ($764\text{ mg/L}$), Average Fluoride ($0.633\text{ mg/L}$ with exceedance percentage), Average Nitrate ($18.4\text{ mg/L}$ with exceedance percentage), and Potable Stations percentage.
  - **Interactive Data Table:** Displays locality, distance, chemical parameters, and color-coded potability badges (**Safe**, **Moderate Stress**, **Critical Stress**).
  - **Export Dataset:** One-click CSV export of the filtered station subset.

---

### 2.7 Smart Recovery & Conservation (`/dashboard/smart-recovery` — `SmartRecoveryPage.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** Engineering advisory tool for decentralized rainwater harvesting (RWH), greywater recycling, and government water conservation subsidies.
- **Key Features:**
  - **Interactive RWH Yield Calculator:**
    - Computes annual harvestable precipitation using the hydrological formula:
      $$\text{Annual Yield (Litres)} = \text{Rooftop Area } (m^2) \times \text{Annual Rainfall } (mm) \times \text{Runoff Coefficient } (C) \times \text{Filter Efficiency } (\eta)$$
    - User inputs: Rooftop area ($m^2$), annual local rainfall ($mm$), and roof surface material (Concrete Slab $C=0.85$, Metal Sheet $C=0.90$, Clay Tile $C=0.75$).
    - Output: Total harvestable litres/year, number of commercial $5,000\text{L}$ water tankers saved, monetary savings in INR ($\text{₹}$), and equivalent carbon footprint offset ($kg\text{ CO}_2$).
  - **Actionable Engineering Strategies:** Step-by-step installation guides for:
    1. Rooftop Collection & Infiltration Well Systems (with first-flush diverters and charcoal percolation beds).
    2. Decentralized Domestic Greywater Biofilters (reed-bed filtration for toilet flushing and landscaping).
    3. Smart Pressure Reduction & Acoustic Pipe Leak Detection.
  - **Government Subsidy Registry:** Outlines active central and state financial assistance programs (e.g., National Jal Jeevan Mission, GHMC RWH Mandatory Rebate Scheme) offering up to $50\%$ capital subsidies.

---

### 2.8 Citizen Incident Reports (`/dashboard/citizen-reports` — `CitizenReportsPage.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** Crowdsourced civic incident reporting portal enabling community-driven flood and contamination hazard tracking with full offline synchronization.
- **Key Features:**
  - **Incident Reporting Form:**
    - Classification Categories: Flooding, Waterlogging, Drainage Blockage, Water Shortage, Contaminated Water, Damaged Infrastructure.
    - Severity Picker: Low, Medium, High, Critical.
    - Auto-Geolocation: Captures high-accuracy GPS coordinates or falls back to active municipality name.
    - Incident Description text area with validation.
  - **Offline-First Storage Pipeline:**
    - When online: Saves report to client IndexedDB (`db.citizenReports`) and immediately submits via `POST /api/reports` to MongoDB Atlas.
    - When offline: Saves report locally with status `pending_local` and increments global pending sync counter. Reports render in the UI with an `Offline Stored` badge.
  - **Incident Stream & Filter Bar:** Filters reports by category (All, Flooding, Waterlogging, Blocked Drainage, Water Quality) and displays status chips (**Submitted**, **Under Review**, **Verified**, **Resolved**).
  - **CSV Export:** Exports citizen incident logs for civic audit.

---

### 2.9 Alerts & Warning System (`/dashboard/alerts` — `AlertsPage.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** Centralized emergency broadcast bulletin aggregating official advisories from IMD, CWC, NDMA, and municipal water boards.
- **Key Features:**
  - **Severity Hierarchies:** Critical (Red), High (Orange), Moderate (Yellow), and Low (Green).
  - **Category Filters:** Filter by All Alerts, Flood Warnings, Severe Weather, Water Supply Disruptions, and Infrastructure Maintenance.
  - **Advisory Card Breakdown:** Displays alert title, verified issuing authority (e.g., India Meteorological Department, GHMC Engineering Wing), timestamp, affected locality, comprehensive situation summary, and mandatory citizen safety action instructions.
  - **Interactive Action Protocol:** Checklists for emergency kit preparation, electrical disconnection, and municipal helpline contact.

---

### 2.10 Live Weather Intelligence (`/dashboard/weather` — `WeatherPage.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** High-resolution meteorological analysis tracking precipitation, barometric trends, and atmospheric moisture driving flood risk.
- **Key Features:**
  - **Live Meteorological Ingestion:** Streams real-time telemetry from Open-Meteo's World Meteorological Organization (WMO) feed for the active coordinate set.
  - **Current Conditions Header:** Large dynamic temperature readout with Celsius/Fahrenheit toggle, apparent "feels like" temperature, atmospheric condition label, and animated WMO icons.
  - **Hydrological Atmospheric Metrics Strip:**
    - *24-Hour Precipitation Accumulation ($mm$):* Directly ingested into the SCS-CN flood model.
    - *Relative Humidity ($\%$):* Evaluates evaporation potential.
    - *Wind Speed & Direction ($km/h$ and Compass Heading):* Tracks storm front trajectories.
    - *Surface Atmospheric Pressure ($hPa$):* Monitors convective storm depressions.
  - **7-Day Weather Forecast Timeline:** Daily high/low temperature forecasts, precipitation probability bars, and expected weather conditions.
  - **Hourly Precipitation Breakdown:** 24-hour horizontal scrolling timeline showing projected hourly rainfall in millimeters.

---

### 2.11 AQUA AI Conversational Assistant (`/dashboard/aqua-ai` — `AquaAIPage.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** Specialized domain-restricted conversational AI assistant providing deep, factual, data-driven hydrological insights, flood safety advice, and water conservation guidance.
- **Key Features:**
  - **Real-Time Telemetry Augmentation:** Every query sent to the backend automatically injects the latest live weather, precipitation accumulation ($mm$), flood risk level, SCS-CN soil runoff status, and municipal station telemetry for the active location directly into the model's context window.
  - **Strict Domain Boundary:** Enforced via `AQUA_SYSTEM_PROMPT`. The model politely declines off-topic queries (coding, politics, general chat) and focuses strictly on water science, flood safety, disaster protocols, and civic water management.
  - **Multi-Key Failover Architecture:** Integrated with `geminiKeyManager.js`, which balances load across 4 Gemini API keys with automatic failover and candidate model fallbacks (`gemini-3-flash-preview` $\rightarrow$ `gemini-3.5-flash` $\rightarrow$ `gemini-3.5-flash-lite`).
  - **Zero-Latency Offline Heuristic Fallback:** If the client loses internet connection or the cloud AI takes longer than expected, the system instantly triggers an offline rule-based protocol from indexed memory, delivering verified disaster safety instructions without a blank screen.
  - **Custom Inline Markdown Renderer:** Pure React markdown parser rendering bold text, code blocks, bulleted lists, numbered lists, blockquotes, and horizontal dividers with zero external npm dependencies.
  - **Conversation Persistence:** Chat histories are indexed in client IndexedDB (`db.chatMessages`) across sessions.

---

### 2.12 Emergency SOS Dispatch (`/dashboard/emergency` — `EmergencyPage.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** Life-safety emergency communication channel designed to operate even during power blackouts and mobile data outages.
- **Key Features:**
  - **Emergency Contact Management:** Add, edit, and delete family/guardian emergency contacts with name, phone number, and relationship. Persisted locally in IndexedDB (`db.emergencyContacts`).
  - **GPS Coordinate Acquisition:** Automatically queries device hardware geolocation (`navigator.geolocation`) with high accuracy enabled.
  - **Automated Dispatch Payload Construction:** Replaces template tokens `[GPS]`, `[LAT]`, and `[LNG]` with real-time decimal coordinates and an instant Google Maps navigation link (`https://maps.google.com/?q=LAT,LNG`).
  - **Native SMS Client Launch:** Launches device cellular messaging protocols via `sms:PHONE?body=PAYLOAD`, allowing transmission over basic 2G/GSM voice channels without mobile data (4G/5G).
  - **Transmission History & Audit Log:** Logs every triggered SOS event into IndexedDB (`db.emergencyMessages`) with timestamp, coordinates, and delivery status (`queued` $\rightarrow$ `sent`).

---

### 2.13 User Profile (`/dashboard/profile` — `ProfilePage.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** Account overview and user profile management.
- **Features:** Displays user avatar, display name, registered email address, account type (Authenticated vs. Demo Account), registration date, and Sign Out action.

---

### 2.14 Settings & Local Storage (`/dashboard/settings` — `SettingsPage.tsx`)
- **Status:** **Fully Implemented**
- **Purpose:** Personalization of notification preferences, measurement units, and local offline cache management.
- **Features:**
  - Notification toggles for Flood Alerts, Weather Alerts, Emergency Warnings, and Water Supply Updates.
  - Units toggle: Metric (Celsius, mm, km/h) vs. Imperial (Fahrenheit, inches, mph).
  - Data refresh cadence selector ($5\text{ min}$, $15\text{ min}$, $30\text{ min}$, $60\text{ min}$).
  - **Clear Offline Storage Button:** Safely purges cached telemetry and chat logs from IndexedDB (`Dexie`) to free device memory without deleting emergency contacts.

---

## 3. Dashboard Breakdown & Metrics Calculation

The Dashboard Overview aggregates data from multiple hydrological and meteorological endpoints. Below is the exact origin and mathematical formulation for every displayed metric:

```
+---------------------------------------------------------------------------------------------------+
|                                  AQUANET X DASHBOARD METRICS                                      |
+----------------------+--------------------+--------------------------------+----------------------+
| Metric Name          | Displayed Value    | Origin / Service               | Calculation Method   |
+----------------------+--------------------+--------------------------------+----------------------+
| Flood Risk Level     | Low / Moderate /   | /api/flood/predict             | SCS-CN Runoff + ML   |
|                      | High / Critical    | (mlInferenceService.js)        | IMD Rain Thresholds  |
+----------------------+--------------------+--------------------------------+----------------------+
| Flood Risk Index     | 0 to 100           | /api/flood/predict             | Calibrated Equation  |
|                      |                    | (mlInferenceService.js)        | (See Eq. 1 below)    |
+----------------------+--------------------+--------------------------------+----------------------+
| Water Stress         | 42% (or regional)  | /api/groundwater/quality       | CGWB Demand Ratio    |
|                      |                    | (mlInferenceService.js)        | Exceedance Sum / N   |
+----------------------+--------------------+--------------------------------+----------------------+
| Rainfall 24h         | e.g. 7.8 mm        | /api/weather                   | Open-Meteo Satellite |
|                      |                    | (weatherService.js)            | Hourly Sum (24h)     |
+----------------------+--------------------+--------------------------------+----------------------+
| Active Alerts        | e.g. 2 Active      | /api/alerts (Alert.js)         | MongoDB Active Count |
+----------------------+--------------------+--------------------------------+----------------------+
| Citizen Reports      | e.g. 4 Pending     | /api/reports                   | MongoDB + IndexedDB  |
+----------------------+--------------------+--------------------------------+----------------------+
| Recovery Potential   | e.g. 78%           | /dashboard/smart-recovery      | Catchment RWH Yield  |
+----------------------+--------------------+--------------------------------+----------------------+
```

### 3.1 Flood Risk Calculation Formula
In [`backend/services/mlInferenceService.js`](file:///backend/services/mlInferenceService.js), flood risk is calibrated against official India Meteorological Department (**IMD**) and Central Water Commission (**CWC**) inundation standards:

$$\text{Risk Index} = \begin{cases} 
\text{clamp}\left(5, 20, \text{round}\left(\frac{P_{24}}{15.0} \times 14\right) + 5\right) & \text{if } P_{24} < 15.0\text{ mm (Low)} \\
\text{round}\left(25 + \frac{P_{24} - 15.0}{20.5} \times 20\right) & \text{if } 15.0 \le P_{24} < 35.5\text{ mm (Moderate)} \\
\text{round}\left(50 + \frac{P_{24} - 35.5}{29.0} \times 24\right) & \text{if } 35.5 \le P_{24} < 64.5\text{ mm (High)} \\
\text{min}\left(100, \text{round}\left(75 + \frac{P_{24} - 64.5}{55.0} \times 25\right)\right) & \text{if } P_{24} \ge 64.5\text{ mm (Critical)}
\end{cases}$$

Where $P_{24}$ is the 24-hour cumulative rainfall in millimeters.

### 3.2 Soil Conservation Service Curve Number (SCS-CN) Runoff Physics
In [`backend/services/floodPredictionService.js`](file:///backend/services/floodPredictionService.js), surface runoff volume $Q$ is computed dynamically:
1. **Potential Maximum Retention ($S$):**
   $$S = \frac{25400}{CN} - 254 \quad (\text{in mm})$$
   *For urban commercial/residential soils, baseline Curve Number $CN = 82$.*
2. **Initial Abstraction ($I_a$):**
   $$I_a = 0.2 \times S$$
   *With $CN=82$, $S \approx 55.76\text{ mm}$ and $I_a \approx 11.15\text{ mm}$. Any rainfall below $11.15\text{ mm}$ is completely absorbed by the catchment.*
3. **Runoff Depth ($Q$):**
   $$Q = \begin{cases} 
   0 & \text{if } P \le I_a \\
   \frac{(P - I_a)^2}{P - I_a + S} & \text{if } P > I_a
   \end{cases}$$
4. **Antecedent Moisture Condition (AMC) Adjustment:**
   - **AMC-I (Dry, 5-day prior rain $< 15\text{mm}$):** $CN \leftarrow CN - 8$
   - **AMC-II (Normal, 5-day prior rain $15\text{--}40\text{mm}$):** $CN \leftarrow CN$
   - **AMC-III (Near-Saturation, 5-day prior rain $> 40\text{mm}$):** $CN \leftarrow CN + 7$

---

## 4. AI, Machine Learning & Hydrological Data Processing

AQUANET X employs a multi-tiered intelligence pipeline combining supervised machine learning, deterministic hydrological physics, and large language model generation.

```
+------------------------------------------------------------------------------------+
|                                AI & ML PIPELINE ARCHITECTURE                       |
+------------------------------------------------------------------------------------+
|                                                                                    |
|  [Raw Data Inputs]                                                                 |
|  ├── CWC Hourly Telemetry Rainfall (2021-2025) ---------> [Feature Engineering]   |
|  ├── CGWB 2024 Water Quality Report (15,177 Stns)          - Rolling rain: 1h, 3h  |
|  └── Open-Meteo Satellite Real-time API                    - Rolling rain: 6h, 24h |
|                                                            - Antecedent Index(API) |
|                                                                    │               |
|                                                                    ▼               |
|  [Trained ML Model: HistGradientBoosting] <────────────────────────┘               |
|  ├── Chronological Holdout Evaluation (Test: 2024-2025)                            |
|  ├── Evaluation Metrics: F1=0.998, Recall=0.9986, ROC-AUC=1.0                      |
|  └── Outputs: Calibrated Probability, Risk Category (Low/Mod/High/Crit)            |
|                                    │                                               |
|                                    ▼                                               |
|  [Hydrological Runoff Engine: SCS-CN Physics]                                      |
|  ├── Initial Abstraction (Ia = 11.15mm at CN=82)                                   |
|  └── Catchment Soil Moisture (AMC-I / AMC-II / AMC-III)                            |
|                                    │                                               |
|                                    ▼                                               |
|  [AQUA AI Context Assembly & Domain Boundary]                                      |
|  ├── Telemetry Injection (Temp, Rain 24h, Runoff Q, Nearest CWC Station)           |
|  ├── Multi-Key Failover Manager (4 Gemini API Keys, Round-Robin)                   |
|  └── Zero-Latency Local Fallback Heuristics (When Offline)                         |
|                                                                                    |
+------------------------------------------------------------------------------------+
```

### 4.1 Trained ML Model Details (`ml/train_flood_model.py`)
- **Algorithm:** `HistGradientBoostingClassifier` (Scikit-Learn).
- **Benchmark Comparisons:** Evaluated against `RandomForestClassifier` and `LogisticRegression`.
- **Training Dataset:** 31,274 observations from Central Water Commission (CWC) telemetry rainfall records spanning 2021 to 2025.
- **Validation Methodology:** **Strict Chronological Holdout Split** (No random cross-validation leakage):
  - *Training Set:* January 2021 to December 2023 ($25,423$ records).
  - *Testing Set:* January 2024 to December 2025 ($5,851$ records).
- **Holdout Test Set Results:**
  - **$F_1$-Score:** `0.998`
  - **Recall:** `0.9986` (Specially tuned high to eliminate catastrophic false negatives in disaster prediction)
  - **Precision:** `0.9975`
  - **ROC-AUC:** `1.0`
  - **Brier Score Loss:** `0.0012`
- **Model Artifacts Generated:**
  - `ml/model_artifacts/evaluation_report.json`: Precision, recall, confusion matrix, ROC-AUC.
  - `ml/model_artifacts/flood_model_params.json`: Feature weights, means, standard deviations, and decision thresholds.
  - `ml/model_artifacts/station_telemetry_summary.json`: Coordinates and baseline stats for all 27 CWC stations.

### 4.2 Gemini API Multi-Key Failover Manager (`backend/services/geminiKeyManager.js`)
To guarantee uninterrupted AI uptime under free-tier quota constraints (15 RPM / 1 million TPM limits), AQUANET X implements an autonomous multi-key failover manager:
1. **Key Loading:** Loads up to 4 distinct Gemini API keys (`GEMINI_API_KEY_1` to `GEMINI_API_KEY_4`) from `.env`.
2. **Round-Robin Execution:** Rotates requests across active keys to balance token consumption.
3. **Exponential Cooldown:** If a key returns `429 (Resource Exhausted)` or `503 (High Demand)`, it is automatically placed in a 60-second cooldown, and the request immediately fails over to the next healthy key without dropping the user's connection.
4. **Candidate Model Hierarchy:** Tries `gemini-3-flash-preview` $\rightarrow$ `gemini-3.5-flash` $\rightarrow$ `gemini-3.5-flash-lite`.
5. **Execution Timeout Wrapper:** Enforces a 70-second `Promise.race` timeout on SDK calls to eliminate indefinite hanging.
6. **Chat History Normalization:** Google Gemini SDK strictly enforces that chat history arrays must begin with the role `user`. The manager sanitizes the sliced history to strip leading model turns before dispatching.

---

## 5. Dataset Documentation & Provenance

All raw and preprocessed datasets reside in the [`Datasets/`](file:///Datasets/) and [`ml/model_artifacts/`](file:///ml/model_artifacts/) directories.

```
Datasets/
├── CGWB_GWQ_2024.pdf                    # Official CGWB Water Quality Report (3.1 MB)
├── processed_cgwb_gwq_2024.json         # Extracted 15,177 Station Database (7.9 MB)
├── rainfall_tel_hr_cwc_ap_2021_2025.csv # CWC Hourly Telemetry Records (5.4 MB)
└── dataset.zip                          # Compressed Archive
```

### 5.1 Central Water Commission (CWC) Hourly Telemetry Rainfall
- **Filename:** `Datasets/rainfall_tel_hr_cwc_ap_2021_2025.csv`
- **Source:** Central Water Commission (CWC), Ministry of Jal Shakti, Government of India.
- **Coverage:** 27 river gauge telemetry stations across Andhra Pradesh and Telangana (Krishna and Godavari Basins).
- **Time Range:** 2021 to 2025 ($31,274$ hourly observations).
- **Key Columns:**
  - `Station`: Station name (e.g., Srisailam, Nagarjuna Sagar, Hyderabad Musi).
  - `Data Acquisition Time`: DD-MM-YYYY HH:MM timestamp.
  - `Telemetry Hourly Rainfall (mm)`: Recorded precipitation gauge reading.
  - `Latitude`, `Longitude`: Geographic coordinates.
  - `Basin`, `District`: Hydrological and administrative boundaries.
- **Preprocessing Pipeline:** Executed by [`ml/train_flood_model.py`](file:///ml/train_flood_model.py). Strips negative anomalies, parses chronological ISO timestamps, interpolates missing values, and computes rolling cumulative windows ($1\text{h}$, $3\text{h}$, $6\text{h}$, $24\text{h}$, $72\text{h}$) and Antecedent Precipitation Index ($API$).
- **Current Status:** **Fully Processed & Integrated into Active ML Model.**

### 5.2 Central Ground Water Board (CGWB) 2024 Groundwater Quality Report
- **Filename:** `Datasets/CGWB_GWQ_2024.pdf` $\rightarrow$ `Datasets/processed_cgwb_gwq_2024.json`
- **Source:** Central Ground Water Board (CGWB), Department of Water Resources, Government of India (Published 2024).
- **Coverage:** 15,177 monitoring stations across all 37 Indian states and Union Territories.
- **Parameters Extracted:**
  - Physical: pH, Electrical Conductivity ($EC$), Total Dissolved Solids ($TDS$).
  - Chemical Ions: Fluoride ($F^-$), Nitrate ($NO_3^-$), Total Hardness ($TH$), Calcium ($Ca^{2+}$), Magnesium ($Mg^{2+}$), Chloride ($Cl^-$), Sulphate ($SO_4^{2-}$).
  - Trace Contaminants: Arsenic ($As$), Iron ($Fe$), Uranium ($U$).
- **Preprocessing Pipeline:** Executed by [`ml/process_groundwater.py`](file:///ml/process_groundwater.py) using `pypdf` layout-aware coordinate extraction. Cleaned missing flags (`BDL`, `ND`, `Nil`), normalized location hierarchies, evaluated limits against **BIS IS 10500:2012**, and assigned Water Quality Ratings (`Safe`, `Moderate Stress`, `Critical Stress`).
- **Current Status:** **Fully Processed & Active in Water Stress API.**

### 5.3 Open-Meteo Satellite & Meteorological Reanalysis Feed
- **Source:** Open-Meteo Historical & Live Forecast API (combining ECMWF IFS, DWD ICON, and GFS data).
- **Format:** Dynamic JSON stream.
- **Usage:** Ingested in real time by [`backend/services/weatherService.js`](file:///backend/services/weatherService.js) based on active user coordinates.

---

## 6. System Architecture & End-to-End Data Flow

AQUANET X operates as a decoupled, multi-tier system with shared routing under Vercel Services.

```mermaid
flowchart TD
    subgraph CLIENT["Client Browser / Mobile PWA"]
        UI["React 18 + TypeScript + Vite UI"]
        DEXIE["Dexie.js (IndexedDB Cache)\n- Emergency Contacts\n- Pending Incident Reports\n- Chat History & Telemetry"]
        GEO["Device Hardware GPS\nnavigator.geolocation"]
        SMS["Native SMS Client\nsms:PHONE?body=PAYLOAD"]
    end

    subgraph ROUTING["Vercel Multi-Service Router (vercel.json)"]
        REV_FRONT["Rewrite: /(.*) -> Frontend Service"]
        REV_API["Rewrite: /api/(.*) -> Backend Service"]
    end

    subgraph BACKEND["Node.js / Express Backend Engine"]
        SRV["Express REST API (server.js)"]
        AUTH_MID["Firebase Admin Auth Middleware"]
        WEATHER_SRV["Weather Service (Open-Meteo Client)"]
        FLOOD_SRV["SCS-CN Runoff Physics Engine"]
        ML_SRV["ML Inference Service\n(HistGradientBoosting Artifacts)"]
        GEMINI_MGR["Gemini Key Manager\n(4-Key Round-Robin Failover)"]
    end

    subgraph DATASTORES["Databases & External Cloud Services"]
        MONGO[("MongoDB Atlas Cloud\n- Alerts Collection\n- CitizenReports Collection\n- UserProfiles Collection\n- EmergencyContacts Collection")]
        FIREBASE["Firebase Authentication\n(Google OAuth & Email/Pass)"]
        GEMINI_API["Google Gemini 1.5 / Flash AI API"]
        METEO_API["Open-Meteo Global Weather Telemetry"]
        DATA_FILES[("Local Dataset Artifacts\n- processed_cgwb_gwq_2024.json\n- flood_model_params.json\n- station_telemetry_summary.json")]
    end

    %% Client Interactions
    UI <--> DEXIE
    UI --> GEO
    UI --> SMS
    UI -- "HTTPS API Requests" --> ROUTING

    %% Routing
    ROUTING -- "/api/*" --> SRV
    ROUTING -- "/*" --> UI

    %% Backend Services
    SRV --> AUTH_MID
    AUTH_MID -. "Verify JWT" .-> FIREBASE
    SRV --> WEATHER_SRV
    SRV --> FLOOD_SRV
    SRV --> ML_SRV
    SRV --> GEMINI_MGR
    SRV <--> MONGO

    %% External APIs & Data Files
    WEATHER_SRV -- "Fetch live rainfall & temp" --> METEO_API
    ML_SRV -- "Load model weights & CGWB data" --> DATA_FILES
    FLOOD_SRV -- "SCS-CN curve calibration" --> WEATHER_SRV
    GEMINI_MGR -- "Injected live telemetry prompt" --> GEMINI_API
```

---

## 7. Technology Stack & Component Justification

| Layer | Technology | Purpose & Justification |
|---|---|---|
| **Frontend Framework** | **React 18.3 + TypeScript** | Component-based, strictly typed UI architecture for reliable state and prop contracts across complex dashboard views. |
| **Build Tooling** | **Vite 8.3** | Near-instant Hot Module Replacement (HMR) and optimized Rollup-based production chunking. |
| **Styling & Design** | **Global CSS + Glassmorphism** | High-performance CSS design tokens with custom frosted glass (`backdrop-filter: blur`), dark-mode ocean palettes, and mobile media queries. |
| **Client Database** | **Dexie.js (IndexedDB)** | Robust client-side database enabling full offline-first functionality for incident reports, emergency contacts, and chat history. |
| **Geospatial Mapping** | **Leaflet 1.9 + React-Leaflet** | Lightweight, open-source tile cartography without restrictive commercial API billing keys. |
| **Icons & Visuals** | **Lucide React** | Clean, accessible SVG iconography. |
| **Backend Runtime** | **Node.js (v18+) + Express** | Asynchronous, non-blocking REST API server handling concurrent telemetry requests and ML inferences. |
| **Cloud Database** | **MongoDB Atlas + Mongoose** | Flexible document datastore for citizen incident reports, alerts, and user profiles with automatic schema validation. |
| **Authentication** | **Firebase Auth + Admin SDK** | Secure token-based authentication supporting Google OAuth popups and email/password accounts with server-side JWT verification. |
| **Artificial Intelligence** | **Google Gemini API (`@google/generative-ai`)** | Deep multimodal large language model powering AQUA AI with domain-specific hydrological prompts. |
| **Machine Learning** | **Scikit-Learn (Python 3.10+)** | Training HistGradientBoosting classifiers, computing metrics, and exporting parameter matrices for Node.js inference. |
| **Hydrological Modeling** | **USDA SCS-CN Curve Number** | Deterministic physics formula for accurate rainfall-to-runoff depth conversion. |
| **Cloud Deployment** | **Vercel Multi-Service Platform** | Unified monorepo hosting both the Vite frontend and Express backend under a single production domain with shared routing. |

---

## 8. Database Architecture & Data Storage

AQUANET X employs a **hybrid storage strategy**: MongoDB Atlas handles centralized multi-user cloud data, while Dexie (IndexedDB) manages offline-first client persistence.

### 8.1 MongoDB Atlas Schemas (`backend/models/`)

#### 1. `CitizenReport` Schema ([`backend/models/CitizenReport.js`](file:///backend/models/CitizenReport.js))
```javascript
{
  description:   { type: String, required: true },
  category:      { type: String, enum: ['Flooding', 'Waterlogging', 'Drainage Blockage', 
                                        'Water Shortage', 'Contaminated Water', 
                                        'Damaged Infrastructure', 'Other'], default: 'Flooding' },
  severity:      { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  location: {
    lat:         { type: Number, required: true },
    lon:         { type: Number, required: true },
    address:     { type: String, default: 'Unspecified location' }
  },
  photoUrl:      { type: String, default: null },
  status:        { type: String, enum: ['submitted', 'verified', 'dispatched', 'resolved'], default: 'submitted' },
  reporter: {
    uid:         { type: String, default: null },
    name:        { type: String, default: 'Anonymous Citizen' }
  },
  localReportId: { type: String, index: true }, // Deduplication key for offline sync
  createdAt:     { type: Date, default: Date.now },
  verifiedAt:    { type: Date, default: null }
}
```

#### 2. `Alert` Schema ([`backend/models/Alert.js`](file:///backend/models/Alert.js))
```javascript
{
  title:          { type: String, required: true },
  severity:       { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  type:           { type: String, enum: ['Flood', 'Weather', 'Water Shortage', 'Infrastructure', 'Emergency'], default: 'Flood' },
  location:       { type: String, required: true },
  source:         { type: String, default: 'Hydrological & Disaster Management Network' },
  description:    { type: String, required: true },
  recommendation: { type: String, required: true },
  active:         { type: Boolean, default: true },
  createdAt:      { type: Date, default: Date.now },
  expiresAt:      { type: Date, default: null }
}
```

#### 3. `EmergencyContact` Schema ([`backend/models/EmergencyContact.js`](file:///backend/models/EmergencyContact.js))
```javascript
{
  userId:      { type: String, required: true, index: true },
  name:        { type: String, required: true },
  phone:       { type: String, required: true },
  relationship:{ type: String, default: 'Family' },
  isPrimary:   { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now }
}
```

#### 4. `UserProfile` Schema ([`backend/models/UserProfile.js`](file:///backend/models/UserProfile.js))
```javascript
{
  uid:                     { type: String, required: true, unique: true, index: true },
  email:                   String,
  displayName:             String,
  defaultLocation: {
    name:                  { type: String, default: 'Hyderabad, Telangana, India' },
    lat:                   { type: Number, default: 17.3850 },
    lon:                   { type: Number, default: 78.4867 }
  },
  onboardingComplete:      { type: Boolean, default: false },
  notificationPreferences: {
    floodAlerts:           { type: Boolean, default: true },
    weatherAlerts:         { type: Boolean, default: true },
    emergencyAlerts:       { type: Boolean, default: true },
    waterAlerts:           { type: Boolean, default: false }
  },
  createdAt:               { type: Date, default: Date.now },
  updatedAt:               { type: Date, default: Date.now }
}
```

### 8.2 Client-Side IndexedDB Tables (`frontend/src/db.ts`)
Dexie database version 1 (`AquaNetX`):
- `citizenReports`: `'++id, serverId, userId, status, createdAt'`
- `emergencyContacts`: `'++id, userId'`
- `emergencyMessages`: `'++id, userId, status, createdAt'`
- `cachedData`: `'++id, key, expiresAt'`
- `chatMessages`: `'++id, sessionId, createdAt'`
- `userPreferences`: `'++id, userId, key'`

---

## 9. Complete End-to-End User Workflows

### 9.1 User Registration & Login Workflow
1. User navigates to `/login` or `/register`.
2. User enters credentials or clicks **"Sign in with Google"**.
3. Firebase executes authentication. On success, `AuthContext` receives the Firebase user object, extracts UID, email, and display name, and sets `user` state.
4. If the user clicks **"Continue as Guest / Demo"**, `demoLogin()` creates an in-memory session (`uid: 'demo-user-001'`), sets `localStorage.setItem('aquanetx_demo_session', '1')`, and grants instant dashboard access.
5. `ProtectedRoute` validates the user and mounts [`DashboardLayout.tsx`](file:///frontend/src/pages/dashboard/DashboardLayout.tsx).

### 9.2 Flood Risk Inundation Assessment Workflow
1. User opens `/dashboard/floodsense`.
2. Component reads active coordinates (e.g., Hyderabad `17.3850, 78.4867`).
3. Makes parallel requests to:
   - `GET /api/flood/predict?lat=17.3850&lon=78.4867`: Calls `mlInferenceService.js` $\rightarrow$ checks current 24h rainfall $\rightarrow$ evaluates calibrated equations $\rightarrow$ returns risk level, probability, and operational advisory.
   - `GET /api/ml/metrics`: Returns champion model training benchmarks.
   - `GET /api/ml/stations`: Returns nearest CWC river gauges.
4. Leaflet map renders risk circles colored by severity.
5. If the user moves the **Surge Simulator Slider** to $+45\text{mm}$, the client instantly simulates precipitation surge, recalculating SCS-CN runoff and dynamically shifting map circles from Green to Orange/Red.

### 9.3 Citizen Incident Submission & Offline Synchronization Workflow
1. User encounters standing water on an underpass and opens `/dashboard/citizen-reports`.
2. Clicks **"+ New Incident Report"**, selects Category (`Waterlogging`), Severity (`High`), and enters description.
3. Clicks **"Detect GPS"** $\rightarrow$ browser captures device latitude and longitude.
4. User clicks **"Submit Report"**:
   - Report is saved immediately to IndexedDB `db.citizenReports`.
   - **If Online:** Dispatches `POST /api/reports` with Firebase auth token. The server persists the report in MongoDB Atlas. Status marks `received`.
   - **If Offline:** Network failure is caught gracefully. Report remains in IndexedDB with status `pending_local`. The global connectivity bar displays an incremented pending sync badge.
   - When network connectivity returns (`window.addEventListener('online')`), the queue is flushed and synchronized with the backend.

### 9.4 Emergency SOS Transmission Workflow
1. User navigates to `/dashboard/emergency`.
2. Adds emergency contacts (e.g., Parent, Spouse) with verified telephone numbers. Saved to IndexedDB.
3. In a disaster event, user presses the large red **"TRANSMIT EMERGENCY SOS"** button.
4. System queries hardware GPS via `navigator.geolocation.getCurrentPosition()`.
5. Compiles payload:  
   `"EMERGENCY! I may need assistance. My current location is: 17.38501, 78.48672. Map: https://maps.google.com/?q=17.38501,78.48672. Please contact me immediately. — AQUANET X Emergency"`
6. For each contact:
   - Queues record in IndexedDB `db.emergencyMessages`.
   - Triggers native cellular intent: `window.open("sms:+919876543210?body=...", "_blank")`.
   - Device messaging client opens with pre-filled message ready to transmit over GSM without cellular data.
   - Updates local record status to `sent`.

### 9.5 AQUA AI Conversational Workflow
1. User enters question in `/dashboard/aqua-ai`: *"What is our flood risk right now?"*
2. Frontend gathers the last 6 messages from IndexedDB for conversation memory.
3. Dispatches `POST /api/ai/chat` with message, coordinates, and conversation history.
4. Backend fetches live weather from Open-Meteo, calculates current SCS-CN runoff, and constructs a telemetry block:
   ```
   [REAL-TIME OPERATIONAL TELEMETRY FEED FOR HYDERABAD]:
   - Temperature: 28°C
   - 24h Precipitation: 7.8 mm
   - Hydrological Flood Risk: Low (Index: 12/100)
   - Initial Soil Abstraction: Precipitation (7.8mm) completely absorbed by soil (CN=82, Ia=11.1mm); Runoff is 0.0 mm.
   ```
5. `geminiKeyManager.js` routes prompt to an active Gemini API key.
6. Returns analytical response explaining both the meteorological status and the hydrological physics.
7. Frontend renders response via custom markdown parser and appends message to IndexedDB.
8. *(If offline or timed out)*: Triggers verified local safety heuristic immediately.

---

## 10. Comprehensive REST API Documentation

All backend endpoints are implemented in [`backend/server.js`](file:///backend/server.js).

### 10.1 System Health
- **Endpoint:** `GET /api/health`
- **Auth:** None (Public)
- **Response:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-11-03T02:19:35.000Z",
    "uptime": 1420.5,
    "services": {
      "database": "connected",
      "aiEngine": "configured",
      "weatherService": "active",
      "mlInferenceEngine": "active"
    }
  }
  ```

### 10.2 Live Weather Telemetry
- **Endpoint:** `GET /api/weather`
- **Auth:** None (Public)
- **Query Parameters:**
  - `lat` (float, optional, default: `17.3850`)
  - `lon` (float, optional, default: `78.4867`)
  - `name` (string, optional, default: `'Hyderabad, Telangana, India'`)
- **Response Structure:** Current temperature, apparent temperature, humidity, wind speed, pressure, 24h precipitation sum, 7-day daily forecast, and 24-hour hourly timeline.

### 10.3 Flood Risk & Runoff Prediction
- **Endpoint:** `GET /api/flood/predict`
- **Auth:** None (Public)
- **Query Parameters:** `lat`, `lon`, `rain24h` (optional override)
- **Response:**
  ```json
  {
    "location": { "lat": 17.385, "lon": 78.4867 },
    "featuresUsed": { "rain24hMm": 7.8, "rain1hMm": 0, "apiIndex": 12 },
    "mlEngine": {
      "riskIndex": 12,
      "riskLevel": "Low",
      "riskColor": "#16A34A",
      "calibratedProbability": 0.12,
      "recommendation": "Routine telemetry: Normal drainage flow. Zero flood or waterlogging risk detected across monitored urban basins."
    },
    "physicsEngine": {
      "runoffMm": 0.0,
      "curveNumber": 82,
      "initialAbstractionMm": 11.15,
      "soilCondition": "Moderate moisture (AMC-II)"
    }
  }
  ```

### 10.4 Machine Learning Benchmarks & Stations
- **Endpoint:** `GET /api/ml/metrics`
  - **Response:** Champion model evaluation metrics ($F_1$, precision, recall, ROC-AUC, confusion matrix).
- **Endpoint:** `GET /api/ml/stations`
  - **Response:** Array of 27 CWC telemetry stations with coordinates and recorded precipitation.

### 10.5 Groundwater Quality & Potability
- **Endpoint:** `GET /api/groundwater/quality`
- **Auth:** None (Public)
- **Query Parameters:**
  - `state` (string, e.g. `'Telangana'`, `'All'`)
  - `search` (string, optional)
  - `lat`, `lon` (float, optional — triggers distance sorting)
  - `limit` (integer, default: `50`)
- **Response:** Summary statistics (Average TDS, Fluoride exceedance %, Nitrate exceedance %, Potable count) and array of station objects evaluated against BIS IS 10500.

### 10.6 AQUA AI Chat Endpoint
- **Endpoint:** `POST /api/ai/chat`
- **Auth:** Bearer Token (Optional — falls back to demo mode)
- **Request Body:**
  ```json
  {
    "message": "Is Hyderabad at risk of flooding right now?",
    "location": { "name": "Hyderabad", "lat": 17.385, "lon": 78.4867 },
    "history": [
      { "role": "user", "content": "Hello" },
      { "role": "assistant", "content": "Hello! I am AQUA AI." }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "response": "Based on live telemetry for Hyderabad...",
    "keyUsed": "key_1",
    "model": "gemini-3-flash-preview",
    "isLive": true,
    "telemetryAttached": { "location": "Hyderabad", "temp": 28, "rain24h": 7.8 }
  }
  ```

### 10.7 Citizen Incident Reports
- **Endpoint:** `GET /api/reports`
  - **Response:** Array of submitted reports from MongoDB Atlas sorted by `createdAt` descending.
- **Endpoint:** `POST /api/reports`
  - **Auth:** Required (Bearer JWT or Demo)
  - **Request Body:** `description`, `category`, `severity`, `location: { lat, lon, address }`, `localReportId`.
  - **Response:** Created report object with assigned MongoDB `_id`.

### 10.8 Emergency Contacts
- **Endpoints:**
  - `GET /api/emergency/contacts`: Lists contacts for authenticated user.
  - `POST /api/emergency/contacts`: Creates new contact.
  - `DELETE /api/emergency/contacts/:id`: Removes contact by ID.

### 10.9 Active Alerts
- **Endpoint:** `GET /api/alerts`
- **Auth:** None (Public)
- **Response:** Array of active hydrological, weather, and municipal disruption advisories.

### 10.10 User Profile
- **Endpoints:**
  - `GET /api/user/profile`: Fetches stored profile and notification preferences.
  - `PUT /api/user/profile`: Updates display name, default coordinates, and preferences.

---

## 11. Project Directory & File Structure

```
datanyx/
├── backend/                              # Express REST API Server
│   ├── models/                           # Mongoose MongoDB Schemas
│   │   ├── Alert.js                      # Flood, weather & infrastructure alerts
│   │   ├── CitizenReport.js              # Crowdsourced incident reports
│   │   ├── EmergencyContact.js           # User emergency response contacts
│   │   └── UserProfile.js                # Profile settings & notification prefs
│   ├── services/                         # Core Hydrological & AI Business Logic
│   │   ├── floodPredictionService.js     # SCS-CN runoff physics & AMC engine
│   │   ├── geminiKeyManager.js           # 4-Key failover manager for Gemini AI
│   │   ├── mlInferenceService.js         # Real-time HistGradientBoosting inference
│   │   └── weatherService.js             # Open-Meteo satellite weather client
│   ├── firebaseAdmin.js                  # Firebase Admin SDK initialization
│   ├── package.json                      # Backend dependencies & start scripts
│   └── server.js                         # Main Express application entrypoint
│
├── Datasets/                             # Raw & Preprocessed Hydrological Data
│   ├── CGWB_GWQ_2024.pdf                 # Government of India CGWB Water Quality Report
│   ├── processed_cgwb_gwq_2024.json      # 15,177 Parsed monitoring stations
│   └── rainfall_tel_hr_cwc_ap_2021_2025.csv # CWC Hourly Telemetry Rainfall (31k rows)
│
├── frontend/                             # React 18 + TypeScript + Vite Client
│   ├── public/                           # Static assets, PWA icons, Favicons
│   │   ├── favicon.png                   # AQUANET X droplet circuit logo
│   │   ├── manifest.json                 # PWA Web App Manifest
│   │   └── sw.js                         # Service worker for offline caching
│   ├── src/
│   │   ├── components/                   # Shared UI Components
│   │   │   └── OnboardingMascot.tsx      # AQUA AI 10-step guided tour mascot
│   │   ├── contexts/                     # React Context Providers
│   │   │   ├── AuthContext.tsx           # Firebase & Guest authentication state
│   │   │   └── ConnectivityContext.tsx   # Online/Offline network state listener
│   │   ├── pages/                        # View Pages
│   │   │   ├── auth/                     # Authentication Views
│   │   │   │   ├── ForgotPasswordPage.tsx
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── dashboard/                # Authenticated Dashboard Views
│   │   │   │   ├── AlertsPage.tsx        # Municipal warnings & advisories
│   │   │   │   ├── AquaAIPage.tsx        # Hydrological AI conversational assistant
│   │   │   │   ├── CitizenReportsPage.tsx# Crowdsourced incident reporting & sync
│   │   │   │   ├── DashboardLayout.tsx   # Responsive layout shell & topbar
│   │   │   │   ├── DashboardOverview.tsx # Executive metrics command center
│   │   │   │   ├── EmergencyPage.tsx     # One-tap SOS & cellular SMS dispatch
│   │   │   │   ├── FloodSensePage.tsx    # Leaflet map & storm surge simulator
│   │   │   │   ├── ProfilePage.tsx       # User account details
│   │   │   │   ├── SettingsPage.tsx      # Notification preferences & cache clear
│   │   │   │   ├── SmartRecoveryPage.tsx # RWH yield calculator & subsidy registry
│   │   │   │   ├── WaterStressPage.tsx   # 15k CGWB groundwater quality index
│   │   │   │   └── WeatherPage.tsx       # Real-time satellite weather analysis
│   │   │   └── LandingPage.tsx           # Public WebGL ocean & boid landing page
│   │   ├── App.tsx                       # React Router route declarations
│   │   ├── db.ts                         # Dexie.js (IndexedDB) offline schema
│   │   ├── firebase.ts                   # Client Firebase SDK configuration
│   │   ├── index.css                     # Global styles, variables & media queries
│   │   └── main.tsx                      # Vite React application mounting
│   ├── package.json                      # Frontend dependencies
│   ├── tsconfig.json                     # TypeScript compiler configuration
│   └── vite.config.ts                    # Vite build & development proxy config
│
├── ml/                                   # Python Machine Learning Pipelines
│   ├── model_artifacts/                  # Exported JSON Model Weights & Reports
│   │   ├── evaluation_report.json        # Test set metrics (F1, Recall, ROC-AUC)
│   │   ├── flood_model_params.json       # Feature coefficients & weights
│   │   ├── groundwater_quality_summary.json # CGWB regional summary
│   │   └── station_telemetry_summary.json   # CWC station coordinates & stats
│   ├── process_groundwater.py            # PDF extraction pipeline for CGWB 2024
│   └── train_flood_model.py              # HistGradientBoosting training script
│
├── GUIDE.md                              # Complete Engineering & System Guide
├── README.md                             # Repository introduction
└── vercel.json                           # Vercel Multi-Service deployment config
```

---

## 12. Local Setup, Environment & Deployment Guide

### 12.1 Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Python (Optional, for retraining ML):** Python 3.10+ with `pandas`, `numpy`, `scikit-learn`, `pypdf`
- **Git**

### 12.2 Clone & Dependency Installation
```bash
# Clone the repository
git clone https://github.com/hyderadnanshaik-cyber/aquanetx.git
cd aquanetx

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 12.3 Environment Variable Setup
Create `.env` files in both `backend/` and `frontend/` using the templates below.

#### Backend `.env` (`backend/.env`):
```ini
# Server Configuration
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173

# MongoDB Atlas Database URI
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/aquanetx?retryWrites=true&w=majority

# Google Gemini API Multi-Key Failover
GEMINI_API_KEY_1=your_first_gemini_api_key
GEMINI_API_KEY_2=your_second_gemini_api_key
GEMINI_API_KEY_3=your_third_gemini_api_key
GEMINI_API_KEY_4=your_fourth_gemini_api_key
GEMINI_MODEL=gemini-3-flash-preview

# Optional: Firebase Admin Credentials (for server-side token verification)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

#### Frontend `.env` (`frontend/.env`):
```ini
# Firebase Web Client Configuration
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend Base URL (Empty for relative proxy in dev and Vercel production)
VITE_API_BASE_URL=
```

### 12.4 Running the Application Locally
In two separate terminal windows:

```bash
# Terminal 1: Start Backend (Port 4000)
cd backend
npm start
# Output: [AQUANET X] Backend running on port 4000

# Terminal 2: Start Frontend (Port 5173)
cd frontend
npm run dev
# Output: Local: http://localhost:5173/
```

Open `http://localhost:5173` in any modern web browser.

### 12.5 Production Build Check
```bash
cd frontend
npm run build
# Compiles TypeScript and builds optimized static assets into frontend/dist/
```

### 12.6 Deploying to Vercel (Multi-Service Project)
AQUANET X is pre-configured with [`vercel.json`](file:///vercel.json) to deploy both the Express API and Vite React frontend as a unified Vercel Project:
1. In the Vercel Dashboard, select **Add New Project** $\rightarrow$ Import `hyderadnanshaik-cyber/aquanetx`.
2. Under Application Preset, choose **Services**.
3. In the Environment Variables settings, configure:
   - `MONGODB_URI`
   - `GEMINI_API_KEY_1` to `GEMINI_API_KEY_4`
   - `ALLOWED_ORIGINS` (set to your Vercel URL, e.g. `https://aquanetx.vercel.app`)
   - `VITE_FIREBASE_*` credentials
4. Click **Deploy**. Vercel will automatically route `/api/*` to the Express backend and all other routes to the Vite frontend.

---

## 13. Current Implementation Status Matrix

| Component / Feature | Implementation Status | Technical Details & Verification |
|---|---|---|
| **Landing Page WebGL Environment** | **Fully Implemented** | Custom GLSL fragment shader caustics + 2D Boid swarm simulation canvas. |
| **User Authentication** | **Fully Implemented** | Firebase Auth (Email/Pass + Google OAuth) + Guest Demo session fallback. |
| **Dashboard Shell & Location Switcher** | **Fully Implemented** | GPS locator, city presets, Open-Meteo reverse geocoder, and responsive drawer. |
| **FloodSense Interactive Map** | **Fully Implemented** | Leaflet radar map with layer toggles (Risk Zones, Rainfall Feeds, CWC Gauges). |
| **Storm Surge Simulation Bar** | **Fully Implemented** | Client-side recalculation of SCS-CN runoff volume and IMD inundation thresholds. |
| **Flood ML Model (HistGradientBoosting)** | **Fully Implemented** | Trained on 31,274 CWC telemetry records ($F_1 = 0.998$, Holdout Recall $= 0.9986$). |
| **Water Stress & Groundwater Index** | **Fully Implemented** | 15,177 CGWB stations parsed, BIS IS 10500 compliance, nearest station distance sorting. |
| **Smart Recovery & RWH Calculator** | **Fully Implemented** | Annual yield formula based on roof area, rainfall, and material runoff coefficient. |
| **Citizen Incident Reporting** | **Fully Implemented** | Dual-write to IndexedDB (`Dexie`) and MongoDB Atlas with offline sync support. |
| **Emergency SOS Dispatch** | **Fully Implemented** | Hardware GPS acquisition + native `sms:` protocol generation for offline dispatch. |
| **Live Weather Analysis** | **Fully Implemented** | Live WMO telemetry stream from Open-Meteo API (temperature, rain, wind, pressure). |
| **AQUA AI Assistant** | **Fully Implemented** | Gemini AI with 4-key failover manager, live telemetry injection, and local fallback. |
| **PWA & Offline Service Worker** | **Fully Implemented** | `manifest.json` and `sw.js` configured for app installation and asset caching. |
| **Automated IoT Hardware Telemetry** | **Planned (Future)** | Direct MQTT/LoRaWAN sensor integration for physical culvert water level probes. |
| **Satellite SAR Flood Extent Mapping** | **Planned (Future)** | Integration of Sentinel-1 Synthetic Aperture Radar (SAR) raster overlays. |

---

## 14. Roadmap & Future Scope

While AQUANET X delivers an operational full-stack hydrological platform, the following architectural expansions are planned for future major releases:

1. **Physical IoT Sensor Ingestion (LoRaWAN / MQTT):**
   - Deploy ultrasonic water-level sensors and tipping-bucket rain gauges in vulnerable urban underpasses.
   - Stream telemetry directly into the backend using an MQTT broker to supplement satellite forecasts with real-time millimeter road pooling data.
2. **Sentinel-1 SAR Satellite Imagery Pipeline:**
   - Ingest European Space Agency (ESA) Sentinel-1 Synthetic Aperture Radar (SAR) imagery during monsoon events to perform automated water-surface thresholding and map active inundation extents regardless of cloud cover.
3. **Automated Reverse-Geocoded SMS Gateway:**
   - Integrate an automated SMS gateway (e.g., Twilio / Fast2SMS) on the server side so that when an emergency SOS is triggered by an online user, the server can dispatch automated SMS notifications and voice calls simultaneously.
4. **Hydrodynamic Digital Elevation Modeling (DEM):**
   - Incorporate high-resolution 1-meter LiDAR or Cartosat Digital Surface Models (DSM) to compute 2D shallow water flow equations (Saint-Venant equations) for street-by-street hydraulic routing.
5. **Decentralized Neighborhood Mesh Networks:**
   - Explore WebRTC / Bluetooth Low Energy (BLE) peer-to-peer mesh synchronization between nearby mobile devices to propagate emergency citizen reports even when cell towers are disabled.

---

*Document compiled and verified against codebase source on November 3, 2026.*  
*Maintained by the AQUANET X Core Development Team.*
