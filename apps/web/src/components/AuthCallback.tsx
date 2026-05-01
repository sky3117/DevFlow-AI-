import { useEffect, useState } from 'react';
import { exchangeGithubCode } from '../lib/api';
import { setToken } from '../lib/auth';

export function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      setStatus('error');
      setMessage('Missing OAuth code from GitHub.');
      return;
    }

    exchangeGithubCode(code)
      .then((data) => {
        setToken(data.token);
        window.location.replace('/');
      })
      .catch((err: Error) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">DevFlow AI</h1>
        <p className={status === 'error' ? 'text-rose-400' : 'text-slate-300'}>{message}</p>
      </div>
    </div>
  );
}
