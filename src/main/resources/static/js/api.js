const API = '';

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
function toast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = type;
    t.style.display = 'block';

    setTimeout(() => {
        t.style.display = 'none';
    }, 3500);
}

// ── API ──
async function api(path, method = 'GET', body = null, auth = true) {

    const headers = {
        'Content-Type': 'application/json'
    };

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

// ── FORMAT DATE ──
function fmtDate(dt) {

    if (!dt) return "—";

    return new Date(dt).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}