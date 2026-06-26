const API = '';  // same origin — no need for full URL

// ── STATE ──
let token = localStorage.getItem('token') || null;
let userRole = localStorage.getItem('role') || null;
let userName = localStorage.getItem('userName') || null;
let userEmail = localStorage.getItem('userEmail') || null;
let currentRating = 0;
let currentRateAppId = null;
let currentRateEventName = '';
let ratings = JSON.parse(localStorage.getItem('ratings') || '{}');
let searchTimer = null;

// ── TOAST ──
function toast(msg, type='info') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = type; t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3500);
}

// ── API ──
async function api(path, method='GET', body=null, auth=true) {
  const headers = {'Content-Type':'application/json'};

  if (auth && token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  if (res.status === 401) {
    localStorage.clear();
    alert("Session expired. Please login again.");
    location.reload();
    return;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// ── NAV ──

function startQrScanner() {

    const html5QrCode = new Html5Qrcode("qr-reader");

    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: 250
        },
        async (decodedText) => {

            console.log("Scanned QR:", decodedText);
            alert("Scanned QR: " + decodedText);

            try {

                const response = await api(
                    `/api/attendance/checkin/${decodedText}`,
                    "POST"
                );

                console.log(response);

                toast("Attendance marked successfully ✅", "success");

                await html5QrCode.stop();

            } catch (e) {

                console.error(e);

                alert(JSON.stringify(e));

                toast(e.message || "Attendance failed", "error");
            }

        }
    );
}

function updateNav() {
  const nav = document.getElementById('navLinks');
  if (token) {
    nav.innerHTML = `
      <button class="nav-btn ghost" onclick="showPage('home')">🏠 Home</button>
      <button class="nav-btn ghost" onclick="showPage('events')">📅 Events</button>
      <span class="user-badge">👤 ${userName||userEmail}</span>
      <span class="role-badge">${userRole}</span>
      <button class="nav-btn ghost" onclick="showPage('${userRole==='ADMIN'?'admin':'dashboard'}')">Dashboard</button>
      <button class="nav-btn primary" onclick="doLogout()">Logout</button>
    `;
  } else {
    nav.innerHTML = `
      <button class="nav-btn ghost" onclick="showPage('home')">🏠 Home</button>
      <button class="nav-btn ghost" onclick="showPage('events')">📅 Events</button>
      <button class="nav-btn primary" onclick="showPage('login')">Login</button>
      <button class="nav-btn accent" onclick="showPage('register')">Register</button>
    `;
  }
}

// ── ROUTING ──
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  window.scrollTo(0,0);
  if (name==='home')      loadHomeEvents();
  if (name==='events')    loadAllEvents();
  if (name==='dashboard') loadDashboard();
  if (name==='admin')     loadAdminDashboard();
}

function switchTab(tabId, btn) {
  const section = btn.closest('.section');
  section.querySelectorAll('[id]').forEach(el => {
    if (['myApps','browseEvents','myCerts','adminEvents','adminApps'].includes(el.id))
      el.style.display = 'none';
  });
  section.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  btn.classList.add('active');
  if (tabId==='browseEvents') loadDashEvents();
  if (tabId==='adminApps')    loadAdminApps();
  if (tabId==='adminEvents')  loadAdminEvents();
  if (tabId==='myCerts')      loadCertificates();
}

// ── FORMAT ──
function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}

// ── EVENT CARD ──
function eventCard(ev, showApply=false, showDelete=false) {
  const icons = ['🌿','🌊','🏥','🌳','🤝','📚','🎨','🌍'];
  const icon = icons[ev.id % icons.length];
  const avgRating = getAvgRating(ev.id);
  const ratingHtml = avgRating > 0
    ? `<div class="rating-display"><span class="stars-show">${'★'.repeat(Math.round(avgRating))}</span><span>${avgRating.toFixed(1)}/5</span></div>`
    : `<div class="rating-display" style="color:#ccc;font-size:12px;">No ratings yet</div>`;
  return `
    <div class="card">
      <div class="card-top">
        <div class="card-icon">${icon}</div>
        <div class="card-title">${ev.title}</div>
        <div class="card-date">📅 ${fmtDate(ev.date)}</div>
      </div>
      <div class="card-body">
        <div class="card-desc">${ev.description||'No description provided.'}</div>
        <div class="card-meta">📍 ${ev.location}</div>
        ${ratingHtml}
        <div class="card-actions">
          ${showApply ? `<button class="btn btn-green" style="padding:8px 16px;font-size:13px;" onclick="applyEvent(${ev.id},this)">✋ Apply</button>` : ''}
          ${showDelete ? `<button class="btn btn-danger" style="padding:8px 16px;font-size:13px;" onclick="deleteEvent(${ev.id})">🗑 Delete</button>` : ''}
          ${!showApply && !showDelete && !token ? `<button class="btn btn-green" style="padding:8px 16px;font-size:13px;" onclick="showPage('login')">Login to Apply</button>` : ''}
        </div>
      </div>
    </div>`;
}

// ══════════════════════════════════════
// 🔍 SEARCH & FILTER
// ══════════════════════════════════════
function liveSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(doSearch, 400); // 400ms debounce
}

async function doSearch() {
  const title    = document.getElementById('searchTitle').value.trim();
  const location = document.getElementById('searchLocation').value.trim();
  const dateVal  = document.getElementById('searchDate').value;
  const el       = document.getElementById('allEventsList');
  const info     = document.getElementById('searchInfo');
  const pageTitle = document.getElementById('eventsPageTitle');

  el.innerHTML = `<div class="loading"><div class="spinner"></div>Searching...</div>`;

  try {
    let url = '/api/events/search?';
    const params = [];
    if (title)    params.push('title=' + encodeURIComponent(title));
    if (location) params.push('location=' + encodeURIComponent(location));
    if (dateVal)  params.push('date=' + encodeURIComponent(dateVal + 'T00:00:00'));
    url += params.join('&');

    const events = await api(url, 'GET', null, false);

    const hasFilter = title || location || dateVal;
    pageTitle.textContent = hasFilter ? `🔍 Search Results` : '📅 All Events';

    if (hasFilter) {
      info.innerHTML = `Found <strong>${events.length}</strong> event${events.length!==1?'s':''} matching your search`;
    } else {
      info.innerHTML = '';
    }

    if (!events.length) {
      el.innerHTML = `
        <div class="empty">
          <div class="empty-icon">🔍</div>
          <h3>No events found</h3>
          <p>Try different search terms or <a href="#" onclick="clearSearch()" style="color:var(--green);">clear filters</a></p>
        </div>`;
      return;
    }
    el.innerHTML = events.map(ev => eventCard(ev,
      !!token && userRole==='USER',
      userRole==='ADMIN'
    )).join('');
  } catch(e) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><h3>${e.message}</h3></div>`;
  }
}

function clearSearch() {
  document.getElementById('searchTitle').value = '';
  document.getElementById('searchLocation').value = '';
  document.getElementById('searchDate').value = '';
  document.getElementById('searchInfo').innerHTML = '';
  document.getElementById('eventsPageTitle').textContent = '📅 All Events';
  loadAllEvents();
}

// ══════════════════════════════════════
// ⭐ RATINGS
// ══════════════════════════════════════
function getAvgRating(eventId) {
  const key = 'event_' + eventId;
  const data = ratings[key];
  if (!data || !data.length) return 0;
  return data.reduce((a,b) => a + b.score, 0) / data.length;
}

function openRateModal(appId, eventName) {
  currentRateAppId = appId;
  currentRateEventName = eventName;
  currentRating = 0;
  document.getElementById('rateEventName').textContent = eventName;
  document.getElementById('ratingComment').value = '';
  document.getElementById('ratingLabel').textContent = 'Click a star to rate';
  document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
  document.getElementById('rateModal').classList.add('open');
}

function setRating(val) {
  currentRating = val;
  const labels = ['','Poor 😞','Fair 😐','Good 😊','Great 😃','Excellent 🌟'];
  document.getElementById('ratingLabel').textContent = labels[val];
  document.querySelectorAll('#ratingStars .star').forEach((s,i) => {
    s.classList.toggle('active', i < val);
  });
}

function submitRating() {
  if (!currentRating) return toast('Please select a rating!', 'error');
  const comment = document.getElementById('ratingComment').value.trim();
  const key = 'event_' + currentRateAppId;
  if (!ratings[key]) ratings[key] = [];
  ratings[key].push({
    score: currentRating,
    comment,
    user: userName,
    date: new Date().toLocaleDateString()
  });
  localStorage.setItem('ratings', JSON.stringify(ratings));
  closeModal('rateModal');
  toast(`Thanks for rating ${currentRateEventName}! ⭐`, 'success');
  loadMyApplications();
}

// ══════════════════════════════════════
// 📄 CERTIFICATES
// ══════════════════════════════════════
function showCertificate(appId, eventName, eventDate) {
  document.getElementById('certName').textContent = userName || userEmail;
  document.getElementById('certEvent').textContent = eventName;
  document.getElementById('certDate').textContent = 'Date: ' + fmtDate(eventDate);
  document.getElementById('certModal').classList.add('open');
}

function downloadCert() {
  const content = document.getElementById('certContent');
  const name = document.getElementById('certEvent').textContent;
  const text = `
====================================
    CERTIFICATE OF PARTICIPATION
====================================

This is to certify that

    ${userName || userEmail}

has successfully participated in

    ${name}

Date: ${document.getElementById('certDate').textContent}

🌿 VolunteerHub — NGO Platform
====================================
  `;
  const blob = new Blob([text], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Certificate_${name.replace(/\s+/g,'_')}.txt`;
  a.click();
  toast('Certificate downloaded! 🏆', 'success');
}

function loadCertificates() {
  const el = document.getElementById('certsList');
  api('/api/applications/my').then(apps => {
    const completed = apps.filter(a => a.status === 'COMPLETED');

    if (!completed.length) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">🏆</div><h3>No certificates yet</h3><p>Complete an event to earn certificates!</p></div>`;
      return;
    }

    el.innerHTML = completed.map(a => `
      <div class="card" style="margin-bottom:16px;">
        <div class="card-top" style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div class="card-icon">🏆</div>
            <div class="card-title">${a.eventTitle}</div>
            <div class="card-date">Status: COMPLETED ✅</div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-actions">
            <button class="btn btn-green" style="padding:8px 16px;font-size:13px;"
              onclick="showCertificate(${a.id},'${a.eventTitle}','${a.eventDate || ''}')">
              🏆 View Certificate
            </button>
            <button class="btn btn-accent" style="padding:8px 16px;font-size:13px;"
              onclick="openRateModal(${a.eventId},'${a.eventTitle}')">
              ⭐ Rate Event
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }).catch(e => {
    el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><h3>${e.message}</h3></div>`;
  });
}
// ══════════════════════════════════════
// LOAD EVENTS
// ══════════════════════════════════════
async function loadHomeEvents() {
  const el = document.getElementById('homeEventsList');
  try {
    const events = await api('/api/events','GET',null,false);
    document.getElementById('statEvents').textContent = events.length;
    if (!events.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">📭</div><h3>No events yet</h3></div>`; return; }
    el.innerHTML = events.slice(0,3).map(ev => eventCard(ev, !!token && userRole==='USER')).join('');
  } catch(e) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><h3>Could not load events</h3><p>Make sure backend is running.</p></div>`;
  }
}

async function loadAllEvents() {
  const el = document.getElementById('allEventsList');
  if (userRole==='ADMIN') document.getElementById('adminCreateBtn').style.display='block';
  el.innerHTML = `<div class="loading"><div class="spinner"></div>Loading...</div>`;
  try {
    const events = await api('/api/events','GET',null,false);
    document.getElementById('eventsPageTitle').textContent = '📅 All Events';
    document.getElementById('searchInfo').innerHTML = '';
    if (!events.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">📭</div><h3>No events yet</h3></div>`; return; }
    el.innerHTML = events.map(ev => eventCard(ev, !!token && userRole==='USER', userRole==='ADMIN')).join('');
  } catch(e) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><h3>${e.message}</h3></div>`;
  }
}

// ══════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════
function loadDashboard() {
  document.getElementById('dashName').textContent = userName || userEmail;
  loadMyApplications();
}

async function loadDashEvents() {
  const el = document.getElementById('dashEventsList');
  el.innerHTML = `<div class="loading"><div class="spinner"></div>Loading...</div>`;
  try {
    const events = await api('/api/events');
    el.innerHTML = events.map(ev => eventCard(ev, true)).join('') ||
      `<div class="empty"><div class="empty-icon">📭</div><h3>No events</h3></div>`;
  } catch(e) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><h3>${e.message}</h3></div>`;
  }
}

async function loadMyApplications() {
  const el = document.getElementById('myAppsList');
  el.innerHTML = `<div class="loading"><div class="spinner"></div>Loading...</div>`;
  try {
    const apps = await api('/api/applications/my');
    document.getElementById('myAppCount').textContent = apps.length;
    document.getElementById('myApprovedCount').textContent = apps.filter(a=>a.status==='APPROVED').length;
    document.getElementById('myPendingCount').textContent = apps.filter(a=>a.status==='PENDING').length;
    document.getElementById('myRejectedCount').textContent = apps.filter(a=>a.status==='REJECTED').length;
    if (!apps.length) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><h3>No applications yet</h3><p>Browse events and apply!</p></div>`;
      return;
    }
    el.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Event</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${apps.map(a=>`
              <tr>
                <td><strong>${a.eventTitle}</strong></td>
                <td><span class="status ${a.status}">${a.status}</span></td>
                <td style="display:flex;gap:6px;flex-wrap:wrap;">
                  ${a.status==='COMPLETED' ? `
  <button class="btn" style="background:#d1e7dd;color:#0a3622;padding:6px 10px;font-size:12px;"
    onclick="showCertificate(${a.id},'${a.eventTitle}','${a.eventDate || ''}')">🏆 Certificate</button>
  <button class="btn" style="background:#fff3cd;color:#856404;padding:6px 10px;font-size:12px;"
    onclick="openRateModal(${a.eventId},'${a.eventTitle}')">⭐ Rate</button>
` : '—'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch(e) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><h3>${e.message}</h3></div>`;
  }
}

// ══════════════════════════════════════
// ADMIN
// ══════════════════════════════════════
function loadAdminDashboard() { loadAdminEvents(); }

async function loadAdminEvents() {
  const el = document.getElementById('adminEventsBody');

  try {
    console.log("Loading admin events...");

    const events = await api('/api/events', 'GET', null, false);

    console.log("Events received:", events);

    document.getElementById('adminEventCount').textContent = events.length;

    if (!events.length) {
      el.innerHTML =
        `<tr><td colspan="6" style="text-align:center;">No events found</td></tr>`;
      return;
    }

    el.innerHTML = events.map(ev => `
      <tr>
        <td>${ev.id}</td>
        <td>${ev.title}</td>
        <td>${fmtDate(ev.date)}</td>
        <td>${ev.location}</td>
        <td>—</td>
        <td>
          <td>
    <button class="btn btn-green"
        onclick="viewQr(${ev.id})">
        📷 View QR
    </button>

    <button class="btn btn-danger"
        onclick="deleteEvent(${ev.id})">
        🗑 Delete
    </button>
</td>
        </td>
      </tr>
    `).join('');

  } catch (e) {
    console.error("loadAdminEvents ERROR:", e);

    el.innerHTML =
      `<tr><td colspan="6" style="color:red">${e.message}</td></tr>`;
  }
}
async function loadAdminApps() {
  const el = document.getElementById('adminAppsBody');
  el.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;"><div class="spinner" style="margin:auto;"></div></td></tr>`;

  try {
    const apps = await api('/api/applications/all');

    document.getElementById('adminAppCount').textContent = apps.length;
    document.getElementById('adminPendingCount').textContent = apps.filter(a => a.status === 'PENDING').length;
    document.getElementById('adminApprovedCount').textContent = apps.filter(a => a.status === 'APPROVED').length;

    if (!apps.length) {
      el.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--gray);">No applications yet.</td></tr>`;
      return;
    }

    el.innerHTML = apps.map(a => `
      <tr>
        <td>#${a.id}</td>
        <td>👤 ${a.userName}<br/><small style="color:var(--gray)">${a.userEmail}</small></td>
        <td>${a.eventTitle}</td>
        <td><span class="status ${a.status}">${a.status}</span></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          ${a.status !== 'APPROVED' ? `
            <button class="btn" style="background:#d1e7dd;color:#0a3622;padding:6px 10px;font-size:12px;"
              onclick="updateStatus(${a.id},'APPROVED',this)">✅ Approve</button>
          ` : ''}

          ${a.status === 'APPROVED' ? `
            <button class="btn" style="background:#cfe2ff;color:#084298;padding:6px 10px;font-size:12px;"
              onclick="updateStatus(${a.id},'COMPLETED',this)">🏁 Complete</button>
          ` : ''}

          ${a.status !== 'REJECTED' ? `
            <button class="btn" style="background:#f8d7da;color:#842029;padding:6px 10px;font-size:12px;"
              onclick="updateStatus(${a.id},'REJECTED',this)">❌ Reject</button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  } catch (e) {
    el.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--danger);">${e.message}</td></tr>`;
  }
}
// ══════════════════════════════════════
// AUTH
// ══════════════════════════════════════
async function doRegister() {
  const name=document.getElementById('regName').value.trim();
  const email=document.getElementById('regEmail').value.trim();
  const password=document.getElementById('regPassword').value;
  if (!name||!email||!password) return toast('Please fill all fields','error');
  try {
    const data = await api('/api/auth/register','POST',{name,email,password},false);
    saveAuth(data,name);
    toast('Welcome to VolunteerHub! 🎉','success');
    showPage(userRole==='ADMIN'?'admin':'dashboard');
  } catch(e) { toast(e.message,'error'); }
}

async function doLogin() {
  const email=document.getElementById('loginEmail').value.trim();
  const password=document.getElementById('loginPassword').value;
  if (!email||!password) return toast('Please enter email and password','error');
  try {
    const data = await api('/api/auth/login','POST',{email,password},false);
    saveAuth(data,data.email);
    toast('Welcome back! 👋','success');
    showPage(userRole==='ADMIN'?'admin':'dashboard');
  } catch(e) { toast(e.message,'error'); }
}

function saveAuth(data,name) {
  token=data.token; userRole=data.role; userEmail=data.email; userName=name||data.email;
  localStorage.setItem('token',token);
  localStorage.setItem('role',userRole);
  localStorage.setItem('userEmail',userEmail);
  localStorage.setItem('userName',userName);
  updateNav();
}

function doLogout() {
  token=null; userRole=null; userName=null; userEmail=null;
  localStorage.clear();
  ratings = {};
  updateNav();
  showPage('home');
  toast('Logged out successfully','info');
}

// ══════════════════════════════════════
// APPLY
// ══════════════════════════════════════
async function applyEvent(eventId, btn) {
  if (!token) return showPage('login');
  btn.disabled=true; btn.textContent='Applying...';
  try {
    await api(`/api/applications/apply/${eventId}`,'POST');
    btn.textContent='✅ Applied!'; btn.style.background='#52b788';
    toast('Application submitted! 🎉','success');
    loadMyApplications();
  } catch(e) {
    btn.disabled=false; btn.textContent='✋ Apply';
    toast(e.message,'error');
  }
}

// ══════════════════════════════════════
// CREATE / DELETE EVENT
// ══════════════════════════════════════
function openCreateModal() { document.getElementById('createModal').classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

async function handleCreateEvent() {
  console.log("CREATE BUTTON CLICKED");
  const title = document.getElementById('evTitle').value.trim();
  const desc = document.getElementById('evDesc').value.trim();
  const dateVal = document.getElementById('evDate').value;
  const location = document.getElementById('evLocation').value.trim();

  if (!title) return toast('Please enter event title!', 'error');
  if (!dateVal) return toast('Please select event date!', 'error');
  if (!location) return toast('Please enter event location!', 'error');

  let formattedDate = dateVal;
  if (dateVal.length === 16) {
    formattedDate = dateVal + ':00';
  }

  try {
    await api('/api/events/create', 'POST', {
      title,
      description: desc || 'No description provided.',
      date: formattedDate,
      location
    });

    closeModal('createModal');
    toast('Event created successfully! 🌿', 'success');
    loadAdminEvents();
    loadAllEvents();
    showPage('admin');
  } catch (e) {
    console.error('Create event error:', e);
    toast('Error: ' + e.message, 'error');
  }
}

async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  try {
    await api(`/api/events/delete/${id}`,'DELETE');
    toast('Event deleted.','info');
    loadAdminEvents(); loadAllEvents();
  } catch(e) { toast(e.message,'error'); }
}

// ══════════════════════════════════════
// UPDATE STATUS
// ══════════════════════════════════════
async function updateStatus(id, status, btn) {
  btn.disabled=true;
  try {
    await api(`/api/applications/${id}/status`,'PUT',{status});
    toast(`Application ${status.toLowerCase()}! ✅`,'success');
    loadAdminApps();
  } catch(e) { btn.disabled=false; toast(e.message,'error'); }
}

// ══════════════════════════════════════
// 🌱 SEED SAMPLE EVENTS
// ══════════════════════════════════════
async function seedSampleEvents() {
  if (!confirm("This will create 6 sample events. Continue?")) return;

  const sampleEvents = [
    {
      title: "Beach Cleanup Drive",
      description: "Help us clean the local beach and protect marine life. Bring gloves and enthusiasm!",
      date: "2027-09-15T09:00:00",
      location: "Marina Beach, Chennai"
    },
    {
      title: "Tree Plantation Campaign",
      description: "Join hands to plant 1000 trees in the city park. Together we can make our city greener!",
      date: "2027-10-05T07:00:00",
      location: "Cubbon Park, Bangalore"
    },
    {
      title: "Blood Donation Camp",
      description: "Donate blood and save lives. Medical staff will be present. Every drop counts!",
      date: "2027-08-20T10:00:00",
      location: "City Hospital, Mumbai"
    },
    {
      title: "Food Distribution Drive",
      description: "Help distribute food to underprivileged communities. Bring compassion and kindness!",
      date: "2027-09-01T08:00:00",
      location: "Gandhi Nagar, Delhi"
    },
    {
      title: "Education Awareness Camp",
      description: "Teach underprivileged children basic reading and writing skills. Change a life today!",
      date: "2027-10-20T10:00:00",
      location: "Government School, Hyderabad"
    },
    {
      title: "Old Age Home Visit",
      description: "Spend quality time with elderly residents. Bring joy, stories and warm smiles!",
      date: "2027-11-05T11:00:00",
      location: "Sunshine Old Age Home, Pune"
    }
  ];

  let created = 0;
  let failed = 0;

  toast("Creating sample events... Please wait ⏳", "info");

  for (const event of sampleEvents) {
  try {
    const result = await api("/api/events/create", "POST", event);
    console.log("SUCCESS:", result);
    created++;
  } catch(e) {
    console.error("FAILED:", event.title, e);
    failed++;

    }
  }

  if (created > 0) {
    toast(`✅ ${created} sample events created successfully!`, "success");
    loadAdminEvents();
    loadAllEvents();
    loadHomeEvents();
  }
  if (failed > 0) {
      console.log("Failed Count =", failed);
      toast(`⚠️ ${failed} events failed`, "warning");

  }
}

function viewQr(eventId){

    document.getElementById("qrImage").src =
        `/api/events/${eventId}/qr`;

    document.getElementById("qrModal")
        .classList.add("open");
}

function downloadQr(){

    const img=document.getElementById("qrImage");

    const a=document.createElement("a");

    a.href=img.src;

    a.download="event-qr.png";

    a.click();
}

// ── INIT ──
updateNav();
loadHomeEvents();
