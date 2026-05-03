import AppRouter from './app/AppRouter';
import AppLayout from './app/Layout';
import Loader from "./features/shared/Loader";
import SkeletonLoader from './features/shared/SkeletonLoader';


const App = () => {
  return (
    <AppLayout>
      <AppRouter />
      {/* <Loader/> */}
      {/* <SkeletonLoader/> */}
    </AppLayout>
  );
};

export default App;
