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

function setupNavigation() {
  const isLoggedIn = !!authToken;
  toggleNavButtons(isLoggedIn);
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
  try {
    const res = await fetch(`${API_BASE}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP error! status: ${res.status}, response: ${text}`);
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Response is not JSON: ${text}`);
    }
    const data = await res.json();
    const { token } = data;
    setAuthToken(token);
    showError('User logged in successfully!', false);
    toggleNavButtons(true);
    showAuth();
  } catch (err) {
    showError(`Error: ${err.message}`);
    console.log("Raw response:", await res.text());
  }
}

function toggleNavButtons(isLoggedIn) {
  registerNavBtn.style.display = isLoggedIn ? 'block' : 'none';
  loginNavBtn.style.display = isLoggedIn ? 'block' : 'none';
  logoutNavBtn.style.display = isLoggedIn ? 'block' : 'none';
  userRegisterBtn.style.display = isLoggedIn ? 'none' : 'block';
  userLoginBtn.style.display = isLoggedIn ? 'none' : 'block';
}

function showAuth() {
  toggleNavButtons(!!authToken);
  const content = document.createElement('div');
  content.innerHTML = `
    <h1>Welcome to Device Control</h1>
    <p>Please register a new device or login to an existing one.</p>
  `;
  app.innerHTML = '';
  app.appendChild(content);
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

  if (username.length > 50 || !/^[A-Za-z0-9_]+$/.test(username)) {
    showError('Invalid username: Alphanumeric and underscores only, max 50 characters.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('Invalid email format.');
    return;
  }
  if (password.length < 8 || password.length > 100) {
    showError('Password must be between 8 and 100 characters.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    showError('User registered successfully! Please login.', false);
    showUserLogin();
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
}

function showRegister() {
  if (!authToken) {
    showError('Please log in to register a device.');
    showUserLogin();
    return;
  }
  app.innerHTML = `
    <h1>Register Device</h1>
    <form id="registerForm">
      <label for="name">Device Name:</label>
      <input type="text" id="name" required>
      <label for="enrollId">Enroll ID:</label>
      <input type="text" id="enrollId" required>
      <button type="submit">Register</button>
    </form>
    <div id="error" class="error" style="display: none;"></div>
  `;
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

async function handleRegister(e) {
  e.preventDefault();
  if (!authToken) {
    showError('Please log in to register a device.');
    showUserLogin();
    return;
  }
  const deviceName = document.getElementById('name').value.trim();
  const enrollId = document.getElementById('enrollId').value.trim();
  const now = new Date();
  const value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  if (deviceName.length > 100 || !/^[A-Za-z\s]+$/.test(deviceName)) {
    showError('Invalid device name: Must be letters and spaces only, max 100 characters.');
    return;
  }
  if (enrollId.length > 20 || !/^[A-Za-z0-9]+$/.test(enrollId)) {
    showError('Invalid Enroll ID: Alphanumeric only, max 20 characters.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/device/save-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ deviceName, enrollId, value })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to register.');
    }
    const { data: device } = await res.json();
    showControl(enrollId, device.deviceName, device.value, device.device_status);
    toggleNavButtons(true);
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
}

function showLogin() {
  app.innerHTML = `
    <h1>Login to Device</h1>
    <form id="loginForm">
      <label for="enrollId">Enroll ID:</label>
      <input type="text" id="enrollId" required>
      <button type="submit">Login</button>
    </form>
    <div id="error" class="error" style="display: none;"></div>
  `;
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  const enrollId = document.getElementById('enrollId').value.trim();

  try {
    const res = await fetch(`${API_BASE}/getdata`);
    if (!res.ok) throw new Error('Failed to fetch device data.');
    const { data: rows } = await res.json();
    const device = rows.find(r => r.enrollid === enrollId);
    if (!device) {
      showError('Device not found with this Enroll ID.');
      return;
    }
    showControl(enrollId, device.deviceName, device.value, device.device_status);
    toggleNavButtons(true);
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
}

function showControl(enrollId, deviceName, value, status) {
  toggleNavButtons(true);
  app.innerHTML = `
    <h1>Device Control: ${deviceName}</h1>
    <p>Enroll ID: ${enrollId}</p>
    <p id="valueDisplay">Last Value: ${value}</p>
    <p>Status: <span id="status" class="${status ? 'on' : 'off'}" role="status">${status ? 'ON' : 'OFF'}</span></p>
    <button id="turnOn">Turn On</button>
    <button id="turnOff">Turn Off</button>
    <button id="refresh">Refresh</button>
    <div id="logsSection">
      <h2>Usage Logs</h2>
      <table id="logsTable" role="grid" aria-label="Device Usage Logs">
        <thead>
          <tr>
            <th scope="col">Action</th>
            <th scope="col">Date and Time</th>
            <th scope="col">User</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <div id="error" class="error" style="display: none;"></div>
  `;
  document.getElementById('turnOn').addEventListener('click', () => handleTurn(enrollId, true));
  document.getElementById('turnOff').addEventListener('click', () => handleTurn(enrollId, false));
  document.getElementById('refresh').addEventListener('click', () => refreshStatus(enrollId));
  loadLogs(enrollId);
}

async function handleTurn(enrollId, on) {
  const endpoint = on ? '/device/turn-on' : '/device/turn-off';
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ enrollId })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update status.');
    }
    const { data: device } = await res.json();
    document.getElementById('status').textContent = device.device_status ? 'ON' : 'OFF';
    document.getElementById('status').className = device.device_status ? 'on' : 'off';
    loadLogs(enrollId);
  } catch (err) {
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
    const res = await fetch(`${API_BASE}/device/logs/${enrollId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error('Failed to fetch logs.');
    const { logs } = await res.json();
    cachedLogs[enrollId] = logs;
    renderLogs(logs);
  } catch (err) {
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
    const res = await fetch(`${API_BASE}/device/${enrollId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error('Failed to fetch device data.');
    const { device_status, value } = await res.json();
    document.getElementById('status').textContent = device_status ? 'ON' : 'OFF';
    document.getElementById('status').className = device_status ? 'on' : 'off';
    document.getElementById('valueDisplay').textContent = `Last Value: ${value}`;
    loadLogs(enrollId);
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
}

function showError(message, isSuccess = false) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  errorDiv.className = isSuccess ? 'success' : 'error';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

let authToken = localStorage.getItem('authToken') || null;

function setAuthToken(token) {
  authToken = token;
  localStorage.setItem('authToken', token);
}

function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('authToken');
}

setupNavigation();
showAuth();