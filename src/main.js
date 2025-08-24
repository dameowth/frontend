import './style.css';

const API_BASE = import.meta.env.VITE_API_BASE;

const app = document.getElementById('app');
const navbar = document.getElementById('navbar');
const homeBtn = document.getElementById('homeBtn');
const registerNavBtn = document.getElementById('registerDeviceBtn');
const loginNavBtn = document.getElementById('loginDeviceBtn');
const logoutNavBtn = document.getElementById('logoutNavBtn');
const userRegisterBtn = document.getElementById('userRegisterBtn');
const userLoginBtn = document.getElementById('userLoginBtn');
const listDevicesBtn = document.getElementById('listDevicesBtn');

let authToken = localStorage.getItem('authToken') || null;

function setAuthToken(token) {
  authToken = token;
  localStorage.setItem('authToken', token);
}

function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('authToken');
}

function toggleNavButtons(isLoggedIn) {
  registerNavBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
  loginNavBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
  logoutNavBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
  userRegisterBtn.style.display = isLoggedIn ? 'none' : 'inline-block';
  userLoginBtn.style.display = isLoggedIn ? 'none' : 'inline-block';
}

function setupNavigation() {
  toggleNavButtons(!!authToken);
  listDevicesBtn.addEventListener('click', showDeviceList);
  listDevicesBtn.style.display = !!authToken ? 'inline-block' : 'none';
  homeBtn.addEventListener('click', showAuth);
  registerNavBtn.addEventListener('click', showRegister);
  loginNavBtn.addEventListener('click', showLogin);
  userRegisterBtn.addEventListener('click', showUserRegister);
  userLoginBtn.addEventListener('click', showUserLogin);
  logoutNavBtn.addEventListener('click', () => {
    clearAuthToken();
    showAuth();
    toggleNavButtons(false);
  });
}

function showUserLogin() {
  app.innerHTML = `
    <h1>User Login</h1>
    <form id="userLoginForm">
      <label for="email">Email:</label>
      <input type="email" id="email" required>
      <label for="password">Password:</label>
      <input type="password" id="password" required>
      <button type="submit">Login</button>
    </form>
    <div id="error" class="error" style="display: none;"></div>
  `;
  document.getElementById('userLoginForm').addEventListener('submit', handleUserLogin);
}

async function handleUserLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('Invalid email format');
    return;
  }
  if (password.length < 3) {
    showError('Password must be at least 3 characters long');
    return;
  }

  try {
    console.log('Requesting:', `${API_BASE}/user/login`, { email, password });
    const res = await fetch(`${API_BASE}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    const { token, message } = await res.json();
    setAuthToken(token);
    showError(message || 'User logged in successfully!', true);
    toggleNavButtons(true);
    showAuth();
  } catch (err) {
    console.error('Login error:', err.message);
    showError(`Error: ${err.message}`);
  }
}

function showUserRegister() {
  app.innerHTML = `
    <h1>User Registration</h1>
    <form id="userRegisterForm">
      <label for="username">Username:</label>
      <input type="text" id="username" required>
      <label for="email">Email:</label>
      <input type="email" id="email" required>
      <label for="password">Password:</label>
      <input type="password" id="password" required>
      <button type="submit">Register User</button>
    </form>
    <div id="error" class="error" style="display: none;"></div>
  `;
  document.getElementById('userRegisterForm').addEventListener('submit', handleUserRegister);
}

async function handleUserRegister(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!/^[A-Za-z0-9]{3,50}$/.test(username)) {
    showError('Username must be 3-50 alphanumeric characters');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('Invalid email format');
    return;
  }
  if (password.length < 3) {
    showError('Password must be at least 3 characters long');
    return;
  }

  try {
    console.log('Requesting:', `${API_BASE}/user/signup`, { username, email, password });
    const res = await fetch(`${API_BASE}/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    const { message } = await res.json();
    showError(message || 'User registered successfully! Please login.', true);
    showUserLogin();
  } catch (err) {
    console.error('Register error:', err.message);
    showError(`Error: ${err.message}`);
  }
}

function showRegister() {
  app.innerHTML = `
    <h1>Register Device</h1>
    <form id="registerForm">
      <label for="deviceName">Device Name:</label>
      <input type="text" id="deviceName" required>
      <label for="enrollId">Enroll ID:</label>
      <input type="text" id="enrollId" required>
      <label for="value">Value (YYYY-MM-DD HH:MM:SS):</label>
      <input type="text" id="value" required>
      <button type="submit">Register</button>
    </form>
    <div id="error" class="error" style="display: none;"></div>
  `;
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

async function handleRegister(e) {
  e.preventDefault();
  const deviceName = document.getElementById('deviceName').value.trim();
  const enrollId = document.getElementById('enrollId').value.trim();
  const value = document.getElementById('value').value.trim();

  if (deviceName.length > 100 || !/^[A-Za-z\s]{1,100}$/.test(deviceName)) {
    showError('Invalid device name');
    return;
  }
  if (enrollId.length > 20 || !/^[A-Za-z0-9]{1,20}$/.test(enrollId)) {
    showError('Invalid enroll ID');
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    showError('Invalid timestamp format');
    return;
  }

  try {
    console.log('Requesting:', `${API_BASE}/save-data`, { deviceName, enrollId, value });
    const res = await fetch(`${API_BASE}/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ deviceName, enrollId, value })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    const { message } = await res.json();
    showError(message || 'Device registered successfully!', true);
    showLogin(enrollId);
  } catch (err) {
    console.error('Register device error:', err.message);
    showError(`Error: ${err.message}`);
  }
}

function showLogin(preEnrollId = '') {
  app.innerHTML = `
    <h1>Login Device</h1>
    <form id="loginForm">
      <label for="enrollId">Enroll ID:</label>
      <input type="text" id="enrollId" value="${preEnrollId}" required>
      <button type="submit">Load Device</button>
    </form>
    <div id="error" class="error" style="display: none;"></div>
  `;
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  const enrollId = document.getElementById('enrollId').value.trim();
  if (!enrollId) {
    showError('Enroll ID required');
    return;
  }
  await showDeviceControl(enrollId);
}

async function showDeviceControl(enrollId) {
  app.innerHTML = `
    <h1>Device Control</h1>
    <p>Enroll ID: ${enrollId}</p>
    <p id="valueDisplay">Last Value: Loading...</p>
    <p>Status: <span id="status">Loading...</span></p>
    <button id="turnOnBtn">Turn On</button>
    <button id="turnOffBtn">Turn Off</button>
    <button id="refreshBtn">Refresh Status</button>
    <div id="error" class="error" style="display: none;"></div>
    <div id="logsSection">
      <h2>Device Logs</h2>
      <table id="logsTable">
        <thead>
          <tr>
            <th>Action</th>
            <th>Timestamp</th>
            <th>User</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;
  document.getElementById('turnOnBtn').addEventListener('click', () => turnDevice(enrollId, true));
  document.getElementById('turnOffBtn').addEventListener('click', () => turnDevice(enrollId, false));
  document.getElementById('refreshBtn').addEventListener('click', () => refreshStatus(enrollId));
  await refreshStatus(enrollId);
}

async function showDeviceList() {
  app.innerHTML = `
    <h1>Registered Devices</h1>
    <table id="devicesTable">
      <thead>
        <tr>
          <th>Device Name</th>
          <th>Enroll ID</th>
          <th>Value</th>
          <th>Status</th>
          <th>Registered By</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <div id="error" class="error" style="display: none;"></div>
  `;
  try {
    const res = await fetch(`${API_BASE}/get-data`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error('Fetch error');
    const { data } = await res.json();
    const tbody = document.querySelector('#devicesTable tbody');
    data.forEach(device => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${device.devicename}</td>
        <td>${device.enrollid}</td>
        <td>${new Date(device.value).toLocaleString()}</td>
        <td>${device.device_status ? 'ON' : 'OFF'}</td>
        <td>${device.registered_by || 'Unknown'}</td>
        <td><button onclick="showDeviceControl('${device.enrollid}')">Control</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
}

async function turnDevice(enrollId, on) {
  try {
    console.log('Requesting:', `${API_BASE}/device/turn-${on ? 'on' : 'off'}`, { enrollId });
    const res = await fetch(`${API_BASE}/device/turn-${on ? 'on' : 'off'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ enrollId })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    const { message, data: device } = await res.json();
    document.getElementById('status').textContent = device.device_status ? 'ON' : 'OFF';
    document.getElementById('status').className = device.device_status ? 'on' : 'off';
    showError(message || `Device turned ${on ? 'on' : 'off'} successfully!`, true);
    loadLogs(enrollId);
  } catch (err) {
    console.error('Turn device error:', err.message);
    showError(`Error: ${err.message}`);
  }
}

let cachedLogs = {};

async function loadLogs(enrollId) {
  if (cachedLogs[enrollId]) {
    renderLogs(cachedLogs[enrollId]);
    return;
  }
  try {
    console.log('Requesting:', `${API_BASE}/device/logs/${enrollId}`);
    const res = await fetch(`${API_BASE}/device/logs/${enrollId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    const { logs } = await res.json();
    cachedLogs[enrollId] = logs;
    renderLogs(logs);
  } catch (err) {
    console.error('Load logs error:', err.message);
    showError(`Error: ${err.message}`);
  }
}

function renderLogs(logs) {
  const tbody = document.querySelector('#logsTable tbody');
  tbody.innerHTML = '';
  logs.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${log.action.toUpperCase()}</td>
      <td>${new Date(log.timestamp).toLocaleString()}</td>
      <td>${log.username || 'Anonymous'}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function refreshStatus(enrollId) {
  try {
    console.log('Requesting:', `${API_BASE}/device/status/${enrollId}`);
    const res = await fetch(`${API_BASE}/device/status/${enrollId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    const { device_status } = await res.json();
    document.getElementById('status').textContent = device_status ? 'ON' : 'OFF';
    document.getElementById('status').className = device_status ? 'on' : 'off';
    showError('Status refreshed successfully!', true);
    loadLogs(enrollId);
  } catch (err) {
    console.error('Refresh status error:', err.message);
    showError(`Error: ${err.message}`);
  }
}

function showError(message, isSuccess = false) {
  const errorDiv = document.getElementById('error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = isSuccess ? 'success' : 'error';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }
}

function showAuth() {
  toggleNavButtons(!!authToken);
  app.innerHTML = `
    <h1>Welcome to Device Control</h1>
    <p>Please register a new device or login to an existing one.</p>
  `;
}

setupNavigation();
showAuth();