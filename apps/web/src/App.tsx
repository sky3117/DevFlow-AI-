import { AuthCallback } from './components/AuthCallback';
import { Dashboard } from './components/Dashboard';

function App() {
  const isAuthCallback = window.location.pathname.startsWith('/auth/github/callback');
  return isAuthCallback ? <AuthCallback /> : <Dashboard />;
}

export default App;
