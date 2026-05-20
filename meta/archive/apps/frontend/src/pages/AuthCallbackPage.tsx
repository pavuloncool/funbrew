import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('auth_token', token);
      setStatus('success');
      setTimeout(() => navigate('/'), 1500);
    } else {
      setStatus('error');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      {status === 'loading' && (
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-stone-600">Weryfikuję...</p>
        </div>
      )}
      {status === 'success' && (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-600">Sukces!</h1>
          <p className="text-stone-600 mt-2">Zalogowano pomyślnie</p>
        </div>
      )}
      {status === 'error' && (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Błąd</h1>
          <p className="text-stone-600 mt-2">Wystąpił problem z logowaniem</p>
          <button onClick={() => navigate('/')} className="mt-4 text-amber-600 hover:underline">
            Wróć do strony głównej
          </button>
        </div>
      )}
    </div>
  );
}