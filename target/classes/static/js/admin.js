function loadAdminDashboard() {
    console.log("Admin dashboard loaded");
    loadAdminEvents();
    loadAdminApps();
}
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
          <button class="btn btn-green"
                  onclick="viewQr(${ev.id})">
            📷 View QR
          </button>

          <button class="btn btn-danger"
                  onclick="deleteEvent(${ev.id})">
            🗑 Delete
          </button>
        </td>
      </tr>
    `).join('');
    console.log("Rows:", el.rows.length);
console.log("HTML:", el.innerHTML);

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

async function updateStatus(id, status, btn) {
  btn.disabled=true;
  try {
    await api(`/api/applications/${id}/status`,'PUT',{status});
    toast(`Application ${status.toLowerCase()}! ✅`,'success');
    loadAdminApps();
  } catch(e) { btn.disabled=false; toast(e.message,'error'); }
}
