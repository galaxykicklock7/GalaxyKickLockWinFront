import axios from 'axios';

// Get backend URL from environment variable or use default
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Only use proxy for localhost backends, use direct URL for tunnels/production
const isDevelopment = import.meta.env.DEV;
const isLocalBackend = BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1');
const baseURL = (isDevelopment && isLocalBackend) ? '' : BACKEND_URL;

console.log('API Configuration:');
console.log('- BACKEND_URL:', BACKEND_URL);
console.log('- isDevelopment:', isDevelopment);
console.log('- isLocalBackend:', isLocalBackend);
console.log('- baseURL (used by axios):', baseURL);

// Create axios instance
const api = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true'
  }
});

// For LocalTunnel, we'll handle bypass differently (via query param or direct access)
const isLocalTunnel = BACKEND_URL.includes('loca.lt');

// API methods
export const apiClient = {
  // Health check
  async health() {
    const response = await api.get('/api/health');
    return response.data;
  },

  // Get status
  async getStatus() {
    // Add timestamp to prevent caching
    const response = await api.get(`/api/status?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return response.data;
  },

  // Get logs
  async getLogs() {
    // Add timestamp to prevent caching
    const response = await api.get(`/api/logs?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log('getLogs API response:', response);
    console.log('getLogs response.data:', response.data);
    return response.data;
  },

  // Configure
  async configure(config) {
    const response = await api.post('/api/configure', config);
    return response.data;
  },

  // Connect
  async connect() {
    const response = await api.post('/api/connect');
    return response.data;
  },

  // Disconnect
  async disconnect() {
    const response = await api.post('/api/disconnect');
    return response.data;
  },

  // Send command to specific WebSocket
  async sendCommand(wsNumber, command) {
    const response = await api.post('/api/send', {
      wsNumber,
      command
    });
    return response.data;
  }
};

export default api;
export { BACKEND_URL };
