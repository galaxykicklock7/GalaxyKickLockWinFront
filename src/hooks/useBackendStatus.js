import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api';

export const useBackendStatus = () => {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState({ log1: [], log2: [], log3: [], log4: [], log5: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const statusData = await apiClient.getStatus();
      setStatus(statusData);
      setConnected(statusData.connected);
      setError(null);
    } catch (err) {
      setError(err.message);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const logsData = await apiClient.getLogs();
      if (logsData && logsData.logs) {
        setLogs(logsData.logs);
        console.log('Logs updated:', logsData.logs);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, []);

  // Efficient polling - only when connected
  useEffect(() => {
    // Initial fetch
    fetchStatus();
    fetchLogs();

    // Poll every 1 second for real-time feel
    const pollInterval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 1000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [fetchStatus, fetchLogs]);

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiClient.connect();
      await fetchStatus();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const disconnect = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiClient.disconnect();
      await fetchStatus();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const updateConfig = useCallback(async (config) => {
    try {
      const result = await apiClient.configure(config);
      // Don't fetch status immediately to avoid overwriting the UI
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const sendCommand = useCallback(async (wsNumber, command) => {
    try {
      const result = await apiClient.sendCommand(wsNumber, command);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    status,
    logs,
    loading,
    error,
    connected,
    connect,
    disconnect,
    updateConfig,
    sendCommand,
    refresh: fetchStatus
  };
};
