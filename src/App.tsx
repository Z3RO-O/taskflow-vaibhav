import { BrowserRouter } from 'react-router';

import AppRoutes from '@/routes';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
