import AppRouter from './app/AppRouter';
import AppLayout from './app/Layout';

const App = () => {
  return (
    <AppLayout>
      <AppRouter />
    </AppLayout>
  );
};

export default App;
