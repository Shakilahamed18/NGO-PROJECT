async function startQrScanner() {

    const qrReader = document.getElementById("qr-reader");
    qrReader.style.display = "block";

    const html5QrCode = new Html5Qrcode("qr-reader");

    try {

        await html5QrCode.start(
            { facingMode: "environment" }, // On laptops, you can change to "user"
            {
                fps: 10,
                qrbox: 250
            },

            async (decodedText) => {

                console.log("Scanned QR:", decodedText);

                try {

                    const response = await api(
                        `/api/attendance/checkin/${decodedText}`,
                        "POST"
                    );

                    console.log(response);

                    toast("Attendance marked successfully ✅", "success");

                    await html5QrCode.stop();

                    qrReader.style.display = "none";
                    qrReader.innerHTML = "";

                } catch (e) {

                    console.error(e);

                    toast(e.message || "Attendance failed", "error");

                }

            },

            (errorMessage) => {
                // Ignore scan errors while searching for a QR code
                // console.log(errorMessage);
            }

        );

    } catch (err) {

        console.error(err);

        toast("Unable to start camera", "error");

    }
}


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
function loadDashboard() {
  document.getElementById('dashName').textContent = userName || userEmail;
  loadMyApplications();
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
<div class="applications-container">

<div class="applications-header">

      <h2>📋 My Applications</h2>

      

    </div>

    <div class="table-wrap">

        <table class="applications-table">

            <thead>

                <tr>

                    <th>🌿 Event</th>

                    <th>📅 Date</th>

                    <th>Status</th>

                    <th style="text-align:center;">Actions</th>

                </tr>

            </thead>

            <tbody>

                ${apps.map(a => `

                <tr>

                    <td>

                        <div class="event-info">
<div class="event-logo">
    ${['🌿','🌊','🌳','🏥','📚','🎨','🤝','🌍'][a.eventId % 8]}
</div>

                            <div>

                                <div class="event-title">

                                    ${a.eventTitle}

                                </div>

                            </div>

                        </div>

                    </td>

                    <td>

                        ${a.eventDate ? fmtDate(a.eventDate) : "-"}

                    </td>

                    <td>

                        <span class="status ${a.status}">

                            ${a.status}

                        </span>

                    </td>

                    <td class="actions">

                        ${
                            a.status === "COMPLETED"
                            ? `
                            <button
                                class="mini-btn certificate"
                                onclick="showCertificate(${a.id},'${a.eventTitle}','${a.eventDate || ''}')">

                                🏆

                            </button>

                            <button
                                class="mini-btn rating"
                                onclick="openRateModal(${a.eventId},'${a.eventTitle}')">

                                ⭐

                            </button>
                            `
                            : `<span class="no-action">No Actions</span>`
                        }

                    </td>

                </tr>

                `).join("")}

            </tbody>

        </table>

    </div>

</div>
`;
  } catch(e) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><h3>${e.message}</h3></div>`;
  }
}


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

