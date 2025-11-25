import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useFetch(fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err);
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]); 

  useEffect(() => {
    execute();
  }, [...dependencies, execute]);

  return { data, loading, error, refetch: execute };
}