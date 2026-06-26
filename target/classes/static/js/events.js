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

