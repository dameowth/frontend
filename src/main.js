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
  listDevicesBtn.addEventListener('click', () => showDeviceList()); // Wrapped to prevent immediate execution
  listDevicesBtn.style.display = !!authToken ? 'inline-block' : 'none';
  homeBtn.addEventListener('click', () => showAuth()); // Wrapped
  registerNavBtn.addEventListener('click', () => showRegister()); // Wrapped
  loginNavBtn.addEventListener('click', () => showLogin()); // Wrapped
  userRegisterBtn.addEventListener('click', () => showUserRegister()); // Wrapped
  userLoginBtn.addEventListener('click', () => showUserLogin()); // Wrapped
  logoutNavBtn.addEventListener('click', () => {
    clearAuthToken();
    showAuth();
  });
}

function showAuth() {
  toggleNavButtons(!!authToken);
  app.innerHTML = `
    <h1>Welcome to Device Control</h1>
    <p>Please register a new device or login to an existing one.</p>
  `;
}

function showUserRegister() {
  if (authToken) {
    showAuth();
    return;
  }
  app.innerHTML = `
    <h1>User Registration</h1>
    <form id="userRegisterForm">
      <input type="text" id="username" placeholder="Username" required><br>
      <input type="email" id="email" placeholder="Email" required><br>
      <input type="password" id="password" placeholder="Password" required><br>
      <button type="submit">Register</button>
    </form>
  `;
  document.getElementById('userRegisterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    fetch(`${API_BASE}/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      alert('Registration successful! Please log in.');
      showUserLogin();
    })
    .catch(err => showError(`Error: ${err.message}`));
  });
}

function showUserLogin() {
  if (authToken) {
    showAuth();
    return;
  }
  app.innerHTML = `
    <h1>User Login</h1>
    <form id="userLoginForm">
      <input type="email" id="loginEmail" placeholder="Email" required><br>
      <input type="password" id="loginPassword" placeholder="Password" required><br>
      <button type="submit">Login</button>
    </form>
  `;
  document.getElementById('userLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    fetch(`${API_BASE}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      setAuthToken(data.token);
      toggleNavButtons(true);
      showAuth();
    })
    .catch(err => showError(`Error: ${err.message}`));
  });
}

function showRegister() {
  if (!authToken) {
    alert('Please log in as a user first');
    showUserLogin();
    return;
  }
  app.innerHTML = `
    <h1>Register Device</h1>
    <form id="registerForm">
      <input type="text" id="deviceName" placeholder="Device Name" required><br>
      <input type="text" id="enrollId" placeholder="Enroll ID" required><br>
      <input type="datetime-local" id="value" value="2025-08-25T09:53" required><br>
      <button type="submit">Register Device</button>
    </form>
  `;
  document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const deviceName = document.getElementById('deviceName').value.trim();
    const enrollId = document.getElementById('enrollId').value.trim();
    const value = document.getElementById('value').value; // Already in ISO format
    if (!deviceName || !enrollId || !value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      showError('Invalid input: Check device name, enroll ID, or timestamp');
      return;
    }
    fetch(`${API_BASE}/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ deviceName, enrollId, value })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      showError('Device registered successfully!', true);
      showAuth();
    })
    .catch(err => showError(`Error: ${err.message}`));
  });
}

function showLogin() {
  if (!authToken) {
    alert('Please log in as a user first');
    showUserLogin();
    return;
  }
  app.innerHTML = `
    <h1>Login Device</h1>
    <form id="loginForm">
      <input type="text" id="enrollId" placeholder="Enroll ID" required><br>
      <button type="submit">Login Device</button>
    </form>
  `;
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const enrollId = document.getElementById('enrollId').value.trim();
    if (!enrollId) {
      showError('Please enter Enroll ID');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/device/status/${enrollId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Device not found');
      showDeviceControl(enrollId);
    } catch (err) {
      showError(`Error: ${err.message}`);
    }
  });
}

function showDeviceControl(enrollId) {
  if (!authToken) {
    alert('Please log in as a user first');
    showUserLogin();
    return;
  }
  app.innerHTML = `
    <h1>Device Control</h1>
    <p>Enroll ID: ${enrollId}</p>
    <p>Status: <span id="status">Loading...</span></p>
    <button id="turnOnBtn">Turn ON</button>
    <button id="turnOffBtn">Turn OFF</button>
    <h2>Logs</h2>
    <table id="logsTable">
      <thead><tr><th>Action</th><th>Timestamp</th><th>User</th></tr></thead>
      <tbody></tbody>
    </table>
  `;
  const turnOnBtn = document.getElementById('turnOnBtn');
  const turnOffBtn = document.getElementById('turnOffBtn');
  turnOnBtn.addEventListener('click', () => toggleDevice(enrollId, true));
  turnOffBtn.addEventListener('click', () => toggleDevice(enrollId, false));
  refreshStatus(enrollId);
}

async function toggleDevice(enrollId, status) {
  if (!authToken) {
    showError('Please log in to toggle device status');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/device/status/${enrollId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ device_status: status })
    });
    if (!res.ok) throw new Error('Failed to toggle status');
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
      <thead><tr><th>Device Name</th><th>Enroll ID</th><th>Value</th><th>Status</th></tr></thead>
      <tbody></tbody>
    </table>
  `;
  try {
    const res = await fetch(`${API_BASE}/get-data`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error('Failed to fetch devices');
    const data = await res.json();
    const tbody = document.querySelector('#devicesTable tbody');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No data found</td></tr>';
    } else {
      data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.deviceName}</td>
          <td>${item.enrollId}</td>
          <td>${new Date(item.value).toLocaleString()}</td>
          <td>${item.device_status ? 'ON' : 'OFF'}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
}

async function loadLogs(enrollId) {
  if (!authToken) {
    showError('Please log in to view logs');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/device/logs/${enrollId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error('Failed to fetch logs');
    const { logs } = await res.json();
    renderLogs(logs);
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
}

async function refreshStatus(enrollId) {
  if (!authToken) {
    showError('Please log in to refresh status');
    return;
  }
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

setupNavigation();
showAuth();