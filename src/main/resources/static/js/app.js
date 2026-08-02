
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
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show selected page
    document.getElementById('page-' + name).classList.add('active');

    window.scrollTo(0, 0);

    if (name === 'home') {
        loadHomeEvents();
    }

    if (name === 'events') {
        loadAllEvents();
    }

    if (name === 'dashboard') {
        loadDashboard();

        // Reset user tabs
        document.getElementById('myApps').style.display = 'block';
        document.getElementById('browseEvents').style.display = 'none';
        document.getElementById('myCerts').style.display = 'none';

        // Highlight first user tab
        document.querySelectorAll('#page-dashboard .tab').forEach(t => t.classList.remove('active'));
        document.querySelector('#page-dashboard .tab').classList.add('active');
    }

    if (name === 'admin') {
        loadAdminDashboard();

        // Reset admin tabs
        document.getElementById('adminEvents').style.display = 'block';
        document.getElementById('adminApps').style.display = 'none';

        // Highlight first admin tab
        document.querySelectorAll('#page-admin .tab').forEach(t => t.classList.remove('active'));
        document.querySelector('#page-admin .tab').classList.add('active');
    }
}



function switchUserTab(tabId, btn){
    ['myApps','browseEvents','myCerts'].forEach(id=>{
        document.getElementById(id).style.display='none';
    });

    btn.parentElement.querySelectorAll('.tab')
       .forEach(t=>t.classList.remove('active'));

    document.getElementById(tabId).style.display='block';
    btn.classList.add('active');

    if(tabId==='browseEvents') loadDashEvents();
    if(tabId==='myCerts') loadCertificates();
}

function switchAdminTab(tabId, btn){
    ['adminEvents','adminApps'].forEach(id=>{
        document.getElementById(id).style.display='none';
    });

    btn.parentElement.querySelectorAll('.tab')
       .forEach(t=>t.classList.remove('active'));

    document.getElementById(tabId).style.display='block';
    btn.classList.add('active');

    if(tabId==='adminEvents') loadAdminEvents();
    if(tabId==='adminApps') loadAdminApps();
}

function openCreateModal() { document.getElementById('createModal').classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }


updateNav();
loadHomeEvents();
