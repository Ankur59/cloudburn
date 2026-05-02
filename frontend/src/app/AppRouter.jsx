import { Routes, Route } from 'react-router-dom';
import Login from '../features/auth/pages/Login.jsx';
import Register from '../features/auth/pages/Register.jsx';
import Dashboard from '../features/dashboard/pages/DashboardPage.jsx';
import Connect from '../features/cloud-connect/pages/Connect.jsx';
import Reports from '../features/report/pages/Reports.jsx';

const AppRouter = () => {
  return (
    <Routes>
      <Route path='/' element={<Dashboard />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<Register />} />
      <Route path='/connect' element={<Connect />} />
      <Route path='/reports' element={<Reports />} />
    </Routes>
  );
};

export default AppRouter;