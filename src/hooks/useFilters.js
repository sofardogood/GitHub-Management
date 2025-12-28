import { useState } from 'react';

export function useFilters(initialState) {
  const [filters, setFilters] = useState(initialState);

  const updateFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const resetFilters = () => {
    setFilters(initialState);
  };

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}

