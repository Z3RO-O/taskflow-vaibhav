import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderKanban, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteFromUrl = searchParams.get('invite')?.trim() ?? '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(inviteFromUrl);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInviteCode(inviteFromUrl);
  }, [inviteFromUrl]);

  if (user) return <Navigate to='/' replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    if (password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const code = inviteCode.trim() || null;
      await register(name.trim(), email.trim(), password, code);
    } catch (err: any) {
      if (err?.fields) setFieldErrors(err.fields);
      else setError(err?.error || 'Registration failed');
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
          <p className='text-sm text-muted-foreground'>Create your account</p>
          {inviteFromUrl && (
            <p className='mt-2 text-xs text-muted-foreground'>
              You are joining an organization using an invite link. Leave the
              code blank only if you intend to create a separate workspace
              instead.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <div className='rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive'>
              {error}
            </div>
          )}

          <div>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Your name'
            />
            {fieldErrors.name && (
              <p className='mt-1 text-xs text-destructive'>
                {fieldErrors.name}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='you@example.com'
            />
            {fieldErrors.email && (
              <p className='mt-1 text-xs text-destructive'>
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='••••••••'
            />
            {fieldErrors.password && (
              <p className='mt-1 text-xs text-destructive'>
                {fieldErrors.password}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor='invite'>Organization invite code</Label>
            <Input
              id='invite'
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder='e.g. ACME-DEMO'
              autoComplete='off'
            />
            <p className='mt-1 text-xs text-muted-foreground'>
              Optional. Leave empty to create your own workspace. Use a code
              from your team to join their organization.
            </p>
            {fieldErrors.invite && (
              <p className='mt-1 text-xs text-destructive'>
                {fieldErrors.invite}
              </p>
            )}
          </div>

          <Button type='submit' className='w-full' disabled={loading}>
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Create Account
          </Button>
        </form>

        <p className='mt-6 text-center text-sm text-muted-foreground'>
          Already have an account?{' '}
          <Link
            to='/login'
            className='font-medium text-primary hover:underline'
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
