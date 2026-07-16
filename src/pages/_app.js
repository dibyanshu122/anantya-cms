import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const publicRoutes = ['/login', '/register'];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !publicRoutes.includes(router.pathname)) {
        router.push('/login');
      }
    };
    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });
    return () => listener?.subscription?.unsubscribe();
  }, [router.pathname]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1E293B',
            color: '#F1F5F9',
            border: '1px solid #334155',
          },
        }}
      />
      <Component {...pageProps} />
    </>
  );
}
