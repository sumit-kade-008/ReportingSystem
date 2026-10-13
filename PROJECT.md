# EIRS - Emergency Infrastructure Reporting System
> **College Project Specification & Architectural Blueprint**

---

## 1. Project Overview
**EIRS (Emergency Infrastructure Reporting System)** is a centralized full-stack web application designed to empower citizens to report urban public infrastructure emergencies directly to municipal authorities.
Reports with specific categories are **automatically assigned** to corresponding municipal departments. Department officers manage, act upon, and resolve issues with proof-of-work uploads. Administrators monitor municipal performance, reassign or triage unmapped reports, and oversee all department metrics. Citizens track real-time resolution timelines and receive updates.

---

## 2. Core Entities & Business Logic

### Roles & Access Control

- **`citizen`**:
  - Registers and authenticates securely.
  - Submits emergency reports with photo, GPS location, category, and severity.
  - Duplicate detection alerts or prevents reporting identical issues within close proximity.
  - Report is **automatically routed** to the responsible department based on the selected category.
  - Views personal report history, in-app notifications, and tracks resolution progress via a visual timeline.
  - Submits rating and feedback after report resolution.

- **`department`** (dedicated login per department: Road, Water, Electricity, Drainage, Tree, Fire, Sanitation):
  - Logs into a **Department Dashboard** displaying only reports assigned to their department.
  - Views KPI cards: New (Assigned), In Progress, Resolved, Critical.
  - Inspects assigned reports on an interactive map and filterable table.
  - Updates status (`Assigned` ➔ `In Progress` ➔ `Resolved`), attaches field work notes, and uploads a "resolved proof" photo.
  - Each status change triggers a citizen notification and logs an entry in `statusHistory`.

- **`admin`**:
  - Centralized municipal oversight with system-wide KPI counters and Chart.js analytics.
  - Monitors all reports on a master interactive map (Leaflet + OpenStreetMap).
  - Triage handler: Manages unassigned/`Pending` reports (e.g. Traffic Signal, Bridge, Accident, Other).
  - Overrides routing: Reassigns misclassified reports to the appropriate department.
  - Evaluates department performance (average resolution time, resolution percentage).
  - Creates and manages department accounts.

### System Enumerations & Mappings

- **Categories**:
  `Pothole`, `Fallen Tree`, `Electric Pole`, `Water Leakage`, `Drainage`, `Traffic Signal`, `Bridge Damage`, `Fire`, `Garbage`, `Accident`, `Other`

- **Departments**:
  `Road`, `Water`, `Electricity`, `Drainage`, `Tree`, `Fire`, `Sanitation`

- **Severity Levels**:
  `Low`, `Medium`, `High`, `Critical`

- **Status Flow**:
  - Auto-assigned reports: `Assigned` ➔ `In Progress` ➔ `Resolved`
  - Unmapped reports: `Pending` (Admin Triage) ➔ `Assigned` ➔ `In Progress` ➔ `Resolved`

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

## 3. Technology Stack

| Layer | Technologies | Justification (Viva Point) |
|---|---|---|
| **Frontend** | React (Vite), Tailwind CSS | Component reusability, fast HMR build tool, modern responsive UI. |
| **Maps & Geo** | Leaflet, React-Leaflet, OpenStreetMap | Completely free, open-source mapping without API keys or credit card restrictions. |
| **Analytics** | Chart.js, react-chartjs-2 | Visual representation of municipal workload, resolution percentages, and response times. |
| **Backend** | Node.js, Express.js | Fast, non-blocking I/O ideal for RESTful APIs and multipart file handling. |
| **Database** | MongoDB, Mongoose ODM | Flexible document schema, geospatial coordinate queries for duplicate detection. |
| **Authentication**| JWT (JSON Web Tokens), bcryptjs | Stateless authorization token with role-based access control. |
| **File Handling** | Multer | Local disk storage middleware for photo uploads (evidence and resolved-proof). |

---

## 4. Architecture & Directory Structure

```text
Eirs/
├── PROJECT.md                      # Master project documentation
├── client/                         # React (Vite) + Tailwind CSS Frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── common/             # Navbar, Footer, ProtectedRoute, Loader, AlertModal, NotificationBell
│       │   ├── map/                # LocationPicker (citizen), ReportMap (admin & department)
│       │   ├── charts/             # DepartmentPerformanceChart, StatusDoughnutChart, SeverityPieChart
│       │   └── reports/            # ReportCard, ReportFilters, StatusTimeline, ReportStatusBadge, StatusUpdateModal
│       ├── context/
│       │   └── AuthContext.jsx     # Auth state, login redirect by role (citizen -> /my-reports, department -> /department, admin -> /admin)
│       ├── pages/
│       │   ├── Home.jsx            # Landing page with stats & quick report CTA
│       │   ├── Login.jsx           # Unified login with role-based redirection
│       │   ├── Register.jsx        # Citizen registration
│       │   ├── SubmitReport.jsx    # Photo upload, GPS picker, category, severity, duplicate check
│       │   ├── MyReports.jsx       # Citizen dashboard to view personal reports & ratings
│       │   ├── ReportDetails.jsx   # Detailed report view with timeline, photos & feedback
│       │   ├── DepartmentDashboard.jsx # Department KPI cards, map, table, status updates & resolved proof upload
│       │   ├── AdminDashboard.jsx  # System KPIs, department performance analytics, pending triage
│       │   └── AdminReports.jsx    # Master table & map to reassign departments & manage accounts
│       ├── services/
│       │   ├── api.js              # Axios base instance with JWT interceptor
│       │   ├── authService.js      # Login, register, profile fetch API calls
│       │   └── reportService.js    # Report CRUD, status change, feedback, and stats
│       ├── utils/
│       │   ├── constants.js        # Categories, departments, severity colors, status badges
│       │   └── formatters.js       # Date and address formatters
│       ├── App.jsx                 # Route configurations with role-based guards
│       ├── main.jsx
│       └── index.css
│
└── server/                         # Node.js + Express Backend
    ├── package.json
    ├── .env.example
    ├── server.js                   # Express application entry point & MongoDB connection
    ├── uploads/                    # Local image storage for initial evidence and resolution proof
    ├── config/
    │   └── departmentMap.js        # Category-to-Department auto-assignment rules
    └── src/
        ├── config/
        │   └── db.js               # Mongoose connection logic
        ├── controllers/
        │   ├── authController.js   # User registration, login, profile, admin department user creation
        │   ├── reportController.js # Create report with auto-assignment & duplicate detection, queries, status updates
        │   ├── statsController.js  # Department performance & city-wide analytics queries
        │   └── notificationController.js # Citizen notification list and mark-as-read
        ├── middleware/
        │   ├── authMiddleware.js   # Verify JWT token and attach user to req.user
        │   ├── roleCheck.js        # Strict role-based authorization (citizen, department, admin)
        │   ├── uploadMiddleware.js # Multer diskStorage config for evidence and resolved-proof images
        │   └── errorMiddleware.js  # Global error handler
        ├── models/
        │   ├── User.js             # User Schema with roles (citizen, department, admin) & department field
        │   ├── Report.js           # Report Schema with statusHistory, location, resolvedProofUrl, feedback
        │   └── Notification.js     # In-app notifications for citizens
        ├── routes/
        │   ├── authRoutes.js       # /api/auth endpoints
        │   ├── reportRoutes.js     # /api/reports endpoints
        │   ├── statsRoutes.js      # /api/stats endpoints
        │   └── notificationRoutes.js # /api/notifications endpoints
        ├── seeds/
        │   └── seed.js             # Database seeder (1 admin, 7 department users, 2 citizens, demo reports)
        └── utils/
            └── geoUtils.js         # Distance calculation (Haversine formula) for duplicate detection
```

---

## 5. Database Schemas (Mongoose)

### 5.1. `User` Schema (`server/src/models/User.js`)
```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  phone: { type: String, trim: true },
  role: {
    type: String,
    enum: ['citizen', 'department', 'admin'],
    default: 'citizen',
  },
  department: {
    type: String,
    enum: ['Road', 'Water', 'Electricity', 'Drainage', 'Tree', 'Fire', 'Sanitation', null],
    default: null, // Required if role === 'department'
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 5.2. `Report` Schema (`server/src/models/Report.js`)
```javascript
{
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: [
      'Pothole', 'Fallen Tree', 'Electric Pole', 'Water Leakage',
      'Drainage', 'Traffic Signal', 'Bridge Damage', 'Fire',
      'Garbage', 'Accident', 'Other'
    ],
  },
  severity: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: 'Pin location on map' },
  },
  imageUrl: { type: String, required: true }, // Evidence photo
  resolvedProofUrl: { type: String, default: null }, // Proof of work uploaded by department
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
    default: 'Pending',
  },
  department: {
    type: String,
    enum: ['Road', 'Water', 'Electricity', 'Drainage', 'Tree', 'Fire', 'Sanitation', 'Unassigned'],
    default: 'Unassigned',
  },
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminNotes: { type: String, default: '' },
  workNotes: { type: String, default: '' }, // Field notes added by department officer
  statusHistory: [
    {
      status: { type: String, enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'], required: true },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['citizen', 'department', 'admin'] },
      note: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now },
    }
  ],
  resolvedAt: { type: Date, default: null }, // Used to compute department response & resolution time
  feedback: {
    rating: { type: Number, min: 1, max: 5 }, // Citizen rating after resolution
    comment: { type: String },
    submittedAt: { type: Date },
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 5.3. `Notification` Schema (`server/src/models/Notification.js`)
```javascript
{
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 6. Seed Credentials
| Role | Email | Password | Assigned Department |
|---|---|---|---|
| **Admin** | `admin@eirs.com` | `admin123` | N/A |
| **Department** | `road@eirs.com` | `password123` | Road |
| **Department** | `water@eirs.com` | `password123` | Water |
| **Department** | `electricity@eirs.com` | `password123` | Electricity |
| **Department** | `drainage@eirs.com` | `password123` | Drainage |
| **Department** | `tree@eirs.com` | `password123` | Tree |
| **Department** | `fire@eirs.com` | `password123` | Fire |
| **Department** | `sanitation@eirs.com` | `password123` | Sanitation |
| **Citizen 1** | `rahul@gmail.com` | `citizen123` | N/A |
| **Citizen 2** | `priya@gmail.com` | `citizen123` | N/A |
