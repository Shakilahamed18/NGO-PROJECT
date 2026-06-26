
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

function openCreateModal() { document.getElementById('createModal').classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }


updateNav();
loadHomeEvents();
