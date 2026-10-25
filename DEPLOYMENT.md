# Deploying EIRS on Render

This guide outlines the step-by-step process to deploy the **Emergency Infrastructure Reporting System (EIRS)** on [Render](https://render.com) using a single free Web Service.

---

## Architecture Overview

The application is structured to run as a **unified fullstack service** on Render:
- **Express Backend:** Serves the REST API (`/api/*`), handles uploads (`/uploads/*`), and performs database operations.
- **React Frontend:** Built via Vite into static assets (`client/dist`) and served directly by Express in production mode.
- **Benefits:**
  - 100% Free on Render (requires only 1 Web Service instance).
  - No cross-origin (CORS) issues between frontend and backend.
  - Uploaded image paths (`/uploads/...`) resolve seamlessly on the same domain.
  - Single git push automatically builds both frontend and backend.

---

## Step 1: Set Up MongoDB Atlas (Free Cloud Database)

Render's free tier does not host MongoDB natively. Use MongoDB Atlas (free forever M0 cluster):

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in or create a free account.
2. Click **Create Deployment** and select the **M0 Free** shared tier. Choose any nearby cloud region (e.g., AWS Mumbai, Frankfurt, or N. Virginia).
3. **Database Access (User):**
   - Go to **Security > Database Access**.
   - Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Create a username (e.g. `eirs_user`) and a secure password.
   - Role: **Read and write to any database**.
4. **Network Access (IP Whitelist):**
   - Go to **Security > Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`). *(Render services use dynamic IP addresses, so this is required)*.
   - Click **Confirm**.
5. **Get Your Connection String:**
   - Go to **Deployments > Database**.
   - Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection URI. It looks like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/eirs?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials. Replace the database name with `eirs` before the `?`.

---

## Step 2: Push Your Code to GitHub

Make sure all changes are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "Configure fullstack deployment for Render"
git push origin main
```

---

## Step 3: Deploy on Render

You can deploy using either **Method A (Render Blueprint - Easiest)** or **Method B (Manual Dashboard Setup)**.

### Method A: 1-Click Render Blueprint (Recommended)

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click the **New +** button in the top navigation and select **Blueprint**.
3. Connect your GitHub repository.
4. Render will detect the included [`render.yaml`](./render.yaml) file automatically.
5. In the parameters screen:
   - Provide your `MONGO_URI` (from Step 1).
   - `JWT_SECRET` will be generated automatically by Render.
6. Click **Apply**. Render will install dependencies, build the React frontend, and boot the server!

---

### Method B: Manual Web Service Setup

If you prefer configuring through the UI manually:

1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the following fields:
   - **Name:** `eirs-system` (or any name you choose)
   - **Region:** Choose the region closest to your MongoDB Atlas cluster (e.g., Singapore, Frankfurt, Oregon)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank / default root)*
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** `Free`
4. Expand **Advanced** and add the following **Environment Variables**:

| Key | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enables production mode and frontend static serving |
| `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | *(Random 32+ character string)* | Secret for signing JWT authentication tokens |
| `JWT_EXPIRES_IN` | `7d` | Token validity period |

*(Note: `PORT` is assigned automatically by Render; Express will automatically listen on it)*.

5. Click **Create Web Service**. Render will begin building.

---

## Step 4: Seed Initial Data (Admin, Officers & Reports)

Once your deployment status displays **Live**:

1. In the Render Dashboard, click on your deployed **Web Service**.
2. In the left sidebar, click the **Shell** tab (opens a live SSH terminal inside your container).
3. Run the seed script:
   ```bash
   npm run seed
   ```
4. This populates your cloud MongoDB database with:
   - **Admin Officer:** `admin@eirs.com` / `admin123`
   - **Department Officers:**
     - Road: `road@eirs.com` / `password123`
     - Water: `water@eirs.com` / `password123`
     - Electricity: `electricity@eirs.com` / `password123`
     - Drainage: `drainage@eirs.com` / `password123`
     - Tree: `tree@eirs.com` / `password123`
     - Fire: `fire@eirs.com` / `password123`
     - Sanitation: `sanitation@eirs.com` / `password123`
   - **Citizens:**
     - `rahul@gmail.com` / `citizen123`
     - `priya@gmail.com` / `citizen123`
   - 8 realistic demo reports with status histories and coordinates.

---

## Step 5: Test Your Live App

1. Click on the `.onrender.com` URL provided at the top of your Render service dashboard (e.g., `https://eirs-reporting-system.onrender.com`).
2. Test the following:
   - **Health check:** Visit `https://your-app.onrender.com/api/health` — should return `{ status: 'online', ... }`.
   - **Home / Landing:** Public map, analytics counters, and emergency report list.
   - **Citizen Flow:** Login as `rahul@gmail.com` / `citizen123` or register a new user.
   - **Department Flow:** Login as `road@eirs.com` / `password123` to view department-specific triage and update report status.
   - **Admin Flow:** Login as `admin@eirs.com` / `admin123` to triage unassigned incidents and reassign departments.

---

## Free Tier Notes & Best Practices

- **Spin Down (Cold Starts):** On Render's Free tier, the web service automatically spins down after 15 minutes of inactivity. When a new request arrives, it takes approximately 30–50 seconds to wake up.
- **Ephemeral Storage for Uploads:** Render Free tier disks are ephemeral (restarts or redeployments wipe local `/uploads` files). For permanent cloud image hosting in the future, integration with Cloudinary or AWS S3 can be added. The seed script (`npm run seed`) can be re-run at any time to regenerate sample photos.
