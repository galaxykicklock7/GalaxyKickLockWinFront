import axios from 'axios';

// Get backend URL from environment variable or use default
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add bypass-tunnel-reminder header only for LocalTunnel URLs
if (BACKEND_URL.includes('loca.lt')) {
  api.defaults.headers.common['bypass-tunnel-reminder'] = 'true';
}

// API methods
export const apiClient = {
  // Health check
  async health() {
    const response = await api.get('/api/health');
    return response.data;
  },

  // Get status
  async getStatus() {
    const response = await api.get('/api/status');
    return response.data;
  },

  // Get logs
  async getLogs() {
    const response = await api.get('/api/logs');
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
