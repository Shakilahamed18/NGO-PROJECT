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