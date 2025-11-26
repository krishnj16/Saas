import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

export function useFetch(fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchRef = useRef(fetchFn);

  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchRef.current();
      setData(result);
    } catch (err) {
      setError(err);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    execute();
  }, [...dependencies, execute]);

  return { data, loading, error, refetch: execute };
}