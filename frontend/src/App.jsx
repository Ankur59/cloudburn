import { useEffect } from 'react';
import AppRouter from './app/AppRouter';
import AppLayout from './app/Layout';
import useAuth from './features/auth/hook/useAuth';

const App = () => {
  const { handleGetme } = useAuth();

  useEffect(() => {
    handleGetme();
  }, []);

  return (
    <AppLayout>
      <AppRouter />
    </AppLayout>
  );
};

export default App;
