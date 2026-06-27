function eventCard(ev, showApply = false, showDelete = false) {

    const icons = ['🌿', '🌊', '🏥', '🌳', '🤝', '📚', '🎨', '🌍'];
    const icon = icons[ev.id % icons.length];

    const avgRating = getAvgRating(ev.id);

    const ratingHtml = avgRating > 0
        ? `<div class="rating-display">
                <span class="stars-show">⭐ ${avgRating.toFixed(1)}</span>
           </div>`
        : `<div class="rating-display no-rating">
                ⭐ No Ratings
           </div>`;

    return `

    <div class="event-card">

        <div class="event-header">

            <div class="event-icon">
                ${icon}
            </div>

            <div>

                <h3>${ev.title}</h3>

                <span class="event-date">
                    📅 ${fmtDate(ev.date)}
                </span>

            </div>

        </div>

        <p class="event-description">

            ${ev.description || "No description available."}

        </p>

        <div class="event-location">

            📍 ${ev.location}

        </div>

        ${ratingHtml}

        <div class="event-footer">

            ${
                showApply
                ? `<button class="apply-btn"
                        onclick="applyEvent(${ev.id},this)">
                        Apply Now →
                   </button>`
                : ""
            }

            ${
                showDelete
                ? `<button class="delete-btn"
                        onclick="deleteEvent(${ev.id})">
                        Delete
                   </button>`
                : ""
            }

            ${
                !showApply && !showDelete && !token
                ? `<button class="apply-btn"
                        onclick="showPage('login')">
                        Login to Apply
                   </button>`
                : ""
            }

        </div>

    </div>

    `;
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

    const el = document.getElementById("dashEventsList");

    el.innerHTML = `<div class="loading"><div class="spinner"></div>Loading...</div>`;

    try {

        const events = await api("/api/events");

        // Update Upcoming Event Card
        const next = document.getElementById("nextEventText");

        if (events.length > 0) {

            next.innerHTML = `
                <strong>${events[0].title}</strong><br>
                📍 ${events[0].location}<br>
                📅 ${fmtDate(events[0].date)}
            `;

        } else {

            next.innerHTML = "No upcoming events available.";

        }

        el.innerHTML = events.map(ev => eventCard(ev, true)).join("");

    } catch (e) {

        el.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⚠️</div>
                <h3>${e.message}</h3>
            </div>
        `;

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


function openEventModal(ev, showApply){

    const icons=['🌿','🌊','🏥','🌳','🤝','📚','🎨','🌍'];

    document.getElementById("modalIcon").innerHTML =
        icons[ev.id % icons.length];

    document.getElementById("modalTitle").innerHTML =
        ev.title;

    document.getElementById("modalDate").innerHTML =
        fmtDate(ev.date);

    document.getElementById("modalLocation").innerHTML =
        ev.location;

    document.getElementById("modalDescription").innerHTML =
        ev.description || "No description available.";

    const rating=getAvgRating(ev.id);

    document.getElementById("modalRating").innerHTML =
        rating>0
        ? `⭐ ${rating.toFixed(1)} / 5`
        : "⭐ No ratings yet";

    const btn=document.getElementById("modalApplyBtn");

    if(showApply){

        btn.style.display="inline-block";

        btn.onclick=()=>{

            applyEvent(ev.id);

            closeModal("eventModal");

        };

    }else{

        btn.style.display="none";

    }

    openModal("eventModal");

}

function loadUpcomingEvent(events){

    const txt=document.getElementById("nextEventText");

    if(!txt) return;

    if(!events || events.length===0){

        txt.innerHTML="No upcoming events available.";

        return;

    }

    const event=events[0];

    txt.innerHTML=`
        <strong>${event.title}</strong><br>
        📍 ${event.location}<br>
        📅 ${fmtDate(event.date)}
    `;

}