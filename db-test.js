// =====================================================
//  ArogyaBot — Supabase Database Test Script
//  Tests: connection, insert, read, delete
//  Supabase URL: https://nqhjdhrilrdkzltbkytq.supabase.co
// =====================================================

const SUPABASE_URL = 'https://nqhjdhrilrdkzltbkytq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaGpkaHJpbHJka3psdGJreXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTI0MDksImV4cCI6MjA5MTAyODQwOX0.DmBphKejH2JyKDP3so7s89R4oqGGZ1T_VS-IkVKIocI';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const log = (msg) => {
  const el = document.getElementById('log');
  el.textContent += '\n' + msg;
  el.scrollTop = el.scrollHeight;
};

// ── Check connection on load ──────────────────────────────────────────────
window.onload = async () => {
  try {
    const { data, error } = await sb.from('consultations').select('count', { count: 'exact', head: true });
    if (error) throw error;
    document.getElementById('conn-status').textContent = '✅ Connected to Supabase!';
    document.getElementById('conn-detail').textContent = `Project: nqhjdhrilrdkzltbkytq.supabase.co`;
    document.getElementById('log').textContent = '✅ Connection successful! Database is ready.\nClick the buttons above to test.';
  } catch(e) {
    document.getElementById('conn-status').textContent = '❌ Connection Failed';
    document.getElementById('conn-detail').textContent = e.message;
  }
};

// ── Insert consultations ──────────────────────────────────────────────────
async function insertConsultations() {
  log('\n🔄 Inserting test consultations...');
  const data = [
    { user_id: 'test_rounak', symptoms: 'Fever and headache since 2 days', ai_response: 'You may have viral fever. Rest, drink fluids, take paracetamol 500mg.', severity: 'MEDIUM', language: 'en' },
    { user_id: 'test_pooja', symptoms: 'पेट में दर्द और उल्टी', ai_response: 'पेट दर्द के लिए ORS पिएं, हल्का खाना खाएं। डॉक्टर से मिलें।', severity: 'MEDIUM', language: 'hi' },
    { user_id: 'test_shubham', symptoms: 'Chest pain and difficulty breathing', ai_response: 'This is serious. Seek emergency care immediately. Call 108.', severity: 'HIGH', language: 'en' },
    { user_id: 'test_dharmendra', symptoms: 'Cough and cold for 3 days', ai_response: 'Common cold. Drink warm water with honey. Rest well.', severity: 'LOW', language: 'en' },
  ];

  const { data: res, error } = await sb.from('consultations').insert(data).select();
  if (error) { log('❌ Error: ' + error.message); return; }
  log(`✅ Inserted ${res.length} consultations successfully!`);
  res.forEach(r => log(`   → [${r.severity}] ${r.user_id}: ${r.symptoms.slice(0,40)}...`));
}

// ── Insert reminders ──────────────────────────────────────────────────────
async function insertReminders() {
  log('\n🔄 Inserting test reminders...');
  const data = [
    { user_id: 'test_rounak', medicine_name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Twice daily', time: '08:00', duration: '5 days' },
    { user_id: 'test_pooja', medicine_name: 'ORS Packet', dosage: '1 packet in 1L water', frequency: 'Three times daily', time: '09:00', duration: '3 days' },
    { user_id: 'test_shubham', medicine_name: 'Amoxicillin 250mg', dosage: '1 capsule', frequency: 'Three times daily', time: '07:00', duration: '7 days' },
  ];

  const { data: res, error } = await sb.from('reminders').insert(data).select();
  if (error) { log('❌ Error: ' + error.message); return; }
  log(`✅ Inserted ${res.length} reminders successfully!`);
  res.forEach(r => log(`   → 💊 ${r.user_id}: ${r.medicine_name} @ ${r.time}`));
}

// ── Read all data ─────────────────────────────────────────────────────────
async function readAll() {
  log('\n🔄 Reading all data from Supabase...');

  const { data: consults } = await sb.from('consultations').select('*').order('created_at', { ascending: false });
  const { data: reminders } = await sb.from('reminders').select('*').order('created_at', { ascending: false });

  log(`✅ Found ${consults?.length || 0} consultations and ${reminders?.length || 0} reminders`);

  // Render consultations table
  if (consults?.length) {
    let html = '<table><tr><th>User</th><th>Symptoms</th><th>Severity</th><th>Lang</th><th>Time</th></tr>';
    consults.forEach(c => {
      const badge = c.severity === 'HIGH' ? 'high' : c.severity === 'MEDIUM' ? 'medium' : 'low';
      const time = new Date(c.created_at).toLocaleString('en-IN');
      html += `<tr>
        <td>${c.user_id}</td>
        <td>${c.symptoms?.slice(0,40)}...</td>
        <td><span class="badge ${badge}">${c.severity}</span></td>
        <td>${c.language?.toUpperCase()}</td>
        <td style="color:#9CA3AF;font-size:11px">${time}</td>
      </tr>`;
    });
    html += '</table>';
    document.getElementById('consult-table').innerHTML = html;
  }

  // Render reminders table
  if (reminders?.length) {
    let html = '<table><tr><th>User</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Time</th></tr>';
    reminders.forEach(r => {
      html += `<tr>
        <td>${r.user_id}</td>
        <td>💊 ${r.medicine_name}</td>
        <td>${r.dosage}</td>
        <td>${r.frequency}</td>
        <td>${r.time}</td>
      </tr>`;
    });
    html += '</table>';
    document.getElementById('reminder-table').innerHTML = html;
  }

  document.getElementById('data-section').style.display = 'block';
}

// ── Clear test data ───────────────────────────────────────────────────────
async function clearTestData() {
  log('\n🔄 Clearing test data...');
  const testUsers = ['test_rounak', 'test_pooja', 'test_shubham', 'test_dharmendra'];
  for (const u of testUsers) {
    await sb.from('consultations').delete().eq('user_id', u);
    await sb.from('reminders').delete().eq('user_id', u);
  }
  log('✅ Test data cleared!');
  document.getElementById('data-section').style.display = 'none';
}