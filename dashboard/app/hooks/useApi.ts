"use client";

import { useState, useEffect, useCallback, DependencyList } from "react";

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export const useApi = <T>(
  apiCall: () => Promise<T>,
  deps: DependencyList = [],
): UseApiState<T> => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    try {
      const response = await apiCall();
      setState({ data: response, isLoading: false, error: null });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setState({ data: null, isLoading: false, error: errorObj });
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData();
  }, deps);

  return state;
};
