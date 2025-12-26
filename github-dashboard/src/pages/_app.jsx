import '../styles/index.css';
import { GitHubDataProvider } from '../contexts/GitHubDataContext.jsx';

export default function App({ Component, pageProps }) {
  return (
    <GitHubDataProvider>
      <Component {...pageProps} />
    </GitHubDataProvider>
  );
}

