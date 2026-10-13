# EIRS — Emergency Infrastructure Reporting System

> **A centralized civic emergency platform connecting citizens with municipal departments in real time.**

---

## 🌟 Overview
**EIRS (Emergency Infrastructure Reporting System)** empowers citizens to report urban public infrastructure emergencies (potholes, fallen trees, electrical hazards, water leakages, drainage issues, etc.) with exact GPS coordinates and photographic evidence. 

Reports are **automatically assigned** to corresponding municipal departments based on category rules, enabling department officers to dispatch crews, update progress, and upload resolution proof photos. Administrators monitor city-wide performance and triage unmapped emergencies.

---

## 🚀 Key Features

### 👤 Citizens
- Report emergencies with **GPS location picker** (Leaflet OpenStreetMap) and photo evidence.
- **Auto-Routing Engine:** Automatically directs the report to the responsible department.
- **Duplicate Detection:** Prevents clutter by detecting similar active emergencies within 50 meters.
- **Live Progress Timeline:** Track step-by-step resolution status (`Pending` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved`).
- **In-App Notifications:** Real-time alerts when department officers update incident status.
- **Citizen Feedback:** Submit 1–5 star ratings and comments after resolution.

### 🏢 Municipal Departments (7 Specialized Portals)
- **Dedicated Dashboards:** For `Road`, `Water`, `Electricity`, `Drainage`, `Tree`, `Fire`, and `Sanitation`.
- **Backend Isolation:** Departments only access reports assigned to their department.
- **KPI Counters:** Track `New (Assigned)`, `In Progress`, `Resolved`, and `Critical Alerts`.
- **Field Actions:** Transition status, log work notes, and upload **proof-of-work** photos.

### 🛡️ Municipal Administrators
- **City-Wide Command & Control:** Comprehensive KPI overview and Leaflet hotspot map.
- **Performance Analytics (Chart.js):** Monitor Resolution Rate (%) and Average Resolution Time (Hours) per department.
- **Triage Queue:** Review and manually assign unmapped incidents (`Traffic Signal`, `Bridge Damage`, `Accident`, `Other`).
- **Routing Override:** Reassign misclassified reports to the correct department.
- **Staff Management:** Create new department accounts.

---

## ⚙️ Category-to-Department Routing Rules

| Emergency Category | Auto-Assigned Department | Initial Status |
|---|---|---|
| **Pothole** / Road Damage | `Road` | `Assigned` |
| **Electric Pole** / Sparks | `Electricity` | `Assigned` |
| **Water Leakage** / Pipe Burst | `Water` | `Assigned` |
| **Drainage** / Clogged Drain | `Drainage` | `Assigned` |
| **Fallen Tree** / Blockage | `Tree` | `Assigned` |
| **Fire** Hazard | `Fire` | `Assigned` |
| **Garbage** Heap | `Sanitation` | `Assigned` |
| **Traffic Signal**, **Bridge**, **Accident**, **Other** | `Unassigned` | `Pending` (Admin Triage) |

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons
- **Maps & Geo:** Leaflet, React-Leaflet, OpenStreetMap
- **Analytics:** Chart.js, react-chartjs-2
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **File Uploads:** Multer (Local disk storage)

---

## 📁 Project Structure

```text
Eirs/
├── PROJECT.md               # Master technical specification
├── README.md                # Project documentation & deployment guide
├── client/                  # React (Vite) + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/      # Navbar, Leaflet Maps, ProtectedRoute
│   │   ├── context/         # AuthContext & role-based routing
│   │   ├── pages/           # DepartmentDashboard, AdminDashboard, SubmitReport, etc.
│   │   └── services/        # Axios API client
│   └── package.json
└── server/                  # Node.js + Express Backend
    ├── config/
    │   └── departmentMap.js # Category auto-assignment configuration
    ├── src/
    │   ├── controllers/     # Auth, Reports, Stats, Notifications
    │   ├── middleware/      # JWT, roleCheck, Multer upload
    │   ├── models/          # User, Report, Notification schemas
    │   ├── routes/          # Express API endpoints
    │   └── seeds/           # Database seeder & test scripts
    ├── uploads/             # Image storage directory
    ├── .env.example         # Template for environment variables
    └── package.json
```

---

## 🔑 Demo & Test Credentials

After running the database seeder, the following test accounts are ready for use:

| Role | Email | Password | Department / Access |
|---|---|---|---|
| **Admin** | `admin@eirs.com` | `admin123` | Municipal Admin Portal |
| **Department** | `electricity@eirs.com` | `password123` | Electricity Department |
| **Department** | `water@eirs.com` | `password123` | Water Department |
| **Department** | `road@eirs.com` | `password123` | Road / Public Works |
| **Department** | `tree@eirs.com` | `password123` | Tree & Horticulture |
| **Department** | `drainage@eirs.com` | `password123` | Drainage Department |
| **Department** | `fire@eirs.com` | `password123` | Fire Response |
| **Department** | `sanitation@eirs.com` | `password123` | Sanitation Department |
| **Citizen 1** | `rahul@gmail.com` | `citizen123` | Citizen Reporting |
| **Citizen 2** | `priya@gmail.com` | `citizen123` | Citizen Reporting |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### 2. Backend Setup
```bash
cd server
npm install

# Copy environment template
cp .env.example .env

# Populate demo data
npm run seed

# Start server
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
# Client runs on http://localhost:5173
```

---

## 🌐 Deployment Configuration

For production deployment (e.g. Render, Railway, Vercel, AWS):
1. **Never commit `.env` files** (they are ignored by `.gitignore`).
2. Set the following environment variables on your hosting provider using `server/.env.example`:
   - `PORT`: `5000`
   - `MONGO_URI`: Your production MongoDB connection string (e.g. MongoDB Atlas)
   - `JWT_SECRET`: A secure secret string
   - `JWT_EXPIRES_IN`: `7d`
   - `NODE_ENV`: `production`
