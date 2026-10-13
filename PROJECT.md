# EIRS - Emergency Infrastructure Reporting System
> **College Project Specification & Architectural Blueprint**

---

## 1. Project Overview
**EIRS (Emergency Infrastructure Reporting System)** is a centralized full-stack civic emergency reporting platform.
Citizens report urban infrastructure hazards (potholes, fallen trees, electrical hazards, water leakages, drainage issues, etc.) in real time.
To prevent fraud and maintain operational integrity, reports require **live in-browser camera capture with GPS watermarking** and **high-accuracy geolocation verification (< 100m)**.
Reports are **automatically assigned** to corresponding municipal departments. When multiple citizens report the same emergency within 50 meters, the system prevents duplicate tickets by automatically appending the citizen's photo and coordinates into a **collaborative confirmations array**, incrementing the incident priority and notifying all involved citizens.

---

## 2. Core Entities & Business Logic

### Roles & Access Control

- **`citizen`**:
  - Registers and authenticates securely.
  - Submits emergency reports using **live camera capture only** (no gallery file upload permitted).
  - High-accuracy GPS verification (< 100m accuracy required; read-only location detection with Nominatim reverse geocoding).
  - Canvas watermarking stamps real-time timestamp and GPS coordinates directly onto the photo.
  - **Collaborative Duplicate Resolution:** If an identical incident exists within 50m, the citizen is added to `reportedBy`, their photo is recorded in `confirmations`, and they receive full live tracking access without generating duplicate clutter.
  - Views personal and linked reports in **My Reports**, receives notifications on status transitions, and submits 1–5 star ratings and reviews upon resolution.

- **`department`** (dedicated accounts: Road, Water, Electricity, Drainage, Tree, Fire, Sanitation):
  - Accesses a **Department Dashboard** displaying only reports assigned to their department.
  - Views KPI cards: New (Assigned), In Progress, Resolved, Critical.
  - Inspects assigned reports on an interactive Leaflet map and filterable table.
  - Updates status (`Assigned` ➔ `In Progress` ➔ `Resolved`), attaches field notes, and uploads a "resolved proof" photo.
  - Every status change triggers notifications to all citizens linked to that report and records a step in `statusHistory`.

- **`admin`**:
  - Centralized municipal oversight with system-wide KPI counters and Chart.js analytics.
  - Monitors all reports on a master interactive map (Leaflet + OpenStreetMap).
  - Triage handler: Manages unassigned/`Pending` reports (e.g. Traffic Signal, Bridge, Accident, Other).
  - Overrides routing: Reassigns misclassified reports to the appropriate department.
  - Evaluates department performance (average resolution time, resolution percentage).
  - Creates and manages department accounts.

---

## 3. Anti-Fraud & Verification Rules

1. **Live Camera Only:**
   - Captured exclusively via `navigator.mediaDevices.getUserMedia` (`facingMode: "environment"`).
   - No file inputs, file dialogs, or gallery pickers.
   - Captured frame is rendered to an HTML5 canvas and watermarked with:
     - ISO / Local Date & Time
     - Exact Latitude, Longitude, and GPS Accuracy (±Xm)
   - Converted directly to JPEG blob for upload.

2. **Real-Time GPS Verification:**
   - Captured via `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`, `timeout: 15000`, `maximumAge: 0`.
   - Read-only preview with fixed map marker; click-to-pin is disabled to prevent manual coordinate spoofing.
   - If GPS accuracy is worse than 100 meters, report submission is blocked until the citizen retries in an open area.
   - Auto-filled reverse-geocoded address from OpenStreetMap Nominatim.

3. **Backend Temporal & Accuracy Verification:**
   - Backend enforces `accuracy <= 100`. Reports with lower accuracy are rejected (`400 Bad Request`).
   - Backend enforces `|Date.now() - capturedAt| <= 2 minutes`. Stale or prerecorded payloads are rejected.
   - Client-provided status and department parameters are ignored; server deterministically assigns them via `departmentMap.js`.

4. **Strict Duplicate Handling & Crowd-Confirmation:**
   - If an active report (status `!= Resolved`) exists within **50 meters** with the same category:
     - No second report is created (no "submit anyway" bypass).
     - If the current citizen has already reported/confirmed it, returns a helpful message with a direct link to the report.
     - If it is a new citizen:
       - Adds citizen to `reportedBy` (no duplicates).
       - Increments `reportCount`.
       - Appends to `confirmations`: `[{ citizen, imageUrl, latitude, longitude, accuracy, capturedAt }]`.
       - Sends in-app notification linking the citizen to the incident.
       - Returns `{ duplicate: true, report: existingReport }`.
     - Frontend opens a modal: *"This Emergency Is Already Reported and Live"*, showing live status, original photo, confirmations count, and a direct button to track progress.

---

## 4. System Enumerations & Mappings

- **Categories**:
  `Pothole`, `Fallen Tree`, `Electric Pole`, `Water Leakage`, `Drainage`, `Traffic Signal`, `Bridge Damage`, `Fire`, `Garbage`, `Accident`, `Other`

- **Departments**:
  `Road`, `Water`, `Electricity`, `Drainage`, `Tree`, `Fire`, `Sanitation`

- **Severity Levels**:
  `Low`, `Medium`, `High`, `Critical`

- **Auto-Assignment Mapping (`server/config/departmentMap.js`)**:
  | Category | Auto-Assigned Department | Initial Status |
  |---|---|---|
  | `Pothole` | `Road` | `Assigned` |
  | `Electric Pole` | `Electricity` | `Assigned` |
  | `Water Leakage` | `Water` | `Assigned` |
  | `Drainage` | `Drainage` | `Assigned` |
  | `Fallen Tree` | `Tree` | `Assigned` |
  | `Fire` | `Fire` | `Assigned` |
  | `Garbage` | `Sanitation` | `Assigned` |
  | `Traffic Signal` | None (`Unassigned`) | `Pending` (Admin Triage) |
  | `Bridge Damage` | None (`Unassigned`) | `Pending` (Admin Triage) |
  | `Accident` | None (`Unassigned`) | `Pending` (Admin Triage) |
  | `Other` | None (`Unassigned`) | `Pending` (Admin Triage) |

---

## 5. Database Schemas (Mongoose)

### 5.1. `Report` Schema (`server/src/models/Report.js`)
```javascript
{
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: [...] },
  severity: { type: String, required: true, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: 'Detected via GPS' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  accuracy: { type: Number, required: true },       // GPS accuracy in meters
  capturedAt: { type: Date, required: true },      // Timestamp of live camera shutter
  imageUrl: { type: String, required: true },       // Initial evidence photo
  resolvedProofUrl: { type: String, default: null },// Proof uploaded by department
  status: { type: String, enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'], default: 'Pending' },
  department: { type: String, default: 'Unassigned' },
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Initial reporter
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],            // All confirming citizens
  reportCount: { type: Number, default: 1 },                                      // Total citizen confirmations
  confirmations: [                                                                // Extra evidence submissions
    {
      citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      imageUrl: String,
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      capturedAt: Date
    }
  ],
  adminNotes: { type: String, default: '' },
  workNotes: { type: String, default: '' },
  statusHistory: [...],
  resolvedAt: { type: Date, default: null },
  feedback: { rating: Number, comment: String, submittedAt: Date }
}
```

---

## 6. Mobile Phone Testing via HTTPS

Because browsers strictly block `getUserMedia` (camera) and `geolocation` on insecure plain HTTP when accessed over a local network IP, the Vite development server is configured with `@vitejs/plugin-basic-ssl`.

**Testing on Phone Steps:**
1. Start frontend with host exposed: `npm run dev -- --host`
2. Find host machine's Local LAN IP (e.g., `192.168.1.5`).
3. Connect smartphone to the same Wi-Fi network.
4. Navigate to `https://<YOUR_IP>:5173` on mobile Chrome or Safari.
5. Tap **"Advanced" ➔ "Proceed anyway"** to accept the self-signed SSL certificate.
6. Grant Camera and Location permissions when prompted.
