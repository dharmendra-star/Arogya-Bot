# ⚡ ArogyaBot — Judge Q&A Cheat Sheet
> Updated with final tech stack: Groq AI + Supabase Database

---

## 🎯 What to say when judges ask...

### "What does your app do?"
ArogyaBot is an AI-powered rural health assistant. Users describe symptoms
in Hindi or English by typing or speaking. Our AI gives health guidance,
home remedies, and a severity rating (LOW / MEDIUM / HIGH). It also finds
nearby hospitals using GPS and manages medicine reminders with WhatsApp sharing.
All data is saved to a cloud database in real time.

### "What problem does it solve?"
65% of India lives in rural areas with a doctor-patient ratio of 1:11,000.
Many delay seeking help due to language barriers and distance. ArogyaBot
gives instant first-point-of-contact health guidance in their own language,
24/7, on any basic smartphone — no installation needed.

### "What tech stack did you use?"
- Frontend  : HTML5 + CSS3 + Vanilla JavaScript (single file!)
- AI Engine : Groq API — Llama 3.3 70B (completely free)
- Database  : Supabase (PostgreSQL) — real-time cloud sync
- Voice     : Web Speech API — Hindi & English
- Maps      : OpenStreetMap + Nominatim (free, no API key)
- Directions: Google Maps URL API

### "Why Groq instead of ChatGPT or Claude?"
Groq is completely free with 14,400 requests/day. It runs Llama 3.3 70B
which is as smart as GPT-4, and is 10x faster than other APIs. Perfect for
rural users on slow internet connections. No credit card needed.

### "How does the AI work?"
We send the user symptoms to Groq Llama 3.3 with a health assistant system
prompt. The AI always returns SEVERITY: LOW (home treatment), MEDIUM (see
doctor), or HIGH (emergency). We parse this and show a colored badge.

### "Where is data stored?"
All consultations and reminders are saved to Supabase PostgreSQL in real
time. Each user gets an anonymous ID in their browser. You can see live
data right now at supabase.com → ArogyaBot project → Table Editor.

### "How does it scale?"
- Works on any smartphone with Chrome — no app download needed
- Supabase handles millions of records — enterprise grade database
- Groq gives 14,400 free AI requests per day
- Deployable as WhatsApp bot — 500M+ users in India
- ASHA Worker dashboard planned for last-mile reach

### "Is it production ready?"
Core features are fully functional — AI chat, hospital finder, reminders,
cloud database, voice input, Hindi/English. For production we would add
user authentication, doctor verification, and government PHC API integration.

---

## 🔥 Demo Flow (Step by Step for Judges)
1. Open ArogyaBot_Final.html in Chrome
2. Type "Fever and headache" → show AI response + MEDIUM badge
3. Switch to Hindi → type symptoms → show Hindi response
4. Click mic button → speak symptom → show voice detection
5. Click Hospitals tab → allow location → show map + hospital list
6. Click Reminders tab → add medicine → click WhatsApp share
7. Open Supabase dashboard → show live data saved in real time!

---

## 📊 Key Stats to Mention
- Rural Population    : 65%+ of India (900M+ people)
- Doctor ratio        : 1:11,000 (WHO recommends 1:1,000)
- Healthcare access   : Only 30% of rural Indians
- WhatsApp India      : 500M+ users
- Groq free requests  : 14,400/day
- Supabase free tier  : 50,000 rows free

## 📞 Emergency Numbers
- Ambulance               : 108
- National Health Helpline : 104
