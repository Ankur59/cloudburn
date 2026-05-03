import AppRouter from './app/AppRouter';
import AppLayout from './app/Layout';
import SkeletonLoader from './features/shared/SkeletonLoader';
import Loader from './features/shared/Loader';

const App = () => {
  return (
    <AppLayout>
      <AppRouter />
      {/* <Loader/> */}
    </AppLayout>
  );
};

export default App;
