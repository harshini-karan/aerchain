import Dashboard from './pages/Dashboard';
import RFPs from './pages/RFPs';
import RFPDetail from './pages/RFPDetail';
import Suppliers from './pages/Suppliers';
import Proposals from './pages/Proposals';
import Comparison from './pages/Comparison';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Dashboard',
    path: '/',
    element: <Dashboard />
  },
  {
    name: 'RFPs',
    path: '/rfps',
    element: <RFPs />
  },
  {
    name: 'RFP Detail',
    path: '/rfps/:id',
    element: <RFPDetail />,
    visible: false
  },
  {
    name: 'Suppliers',
    path: '/suppliers',
    element: <Suppliers />
  },
  {
    name: 'Proposals',
    path: '/proposals',
    element: <Proposals />
  },
  {
    name: 'Comparison',
    path: '/comparison',
    element: <Comparison />
  }
];

export default routes;
