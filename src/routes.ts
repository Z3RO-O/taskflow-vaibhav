import { createElement } from 'react';
import { Route, Routes } from 'react-router';

import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import LoginPage from '@/pages/LoginPage';
import ProjectsPage from '@/pages/ProjectsPage';
import RegisterPage from '@/pages/RegisterPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProjectDetailPage from '@/pages/ProjectDetailPage';

const AppRoutes = () =>
  createElement(
    Routes,
    null,
    createElement(Route, { path: '/', element: createElement(Index) }),
    createElement(Route, { path: '/login', element: createElement(LoginPage) }),
    createElement(Route, {
      path: '/register',
      element: createElement(RegisterPage),
    }),
    createElement(Route, {
      path: '/projects',
      element: createElement(ProtectedRoute, null, createElement(ProjectsPage)),
    }),
    createElement(Route, {
      path: '/projects/:id',
      element: createElement(
        ProtectedRoute,
        null,
        createElement(ProjectDetailPage)
      ),
    }),
    createElement(Route, { path: '*', element: createElement(NotFound) })
  );

export default AppRoutes;
