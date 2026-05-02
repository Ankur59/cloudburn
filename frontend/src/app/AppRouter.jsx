import { Routes, Route } from 'react-router-dom';
import Login from '../features/auth/pages/Login.jsx';
import Register from '../features/auth/pages/Register.jsx';
import Dashboard from '../features/dashboard/pages/DashboardPage.jsx';
import Connect from '../features/cloud-connect/pages/Connect.jsx';
import Reports from '../features/report/pages/Reports.jsx';
import Alerts from '../features/alerts/pages/Alerts.jsx';
import Team from '../features/Team/pages/Team.jsx';
import Budget from '../features/budget/pages/Budget.jsx';
import AiInsights from '../features/ai-insights/pages/Aiinsights.jsx';

const AppRouter = () => {
  return (
    <Routes>
      <Route path='/' element={<Dashboard />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<Register />} />
      <Route path='/connect' element={<Connect />} />
      <Route path='/reports' element={<Reports />} />
      <Route path='/alerts' element={<Alerts />} />
      <Route path='/teams' element={<Team />} />
      <Route path='/budget' element={<Budget />} />
      <Route path='/ai-insights' element={<AiInsights />} />
    </Routes>
  );
};

export default AppRouter;