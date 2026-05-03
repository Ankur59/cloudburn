import AppRouter from './app/AppRouter';
import AppLayout from './app/Layout';
import Loader from "./features/shared/Loader"


const App = () => {
  return (
    <AppLayout>
      {/* <AppRouter /> */}
      <Loader/>
    </AppLayout>
  );
};

export default App;
