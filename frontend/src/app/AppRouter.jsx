import { Routes, Route } from 'react-router-dom';
import Login from '../features/auth/pages/Login.jsx';

const AppRouter = () => {
  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<h1>Signup</h1>} />
    </Routes>
  );
};

export default AppRouter;