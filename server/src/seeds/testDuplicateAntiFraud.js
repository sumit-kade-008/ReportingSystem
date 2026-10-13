// server/src/seeds/testDuplicateAntiFraud.js
// Automated verification of Change 1 (duplicate handling & confirmations)
// and Change 4 (anti-fraud: GPS accuracy <= 100m, capture timestamp <= 2 min).

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_BASE = 'http://localhost:5000/api';

async function testAntiFraudAndDuplicates() {
  console.log('\n=== TESTING ANTI-FRAUD & DUPLICATE CONFIRMATION ENGINE ===\n');

  // 1. Authenticate Citizen 1 (Rahul) and Citizen 2 (Priya)
  const res1 = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul@gmail.com', password: 'citizen123' }),
  });
  const rahulAuth = await res1.json();

  const res2 = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya@gmail.com', password: 'citizen123' }),
  });
  const priyaAuth = await res2.json();

  console.log(`✓ Citizen 1: ${rahulAuth.user.name}`);
  console.log(`✓ Citizen 2: ${priyaAuth.user.name}`);

  // TEST A: Reject if accuracy > 100m
  console.log('\n--- Test A: GPS Accuracy > 100m (Expect Rejection) ---');
  const formA = new FormData();
  formA.append('title', 'Spoofed Incident');
  formA.append('description', 'Inaccurate GPS location test');
  formA.append('category', 'Pothole');
  formA.append('latitude', '12.9800');
  formA.append('longitude', '77.6000');
  formA.append('accuracy', '150'); // 150m > 100m!
  formA.append('capturedAt', new Date().toISOString());
  formA.append('image', new Blob([Buffer.from('fakeimg')], { type: 'image/jpeg' }), 'cam.jpg');

  const resA = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${rahulAuth.token}` },
    body: formA,
  });
  const dataA = await resA.json();
  console.log(`  Response Code: ${resA.status} (Expected 400)`);
  console.log(`  Message: "${dataA.message}"`);
  if (resA.status === 400 && dataA.message.includes('accuracy is too low')) {
    console.log('✓ Test A Passed: Low accuracy rejected correctly!');
  } else {
    throw new Error('Test A failed');
  }

  // TEST B: Reject if photo is older than 2 minutes
  console.log('\n--- Test B: Expired Camera Timestamp > 2 minutes (Expect Rejection) ---');
  const formB = new FormData();
  formB.append('title', 'Stale Photo Test');
  formB.append('description', 'Old photo timestamp test');
  formB.append('category', 'Pothole');
  formB.append('latitude', '12.9800');
  formB.append('longitude', '77.6000');
  formB.append('accuracy', '15');
  formB.append('capturedAt', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 minutes old!
  formB.append('image', new Blob([Buffer.from('fakeimg')], { type: 'image/jpeg' }), 'cam.jpg');

  const resB = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${rahulAuth.token}` },
    body: formB,
  });
  const dataB = await resB.json();
  console.log(`  Response Code: ${resB.status} (Expected 400)`);
  console.log(`  Message: "${dataB.message}"`);
  if (resB.status === 400 && dataB.message.includes('expired')) {
    console.log('✓ Test B Passed: Stale timestamp rejected correctly!');
  } else {
    throw new Error('Test B failed');
  }

  // TEST C: Valid submission by Citizen 1 (Rahul)
  console.log('\n--- Test C: Valid Live Submission by Citizen 1 ---');
  const formC = new FormData();
  formC.append('title', 'Live Verified Water Pipe Burst');
  formC.append('description', 'Flooding on 80 Feet Road');
  formC.append('category', 'Water Leakage');
  formC.append('severity', 'High');
  formC.append('latitude', '12.9555');
  formC.append('longitude', '77.6555');
  formC.append('accuracy', '12'); // valid <= 100m
  formC.append('capturedAt', new Date().toISOString()); // fresh
  formC.append('image', new Blob([Buffer.from('live camera byte stream')], { type: 'image/jpeg' }), 'pipe.jpg');

  const resC = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${rahulAuth.token}` },
    body: formC,
  });
  const dataC = await resC.json();
  const createdReport = dataC.report;
  console.log(`  Response Code: ${resC.status} (Expected 201)`);
  console.log(`  Report ID: ${createdReport._id}`);
  console.log(`  Report Count: ${createdReport.reportCount}`);
  console.log(`  Department: ${createdReport.department}`);

  // TEST D: Citizen 2 (Priya) reports same incident at same location (within 20m)
  console.log('\n--- Test D: Citizen 2 Reports Within 50m (Expect Collaborative Linking) ---');
  const formD = new FormData();
  formD.append('title', 'Water Pipe Burst Confirmed');
  formD.append('description', 'I see this pipe burst too, road is flooded');
  formD.append('category', 'Water Leakage'); // same category
  formD.append('severity', 'High');
  formD.append('latitude', '12.9556'); // ~11 meters away
  formD.append('longitude', '77.6555');
  formD.append('accuracy', '8');
  formD.append('capturedAt', new Date().toISOString());
  formD.append('image', new Blob([Buffer.from('priya camera proof')], { type: 'image/jpeg' }), 'priya-proof.jpg');

  const resD = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${priyaAuth.token}` },
    body: formD,
  });
  const dataD = await resD.json();
  console.log(`  Response Code: ${resD.status} (Expected 200)`);
  console.log(`  duplicate: ${dataD.duplicate}`);
  console.log(`  Message: "${dataD.message}"`);
  console.log(`  Existing Report ID: ${dataD.report._id}`);
  console.log(`  New Report Count: ${dataD.report.reportCount} (Expected 2)`);
  console.log(`  Total Confirmations: ${dataD.report.confirmations?.length} (Expected 1)`);

  if (dataD.duplicate === true && dataD.report.reportCount === 2) {
    console.log('✓ Test D Passed: Citizen 2 successfully linked as collaborator without duplicate ticket!');
  } else {
    throw new Error('Test D failed');
  }

  // TEST E: Citizen 2 tries to submit the same report again (Expect alreadyReported message)
  console.log('\n--- Test E: Citizen 2 Tries Submitting Again (Expect alreadyReported) ---');
  const formE = new FormData();
  formE.append('title', 'Water Pipe Burst Again');
  formE.append('description', 'Still leaking');
  formE.append('category', 'Water Leakage');
  formE.append('latitude', '12.9556');
  formE.append('longitude', '77.6555');
  formE.append('accuracy', '10');
  formE.append('capturedAt', new Date().toISOString());
  formE.append('image', new Blob([Buffer.from('priya camera proof')], { type: 'image/jpeg' }), 'priya-proof.jpg');

  const resE = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${priyaAuth.token}` },
    body: formE,
  });
  const dataE = await resE.json();
  console.log(`  Response Code: ${resE.status} (Expected 409)`);
  console.log(`  alreadyReported: ${dataE.alreadyReported}`);
  console.log(`  Message: "${dataE.message}"`);
  if (dataE.alreadyReported === true && dataE.message.includes('already reported')) {
    console.log('✓ Test E Passed: Second attempt prevented with helpful message!');
  } else {
    throw new Error('Test E failed');
  }

  console.log('\n=============================================');
  console.log('✓ ALL BACKEND ANTI-FRAUD & DUPLICATE TESTS PASSED!');
  console.log('=============================================\n');
}

testAntiFraudAndDuplicates().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
