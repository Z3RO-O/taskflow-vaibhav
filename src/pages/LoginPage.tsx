import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderKanban, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to='/' replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <div className='w-full max-w-sm animate-fade-in'>
        <div className='mb-8 text-center'>
          <div className='mb-4 inline-flex items-center gap-2'>
            <FolderKanban className='h-8 w-8 text-primary' />
            <span className='text-2xl font-bold tracking-tight text-foreground'>
              TaskFlow
            </span>
          </div>
          <p className='text-sm text-muted-foreground'>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <div className='rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive'>
              {error}
            </div>
          )}

          <div>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='test@example.com'
              autoComplete='email'
            />
          </div>

          <div>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='••••••••'
              autoComplete='current-password'
            />
          </div>

          <Button type='submit' className='w-full' disabled={loading}>
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Sign In
          </Button>
        </form>

        <p className='mt-6 text-center text-sm text-muted-foreground'>
          Don't have an account?{' '}
          <Link
            to='/register'
            className='font-medium text-primary hover:underline'
          >
            Sign up
          </Link>
        </p>

        <div className='mt-4 rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground'>
          <strong>Test credentials:</strong> test@example.com / password123
        </div>
      </div>
    </div>
  );
}
