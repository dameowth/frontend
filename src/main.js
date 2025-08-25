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
  listDevicesBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
}

function setupNavigation() {
  toggleNavButtons(!!authToken);
  homeBtn.addEventListener('click', () => showAuth());
  registerNavBtn.addEventListener('click', () => showRegister());
  loginNavBtn.addEventListener('click', () => showDeviceLogin());
  userRegisterBtn.addEventListener('click', () => showUserRegister());
  userLoginBtn.addEventListener('click', () => showUserLogin());
  listDevicesBtn.addEventListener('click', () => showDeviceList());
  logoutNavBtn.addEventListener('click', () => {
    clearAuthToken();
    toggleNavButtons(false);
    showAuth();
  });
}

function showAuth() {
  app.innerHTML = `
    <h1>Welcome to Device Control</h1>
    <p>Please register a new device or login to an existing one.</p>
  `;
  toggleNavButtons(!!authToken);
}

function showUserRegister() {
  if (authToken) return showAuth();
  app.innerHTML = `
    <h1>User Registration</h1>
    <form id="userRegisterForm">
      <input type="text" id="username" placeholder="Username" required><br>
      <input type="email" id="email" placeholder="Email" required><br>
      <input type="password" id="password" placeholder="Password" required><br>
      <button type="submit">Register</button>
    </form>
  `;
  document.getElementById('userRegisterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    try {
      const res = await fetch(`${API_BASE}/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
      const data = await res.json();
      alert('Registration successful! Please log in.');
      showUserLogin();
    } catch (err) {
      showError(`Error: ${err.message}`);
    }
  });
}

function showUserLogin() {
  if (authToken) return showAuth();
  app.innerHTML = `
    <h1>User Login</h1>
    <form id="userLoginForm">
      <input type="email" id="loginEmail" placeholder="Email" required><br>
      <input type="password" id="loginPassword" placeholder="Password" required><br>
      <button type="submit">Login</button>
    </form>
  `;
  document.getElementById('userLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    try {
      const res = await fetch(`${API_BASE}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }
      const data = await res.json();
      setAuthToken(data.token);
      toggleNavButtons(true);
      showAuth();
    } catch (err) {
      showError(`Error: ${err.message}`);
    }
  });
}

function showRegister() {
  if (!authToken) {
    alert('Please log in as a user first');
    return showUserLogin();
  }
  app.innerHTML = `
    <h1>Register Device</h1>
    <form id="registerForm">
      <input type="text" id="deviceName" placeholder="Device Name" required><br>
      <input type="text" id="enrollId" placeholder="Enroll ID" required><br>
      <input type="text" id="value" placeholder="Timestamp (YYYY-MM-DD HH:MM:SS)" required><br>
      <button type="submit">Register</button>
    </form>
  `;
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const deviceName = document.getElementById('deviceName').value.trim();
    const enrollId = document.getElementById('enrollId').value.trim();
    const value = document.getElementById('value').value.trim();
    try {
      const res = await fetch(`${API_BASE}/save-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ deviceName, enrollId, value })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
      const data = await res.json();
      alert('Device registered successfully!');
      showAuth();
    } catch (err) {
      showError(`Error: ${err.message}`);
    }
  });
}

function showDeviceLogin(enrollId = prompt('Enter Enroll ID:')) {
  if (!authToken) {
    alert('Please log in as a user first');
    return showUserLogin();
  }
  if (!enrollId?.trim()) return;
  app.innerHTML = `
    <h1>Device Control</h1>
    <p>Enroll ID: ${enrollId}</p>
    <p>Status: <span id="status">Loading...</span></p>
    <button id="turnOnBtn">Turn ON</button>
    <button id="turnOffBtn">Turn OFF</button>
    <button id="refreshBtn">Refresh Status</button>
    <h2>Logs</h2>
    <table id="logsTable">
      <thead><tr><th>Action</th><th>Timestamp</th><th>User</th></tr></thead>
      <tbody></tbody>
    </table>
  `;
  document.getElementById('turnOnBtn').addEventListener('click', () => toggleDevice(enrollId, true));
  document.getElementById('turnOffBtn').addEventListener('click', () => toggleDevice(enrollId, false));
  document.getElementById('refreshBtn').addEventListener('click', () => refreshStatus(enrollId));
  refreshStatus(enrollId);
}

async function toggleDevice(enrollId, turnOn) {
  if (!authToken) return showError('Please log in to toggle device status');
  try {
    const endpoint = turnOn ? '/device/turn-on' : '/device/turn-off';
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ enrollId: enrollId.trim() })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to toggle status');
    }
    const data = await res.json();
    showError('Device status updated successfully!', true);
    refreshStatus(enrollId);
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
}

async function showDeviceList() {
  if (!authToken) {
    alert('Please log in as a user first');
    showUserLogin();
    return;
  }
  app.innerHTML = `
    <h1>Device List</h1>
    <table id="devicesTable">
      <thead><tr><th>Device Name</th><th>Enroll ID</th><th>Value</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody></tbody>
    </table>
  `;
  try {
    const res = await fetch(`${API_BASE}/get-data`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch devices');
    }
    const data = await res.json();
    const tbody = document.querySelector('#devicesTable tbody');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No data found</td></tr>';
    } else {
      data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.deviceName}</td>
          <td>${item.enrollId}</td>
          <td>${new Date(item.value).toLocaleString()}</td>
          <td>${item.device_status ? 'ON' : 'OFF'}</td>
          <td>
            <button onclick="toggleDevice('${item.enrollId}', true)">Turn ON</button>
            <button onclick="toggleDevice('${item.enrollId}', false)">Turn OFF</button>
            <button onclick="showDeviceLogin('${item.enrollId}')">Control & Logs</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
}

async function loadLogs(enrollId) {
  if (!authToken) return showError('Please log in to view logs');
  try {
    const res = await fetch(`${API_BASE}/device/logs/${enrollId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch logs');
    }
    const { logs } = await res.json();
    renderLogs(logs);
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
}

async function refreshStatus(enrollId) {
  try {
    const res = await fetch(`${API_BASE}/device/status/${enrollId}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    const statusSpan = document.getElementById('status');
    if (statusSpan) {
      statusSpan.textContent = data.device_status ? 'ON' : 'OFF';
      statusSpan.className = data.device_status ? 'on' : 'off';
    }
    showError('Status refreshed successfully!', true);
    loadLogs(enrollId);
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
}

function renderLogs(logs) {
  const tbody = document.querySelector('#logsTable tbody');
  if (!tbody) return;
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

function showError(message, isSuccess = false) {
  const errorDiv = document.getElementById('error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = isSuccess ? 'success' : 'error';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
  } else {
    console.error(message);
  }
}

setupNavigation();
showAuth();