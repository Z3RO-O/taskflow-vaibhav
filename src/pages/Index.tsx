import { Navigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
      </div>
    );
  }
  return user ? (
    <Navigate to='/projects' replace />
  ) : (
    <Navigate to='/login' replace />
  );
}
