// ============================================
// API Helper Functions
// ============================================

class API {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('token');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(method, endpoint, body = null) {
    const options = {
      method,
      headers: this.getHeaders(),
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  login(username, password) {
    return this.request('POST', '/login', { username, password });
  }

  verifyKey(key, deviceId) {
    return this.request('POST', '/verify', { key, deviceId });
  }

  createKey() {
    return this.request('POST', '/create-key');
  }

  listKeys() {
    return this.request('GET', '/list-keys');
  }

  resetKey(keyId) {
    return this.request('POST', '/reset-key', { keyId });
  }

  deleteKey(keyId) {
    return this.request('POST', '/delete-key', { keyId });
  }

  createApiKey(name) {
    return this.request('POST', '/create-api-key', { name });
  }

  listApiKeys() {
    return this.request('GET', '/list-api-keys');
  }

  deleteApiKey(keyId) {
    return this.request('POST', '/delete-api-key', { keyId });
  }
}

const api = new API();

// ============================================
// UI Helper Functions
// ============================================

class Toast {
  static show(message, type = 'info', duration = 3000) {
    const container = document.querySelector('.toast-container') || this.createContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  static createContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  static success(message) {
    this.show(message, 'success');
  }

  static error(message) {
    this.show(message, 'error', 5000);
  }

  static warning(message) {
    this.show(message, 'warning');
  }

  static info(message) {
    this.show(message, 'info');
  }
}

// ============================================
// Modal Helper
// ============================================

function showConfirmModal(title, message, onConfirm) {
  let modal = document.getElementById('confirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modalTitle"></h2>
        </div>
        <p id="modalMessage"></p>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button class="btn btn-danger" id="confirmBtn">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMessage').textContent = message;

  const confirmBtn = document.getElementById('confirmBtn');
  confirmBtn.onclick = () => {
    onConfirm();
    closeModal();
  };

  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// ============================================
// Loading Indicator
// ============================================

function showLoading() {
  let overlay = document.getElementById('loadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// ============================================
// Navigation & Auth
// ============================================

function setActive(selector) {
  document.querySelectorAll('.menu a').forEach((a) => a.classList.remove('active'));
  const el = document.querySelector(selector);
  if (el) el.classList.add('active');
}

function checkAuth() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  if (!token || !username) {
    // Redirect to login
    if (!window.location.pathname.includes('login.html')) {
      window.location.href = 'login.html';
    }
    return false;
  }

  // Update header username
  const usernameEl = document.querySelector('.header-username');
  if (usernameEl) {
    usernameEl.textContent = username;
  }

  return true;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = 'login.html';
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    Toast.success('Copied to clipboard');
  });
}

// ============================================
// Login Page
// ============================================

async function handleLogin() {
  const username = document.querySelector('#username').value;
  const password = document.querySelector('#password').value;

  if (!username || !password) {
    Toast.error('Please enter username and password');
    return;
  }

  showLoading();

  try {
    const result = await api.login(username, password);

    if (result.success) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('username', result.data.username);
      Toast.success('Login successful');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      Toast.error(result.error || 'Login failed');
    }
  } catch (error) {
    Toast.error(error.message || 'Login failed');
  } finally {
    hideLoading();
  }
}

// ============================================
// Dashboard Page
// ============================================

async function loadDashboard() {
  showLoading();

  try {
    const keysResult = await api.listKeys();
    const apiKeysResult = await api.listApiKeys();

    const totalKeys = keysResult.data?.length || 0;
    const boundKeys = keysResult.data?.filter((k) => k.deviceId).length || 0;
    const availableKeys = totalKeys - boundKeys;
    const apiKeysCount = apiKeysResult.data?.length || 0;

    // Update stats
    document.querySelector('[data-stat="total-keys"]').textContent = totalKeys;
    document.querySelector('[data-stat="bound-keys"]').textContent = boundKeys;
    document.querySelector('[data-stat="available-keys"]').textContent = availableKeys;
    document.querySelector('[data-stat="api-keys"]').textContent = apiKeysCount;
  } catch (error) {
    Toast.error('Failed to load dashboard');
  } finally {
    hideLoading();
  }
}

// ============================================
// License Keys Page
// ============================================

async function loadKeys() {
  showLoading();

  try {
    const result = await api.listKeys();

    if (result.success && result.data) {
      renderKeysTable(result.data);
    } else {
      Toast.error(result.error || 'Failed to load keys');
    }
  } catch (error) {
    Toast.error(error.message || 'Failed to load keys');
  } finally {
    hideLoading();
  }
}

function renderKeysTable(keys) {
  const tbody = document.querySelector('#keysTable tbody');
  tbody.innerHTML = '';

  if (keys.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No license keys found</td></tr>';
    return;
  }

  keys.forEach((key) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <code class="code">${key.key}</code>
      </td>
      <td>
        ${key.deviceId || '<span class="text-muted">-</span>'}
      </td>
      <td>
        <span class="status-badge ${key.status}">
          ${key.status === 'available' ? '●' : '●'} ${key.status}
        </span>
      </td>
      <td>
        <small class="text-muted">${new Date(key.createdAt).toLocaleDateString()}</small>
      </td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${key.key}')">
            Copy
          </button>
          ${
            key.deviceId
              ? `<button class="btn btn-warning btn-sm" onclick="confirmResetKey('${key._id}')">
            Reset
          </button>`
              : ''
          }
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteKey('${key._id}')">
            Delete
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function createNewKey() {
  showLoading();

  try {
    const result = await api.createKey();

    if (result.success) {
      Toast.success(`New license key created: ${result.data.key}`);
      loadKeys();
    } else {
      Toast.error(result.error || 'Failed to create key');
    }
  } catch (error) {
    Toast.error(error.message || 'Failed to create key');
  } finally {
    hideLoading();
  }
}

function confirmResetKey(keyId) {
  showConfirmModal(
    'Reset License Key',
    'Are you sure you want to reset this key? The device binding will be removed.',
    () => resetKey(keyId)
  );
}

async function resetKey(keyId) {
  showLoading();

  try {
    const result = await api.resetKey(keyId);

    if (result.success) {
      Toast.success('License key reset successfully');
      loadKeys();
    } else {
      Toast.error(result.error || 'Failed to reset key');
    }
  } catch (error) {
    Toast.error(error.message || 'Failed to reset key');
  } finally {
    hideLoading();
  }
}

function confirmDeleteKey(keyId) {
  showConfirmModal(
    'Delete License Key',
    'Are you sure you want to delete this key? This action cannot be undone.',
    () => deleteKey(keyId)
  );
}

async function deleteKey(keyId) {
  showLoading();

  try {
    const result = await api.deleteKey(keyId);

    if (result.success) {
      Toast.success('License key deleted successfully');
      loadKeys();
    } else {
      Toast.error(result.error || 'Failed to delete key');
    }
  } catch (error) {
    Toast.error(error.message || 'Failed to delete key');
  } finally {
    hideLoading();
  }
}

// ============================================
// API Keys Page
// ============================================

async function loadApiKeys() {
  showLoading();

  try {
    const result = await api.listApiKeys();

    if (result.success && result.data) {
      renderApiKeysTable(result.data);
    } else {
      Toast.error(result.error || 'Failed to load API keys');
    }
  } catch (error) {
    Toast.error(error.message || 'Failed to load API keys');
  } finally {
    hideLoading();
  }
}

function renderApiKeysTable(keys) {
  const tbody = document.querySelector('#apiKeysTable tbody');
  tbody.innerHTML = '';

  if (keys.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No API keys found</td></tr>';
    return;
  }

  keys.forEach((key) => {
    const maskedKey = key.apiKey.substring(0, 10) + '...' + key.apiKey.substring(key.apiKey.length - 10);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong>${key.name}</strong>
      </td>
      <td>
        <code class="code">${maskedKey}</code>
      </td>
      <td>
        <small class="text-muted">${new Date(key.createdAt).toLocaleDateString()}</small>
      </td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${key.apiKey}')">
            Copy
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteApiKey('${key._id}')">
            Delete
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function createNewApiKey() {
  const name = document.querySelector('#apiKeyName').value;

  if (!name.trim()) {
    Toast.error('Please enter API key name');
    return;
  }

  showLoading();

  try {
    const result = await api.createApiKey(name);

    if (result.success) {
      Toast.success(`New API key created: ${result.data.apiKey}`);
      document.querySelector('#apiKeyName').value = '';
      loadApiKeys();
    } else {
      Toast.error(result.error || 'Failed to create API key');
    }
  } catch (error) {
    Toast.error(error.message || 'Failed to create API key');
  } finally {
    hideLoading();
  }
}

function confirmDeleteApiKey(keyId) {
  showConfirmModal(
    'Delete API Key',
    'Are you sure you want to delete this API key? This action cannot be undone.',
    () => deleteApiKey(keyId)
  );
}

async function deleteApiKey(keyId) {
  showLoading();

  try {
    const result = await api.deleteApiKey(keyId);

    if (result.success) {
      Toast.success('API key deleted successfully');
      loadApiKeys();
    } else {
      Toast.error(result.error || 'Failed to delete API key');
    }
  } catch (error) {
    Toast.error(error.message || 'Failed to delete API key');
  } finally {
    hideLoading();
  }
}

// ============================================
// Initialize on Page Load
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('login.html')) {
    // Login page
    const loginBtn = document.querySelector('#loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', handleLogin);
    }

    // Allow Enter key to login
    document.querySelector('input[type="password"]').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  } else {
    // Protected pages
    if (!checkAuth()) return;

    if (path.includes('dashboard.html')) {
      setActive('[href="dashboard.html"]');
      loadDashboard();
    } else if (path.includes('keys.html')) {
      setActive('[href="keys.html"]');
      loadKeys();

      const createBtn = document.querySelector('#createKeyBtn');
      if (createBtn) {
        createBtn.addEventListener('click', createNewKey);
      }
    } else if (path.includes('api.html')) {
      setActive('[href="api.html"]');
      loadApiKeys();

      const createBtn = document.querySelector('#createApiKeyBtn');
      if (createBtn) {
        createBtn.addEventListener('click', createNewApiKey);
      }
    }
  }
});
