// =====================================================
//  ArogyaBot — Main JavaScript
//  HackIndia Spark 6 · NIT Delhi · Team ArogyaBot
//  AI: Groq Llama 3.3 | DB: Supabase PostgreSQL
//  Notifications: Browser Push Notifications
// =====================================================

// ═══════════════════════════════════════════════
//  CONFIG — API KEYS
// ═══════════════════════════════════════════════
const GROQ_KEY = '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';
const SUPABASE_URL = 'https://nqhjdhrilrdkzltbkytq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaGpkaHJpbHJka3psdGJreXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTI0MDksImV4cCI6MjA5MTAyODQwOX0.DmBphKejH2JyKDP3so7s89R4oqGGZ1T_VS-IkVKIocI';

// Init Supabase
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Anonymous user ID
let USER_ID = localStorage.getItem('ab_uid');
if (!USER_ID) { USER_ID = 'u_' + Math.random().toString(36).slice(2) + Date.now(); localStorage.setItem('ab_uid', USER_ID); }

// ═══════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════
let lang = 'en';
let isRecording = false;
let recognition = null;
let chatHistory = [];
let reminders = JSON.parse(localStorage.getItem('ab_reminders') || '[]');

// ═══════════════════════════════════════════════
//  TRANSLATIONS
// ═══════════════════════════════════════════════
const T = {
  en: {
    sub:'AI Rural Health Assistant', chat:'Chat', hosp:'Hospitals', rem:'Reminders',
    welcome:'Hello! I\'m ArogyaBot 🌿 Your AI health companion for rural India.<br/><br/>Tell me your symptoms and I\'ll help you understand what might be happening.<br/><br/><em>Speak in Hindi using the 🎤 button!</em>',
    placeholder:'Describe your symptoms...',
    chips:['Fever & headache','Stomach pain','Cough & cold','Chest pain'],
    hospIntro:'Find PHCs, government hospitals, and clinics near your location.',
    locateBtn:'Find Nearby Hospitals', remTitle:'Add Medicine Reminder',
    medName:'Medicine Name', dosage:'Dosage', freq:'Frequency', time:'Time', duration:'Duration',
    addBtn:'Add Reminder', noRem:'No reminders yet. Add your first medicine reminder!'
  },
  hi: {
    sub:'एआई ग्रामीण स्वास्थ्य सहायक', chat:'बातचीत', hosp:'अस्पताल', rem:'अनुस्मारक',
    welcome:'नमस्ते! मैं आरोग्यबोट हूं 🌿 आपका AI स्वास्थ्य साथी।<br/><br/>मुझे अपने लक्षण बताएं, मैं बताऊंगा क्या हो सकता है।<br/><br/><em>🎤 बटन से हिंदी में बोलें!</em>',
    placeholder:'अपने लक्षण बताएं...',
    chips:['बुखार और सिरदर्द','पेट दर्द','खांसी और जुकाम','सीने में दर्द'],
    hospIntro:'पास के PHC, सरकारी अस्पताल और क्लीनिक खोजें।',
    locateBtn:'पास के अस्पताल खोजें', remTitle:'दवाई अनुस्मारक जोड़ें',
    medName:'दवाई का नाम', dosage:'खुराक', freq:'आवृत्ति', time:'समय', duration:'अवधि',
    addBtn:'अनुस्मारक जोड़ें', noRem:'कोई अनुस्मारक नहीं। पहला जोड़ें!'
  }
};

// ═══════════════════════════════════════════════
//  LANGUAGE
// ═══════════════════════════════════════════════
function setLang(l) {
  lang = l;
  document.getElementById('btn-en').classList.toggle('active', l==='en');
  document.getElementById('btn-hi').classList.toggle('active', l==='hi');
  document.body.style.fontFamily = l==='hi' ? "'Noto Sans Devanagari','Sora',sans-serif" : "'Sora',sans-serif";
  const t = T[l];
  document.getElementById('header-sub').textContent = t.sub;
  document.getElementById('tab-chat-label').textContent = t.chat;
  document.getElementById('tab-hosp-label').textContent = t.hosp;
  document.getElementById('tab-rem-label').textContent = t.rem;
  document.getElementById('welcome-msg').innerHTML = t.welcome;
  document.getElementById('chat-input').placeholder = t.placeholder;
  document.getElementById('hosp-intro').textContent = t.hospIntro;
  document.getElementById('locate-btn-text').textContent = t.locateBtn;
  document.getElementById('reminder-form-title').textContent = t.remTitle;
  document.getElementById('lbl-med-name').textContent = t.medName;
  document.getElementById('lbl-dosage').textContent = t.dosage;
  document.getElementById('lbl-freq').textContent = t.freq;
  document.getElementById('lbl-time').textContent = t.time;
  document.getElementById('lbl-duration').textContent = t.duration;
  document.getElementById('add-btn-label').textContent = t.addBtn;
  document.getElementById('no-rem-text').textContent = t.noRem;
  const chips = document.getElementById('quick-chips');
  chips.innerHTML = '';
  t.chips.forEach(c => { const b = document.createElement('button'); b.className='chip'; b.textContent=c; b.onclick=()=>sendChip(c); chips.appendChild(b); });
}

// ═══════════════════════════════════════════════
//  TABS
// ═══════════════════════════════════════════════
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('content-' + tab).classList.add('active');
}

// ═══════════════════════════════════════════════
//  CHAT
// ═══════════════════════════════════════════════
function handleEnter(e) { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} }
function autoResize(el) { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,80)+'px'; }
function sendChip(text) { document.getElementById('chat-input').value=text; sendMessage(); }

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  addMessage('user', text);
  input.value = ''; input.style.height = 'auto';
  chatHistory.push({ role:'user', content:text });
  document.getElementById('quick-chips').style.display = 'none';
  showTyping();

  try {
    const sysPrompt = lang === 'hi'
      ? 'Aap ArogyaBot hain. Hindi mein jawab dein. Lakshano ka vishleshan karein, gharelu upay sujhaen. Hamesha SEVERITY: LOW ya MEDIUM ya HIGH likhein.'
      : 'You are ArogyaBot, an AI health assistant for rural India. Analyze symptoms, give home remedies and advice. Always end with SEVERITY: LOW, MEDIUM, or HIGH.';

    const messages = [{ role:'system', content:sysPrompt }, ...chatHistory.slice(-8)];

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + GROQ_KEY },
      body: JSON.stringify({ model:'llama-3.3-70b-versatile', messages, max_tokens:600, temperature:0.7 })
    });

    if (!resp.ok) { const e = await resp.json(); throw new Error(e.error?.message || 'Groq error ' + resp.status); }
    const data = await resp.json();
    const reply = data.choices[0].message.content;
    chatHistory.push({ role:'assistant', content:reply });
    hideTyping();

    const sev = reply.match(/SEVERITY:\s*(LOW|MEDIUM|HIGH)/i)?.[1]?.toUpperCase();
    const clean = reply.replace(/SEVERITY:\s*(LOW|MEDIUM|HIGH)/gi,'').trim();
    addMessage('bot', clean, sev);

    // Save to Supabase
    sb.from('consultations').insert({ user_id:USER_ID, symptoms:text, ai_response:reply, severity:sev||'UNKNOWN', language:lang })
      .then(({error}) => { if(error) console.log('DB error:', error); else console.log('Saved to Supabase!'); });

  } catch(err) {
    hideTyping();
    let msg = err.message;
    if (msg.includes('fetch')||msg.includes('Failed')) msg = '❌ Cannot connect. Check internet connection.';
    else if (msg.includes('401')) msg = '❌ Invalid API key.';
    else if (msg.includes('429')) msg = '❌ Rate limit. Wait a moment and try again.';
    addMessage('bot', msg);
  }
}

function addMessage(role, text, severity) {
  const msgs = document.getElementById('chat-messages');
  const row = document.createElement('div'); row.className = 'msg-row ' + role;
  const av = document.createElement('div'); av.className = 'msg-avatar ' + (role==='bot'?'bot-avatar':'user-avatar'); av.textContent = role==='bot'?'AB':'U';
  const bub = document.createElement('div'); bub.className = 'msg-bubble ' + (role==='bot'?'bot-bubble':'user-bubble');
  bub.innerHTML = text.replace(/\n/g,'<br/>');
  if (severity) {
    const cls = severity==='LOW'?'severity-low':severity==='HIGH'?'severity-high':'severity-medium';
    const emoji = severity==='LOW'?'✅':severity==='HIGH'?'🚨':'⚠️';
    const label = severity==='LOW'?(lang==='hi'?'घर पर उपचार':'Manage at home'):severity==='HIGH'?(lang==='hi'?'तुरंत अस्पताल जाएं':'Emergency care now'):(lang==='hi'?'जल्द डॉक्टर से मिलें':'See doctor soon');
    const badge = document.createElement('div'); badge.style.marginTop='10px';
    badge.innerHTML = '<span class="severity-badge '+cls+'">'+emoji+' '+severity+': '+label+'</span>';
    bub.appendChild(badge);
    if (severity==='HIGH'||severity==='MEDIUM') {
      const btn = document.createElement('button'); btn.className='chip'; btn.style.marginTop='10px'; btn.style.display='block';
      btn.textContent = lang==='hi'?'🏥 पास के अस्पताल खोजें':'🏥 Find Nearest Hospital';
      btn.onclick = () => { switchTab('hospitals'); findHospitals(); };
      bub.appendChild(btn);
    }
  }
  row.appendChild(av); row.appendChild(bub); msgs.appendChild(row);
  msgs.scrollTop = msgs.scrollHeight;
}

let typingRow = null;
function showTyping() {
  const msgs = document.getElementById('chat-messages');
  typingRow = document.createElement('div'); typingRow.className='msg-row bot';
  const av = document.createElement('div'); av.className='msg-avatar bot-avatar'; av.textContent='AB';
  const t = document.createElement('div'); t.className='typing-indicator';
  t.innerHTML='<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  typingRow.appendChild(av); typingRow.appendChild(t); msgs.appendChild(typingRow);
  msgs.scrollTop = msgs.scrollHeight;
}
function hideTyping() { if(typingRow){typingRow.remove();typingRow=null;} }

// ═══════════════════════════════════════════════
//  VOICE
// ═══════════════════════════════════════════════
function toggleVoice() {
  if (!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)) { showToast('Voice not supported. Use Chrome.'); return; }
  const btn = document.getElementById('mic-btn');
  if (isRecording) { recognition.stop(); isRecording=false; btn.classList.remove('recording'); return; }
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition = new SR(); recognition.lang = lang==='hi'?'hi-IN':'en-IN'; recognition.interimResults=false;
  recognition.onresult = e => { document.getElementById('chat-input').value=e.results[0][0].transcript; sendMessage(); };
  recognition.onend = () => { isRecording=false; btn.classList.remove('recording'); };
  recognition.onerror = () => { isRecording=false; btn.classList.remove('recording'); showToast('Could not hear. Try again.'); };
  recognition.start(); isRecording=true; btn.classList.add('recording');
  showToast(lang==='hi'?'🎤 सुन रहा हूं...':'🎤 Listening...');
}

// ═══════════════════════════════════════════════
//  HOSPITALS
// ═══════════════════════════════════════════════
function findHospitals() {
  const btn = document.getElementById('locate-btn');
  btn.disabled = true;
  document.getElementById('locate-btn-text').textContent = lang==='hi'?'स्थान खोज रहे हैं...':'Getting location...';
  navigator.geolocation.getCurrentPosition(async pos => {
    const {latitude:lat, longitude:lon} = pos.coords;
    const mapDiv = document.getElementById('map-container');
    mapDiv.style.display='block';
    mapDiv.innerHTML=`<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-.05}%2C${lat-.05}%2C${lon+.05}%2C${lat+.05}&layer=mapnik&marker=${lat}%2C${lon}" style="width:100%;height:260px;border:none;display:block;"></iframe>`;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&lat=${lat}&lon=${lon}&q=hospital+clinic+health&limit=8`);
      const places = await res.json();
      const list = document.getElementById('hospital-list'); list.innerHTML='';
      if (!places.length) { list.innerHTML=`<div class="location-card"><p>${lang==='hi'?'पास में अस्पताल नहीं मिला':'No hospitals found nearby'}</p></div>`; }
      else places.slice(0,6).forEach(p => {
        const dist = haversine(lat,lon,parseFloat(p.lat),parseFloat(p.lon));
        const card = document.createElement('div'); card.className='hospital-card';
        card.innerHTML=`<div class="hospital-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A5C38" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
        <div class="hospital-info"><div class="hospital-name">${p.display_name.split(',')[0]}</div><div class="hospital-dist">📍 ${dist<1?(dist*1000).toFixed(0)+' m':dist.toFixed(1)+' km'} away</div><div class="hospital-type">${p.type||'Health facility'}</div></div>
        <button class="directions-btn" onclick="openDir(${p.lat},${p.lon})">${lang==='hi'?'दिशा':'Directions'}</button>`;
        list.appendChild(card);
      });
    } catch(e) { console.log(e); }
    btn.disabled=false; document.getElementById('locate-btn-text').textContent=T[lang].locateBtn;
  }, () => { btn.disabled=false; document.getElementById('locate-btn-text').textContent=T[lang].locateBtn; showToast(lang==='hi'?'स्थान एक्सेस नहीं हो पाया':'Location access denied.'); });
}

function haversine(a,b,c,d){const R=6371,dL=(c-a)*Math.PI/180,dO=(d-b)*Math.PI/180,x=Math.sin(dL/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dO/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function openDir(lat,lon){window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,'_blank');}

// ═══════════════════════════════════════════════
//  REMINDERS
// ═══════════════════════════════════════════════
function addReminder() {
  const name = document.getElementById('med-name').value.trim();
  if (!name) { showToast(lang==='hi'?'दवाई का नाम डालें':'Enter medicine name'); return; }
  const reminder = {
    id: Date.now(), name,
    dosage: document.getElementById('med-dosage').value.trim(),
    freq: document.getElementById('med-freq').value,
    time: document.getElementById('med-time').value,
    duration: document.getElementById('med-duration').value.trim()
  };
  reminders.push(reminder);
  localStorage.setItem('ab_reminders', JSON.stringify(reminders));
  sb.from('reminders').insert({ user_id:USER_ID, medicine_name:name, dosage:reminder.dosage, frequency:reminder.freq, time:reminder.time, duration:reminder.duration })
    .then(({error}) => { if(error) console.log('Reminder DB error:',error); else console.log('Reminder saved to cloud!'); });
  document.getElementById('med-name').value='';
  document.getElementById('med-dosage').value='';
  document.getElementById('med-duration').value='';
  renderReminders();
  scheduleNotification(reminder);
  showToast(lang==='hi'?'✅ अनुस्मारक जोड़ा गया! 🔔 Notification set!':'✅ Reminder saved! 🔔 Notification scheduled!');
}

function deleteReminder(id) {
  reminders = reminders.filter(r => r.id !== id);
  localStorage.setItem('ab_reminders', JSON.stringify(reminders));
  sb.from('reminders').delete().eq('id', String(id)).then(() => console.log('Deleted from cloud'));
  renderReminders(); showToast('🗑️ Reminder deleted');
}

function shareWhatsApp(r) {
  const msg = lang==='hi'
    ? `💊 दवाई याद दिलाना:\n${r.name} - ${r.dosage}\nसमय: ${r.time}\n${r.freq}\nअवधि: ${r.duration}`
    : `💊 Medicine Reminder:\n${r.name} - ${r.dosage}\nTime: ${r.time}\n${r.freq}\nDuration: ${r.duration}`;
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
}

function renderReminders() {
  const list = document.getElementById('reminders-list');
  const none = document.getElementById('no-reminders');
  list.innerHTML=''; list.appendChild(none);
  none.style.display = reminders.length?'none':'block';
  reminders.forEach(r => {
    const card = document.createElement('div'); card.className='reminder-card';
    card.innerHTML=`<div class="reminder-dot"></div>
    <div class="reminder-info"><div class="reminder-name">💊 ${r.name}${r.dosage?' — '+r.dosage:''}</div><div class="reminder-meta">🕐 ${r.time} · ${r.freq}${r.duration?' · '+r.duration:''}</div></div>
    <button class="whatsapp-btn" onclick='shareWhatsApp(${JSON.stringify(r)})'><svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp</button>
    <button class="delete-btn" onclick="deleteReminder(${r.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>`;
    list.insertBefore(card, none);
  });
}

// ═══════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════
function showToast(msg) {
  const ex = document.querySelector('.toast'); if(ex) ex.remove();
  const t = document.createElement('div'); t.className='toast'; t.textContent=msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(), 2800);
}

// ═══════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════
function updateNotifStatus() {
  const el = document.getElementById('notif-status-text');
  if (!el) return;
  if (!('Notification' in window)) {
    el.textContent = '❌ Notifications not supported in this browser. Use Chrome!';
    el.style.color = '#991B1B';
  } else if (Notification.permission === 'granted') {
    el.textContent = '✅ Notifications enabled — reminders will pop up on time!';
    el.style.color = '#065F46';
  } else if (Notification.permission === 'denied') {
    el.textContent = '❌ Notifications blocked! Go to Chrome Settings → Site Settings → Notifications → Allow';
    el.style.color = '#991B1B';
  } else {
    el.textContent = '⚠️ Click "Test Now" to enable notifications';
    el.style.color = '#92400E';
  }
}

async function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission();
    updateNotifStatus();
    return result;
  }
  updateNotifStatus();
  return Notification.permission;
}

async function testNotification() {
  if (!('Notification' in window)) {
    showToast('❌ Use Google Chrome for notifications!');
    return;
  }
  // Request permission first
  const perm = await Notification.requestPermission();
  updateNotifStatus();
  if (perm !== 'granted') {
    showToast('❌ Please allow notifications in Chrome settings!');
    return;
  }
  // Fire a test notification immediately
  const notif = new Notification('💊 ArogyaBot — Test Notification', {
    body: 'Notifications are working! Your medicine reminders will appear like this.',
    requireInteraction: false
  });
  notif.onclick = () => notif.close();
  showToast('✅ Test notification sent! Check top-right of screen.');
}

// Schedule notifications for all reminders
function scheduleAllNotifications() {
  reminders.forEach(r => scheduleNotification(r));
}

function scheduleNotification(r) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const [hours, minutes] = r.time.split(':').map(Number);
  const now = new Date();
  const notifTime = new Date();
  notifTime.setHours(hours, minutes, 0, 0);

  // If time already passed today → schedule for tomorrow
  if (notifTime <= now) notifTime.setDate(notifTime.getDate() + 1);

  const delay = notifTime - now;
  const mins = Math.round(delay / 60000);
  console.log('⏰ Scheduled: ' + r.name + ' in ' + mins + ' minutes');
  showToast('⏰ ' + r.name + ' reminder set for ' + r.time + ' (' + mins + ' mins away)');

  setTimeout(() => {
    const notif = new Notification('💊 ArogyaBot Medicine Reminder', {
      body: 'Time to take ' + r.name + (r.dosage ? ' — ' + r.dosage : '') + '\n' + r.freq,
      requireInteraction: true,
      tag: 'reminder-' + r.id
    });
    notif.onclick = () => {
      const msg = '💊 Medicine Reminder:\n' + r.name + ' - ' + (r.dosage||'') + '\nTime: ' + r.time + '\n' + r.freq + (r.duration ? '\nDuration: ' + r.duration : '');
      window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
      notif.close();
    };
    showToast('🔔 Time to take ' + r.name + '!');
    // Schedule again for next day
    setTimeout(() => scheduleNotification(r), 24 * 60 * 60 * 1000);
  }, delay);
}

// ═══════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════
renderReminders();
requestNotifPermission().then(() => { scheduleAllNotifications(); updateNotifStatus(); });