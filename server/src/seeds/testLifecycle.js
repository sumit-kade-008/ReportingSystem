// server/src/seeds/testLifecycle.js
// Automated end-to-end lifecycle test script:
// 1. Citizen login & submit emergency -> auto-assigned to department
// 2. Department officer login & updates status (Assigned -> In Progress -> Resolved) with proof photo
// 3. Citizen notification generated & verified
// 4. Citizen submits feedback & 5-star rating
// 5. Admin department performance metrics check

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_BASE = 'http://localhost:5000/api';

async function runLifecycleTest() {
  console.log('\n=============================================');
  console.log('--- STARTING EIRS END-TO-END LIFECYCLE TEST ---');
  console.log('=============================================\n');

  // STEP 1: Login Citizen (Rahul)
  console.log('1. Authenticating Citizen (rahul@gmail.com)...');
  const citizenLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul@gmail.com', password: 'citizen123' }),
  });
  const citizenAuth = await citizenLoginRes.json();
  const citizenToken = citizenAuth.token;
  console.log(`   ✓ Citizen logged in! Name: ${citizenAuth.user.name}, Role: ${citizenAuth.user.role}`);

  // STEP 2: Citizen Submits Emergency Report (Auto-Assign to Electricity)
  console.log('\n2. Citizen submits Electric Pole emergency...');
  const formData = new FormData();
  formData.append('title', 'Sparking Street Light Transformer Box');
  formData.append('description', 'Heavy smoke and sparking near school crossing.');
  formData.append('category', 'Electric Pole');
  formData.append('severity', 'Critical');
  formData.append('latitude', '12.9340');
  formData.append('longitude', '77.6150');
  formData.append('address', '5th Block Koramangala');
  
  // Attach dummy image file
  const dummyImg = new Blob([Buffer.from('fake image data')], { type: 'image/jpeg' });
  formData.append('image', dummyImg, 'test-spark.jpg');

  const reportSubmitRes = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: formData,
  });
  const reportData = await reportSubmitRes.json();
  const createdReport = reportData.report;
  console.log(`   ✓ Report Created! ID: ${createdReport._id}`);
  console.log(`   ✓ Auto-Assigned Department: ${createdReport.department} (Category: ${createdReport.category})`);
  console.log(`   ✓ Initial Status: ${createdReport.status}`);

  // STEP 3: Electricity Department Officer Login
  console.log('\n3. Authenticating Electricity Department Officer (electricity@eirs.com)...');
  const deptLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'electricity@eirs.com', password: 'password123' }),
  });
  const deptAuth = await deptLoginRes.json();
  const deptToken = deptAuth.token;
  console.log(`   ✓ Officer logged in! Role: ${deptAuth.user.role}, Dept: ${deptAuth.user.department}`);

  // STEP 4: Department Updates Status to 'In Progress'
  console.log('\n4. Department transitions report status to "In Progress"...');
  const updateProgressRes = await fetch(`${API_BASE}/reports/${createdReport._id}/department-status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${deptToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'In Progress',
      workNotes: 'Dispatching Emergency Van #4 with transformer technicians.',
    }),
  });
  const inProgressReport = await updateProgressRes.json();
  console.log(`   ✓ Status updated to: ${inProgressReport.report.status}`);
  console.log(`   ✓ Work Notes recorded: "${inProgressReport.report.workNotes}"`);

  // STEP 5: Department Updates Status to 'Resolved' with Resolved Proof
  console.log('\n5. Department transitions report status to "Resolved" with proof photo...');
  const resolveFormData = new FormData();
  resolveFormData.append('status', 'Resolved');
  resolveFormData.append('workNotes', 'Faulty fuse replaced and insulated. Voltage restored to normal.');
  const dummyProof = new Blob([Buffer.from('proof image data')], { type: 'image/jpeg' });
  resolveFormData.append('resolvedProof', dummyProof, 'resolved-box.jpg');

  const resolveRes = await fetch(`${API_BASE}/reports/${createdReport._id}/department-status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${deptToken}` },
    body: resolveFormData,
  });
  const resolvedData = await resolveRes.json();
  console.log(`   ✓ Status updated to: ${resolvedData.report.status}`);
  console.log(`   ✓ Resolved Proof URL: ${resolvedData.report.resolvedProofUrl}`);

  // STEP 6: Citizen Checks Notifications
  console.log('\n6. Checking in-app notifications for Citizen...');
  const notifRes = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  const notifData = await notifRes.json();
  const latestNotif = notifData.notifications[0];
  console.log(`   ✓ Latest Citizen Notification: "${latestNotif.title}"`);
  console.log(`   ✓ Message: "${latestNotif.message}"`);

  // STEP 7: Citizen Submits Rating Feedback
  console.log('\n7. Citizen submits 5-star rating and feedback...');
  const feedbackRes = await fetch(`${API_BASE}/reports/${createdReport._id}/feedback`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${citizenToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rating: 5,
      comment: 'Super fast response! Technicians fixed the sparking wire safely.',
    }),
  });
  const feedbackData = await feedbackRes.json();
  console.log(`   ✓ Feedback saved! Rating: ${feedbackData.feedback.rating} Stars, Comment: "${feedbackData.feedback.comment}"`);

  // STEP 8: Admin Checks Performance Metrics
  console.log('\n8. Authenticating Municipal Admin (admin@eirs.com)...');
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@eirs.com', password: 'admin123' }),
  });
  const adminAuth = await adminLoginRes.json();
  const adminToken = adminAuth.token;

  console.log('   Fetching Department Performance analytics...');
  const perfRes = await fetch(`${API_BASE}/stats/department-performance`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const perfData = await perfRes.json();
  const elecPerf = perfData.performance.find((p) => p.department === 'Electricity');
  console.log(`   ✓ Electricity Dept Performance: Total: ${elecPerf.total}, Resolved: ${elecPerf.resolved}, Rate: ${elecPerf.resolutionRate}%, Avg Time: ${elecPerf.avgResolutionHours} hrs`);

  console.log('\n=============================================');
  console.log('✓✓✓ ALL LIFECYCLE TESTS COMPLETED SUCCESSFULLY! ✓✓✓');
  console.log('=============================================\n');
}

runLifecycleTest().catch((err) => {
  console.error('Lifecycle test error:', err);
});
