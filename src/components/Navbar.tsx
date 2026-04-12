import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate, Link } from 'react-router';
import { LogOut, Moon, Sun, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className='sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg'>
      <div className='mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6'>
        <Link
          to='/'
          className='flex items-center gap-2 font-semibold tracking-tight text-foreground'
        >
          <FolderKanban className='h-5 w-5 text-primary' />
          <span className='text-lg'>TaskFlow</span>
        </Link>

        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleTheme}
            className='h-9 w-9 text-muted-foreground hover:text-foreground'
          >
            {theme === 'dark' ? (
              <Sun className='h-4 w-4' />
            ) : (
              <Moon className='h-4 w-4' />
            )}
          </Button>

          {user && (
            <>
              <span className='hidden text-sm text-muted-foreground sm:inline'>
                {user.name}
              </span>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleLogout}
                className='h-9 w-9 text-muted-foreground hover:text-foreground'
              >
                <LogOut className='h-4 w-4' />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
