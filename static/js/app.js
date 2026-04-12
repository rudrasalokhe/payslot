// DocDrop v3 — Professional Frontend JS
'use strict';

let currentUser = null;
let allDoctors  = [];
let _allAppts   = [];
let _signupData = {};
let _otpTimer   = null;

let _profileDoctor = null;

function renderDoctorCards() {
  const container = $('doctorCards');
  if (!container) return;
  container.innerHTML = allDoctors.map(d => {
    const avatarHtml = d.photo_url
      ? `<img src="${d.photo_url}" alt="${d.name}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid ${d.color||'#c8f135'}33" onerror="this.style.display='none'">`
      : `<span style="width:72px;height:72px;border-radius:50%;background:${d.colorBg||'#2a2a28'};color:${d.color||'#c8f135'};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;font-family:monospace">${d.initials||'?'}</span>`;
    return `
      <div style="background:#252522;border:1px solid #32322e;border-radius:14px;padding:20px 16px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;transition:border-color .15s" onmouseover="this.style.borderColor='${d.color||'#c8f135'}55'" onmouseout="this.style.borderColor='#32322e'">
        ${avatarHtml}
        <div>
          <div style="font-size:14px;font-weight:700;font-family:'Syne',sans-serif;color:#e8e7d8;margin-bottom:3px">${d.name}</div>
          <div style="font-size:10px;font-family:monospace;color:${d.color||'#c8f135'};letter-spacing:.07em;text-transform:uppercase">${d.specialty}</div>
          ${d.experience ? `<div style="font-size:11px;font-family:monospace;color:#6b6b64;margin-top:3px">${d.experience} yrs exp</div>` : ''}
        </div>
        <div style="display:flex;gap:7px;width:100%;margin-top:2px">
          <button onclick="openDoctorProfile('${d.id}')" style="flex:1;padding:7px 0;background:none;border:1px solid #3a3a36;border-radius:8px;color:#9c9882;font-size:11px;font-family:monospace;cursor:pointer;transition:border-color .12s" onmouseover="this.style.borderColor='#6b6b64'" onmouseout="this.style.borderColor='#3a3a36'">Profile</button>
          <button onclick="openBookingModal('${d.id}')" style="flex:2;padding:7px 0;background:${d.colorBg||'rgba(200,212,72,0.12)'};border:1px solid ${d.color||'#c8f135'}55;border-radius:8px;color:${d.color||'#c8f135'};font-size:12px;font-family:'Syne',sans-serif;font-weight:700;cursor:pointer;transition:background .12s" onmouseover="this.style.background='${d.colorBg||'rgba(200,212,72,0.2)'}'" onmouseout="this.style.background='${d.colorBg||'rgba(200,212,72,0.12)'}'">Book →</button>
        </div>
      </div>`;
  }).join('');
}

function selectDoctor(doctorId) {
  $('doctorSelect').value = doctorId;
}

function openBookingModal(doctorId) {
  const d = allDoctors.find(x => x.id === doctorId);
  if (!d) return;
  selectDoctor(doctorId);

  // Populate header
  const avatarEl = $('bmAvatar');
  if (d.photo_url) {
    avatarEl.innerHTML = `<img src="${d.photo_url}" alt="${d.name}" style="width:52px;height:52px;border-radius:50%;object-fit:cover">`;
    avatarEl.style.background = 'none';
  } else {
    avatarEl.innerHTML = d.initials || '?';
    avatarEl.style.background = d.colorBg || '#2a2a28';
    avatarEl.style.color = d.color || '#c8f135';
  }
  $('bmName').textContent = d.name;
  $('bmSpecialty').textContent = d.specialty;
  $('bmHeader').style.borderTop = `3px solid ${d.color || '#c8f135'}`;

  // Reset fields
  $('pDate').value = '';
  $('slotSelect').value = '';
  $('pNotes').value = '';
  $('pDate').min = new Date().toISOString().split('T')[0];

  const modal = $('bookingModal');
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function closeBookingModal() {
  const modal = $('bookingModal');
  modal.classList.add('hidden');
  modal.style.display = 'none';
}

function openDoctorProfile(doctorId) {
  const d = allDoctors.find(x => x.id === doctorId);
  if (!d) return;
  _profileDoctor = d;

  // Avatar
  const avatarEl = $('dpAvatar');
  if (d.photo_url) {
    avatarEl.innerHTML = `<img src="${d.photo_url}" alt="${d.name}" style="width:72px;height:72px;border-radius:50%;object-fit:cover">`;
    avatarEl.style.background = 'none';
  } else {
    avatarEl.innerHTML = d.initials || '?';
    avatarEl.style.background = d.colorBg || '#2a2a28';
    avatarEl.style.color = d.color || '#c8f135';
  }

  $('dpName').textContent = d.name;
  $('dpSpecialty').textContent = d.specialty.toUpperCase();
  $('dpExp').textContent = d.experience ? `${d.experience} years experience` : 'Experienced';
  $('dpBio').textContent = d.bio || 'A dedicated medical professional committed to excellent patient care.';
  $('dpEducation').textContent = d.education || 'Medical degree from a recognised institution.';
  $('dpLanguages').textContent = (d.languages && d.languages.length) ? d.languages.join(', ') : 'English';

  const li = $('dpLinkedin');
  if (d.linkedin) {
    li.href = d.linkedin;
    li.style.display = 'flex';
  } else {
    li.style.display = 'none';
  }

  // Header accent border-top
  $('dpHeader').style.borderTop = `3px solid ${d.color || '#c8f135'}`;

  const modal = $('doctorProfileModal');
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function closeDoctorProfile() {
  const modal = $('doctorProfileModal');
  modal.classList.add('hidden');
  modal.style.display = 'none';
  _profileDoctor = null;
}

function selectDoctorFromProfile() {
  if (_profileDoctor) {
    const id = _profileDoctor.id;
    closeDoctorProfile();
    openBookingModal(id);
  }
}


function doctorAvatar(doctorId) {
  const d = allDoctors.find(x => x.id === doctorId);
  if (!d) return '';
  if (d.photo_url) {
    return `<img src="${d.photo_url}" alt="${d.name}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">`;
  }
  return `<span style="width:32px;height:32px;border-radius:50%;background:${d.colorBg||'#2a2a28'};color:${d.color||'#c8f135'};display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:monospace;flex-shrink:0">${d.initials||'?'}</span>`;
}

// ─── Token ───────────────────────────────────────────
const saveToken  = t  => sessionStorage.setItem('token', t);
const loadToken  = () => sessionStorage.getItem('token');
const clearToken = () => sessionStorage.removeItem('token');

// ─── API ─────────────────────────────────────────────
async function api(path, method = 'GET', body) {
  const token = loadToken();
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}
const get  = path       => api(path, 'GET');
const post = (path, body) => api(path, 'POST', body || {});

// ─── DOM helpers ─────────────────────────────────────
const $ = id => document.getElementById(id);
const show = id => $( id )?.classList.remove('hidden');
const hide = id => $( id )?.classList.add('hidden');
const val  = id => $( id )?.value.trim() ?? '';

// ─── Toast ───────────────────────────────────────────
function toast(msg, type = 'info') {
  const el    = $('toast');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  $('toastIcon').textContent = icons[type] || 'ℹ';
  $('toastMsg').textContent  = msg;
  el.className     = type;
  el.style.display = 'flex';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 3500);
}

// ─── Utils ───────────────────────────────────────────
function fmtDate(d) {
  return new Date(d + 'T00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });
}

function togglePw() {
  const inp = $('aPass');
  inp.type  = inp.type === 'password' ? 'text' : 'password';
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function toggleMobileNav() {
  $('mobileNav').classList.toggle('open');
}

// ─── Button loading state ────────────────────────────
function setBtnLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn._orig = btn.textContent;
    btn.textContent = text || 'Loading…';
  } else {
    btn.textContent = btn._orig || text || btn.textContent;
  }
}

// ─── Shell switching ─────────────────────────────────
function showLanding() {
  $('landingPage').style.display = '';
  $('appShell').classList.remove('visible');
  $('appShell').classList.add('hidden');
  document.body.style.overflow = '';
}

function showShell() {
  $('landingPage').style.display = 'none';
  const shell = $('appShell');
  shell.classList.remove('hidden');
  shell.classList.add('visible');
}

function backToLanding() {
  clearToken();
  currentUser = null;
  clearOtpTimer();
  hideChatFab();
  _chatHistory = [];
  showLanding();
}

// ════════════════════════════════════════════
//  ROUTING
// ════════════════════════════════════════════
function showApp(role, mode) {
  window._currentAuthRole = role;
  showShell();
  $('patientDash') && ($('patientDash').classList.add('hidden'), $('patientDash').style.display='none');
  hide('doctorAdmin');
  hide('callScreen');
  show('authScreen');
  show('authStep1');
  hide('authStep2');
  hide('authStep3');
  hide('authStep4');
  $('navUser').innerHTML = '';

  const isDoc = role === 'doctor';
  $('authTitle').textContent    = isDoc ? 'Doctor Login' : (mode === 'signup' ? 'Create account' : 'Welcome back');
  $('authSubtitle').textContent = isDoc ? 'Sign in to your doctor account.' : 'Access your patient account.';
  $('nameField').style.display  = (isDoc || mode === 'login') ? 'none' : '';

  const btns = $('authBtns');
  const hint = $('authHint');

  if (isDoc) {
    btns.innerHTML = `<button class="btn-cta" onclick="loginDoctor()" style="flex:1;margin:0">Sign in →</button>`;
    hint.textContent   = 'Demo: sarah@docdrop.com / doc123';
    hint.style.display = 'block';
    setTimeout(() => {
      let fpLink = $('fpLinkWrap');
      if (!fpLink) {
        fpLink = document.createElement('div');
        fpLink.id = 'fpLinkWrap';
        fpLink.style.cssText = 'text-align:center;margin-top:10px';
        $('authBtns').insertAdjacentElement('afterend', fpLink);
      }
      fpLink.innerHTML = `<a class="back-link" style="font-size:12px;cursor:pointer;color:#9c9882" onclick="showForgotStep1()">Forgot password?</a>`;
      fpLink.style.display = '';
    }, 0);
  } else if (mode === 'signup') {
    $('nameField').style.display = '';
    btns.innerHTML = `
      <button class="btn-secondary" onclick="switchAuthMode('login')" style="margin:0">Log in instead</button>
      <button class="btn-cta" onclick="initiateSignup()" style="margin:0">Sign Up →</button>`;
    hint.style.display = 'none';
  } else {
    btns.innerHTML = `
      <button class="btn-secondary" onclick="switchAuthMode('signup')" style="margin:0">Create account</button>
      <button class="btn-cta" onclick="loginPatient()" style="margin:0">Log in →</button>`;
    hint.style.display = 'none';
    // Inject forgot password link
    setTimeout(() => {
      let fpLink = $('fpLinkWrap');
      if (!fpLink) {
        fpLink = document.createElement('div');
        fpLink.id = 'fpLinkWrap';
        fpLink.style.cssText = 'text-align:center;margin-top:10px';
        fpLink.innerHTML = `<a class="back-link" style="font-size:12px;cursor:pointer;color:#9c9882" onclick="showForgotStep1()">Forgot password?</a>`;
        $('authBtns').insertAdjacentElement('afterend', fpLink);
      }
    }, 0);
  }
}

function switchAuthMode(mode) { showApp('patient', mode); }

// ════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════
async function loginPatient() {
  const email = val('aEmail'), pass = val('aPass');
  if (!email || !pass) return toast('Enter email and password', 'error');
  const btn = document.querySelector('#authBtns .btn-cta');
  setBtnLoading(btn, true, 'Signing in…');
  try {
    const data = await post('/api/auth/login/patient', { email, password: pass });
    saveToken(data.token);
    currentUser = data.user;
    await showPatientDash();
  } catch(e) {
    toast(e.message, 'error');
  } finally {
    setBtnLoading(btn, false, 'Log in →');
  }
}

async function initiateSignup() {
  const name = val('aName'), email = val('aEmail'), pass = val('aPass');
  if (!email || !pass) return toast('Email and password required', 'error');
  if (pass.length < 4)  return toast('Password must be at least 4 characters', 'error');
  if (!email.includes('@')) return toast('Enter a valid email address', 'error');

  const btn = document.querySelector('#authBtns .btn-cta');
  setBtnLoading(btn, true, 'Sending code…');

  try {
    await post('/api/auth/send-otp', { email, name });
    _signupData = { name, email, password: pass };
    hide('authStep1');
    show('authStep2');
    $('otpSubtext').textContent = `We sent a 6-digit code to ${email}. Expires in 10 minutes.`;
    document.querySelectorAll('.otp-digit').forEach(i => { i.value = ''; i.classList.remove('filled'); });
    $('verifyOtpBtn').disabled = true;
    startOtpTimer(600);
    document.querySelectorAll('.otp-digit')[0].focus();
  } catch(e) {
    toast(e.message || 'Failed to send code.', 'error');
  } finally {
    setBtnLoading(btn, false, 'Sign Up →');
  }
}

async function verifyOtpAndSignup() {
  const digits = [...document.querySelectorAll('.otp-digit')].map(i => i.value).join('');
  if (digits.length < 6) return toast('Enter the full 6-digit code', 'error');

  const btn = $('verifyOtpBtn');
  setBtnLoading(btn, true, 'Verifying…');

  try {
    const data = await post('/api/auth/signup', {
      name:     _signupData.name,
      email:    _signupData.email,
      password: _signupData.password,
      otp:      digits,
    });
    clearOtpTimer();
    saveToken(data.token);
    currentUser = data.user;
    toast('Account created! Welcome 🎉', 'success');
    await showPatientDash();
  } catch(e) {
    toast(e.message, 'error');
  } finally {
    setBtnLoading(btn, false, 'Verify & Create Account');
    btn.disabled = false;
  }
}

async function resendOtp() {
  const btn = $('resendBtn');
  setBtnLoading(btn, true, 'Sending…');
  try {
    await post('/api/auth/send-otp', { email: _signupData.email, name: _signupData.name });
    toast('New code sent!', 'success');
    document.querySelectorAll('.otp-digit').forEach(i => { i.value = ''; i.classList.remove('filled'); });
    $('verifyOtpBtn').disabled = true;
    startOtpTimer(600);
  } catch(e) {
    toast(e.message, 'error');
  } finally {
    setBtnLoading(btn, false, 'Resend code');
    btn.disabled = false;
  }
}

function backToStep1() {
  clearOtpTimer();
  hide('authStep2');
  hide('authStep3');
  hide('authStep4');
  const fpLink = $('fpLinkWrap');
  if (fpLink) fpLink.style.display = '';
  show('authStep1');
}

function otpNext(input, idx) {
  input.value = input.value.replace(/[^0-9]/g, '').slice(-1);
  input.classList.toggle('filled', input.value !== '');
  const digits = [...document.querySelectorAll('.otp-digit')];
  if (input.value && idx < 5) digits[idx + 1].focus();
  $('verifyOtpBtn').disabled = !digits.every(i => i.value !== '');
}

function otpBack(input, e, idx) {
  if (e.key === 'Backspace' && !input.value && idx > 0) {
    const digits = [...document.querySelectorAll('.otp-digit')];
    digits[idx - 1].focus();
    digits[idx - 1].value = '';
    digits[idx - 1].classList.remove('filled');
    $('verifyOtpBtn').disabled = true;
  }
}

function startOtpTimer(seconds) {
  clearOtpTimer();
  hide('resendBtn');
  const timerEl  = $('otpTimer');
  const resendEl = $('resendBtn');
  let remaining  = seconds;

  function tick() {
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    timerEl.textContent = `Expires in ${m}:${s}`;
    if (remaining <= 0) {
      timerEl.textContent = 'Code expired.';
      resendEl.classList.remove('hidden');
      clearOtpTimer();
      return;
    }
    remaining--;
  }
  tick();
  _otpTimer = setInterval(tick, 1000);
  setTimeout(() => { if (_otpTimer) resendEl.classList.remove('hidden'); }, 60000);
}

function clearOtpTimer() {
  if (_otpTimer) { clearInterval(_otpTimer); _otpTimer = null; }
}

// ════════════════════════════════════════════
//  FORGOT / RESET PASSWORD
// ════════════════════════════════════════════
let _fpRole = 'patient';
let _fpEmail = '';

function showForgotStep1() {
  // Determine role from current context (doctor login sets a flag)
  _fpRole = window._currentAuthRole || 'patient';
  hide('authStep1');
  hide('authStep2');
  hide('authStep3');
  hide('authStep4');
  const el = $('fpLinkWrap');
  if (el) el.style.display = 'none';
  show('authStep3');
  setTimeout(() => $('fpEmail')?.focus(), 50);
}

async function sendForgotPassword() {
  const email = ($('fpEmail')?.value || '').trim();
  if (!email) return toast('Please enter your email', 'error');
  if (!email.includes('@')) return toast('Enter a valid email address', 'error');

  const btn = $('fpSendBtn');
  setBtnLoading(btn, true, 'Sending…');
  try {
    _fpEmail = email;
    await post('/api/auth/forgot-password', { email, role: _fpRole });
    // Always advance to step 4 (server always returns ok to prevent enumeration)
    hide('authStep3');
    show('authStep4');
    $('fpCodeSubtext').textContent = `We sent a reset code to ${email}. Check your inbox — expires in 15 minutes.`;
    document.querySelectorAll('.fp-digit').forEach(i => { i.value = ''; i.classList.remove('filled'); });
    const passEl = $('fpNewPass');
    if (passEl) passEl.value = '';
    if ($('fpResetBtn')) $('fpResetBtn').disabled = true;
    setTimeout(() => document.querySelectorAll('.fp-digit')[0]?.focus(), 50);
    toast('Reset code sent! Check your email.', 'success');
  } catch(e) {
    toast(e.message || 'Failed to send reset code', 'error');
  } finally {
    setBtnLoading(btn, false, 'Send reset code →');
  }
}

function fpOtpNext(input, idx) {
  input.value = input.value.replace(/[^0-9]/g, '').slice(-1);
  input.classList.toggle('filled', input.value !== '');
  const digits = [...document.querySelectorAll('.fp-digit')];
  if (input.value && idx < 5) digits[idx + 1].focus();
  checkFpResetReady();
}

function fpOtpBack(input, e, idx) {
  if (e.key === 'Backspace' && !input.value && idx > 0) {
    const digits = [...document.querySelectorAll('.fp-digit')];
    digits[idx - 1].focus();
    digits[idx - 1].value = '';
    digits[idx - 1].classList.remove('filled');
    checkFpResetReady();
  }
}

function toggleFpPw() {
  const inp = $('fpNewPass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function checkFpResetReady() {
  const digits = [...document.querySelectorAll('.fp-digit')];
  const allFilled = digits.every(i => i.value !== '');
  const passEl = $('fpNewPass');
  if ($('fpResetBtn')) $('fpResetBtn').disabled = !allFilled || !passEl || passEl.value.length < 4;
}

async function submitPasswordReset() {
  const token = [...document.querySelectorAll('.fp-digit')].map(i => i.value).join('');
  const newPass = ($('fpNewPass').value || '').trim();
  if (token.length < 6) return toast('Enter the full 6-digit code', 'error');
  if (newPass.length < 4) return toast('Password must be at least 4 characters', 'error');

  const btn = $('fpResetBtn');
  setBtnLoading(btn, true, 'Resetting…');
  try {
    await post('/api/auth/reset-password', { email: _fpEmail, token, password: newPass, role: _fpRole });
    toast('Password reset! You can now log in.', 'success');
    // Go back to login
    hide('authStep4');
    show('authStep1');
    const fpLink = $('fpLinkWrap');
    if (fpLink) fpLink.style.display = '';
    $('aEmail').value = _fpEmail;
    $('aPass').value = '';
    $('aPass').focus();
  } catch(e) {
    toast(e.message || 'Reset failed', 'error');
  } finally {
    setBtnLoading(btn, false, 'Set new password →');
  }
}

async function loginDoctor() {
  const email = val('aEmail'), pass = val('aPass');
  if (!email || !pass) return toast('Enter email and password', 'error');
  const btn = document.querySelector('#authBtns .btn-cta');
  setBtnLoading(btn, true, 'Signing in…');
  try {
    const data = await post('/api/auth/login/doctor', { email, password: pass });
    saveToken(data.token);
    currentUser = data.user;
    await showDoctorAdmin();
  } catch(e) {
    toast(e.message, 'error');
  } finally {
    setBtnLoading(btn, false, 'Sign in →');
  }
}

async function logout() {
  clearToken();
  currentUser = null;
  clearOtpTimer();
  hideChatFab();
  _chatHistory = [];
  showLanding();
}

// ════════════════════════════════════════════
//  PATIENT DASHBOARD
// ════════════════════════════════════════════
function switchTab(name) {
  ['doctors','appointments','prescriptions','profile'].forEach(t => {
    $('tab-' + t)?.classList.toggle('active', t === name);
    const panel = $('tab' + t.charAt(0).toUpperCase() + t.slice(1));
    if (!panel) return;
    if (t === name) {
      panel.classList.remove('hidden');
      if (t === 'appointments') panel.style.display = 'flex';
      else panel.style.display = '';
    } else {
      panel.classList.add('hidden');
      panel.style.display = '';
    }
  });
  if (name === 'profile') renderProfile();
}

async function showPatientDash() {
  hide('authScreen');
  hide('doctorAdmin');
  // patientDash uses flex — can't use show() which sets display:block
  const dash = $('patientDash');
  dash.classList.remove('hidden');
  dash.style.display = 'flex';
  setNavUser();
  showChatFab();
  switchTab('doctors');

  if (currentUser?.name) {
    const lbl = $('dashUserLabel');
    if (lbl) lbl.textContent = currentUser.name;
  }

  try {
    allDoctors = await get('/api/doctors');
    renderDoctorCards();
  } catch(e) { toast('Could not load doctors', 'error'); }

  await loadPatientAppts();
}

async function bookAppointment() {
  const doctorId = val('doctorSelect');
  const date     = val('pDate');
  const timeSlot = val('slotSelect');
  const notes    = val('pNotes');

  if (!doctorId) return toast('Please select a doctor', 'error');
  if (!date)     return toast('Please choose a date', 'error');
  if (!timeSlot) return toast('Please choose a time slot', 'error');

  const btn = $('bookBtn');
  setBtnLoading(btn, true, '⏳ Booking…');

  try {
    await post('/api/appointments/book', { doctor_id: doctorId, date, time_slot: timeSlot, notes });
    closeBookingModal();
    toast('Appointment booked! A receipt has been sent to your email ✓', 'success');
    $('doctorSelect').value = '';
    switchTab('appointments');
    await loadPatientAppts();
  } catch(e) {
    toast(e.message, 'error');
  } finally {
    setBtnLoading(btn, false, 'Book Appointment');
  }
}

async function loadPatientAppts() {
  const tbody = $('patientTableBody');
  tbody.innerHTML = `<tr><td colspan="8" class="tbl-empty">Loading…</td></tr>`;
  try {
    _allAppts = await get('/api/appointments/patient');
    filterAppts();
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="8" class="tbl-empty" style="color:#c0552a">Failed to load appointments.</td></tr>`;
  }
}

function filterAppts() {
  const q      = ($('apptSearch')?.value || '').toLowerCase().trim();
  const status = $('apptStatusFilter')?.value || '';
  const tbody  = $('patientTableBody');

  let filtered = _allAppts.filter(a => {
    if (status && a.status !== status) return false;
    if (q) {
      const hay = [a.doctorName, a.specialty, a.status, a.date, a.time_slot, a.notes].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const count = $('apptCount');
  if (count) count.textContent = filtered.length ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : '';

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="tbl-empty">${_allAppts.length ? 'No matches found.' : 'No appointments yet. Book your first one!'}</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  filtered.forEach(a => {
    const tr = document.createElement('tr');
    const callBtn    = a.status === 'upcoming' ? `<button class="tbl-btn tbl-blue" onclick="joinCall('${a.id}')">📷 Join</button>` : '—';
    const cancelBtn  = a.status === 'upcoming' ? `<button class="tbl-btn tbl-red" onclick="cancelAppt('${a.id}',this)">Cancel</button>` : '—';
    const invoiceBtn = a.status !== 'cancelled' ? `<button class="tbl-btn tbl-invoice" onclick="downloadInvoice('${a.id}',this)" title="Download PDF invoice">⬇ PDF</button>` : '—';
    const deleteBtn  = (a.status === 'cancelled' || a.status === 'done') ? `<button class="tbl-btn tbl-del" onclick="deleteAppt('${a.id}',this)" title="Delete record">🗑</button>` : '';
    tr.innerHTML = `
      <td><div style="display:flex;align-items:center;gap:8px">${doctorAvatar(a.doctor_id)}<strong>${a.doctorName || '—'}</strong></div></td>
      <td>${a.specialty || '—'}</td>
      <td>${fmtDate(a.date)}</td>
      <td>${a.time_slot}</td>
      <td><span class="chip chip-${a.status}">${a.status}</span></td>
      <td>${callBtn}</td>
      <td>${invoiceBtn}</td>
      <td style="display:flex;gap:5px;align-items:center">${cancelBtn}${deleteBtn}</td>`;
    tbody.appendChild(tr);
  });
}

async function deleteAppt(id, btn) {
  if (!confirm('Delete this appointment record? This cannot be undone.')) return;
  btn.disabled = true;
  btn.textContent = '…';
  try {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + loadToken() }
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
    toast('Record deleted', 'success');
    await loadPatientAppts();
  } catch(e) {
    toast(e.message, 'error');
    btn.disabled = false;
    btn.textContent = '🗑';
  }
}

function renderProfile() {
  if (!currentUser) return;

  // Header card
  const initials = (currentUser.name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const av = $('profAvatar'); if (av) av.textContent = initials;
  const nm = $('profName');   if (nm) nm.textContent = currentUser.name || '—';
  const em = $('profEmail');  if (em) em.textContent = currentUser.email || '—';

  // Stats
  const total    = _allAppts.length;
  const done     = _allAppts.filter(a => a.status === 'done').length;
  const upcoming = _allAppts.filter(a => a.status === 'upcoming').length;
  const st = $('statTotal');    if (st) st.textContent = total;
  const sd = $('statDone');     if (sd) sd.textContent = done;
  const su = $('statUpcoming'); if (su) su.textContent = upcoming;

  // History timeline — sorted newest first
  const hist = $('apptHistory');
  if (!hist) return;
  if (!_allAppts.length) {
    hist.innerHTML = `<p style="padding:20px;color:var(--stone);font-family:var(--mono);font-size:13px">No appointments yet.</p>`;
    return;
  }

  const sorted = [..._allAppts].sort((a,b) => b.date.localeCompare(a.date) || b.time_slot.localeCompare(a.time_slot));

  const statusIcon  = { upcoming: '🗓', done: '✅', cancelled: '✕' };
  const statusColor = { upcoming: 'var(--acid)', done: 'var(--sage)', cancelled: 'var(--rust)' };

  hist.innerHTML = sorted.map((a, i) => {
    const isLast  = i === sorted.length - 1;
    const icon    = statusIcon[a.status] || '•';
    const color   = statusColor[a.status] || 'var(--stone)';
    const avatar  = doctorAvatar(a.doctor_id);
    const dateStr = fmtDate(a.date);

    return `
      <div style="display:flex;gap:0;padding:0 20px;position:relative">
        <!-- Timeline spine -->
        <div style="display:flex;flex-direction:column;align-items:center;width:32px;flex-shrink:0;padding-top:18px">
          <div style="width:28px;height:28px;border-radius:50%;background:${a.status === 'done' ? 'var(--sage-dim)' : a.status === 'upcoming' ? 'var(--acid-dim)' : 'var(--rust-dim)'};border:1.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:11px;z-index:1;flex-shrink:0">${icon}</div>
          ${!isLast ? `<div style="width:1.5px;flex:1;background:linear-gradient(#3a3a36,transparent);min-height:20px;margin-top:4px"></div>` : ''}
        </div>
        <!-- Content -->
        <div style="flex:1;padding:14px 0 ${isLast ? '14px' : '8px'} 14px;border-bottom:${isLast ? 'none' : '1px solid #2a2a28'}">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            ${avatar}
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;font-family:'Syne',sans-serif;color:var(--cream)">${a.doctorName || '—'}</div>
              <div style="font-size:11px;font-family:var(--mono);color:var(--stone)">${a.specialty || ''}</div>
            </div>
            <span style="font-size:10px;font-family:var(--mono);color:var(--stone);white-space:nowrap">${dateStr} · ${a.time_slot}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="chip chip-${a.status}">${a.status}</span>
            ${a.notes ? `<span style="font-size:11px;font-family:var(--mono);color:var(--khaki-l);font-style:italic">"${a.notes}"</span>` : ''}
            ${a.status === 'done' ? `<button onclick="downloadInvoice('${a.id}',this)" class="tbl-btn tbl-invoice" style="margin-left:auto">⬇ Invoice</button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

async function cancelAppt(id, btn) {
  btn.disabled = true;
  btn.textContent = '…';
  try {
    await post(`/api/appointments/${id}/cancel`);
    toast('Appointment cancelled', 'success');
    await loadPatientAppts();
  } catch(e) {
    toast(e.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Cancel';
  }
}

// ════════════════════════════════════════════
//  DOCTOR DASHBOARD
// ════════════════════════════════════════════
async function showDoctorAdmin() {
  hide('authScreen');
  $('patientDash') && ($('patientDash').classList.add('hidden'), $('patientDash').style.display='none');
  show('doctorAdmin');
  setNavUser();
  showChatFab();

  try {
    allDoctors = await get('/api/doctors');
    const sel  = $('adminDoctorFilter');
    sel.innerHTML = `<option value="">All Doctors</option>`;
    allDoctors.forEach(d => {
      const opt       = document.createElement('option');
      opt.value       = d.id;
      opt.textContent = d.name;
      if (d.email === currentUser.email) opt.selected = true;
      sel.appendChild(opt);
    });
  } catch(e) { toast('Could not load doctors', 'error'); }

  await loadAdminStats();
  await loadAdminAppts();
}

async function loadAdminStats() {
  try {
    const s = await get('/api/admin/stats');
    $('aTotal').textContent    = s.total;
    $('aToday').textContent    = s.today;
    $('aUpcoming').textContent = s.upcoming;
    $('aPatients').textContent = s.patients;
  } catch {}
}

async function loadAdminAppts() {
  const tbody    = $('adminTableBody');
  const doctorId = val('adminDoctorFilter');
  tbody.innerHTML = `<tr><td colspan="9" class="tbl-empty">Loading…</td></tr>`;
  try {
    const url   = '/api/admin/appointments' + (doctorId ? `?doctor_id=${doctorId}` : '');
    const appts = await get(url);
    if (!appts.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="tbl-empty">No appointments found.</td></tr>`;
      return;
    }
    tbody.innerHTML = '';
    appts.forEach(a => {
      const tr = document.createElement('tr');
      const callBtn = a.status === 'upcoming'
        ? `<button class="tbl-btn tbl-blue" onclick="joinCall('${a.id}')">📷 Join</button>`
        : '—';
      tr.innerHTML = `
        <td><strong>${a.patient_name || '—'}</strong></td>
        <td>${a.patient_email || '—'}</td>
        <td><div style="display:flex;align-items:center;gap:8px">${doctorAvatar(a.doctor_id)}<span>${a.doctorName || '—'}</span></div></td>
        <td>${fmtDate(a.date)}</td>
        <td>${a.time_slot}</td>
        <td>${a.notes || '—'}</td>
        <td><span class="chip chip-${a.status}">${a.status}</span></td>
        <td>${callBtn}</td>
        <td><div class="tbl-actions">
          ${a.status === 'upcoming' ? `<button class="tbl-btn tbl-green" onclick="markDone('${a.id}',this)">✓ Done</button>` : ''}
          ${(() => { window._rxData = window._rxData || {}; window._rxData[a.id] = {name: a.patient_name||'', email: a.patient_email||''}; return ''; })()}${a.status !== 'cancelled' ? `<button class="tbl-btn" style="background:rgba(167,139,250,0.15);color:#a78bfa;border:1px solid rgba(167,139,250,0.3)" onclick="openPrescribeModal('${a.id}')">💊 Prescribe</button>` : ''}
          ${a.status !== 'cancelled' ? `<button class="tbl-btn tbl-red" onclick="adminCancel('${a.id}',this)">Cancel</button>` : ''}
        </div></td>`;
      tbody.appendChild(tr);
    });
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="9" class="tbl-empty" style="color:#c0552a">Failed to load.</td></tr>`;
  }
}

async function markDone(id, btn) {
  btn.disabled    = true;
  btn.textContent = '…';
  try {
    await post(`/api/admin/appointments/${id}/done`);
    toast('Marked as done', 'success');
    await loadAdminAppts();
    await loadAdminStats();
  } catch(e) {
    toast(e.message, 'error');
    btn.disabled    = false;
    btn.textContent = '✓ Done';
  }
}

async function adminCancel(id, btn) {
  btn.disabled    = true;
  btn.textContent = '…';
  try {
    await post(`/api/appointments/${id}/cancel`);
    toast('Cancelled', 'success');
    await loadAdminAppts();
    await loadAdminStats();
  } catch(e) {
    toast(e.message, 'error');
    btn.disabled    = false;
    btn.textContent = 'Cancel';
  }
}

function setNavUser() {
  const role = currentUser.role === 'doctor' ? 'Doctor' : 'Patient';
  $('navUser').innerHTML = `
    <span class="nu-name">${currentUser.name}</span>
    <span class="nu-role">${role}</span>
    <button class="nu-logout" onclick="logout()">Sign out</button>`;
}

// ─── Init ─────────────────────────────────────────────
async function init() {
  const token = loadToken();
  if (!token) { showLanding(); return; }
  try {
    const data  = await get('/api/auth/me');
    currentUser = data.user;
    showShell();
    if (currentUser.role === 'patient')     await showPatientDash();
    else if (currentUser.role === 'doctor') await showDoctorAdmin();
  } catch {
    clearToken();
    showLanding();
  }
}

init();

// ════════════════════════════════════════════
//  VIDEO CALL
// ════════════════════════════════════════════
let _peer          = null;
let _localStream   = null;
let _activeCall    = null;
let _callRoomData  = null;
let _dataConn      = null;
let _callChatOpen  = false;
let _callChatUnread = 0;

async function joinCall(apptId) {
  try {
    const room = await get(`/api/call/room/${apptId}`);
    _callRoomData = room;
    await startCallScreen(room);
  } catch(e) {
    toast('Could not join call: ' + e.message, 'error');
  }
}

async function startCallScreen(room) {
  show('callScreen');
  $('callScreen').classList.remove('hidden');
  $('callApptInfo').textContent =
    room.date + ' at ' + room.time_slot +
    (room.patient_name ? '  ·  ' + room.patient_name : '');

  setCallStatus('connecting', 'Connecting…');
  setWaiting(true, 'Starting camera…');

  try {
    _localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    $('localVideo').srcObject = _localStream;
  } catch(e) {
    toast('Camera/mic access denied. Please allow permissions.', 'error');
    setWaiting(true, '⚠️ Camera access denied. Check browser permissions.');
    return;
  }

  setWaiting(true, 'Waiting for the other person to join…');
  setCallStatus('connecting', 'Waiting…');

  _peer = new Peer(room.peer_id, {
    host: '0.peerjs.com', port: 443, secure: true, path: '/',
    config: { iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]}
  });

  _peer.on('open', id => {
    if (room.role === 'doctor') {
      setWaiting(true, 'Waiting for patient to join…');
      _peer.on('call', call => {
        _activeCall = call;
        call.answer(_localStream);
        handleCallStream(call, room.patient_name || 'Patient');
      });
      _peer.on('connection', conn => {
        _dataConn = conn;
        setupDataConn(conn, room.patient_name || 'Patient');
      });
    } else {
      setWaiting(true, 'Calling doctor…');
      const call = _peer.call(room.other_peer_id, _localStream);
      if (!call) { setWaiting(true, '⚠️ Could not reach doctor. Make sure they joined first.'); return; }
      _activeCall = call;
      handleCallStream(call, 'Doctor');
      const conn = _peer.connect(room.other_peer_id, { reliable: true });
      _dataConn  = conn;
      setupDataConn(conn, 'Doctor');
    }
  });

  _peer.on('error', err => {
    if (err.type === 'peer-unavailable') {
      setWaiting(true, "The other person hasn't joined yet. They'll connect automatically.");
      setTimeout(() => {
        if (_peer && !_activeCall && room.role === 'patient') {
          const call = _peer.call(room.other_peer_id, _localStream);
          if (call) { _activeCall = call; handleCallStream(call, 'Doctor'); }
        }
      }, 4000);
    } else {
      setWaiting(true, '⚠️ Connection error: ' + err.type + '. Try refreshing.');
    }
  });

  _peer.on('disconnected', () => {
    setCallStatus('connecting', 'Reconnecting…');
    _peer.reconnect();
  });
}

function handleCallStream(call, remoteName) {
  call.on('stream', remoteStream => {
    $('remoteVideo').srcObject = remoteStream;
    $('remoteName').textContent = remoteName;
    setWaiting(false);
    setCallStatus('connected', 'In call · ' + remoteName);
  });
  call.on('close', () => {
    setCallStatus('ended', 'Call ended');
    setWaiting(true, 'The other person has left the call.');
    $('remoteVideo').srcObject = null;
  });
  call.on('error', err => toast('Call error: ' + err.message, 'error'));
}

function endCall() {
  _dataConn?.close();   _dataConn   = null;
  _activeCall?.close(); _activeCall = null;
  if (_peer) { _peer.destroy(); _peer = null; }
  _localStream?.getTracks().forEach(t => t.stop());
  _localStream = null;
  $('localVideo').srcObject  = null;
  $('remoteVideo').srcObject = null;
  _callChatOpen   = false;
  _callChatUnread = 0;
  hide('callChatSidebar');
  $('callChatMessages').innerHTML = `<div class="call-chat-info">Messages are only visible during this call.</div>`;
  $('callChatBadge')?.remove();
  hide('callScreen');
  toast('Call ended', 'success');
}

function toggleMic() {
  if (!_localStream) return;
  const track = _localStream.getAudioTracks()[0];
  if (!track) return;
  track.enabled = !track.enabled;
  const btn = $('btnMic');
  btn.textContent = track.enabled ? '🎙 Mute' : '🔇 Unmute';
  btn.classList.toggle('muted', !track.enabled);
}

function toggleCam() {
  if (!_localStream) return;
  const track = _localStream.getVideoTracks()[0];
  if (!track) return;
  track.enabled = !track.enabled;
  const btn = $('btnCam');
  btn.textContent = track.enabled ? '📷 Camera' : '🚫 Camera';
  btn.classList.toggle('muted', !track.enabled);
}

function setCallStatus(state, text) {
  $('callStatus').className = 'call-status ' + state;
  $('callStatusText').textContent = text;
}

function setWaiting(visible, text) {
  const el = $('waitingOverlay');
  if (visible) {
    el.classList.remove('hidden');
    if (text) $('waitingText').textContent = text;
  } else {
    el.classList.add('hidden');
  }
}

// Draggable local PiP
(function initPip() {
  let el, dragging = false, ox, oy;
  document.addEventListener('DOMContentLoaded', () => {
    el = document.querySelector('.video-local');
    if (!el) return;
    el.addEventListener('mousedown', e => {
      dragging = true;
      const r  = el.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      el.style.cursor = 'grabbing';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const pw = el.parentElement.offsetWidth;
      const ph = el.parentElement.offsetHeight;
      let x = Math.max(8, Math.min(pw - el.offsetWidth  - 8, e.clientX - ox));
      let y = Math.max(8, Math.min(ph - el.offsetHeight - 8, e.clientY - oy));
      el.style.right  = 'auto';
      el.style.bottom = 'auto';
      el.style.left   = x + 'px';
      el.style.top    = y + 'px';
    });
    document.addEventListener('mouseup', () => {
      dragging = false;
      if (el) el.style.cursor = 'grab';
    });
  });
})();

// ════════════════════════════════════════════
//  IN-CALL CHAT
// ════════════════════════════════════════════
function setupDataConn(conn, remoteName) {
  conn.on('open',  () => appendCallSystemMsg(remoteName + ' connected to chat'));
  conn.on('data',  data => {
    try {
      const msg = typeof data === 'string' ? JSON.parse(data) : data;
      appendCallChatBubble('them', msg.text, msg.sender || remoteName);
      if (!_callChatOpen) { _callChatUnread++; renderCallChatBadge(); }
    } catch(e) { console.error('[Chat] Bad message:', e); }
  });
  conn.on('close', () => appendCallSystemMsg(remoteName + ' left the chat'));
  conn.on('error', err => console.error('[Chat] conn error:', err));
}

function toggleCallChat() {
  _callChatOpen = !_callChatOpen;
  const sidebar = $('callChatSidebar');
  if (_callChatOpen) {
    sidebar.classList.remove('hidden');
    _callChatUnread = 0;
    renderCallChatBadge();
    setTimeout(() => $('callChatInput').focus(), 150);
    const msgs = $('callChatMessages');
    msgs.scrollTop = msgs.scrollHeight;
  } else {
    sidebar.classList.add('hidden');
  }
  $('btnChat').classList.toggle('muted', _callChatOpen);
}

function renderCallChatBadge() {
  const btn = $('btnChat');
  let badge = $('callChatBadge');
  if (_callChatUnread > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.id        = 'callChatBadge';
      badge.className = 'cbtn-chat-badge';
      btn.style.position = 'relative';
      btn.appendChild(badge);
    }
    badge.textContent = _callChatUnread > 9 ? '9+' : String(_callChatUnread);
  } else {
    badge?.remove();
  }
}

function sendCallChatMessage() {
  const input = $('callChatInput');
  const text  = input.value.trim();
  if (!text) return;

  if (!_dataConn || !_dataConn.open) {
    appendCallChatBubble('me', text, 'You');
    input.value = '';
    appendCallSystemMsg('⚠️ Other party may not be connected to chat yet.');
    return;
  }

  const payload = { text, sender: currentUser?.name || 'You', ts: Date.now() };
  try {
    _dataConn.send(JSON.stringify(payload));
    appendCallChatBubble('me', text, 'You');
    input.value = '';
    $('callChatMessages').scrollTop = $('callChatMessages').scrollHeight;
  } catch(e) {
    appendCallSystemMsg('⚠️ Could not send message: ' + e.message);
  }
}

function appendCallChatBubble(side, text, senderName) {
  const msgs   = $('callChatMessages');
  const wrap   = document.createElement('div');
  wrap.className = 'cc-msg ' + side;
  const bubble = document.createElement('div');
  bubble.className   = 'cc-bubble';
  bubble.textContent = text;
  const meta   = document.createElement('div');
  meta.className   = 'cc-meta';
  meta.textContent = (side === 'them' ? senderName + '  ·  ' : '') +
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  wrap.appendChild(bubble);
  wrap.appendChild(meta);
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function appendCallSystemMsg(text) {
  const msgs = $('callChatMessages');
  const el   = document.createElement('div');
  el.className   = 'cc-system';
  el.textContent = text;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

// ════════════════════════════════════════════
//  AI CHATBOT
// ════════════════════════════════════════════
let _chatOpen    = false;
let _chatHistory = [];
let _chatLoading = false;

function showChatFab() { show('chatFab'); }
function hideChatFab()  { hide('chatFab'); if (_chatOpen) closeChat(); }
function toggleChat()   { _chatOpen ? closeChat() : openChat(); }

function openChat() {
  _chatOpen = true;
  show('chatPanel');
  hide('chatUnread');
  $('chatPanel').classList.remove('hidden');

  if (currentUser) {
    const isDoc = currentUser.role === 'doctor';
    $('chatSubtitle').textContent = isDoc ? 'Clinical assistant' : 'Your medical assistant';
    $('chatWelcomeText').textContent = isDoc
      ? `Hi Dr. ${currentUser.name.split(' ')[0]}! I can help you manage your schedule and appointments.`
      : `Hi ${currentUser.name.split(' ')[0]}! I'm here to help with your appointments and health questions.`;
    if (isDoc) {
      $('chatSuggestions').innerHTML = `
        <button onclick="sendSuggestion(this)">Show today's appointments</button>
        <button onclick="sendSuggestion(this)">Summarise upcoming schedule</button>
        <button onclick="sendSuggestion(this)">Any appointments needing attention?</button>`;
    }
  }
  setTimeout(() => $('chatInput').focus(), 200);
}

function closeChat() { _chatOpen = false; hide('chatPanel'); }

function clearChat() {
  _chatHistory = [];
  $('chatMessages').innerHTML = `
    <div class="chat-welcome">
      <div class="chat-welcome-icon">✦</div>
      <p id="chatWelcomeText">Chat cleared. How can I help you?</p>
      <div class="chat-suggestions" id="chatSuggestions">
        <button onclick="sendSuggestion(this)">Show my upcoming appointments</button>
        <button onclick="sendSuggestion(this)">How do I prepare for my visit?</button>
        <button onclick="sendSuggestion(this)">What should I tell my doctor?</button>
      </div>
    </div>`;
}

function sendSuggestion(btn) {
  const text = btn.textContent;
  $('chatSuggestions')?.remove();
  document.querySelector('.chat-welcome')?.remove();
  sendMessage(text);
}

function chatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
}

function autoResizeChatInput(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

function sendChatMessage() {
  const input = $('chatInput');
  const text  = input.value.trim();
  if (!text || _chatLoading) return;
  input.value        = '';
  input.style.height = 'auto';
  document.querySelector('.chat-welcome')?.remove();
  sendMessage(text);
}

async function sendMessage(text) {
  if (_chatLoading) return;
  _chatLoading = true;
  appendChatBubble('user', text);
  _chatHistory.push({ role: 'user', content: text });
  $('chatSendBtn').disabled = true;
  const typingId = addTypingIndicator();

  try {
    const data = await post('/api/chat', { messages: _chatHistory });
    removeTypingIndicator(typingId);
    _chatHistory.push({ role: 'assistant', content: data.reply });
    appendChatBubble('ai', data.reply);
    if (!_chatOpen) show('chatUnread');
  } catch(e) {
    removeTypingIndicator(typingId);
    appendChatError(e.message || "Sorry, I couldn't get a response. Please try again.");
    _chatHistory.pop();
  } finally {
    _chatLoading = false;
    $('chatSendBtn').disabled = false;
    $('chatInput').focus();
  }
}

function appendChatBubble(role, text) {
  const msgs   = $('chatMessages');
  const wrap   = document.createElement('div');
  wrap.className = 'chat-msg ' + role;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.innerHTML = formatChatText(text);
  const time   = document.createElement('div');
  time.className   = 'chat-time';
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  wrap.appendChild(bubble);
  wrap.appendChild(time);
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function appendChatError(msg) {
  const msgs = $('chatMessages');
  const el   = document.createElement('div');
  el.className   = 'chat-error';
  el.textContent = '⚠️ ' + msg;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

function addTypingIndicator() {
  const msgs = $('chatMessages');
  const el   = document.createElement('div');
  const id   = 'typing_' + Date.now();
  el.id        = id;
  el.className = 'chat-typing';
  el.innerHTML = '<span></span><span></span><span></span>';
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}

function removeTypingIndicator(id) { $(id)?.remove(); }

function formatChatText(text) {
  let safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/^[-•] (.+)$/gm, '<li>$1</li>');
  safe = safe.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  safe = safe.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  safe = safe.replace(/\n\n/g, '</p><p>');
  safe = safe.replace(/\n/g, '<br>');
  return '<p>' + safe + '</p>';
}

// ─── Voice Chat ───────────────────────────────────────
let _voiceRecognition  = null;
let _voiceRecording    = false;
let _voiceSynthesis    = window.speechSynthesis || null;
let _voiceSpeaking     = false;
let _voiceTtsEnabled   = true;  // AI responses spoken aloud by default

function toggleVoiceChat() {
  if (_voiceRecording) {
    stopVoiceRecording();
  } else {
    startVoiceRecording();
  }
}

function startVoiceRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    toast('Voice input is not supported in this browser. Try Chrome.', 'error');
    return;
  }

  // Stop any current TTS before listening
  stopSpeaking();

  _voiceRecognition = new SpeechRecognition();
  _voiceRecognition.lang          = 'en-US';
  _voiceRecognition.continuous    = false;
  _voiceRecognition.interimResults = true;
  _voiceRecognition.maxAlternatives = 1;

  _voiceRecognition.onstart = () => {
    _voiceRecording = true;
    $('chatMicBtn').classList.add('recording');
    $('chatInput').placeholder = 'Listening… speak now';
    show('voiceStatus');
    $('voiceStatusText').textContent = 'Listening…';
  };

  _voiceRecognition.onresult = (event) => {
    let interim = '', final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += t;
      else interim += t;
    }
    $('chatInput').value = final || interim;
    $('voiceStatusText').textContent = interim ? 'Hearing: ' + interim : 'Processing…';
  };

  _voiceRecognition.onend = () => {
    _voiceRecording = false;
    $('chatMicBtn').classList.remove('recording');
    $('chatInput').placeholder = 'Ask anything…';
    hide('voiceStatus');

    const text = $('chatInput').value.trim();
    if (text) {
      $('chatInput').value = '';
      sendVoiceMessage(text);
    }
  };

  _voiceRecognition.onerror = (event) => {
    _voiceRecording = false;
    $('chatMicBtn').classList.remove('recording');
    $('chatInput').placeholder = 'Ask anything…';
    hide('voiceStatus');
    if (event.error !== 'no-speech') {
      toast('Voice error: ' + event.error, 'error');
    }
  };

  _voiceRecognition.start();
}

function stopVoiceRecording() {
  if (_voiceRecognition) {
    _voiceRecognition.stop();
    _voiceRecognition = null;
  }
  _voiceRecording = false;
  $('chatMicBtn').classList.remove('recording');
  hide('voiceStatus');
}

async function sendVoiceMessage(transcript) {
  if (_chatLoading) return;
  _chatLoading = true;

  // Open chat panel if closed
  if (!_chatOpen) openChat();

  document.querySelector('.chat-welcome')?.remove();
  appendChatBubble('user', '🎤 ' + transcript);
  _chatHistory.push({ role: 'user', content: transcript });
  $('chatSendBtn').disabled = true;
  const typingId = addTypingIndicator();

  try {
    const data = await post('/api/chat/voice', {
      transcript,
      messages: _chatHistory.slice(0, -1),  // exclude the one we just pushed
    });
    removeTypingIndicator(typingId);
    _chatHistory.push({ role: 'assistant', content: data.reply });
    appendChatBubble('ai', data.reply);
    if (!_chatOpen) show('chatUnread');

    // Speak the AI reply aloud
    if (_voiceTtsEnabled) speakText(data.reply);

  } catch (e) {
    removeTypingIndicator(typingId);
    appendChatError(e.message || "Voice chat failed. Please try again.");
    _chatHistory.pop();
  } finally {
    _chatLoading   = false;
    $('chatSendBtn').disabled = false;
  }
}

// ─── Text-to-Speech ───────────────────────────────────
function speakText(text) {
  if (!_voiceSynthesis) return;
  stopSpeaking();

  // Strip markdown for cleaner speech
  const clean = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\n+/g, ' ').trim();

  const utterance       = new SpeechSynthesisUtterance(clean);
  utterance.lang        = 'en-US';
  utterance.rate        = 1.0;
  utterance.pitch       = 1.0;
  utterance.volume      = 1.0;

  // Prefer a natural-sounding voice if available
  const voices = _voiceSynthesis.getVoices();
  const preferred = voices.find(v =>
    /Google US English|Samantha|Karen|Moira|Fiona|Zira/.test(v.name)
  ) || voices.find(v => v.lang === 'en-US') || voices[0];
  if (preferred) utterance.voice = preferred;

  utterance.onstart = () => { _voiceSpeaking = true; };
  utterance.onend   = () => { _voiceSpeaking = false; };
  utterance.onerror = () => { _voiceSpeaking = false; };

  _voiceSynthesis.speak(utterance);
}

function stopSpeaking() {
  if (_voiceSynthesis && _voiceSpeaking) {
    _voiceSynthesis.cancel();
    _voiceSpeaking = false;
  }
}

// Stop TTS when chat is closed
const _origCloseChat = closeChat;
closeChat = function() {
  stopSpeaking();
  _origCloseChat();
};

// ════════════════════════════════════════════
//  PRESCRIPTIONS
// ════════════════════════════════════════════

let _rxApptId = null;
let _rxMedCount = 1;

function openPrescribeModal(apptId) {
  _rxApptId   = apptId;
  _rxMedCount = 1;
  const info  = (window._rxData && window._rxData[apptId]) || {};
  $('rxPatientLabel').textContent = `Patient: ${info.name || '—'} · ${info.email || '—'}`;
  $('rxDiagnosis').value = '';
  $('rxNotes').value     = '';
  $('rxMedsList').innerHTML = buildMedRow(0);
  const modal = $('prescribeModal');
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  modal.onclick = (e) => { if (e.target === modal) closePrescribeModal(); };
}

function closePrescribeModal() {
  $('prescribeModal').style.display = 'none';
  $('prescribeModal').classList.add('hidden');
  _rxApptId   = null;
  _rxMedCount = 1;
}

function buildMedRow(idx) {
  return `<div class="rx-med-row" id="rxMed${idx}">
    <div class="rx-med-fields">
      <input class="rx-input" placeholder="Medication name *" id="rxMedName${idx}" />
      <input class="rx-input" placeholder="Dosage (e.g. 500mg twice daily)" id="rxMedDosage${idx}" />
      <input class="rx-input" placeholder="Instructions (e.g. after meals)" id="rxMedInst${idx}" />
    </div>
    ${idx > 0 ? `<button class="rx-remove-btn" onclick="removeMedRow(${idx})" title="Remove">✕</button>` : ''}
  </div>`;
}

function addMedRow() {
  const idx = _rxMedCount++;
  const container = $('rxMedsList');
  const div = document.createElement('div');
  div.innerHTML = buildMedRow(idx);
  container.appendChild(div.firstElementChild);
}

function removeMedRow(idx) {
  const el = $('rxMed' + idx);
  if (el) el.remove();
}

async function submitPrescription() {
  if (!_rxApptId) return;

  // Collect medications from all rx-med-row elements
  const rows = document.querySelectorAll('#rxMedsList .rx-med-row');
  const medications = [];
  let valid = true;

  rows.forEach(row => {
    const id = row.id.replace('rxMed', '');
    const name  = ($('rxMedName'  + id)?.value || '').trim();
    const dosage = ($('rxMedDosage' + id)?.value || '').trim();
    const inst   = ($('rxMedInst'   + id)?.value || '').trim();
    if (name) medications.push({ name, dosage: dosage || '—', instructions: inst || '—' });
  });

  if (!medications.length) {
    toast('Add at least one medication', 'error');
    return;
  }

  const btn = $('rxSubmitBtn');
  setBtnLoading(btn, true, 'Sending…');

  try {
    await post(`/api/admin/appointments/${_rxApptId}/prescribe`, {
      medications,
      diagnosis: ($('rxDiagnosis')?.value || '').trim(),
      notes:     ($('rxNotes')?.value     || '').trim(),
    });
    toast('Prescription emailed to patient ✓', 'success');
    closePrescribeModal();
  } catch(e) {
    toast(e.message, 'error');
  } finally {
    setBtnLoading(btn, false, '📧 Send Prescription');
  }
}

// ── Patient: My Prescriptions tab ────────────────────────────────────────────

async function loadMyPrescriptions() {
  const container = $('myRxContainer');
  if (!container) return;
  container.innerHTML = '<p style="color:#9c9882;font-family:monospace;font-size:13px">Loading…</p>';
  try {
    const rxList = await get('/api/prescriptions/mine');
    if (!rxList.length) {
      container.innerHTML = '<p style="color:#9c9882;font-family:monospace;font-size:13px">No prescriptions yet. When a doctor issues a prescription, it will appear here.</p>';
      return;
    }
    container.innerHTML = rxList.map(rx => `
      <div class="rx-card">
        <div class="rx-card-header">
          <div>
            <span class="rx-card-doctor">💊 ${rx.doctor_name}</span>
            <span class="rx-card-date">${new Date(rx.created_at).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</span>
          </div>
          ${rx.diagnosis ? `<div class="rx-diagnosis">Dx: ${rx.diagnosis}</div>` : ''}
        </div>
        <table class="rx-table">
          <thead><tr><th>Medication</th><th>Dosage</th><th>Instructions</th></tr></thead>
          <tbody>
            ${rx.medications.map(m => `<tr><td><strong>${m.name}</strong></td><td>${m.dosage}</td><td>${m.instructions}</td></tr>`).join('')}
          </tbody>
        </table>
        ${rx.notes ? `<div class="rx-card-notes">📝 ${rx.notes}</div>` : ''}
      </div>`).join('');
  } catch(e) {
    container.innerHTML = '<p style="color:#c0552a;font-family:monospace;font-size:13px">Failed to load prescriptions.</p>';
  }
}

// Hook into showPatientDash to also load prescriptions
const _origShowPatientDash = showPatientDash;
showPatientDash = async function() {
  await _origShowPatientDash();
  await loadMyPrescriptions();
};

// ── Doctor: Prescriptions History ────────────────────────────────────────────

async function loadDoctorRxHistory() {
  const container = $('doctorRxContainer');
  if (!container) return;
  container.innerHTML = '<p style="color:#9c9882;font-family:monospace;font-size:13px">Loading…</p>';
  try {
    const rxList = await get('/api/admin/prescriptions');
    if (!rxList.length) {
      container.innerHTML = '<p style="color:#9c9882;font-family:monospace;font-size:13px">No prescriptions sent yet. Use the 💊 Prescribe button on any appointment.</p>';
      return;
    }
    container.innerHTML = rxList.map(rx => `
      <div class="rx-card">
        <div class="rx-card-header" style="flex-direction:row;justify-content:space-between;align-items:center">
          <div>
            <span class="rx-card-doctor">👤 ${rx.patient_name}</span>
            <span class="rx-card-date">${rx.patient_email}</span>
          </div>
          <span style="font-size:11px;font-family:monospace;color:#9c9882">${new Date(rx.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
        </div>
        ${rx.diagnosis ? `<div style="padding:8px 18px;background:#3d3d39;border-bottom:1px solid #4d4d48"><span class="rx-diagnosis">Dx: ${rx.diagnosis}</span></div>` : ''}
        <table class="rx-table">
          <thead><tr><th>Medication</th><th>Dosage</th><th>Instructions</th></tr></thead>
          <tbody>
            ${rx.medications.map(m => `<tr><td><strong>${m.name}</strong></td><td>${m.dosage}</td><td>${m.instructions}</td></tr>`).join('')}
          </tbody>
        </table>
        ${rx.notes ? `<div class="rx-card-notes">📝 ${rx.notes}</div>` : ''}
      </div>`).join('');
  } catch(e) {
    container.innerHTML = '<p style="color:#c0552a;font-family:monospace;font-size:13px">Failed to load prescriptions.</p>';
  }
}

// Hook into showDoctorAdmin to also load rx history
const _origShowDoctorAdmin = showDoctorAdmin;
showDoctorAdmin = async function() {
  await _origShowDoctorAdmin();
  await loadDoctorRxHistory();
};

// ════════════════════════════════════════════
//  INVOICE DOWNLOAD
// ════════════════════════════════════════════

async function downloadInvoice(apptId, btn) {
  const orig = btn.textContent;
  btn.disabled    = true;
  btn.textContent = '⏳';

  try {
    const token = loadToken();
    const res   = await fetch(`/api/appointments/${apptId}/invoice`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed' }));
      throw new Error(err.error || 'Could not generate invoice');
    }

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `docdrop-invoice-${apptId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Invoice downloaded ✓', 'success');
  } catch(e) {
    toast(e.message, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = orig;
  }
}
