const API_BASE = 'https://exercise1-nt4i.onrender.com';

const app = document.getElementById('app');
const navbar = document.getElementById('navbar');
const homeBtn = document.getElementById('homeBtn');
const registerNavBtn = document.getElementById('registerNavBtn');
const loginNavBtn = document.getElementById('loginNavBtn');
const logoutNavBtn = document.getElementById('logoutNavBtn');

function setupNavigation() {
  homeBtn.addEventListener('click', showAuth);
  registerNavBtn.addEventListener('click', showRegister);
  loginNavBtn.addEventListener('click', showLogin);
  logoutNavBtn.addEventListener('click', () => {
    showAuth();
    toggleNavButtons(false);
  });
}

function toggleNavButtons(isLoggedIn) {
  registerNavBtn.style.display = isLoggedIn ? 'none' : 'block';
  loginNavBtn.style.display = isLoggedIn ? 'none' : 'block';
  logoutNavBtn.style.display = isLoggedIn ? 'block' : 'none';
}

function showAuth() {
  toggleNavButtons(false);
  app.innerHTML = `
    <h1>Welcome to Device Control</h1>
    <p>Please register a new device or login to an existing one.</p>
  `;
}

function showRegister() {
  toggleNavButtons(false);
  app.innerHTML = `
    <h1>Register Device</h1>
    <form id="registerForm">
      <label for="name">Device Name:</label>
      <input type="text" id="name" required>
      <label for="enrollId">Enroll ID:</label>
      <input type="text" id="enrollId" required>
      <button type="submit">Register</button>
    </form>
  `;
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

async function handleRegister(e) {
  e.preventDefault();
  const deviceName = document.getElementById('name').value.trim();
  const enrollId = document.getElementById('enrollId').value.trim();
  const now = new Date();
  const value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  if (deviceName.length > 100 || !/^[A-Za-z\s]+$/.test(deviceName)) {
    alert('Invalid device name: Must be letters and spaces only, max 100 characters.');
    return;
  }
  if (enrollId.length > 20 || !/^[A-Za-z0-9]+$/.test(enrollId)) {
    alert('Invalid Enroll ID: Alphanumeric only, max 20 characters.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/save-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    alert(`Error: ${err.message}`);
  }
}

function showLogin() {
  toggleNavButtons(false);
  app.innerHTML = `
    <h1>Login to Device</h1>
    <form id="loginForm">
      <label for="enrollId">Enroll ID:</label>
      <input type="text" id="enrollId" required>
      <button type="submit">Login</button>
    </form>
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
      alert('Device not found with this Enroll ID.');
      return;
    }
    showControl(enrollId, device.deviceName, device.value, device.device_status);
    toggleNavButtons(true);
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

function showControl(enrollId, deviceName, value, status) {
  toggleNavButtons(true);
  app.innerHTML = `
    <h1>Device Control: ${deviceName}</h1>
    <p>Enroll ID: ${enrollId}</p>
    <p id="valueDisplay">Last Value: ${value}</p>
    <p>Status: <span id="status" class="${status ? 'on' : 'off'}">${status ? 'ON' : 'OFF'}</span></p>
    <button id="turnOn">Turn On</button>
    <button id="turnOff">Turn Off</button>
    <button id="refresh">Refresh</button>
    <div id="logsSection">
      <h2>Usage Logs</h2>
      <table id="logsTable">
        <thead>
          <tr>
            <th>Action</th>
            <th>Date and Time</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
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
      headers: { 'Content-Type': 'application/json' },
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
    alert(`Error: ${err.message}`);
  }
}

async function refreshStatus(enrollId) {
  try {
    const resStatus = await fetch(`${API_BASE}/device/status/${enrollId}`);
    if (!resStatus.ok) throw new Error('Failed to fetch status.');
    const { device_status } = await resStatus.json();
    document.getElementById('status').textContent = device_status ? 'ON' : 'OFF';
    document.getElementById('status').className = device_status ? 'on' : 'off';

    const resData = await fetch(`${API_BASE}/getdata`);
    if (!resData.ok) throw new Error('Failed to fetch device data.');
    const { data: rows } = await resData.json();
    const device = rows.find(r => r.enrollid === enrollId);
    if (device) {
      document.getElementById('valueDisplay').textContent = `Last Value: ${device.value}`;
    }
    loadLogs(enrollId);
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

async function loadLogs(enrollId) {
  try {
    const res = await fetch(`${API_BASE}/device/logs/${enrollId}`);
    if (!res.ok) throw new Error('Failed to fetch logs.');
    const { logs } = await res.json();
    const tbody = document.querySelector('#logsTable tbody');
    tbody.innerHTML = '';
    logs.forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${log.action.toUpperCase()}</td>
        <td>${new Date(log.timestamp).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(`Error loading logs: ${err.message}`);
  }
}

setupNavigation();
showAuth();