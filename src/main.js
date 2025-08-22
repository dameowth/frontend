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

  // Validar email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('Invalid email format');
    return;
  }
  if (password.length < 3) {
    showError('Password must be at least 3 characters long');
    return;
  }

  let res;
  try {
    console.log('Requesting:', `${API_BASE}/user/login`, { email, password });
    res = await fetch(`${API_BASE}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${res.status}, response: ${text}`);
      }
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Response is not JSON: ${text}`);
    }
    const data = await res.json();
    const { token } = data;
    setAuthToken(token);
    showError('User logged in successfully!', true);
    toggleNavButtons(true);
    showAuth();
  } catch (err) {
    console.error('Login error:', err.message);
    if (res) {
      const rawText = await res.text();
      console.error('Raw response in catch:', rawText);
    }
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

  // Validar inputs
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

  let res;
  try {
    console.log('Requesting:', `${API_BASE}/user/signup`, { username, email, password });
    res = await fetch(`${API_BASE}/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${res.status}, response: ${text}`);
      }
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Response is not JSON: ${text}`);
    }
    const data = await res.json();
    showError('User registered successfully!', true);
    showUserLogin();
  } catch (err) {
    console.error('Register error:', err.message);
    if (res) {
      const rawText = await res.text();
      console.error('Raw response in catch:', rawText);
    }
    showError(`Error: ${err.message}`);
  }
}

function showRegister() {
  app.innerHTML = `
    <h1>Register Device</h1>
    <form id="deviceRegisterForm">
      <label for="deviceName">Device Name:</label>
      <input type="text" id="deviceName" required>
      <label for="enrollId">Enroll ID:</label>
      <input type="text" id="enrollId" required>
      <label for="value">Timestamp (YYYY-MM-DD HH:MM:SS):</label>
      <input type="text" id="value" required>
      <button type="submit">Register Device</button>
    </form>
    <div id="error" class="error" style="display: none;"></div>
  `;
  document.getElementById('deviceRegisterForm').addEventListener('submit', handleRegister);
}

async function handleRegister(e) {
  e.preventDefault();
  const deviceName = document.getElementById('deviceName').value.trim();
  const enrollId = document.getElementById('enrollId').value.trim();
  const value = document.getElementById('value').value.trim();

  // Validar inputs
  if (!/^[A-Za-z\s]{1,100}$/.test(deviceName)) {
    showError('Device name must be 1-100 alphabetic characters or spaces');
    return;
  }
  if (!/^[A-Za-z0-9]{1,20}$/.test(enrollId)) {
    showError('Enroll ID must be 1-20 alphanumeric characters');
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    showError('Timestamp must be in YYYY-MM-DD HH:MM:SS format');
    return;
  }

  let res;
  try {
    console.log('Requesting:', `${API_BASE}/save-data`, { deviceName, enrollId, value });
    res = await fetch(`${API_BASE}/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ deviceName, enrollId, value })
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${res.status}, response: ${text}`);
      }
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Response is not JSON: ${text}`);
    }
    const { data } = await res.json();
    showError('Device registered successfully!', true);
    showControl(data.enrollId, data.deviceName, data.value, data.device_status);
  } catch (err) {
    console.error('Register device error:', err.message);
    if (res) {
      const rawText = await res.text();
      console.error('Raw response in catch:', rawText);
    }
    showError(`Error: ${err.message}`);
  }
}

function showLogin() {
  app.innerHTML = `
    <h1>Device Login</h1>
    <form id="deviceLoginForm">
      <label for="enrollId">Enroll ID:</label>
      <input type="text" id="enrollId" required>
      <button type="submit">Login Device</button>
    </form>
    <div id="error" class="error" style="display: none;"></div>
  `;
  document.getElementById('deviceLoginForm').addEventListener('submit', handleDeviceLogin);
}

async function handleDeviceLogin(e) {
  e.preventDefault();
  const enrollId = document.getElementById('enrollId').value.trim();

  // Validar enrollId
  if (!/^[A-Za-z0-9]{1,20}$/.test(enrollId)) {
    showError('Enroll ID must be 1-20 alphanumeric characters');
    return;
  }

  let res;
  try {
    console.log('Requesting:', `${API_BASE}/device/status/${enrollId}`);
    res = await fetch(`${API_BASE}/device/status/${enrollId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${res.status}, response: ${text}`);
      }
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Response is not JSON: ${text}`);
    }
    const { device_status } = await res.json();
    // Asumimos que necesitamos más datos del dispositivo, así que hacemos otra llamada
    const deviceRes = await fetch(`${API_BASE}/device/${enrollId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!deviceRes.ok) {
      const text = await deviceRes.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || `HTTP error! status: ${deviceRes.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${deviceRes.status}, response: ${text}`);
      }
    }
    const deviceData = await deviceRes.json();
    showControl(enrollId, deviceData.deviceName, deviceData.value, device_status);
  } catch (err) {
    console.error('Device login error:', err.message);
    if (res) {
      const rawText = await res.text();
      console.error('Raw response in catch:', rawText);
    }
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
  let res;
  try {
    console.log('Requesting:', `${API_BASE}${endpoint}`, { enrollId });
    res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ enrollId })
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${res.status}, response: ${text}`);
      }
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Response is not JSON: ${text}`);
    }
    const { data: device } = await res.json();
    document.getElementById('status').textContent = device.device_status ? 'ON' : 'OFF';
    document.getElementById('status').className = device.device_status ? 'on' : 'off';
    showError(`Device turned ${on ? 'on' : 'off'} successfully!`, true);
    loadLogs(enrollId);
  } catch (err) {
    console.error('Turn error:', err.message);
    if (res) {
      const rawText = await res.text();
      console.error('Raw response in catch:', rawText);
    }
    showError(`Error: ${err.message}`);
  }
}

let cachedLogs = {};

async function loadLogs(enrollId) {
  if (cachedLogs[enrollId]) {
    renderLogs(cachedLogs[enrollId]);
    return;
  }
  let res;
  try {
    console.log('Requesting:', `${API_BASE}/device/logs/${enrollId}`);
    res = await fetch(`${API_BASE}/device/logs/${enrollId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${res.status}, response: ${text}`);
      }
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Response is not JSON: ${text}`);
    }
    const { logs } = await res.json();
    cachedLogs[enrollId] = logs;
    renderLogs(logs);
  } catch (err) {
    console.error('Load logs error:', err.message);
    if (res) {
      const rawText = await res.text();
      console.error('Raw response in catch:', rawText);
    }
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
  let res;
  try {
    console.log('Requesting:', `${API_BASE}/device/${enrollId}`);
    res = await fetch(`${API_BASE}/device/${enrollId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${res.status}, response: ${text}`);
      }
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Response is not JSON: ${text}`);
    }
    const { device_status, value } = await res.json();
    document.getElementById('status').textContent = device_status ? 'ON' : 'OFF';
    document.getElementById('status').className = device_status ? 'on' : 'off';
    document.getElementById('valueDisplay').textContent = `Last Value: ${value}`;
    showError('Status refreshed successfully!', true);
    loadLogs(enrollId);
  } catch (err) {
    console.error('Refresh status error:', err.message);
    if (res) {
      const rawText = await res.text();
      console.error('Raw response in catch:', rawText);
    }
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