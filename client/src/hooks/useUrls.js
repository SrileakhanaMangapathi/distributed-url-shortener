import { useState, useCallback } from 'react';
import api from '../utils/api';

export const useUrls = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUrls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/urls');
      setUrls(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch URLs');
    } finally {
      setLoading(false);
    }
  }, []);

  const shortenUrl = useCallback(async (originalUrl, customAlias, expiresIn) => {
    try {
      const res = await api.post('/urls/shorten', { originalUrl, customAlias, expiresIn });
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to shorten URL' };
    }
  }, []);

  const deleteUrl = useCallback(async (id) => {
    try {
      await api.delete(`/urls/${id}`);
      setUrls((prev) => prev.filter((url) => url.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to delete URL' };
    }
  }, []);

  const getAnalytics = useCallback(async (shortCode) => {
    try {
      const res = await api.get(`/analytics/${shortCode}`);
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to fetch analytics' };
    }
  }, []);

  return { urls, loading, error, fetchUrls, shortenUrl, deleteUrl, getAnalytics };
};
