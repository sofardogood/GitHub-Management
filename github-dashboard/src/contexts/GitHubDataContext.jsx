import { createContext, useContext } from 'react';
import { useGitHubData } from '../hooks/useGitHubData.js';

const GitHubDataContext = createContext(null);

export function GitHubDataProvider({ children }) {
  const value = useGitHubData();
  return (
    <GitHubDataContext.Provider value={value}>
      {children}
    </GitHubDataContext.Provider>
  );
}

export function useGitHubDataContext() {
  const context = useContext(GitHubDataContext);
  if (!context) {
    throw new Error('useGitHubDataContext must be used within GitHubDataProvider.');
  }
  return context;
}

