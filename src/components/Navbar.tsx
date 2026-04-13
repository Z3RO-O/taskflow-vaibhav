import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate, Link } from 'react-router';
import {
  LogOut,
  Moon,
  Sun,
  FolderKanban,
  Users,
  Copy,
  Link2,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getOrganization,
  regenerateOrganizationInviteCode,
  updateOrganization,
} from '@/lib/mock-db';
import type { Organization } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export const ORG_UPDATED_EVENT = 'taskflow-org-updated';

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

export function notifyOrganizationUpdated() {
  window.dispatchEvent(new CustomEvent(ORG_UPDATED_EVENT, { bubbles: false }));
}

export default function Navbar() {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Organization | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [orgNameInput, setOrgNameInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [rotatingInvite, setRotatingInvite] = useState(false);

  const loadOrg = useCallback(() => {
    if (!user?.org_id) {
      setOrg(null);
      return;
    }
    getOrganization(user.org_id)
      .then(setOrg)
      .catch(() => setOrg(null));
  }, [user?.org_id]);

  useEffect(() => {
    loadOrg();
  }, [loadOrg]);

  useEffect(() => {
    const onOrgUpdated = () => loadOrg();
    window.addEventListener(ORG_UPDATED_EVENT, onOrgUpdated);
    return () => window.removeEventListener(ORG_UPDATED_EVENT, onOrgUpdated);
  }, [loadOrg]);

  useEffect(() => {
    if (profileOpen && user) {
      setProfileName(user.name);
      setOrgNameInput(org?.name ?? '');
    }
  }, [profileOpen, user, org?.name]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const registerInviteUrl =
    typeof window !== 'undefined' && org
      ? `${window.location.origin}/register?invite=${encodeURIComponent(org.invite_code)}`
      : '';

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleRotateInvite = async () => {
    if (!user) return;
    if (
      !window.confirm(
        'Generate a new invite code? The old code will stop working for new sign-ups.'
      )
    ) {
      return;
    }
    setRotatingInvite(true);
    try {
      const next = await regenerateOrganizationInviteCode(user.id);
      setOrg(next);
      notifyOrganizationUpdated();
      toast.success('Invite code updated');
    } catch {
      toast.error('Could not update invite code');
    } finally {
      setRotatingInvite(false);
    }
  };

  const isOrgOwner = Boolean(user && org && org.owner_id === user.id);

  const handleSaveProfile = async () => {
    if (!user || !org) return;
    setSavingProfile(true);
    try {
      await updateProfile(profileName.trim());
      if (
        isOrgOwner &&
        orgNameInput.trim() &&
        orgNameInput.trim() !== org.name
      ) {
        await updateOrganization(org.id, user.id, {
          name: orgNameInput.trim(),
        });
        notifyOrganizationUpdated();
        await loadOrg();
      }
      toast.success('Saved');
      setProfileOpen(false);
    } catch (err: unknown) {
      const e = err as { error?: string; fields?: Record<string, string> };
      if (e?.fields?.name) toast.error(e.fields.name);
      else if (e?.error === 'forbidden')
        toast.error('You cannot rename this organization.');
      else toast.error('Could not save');
    } finally {
      setSavingProfile(false);
    }
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-9 w-9 rounded-full p-0'
                  aria-label='Account menu'
                >
                  <Avatar className='h-9 w-9'>
                    <AvatarFallback className='text-xs'>
                      {userInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-56' align='end'>
                <DropdownMenuLabel className='font-normal'>
                  <div className='flex flex-col space-y-0.5'>
                    <span className='text-sm font-medium text-foreground'>
                      {user.name}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {user.email}
                    </span>
                    {org && (
                      <span className='truncate text-xs text-muted-foreground'>
                        {org.name}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setInviteOpen(true)}>
                    <Users className='mr-2 h-4 w-4' />
                    Invite teammates
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
                    <UserRound className='mr-2 h-4 w-4' />
                    Account & organization
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant='destructive' onSelect={handleLogout}>
                  <LogOut className='mr-2 h-4 w-4' />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Invite teammates</DialogTitle>
            <DialogDescription>
              Share the invite code or registration link. New accounts that use
              them join{' '}
              <span className='font-medium text-foreground'>
                {org?.name ?? 'your organization'}
              </span>{' '}
              and see the same projects.
            </DialogDescription>
          </DialogHeader>
          {org && (
            <div className='space-y-4 py-2'>
              <div>
                <p className='mb-1 text-xs font-medium text-muted-foreground'>
                  Invite code
                </p>
                <code className='block truncate rounded-md bg-muted px-3 py-2 font-mono text-sm'>
                  {org.invite_code}
                </code>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  onClick={() =>
                    copyText(org.invite_code, 'Invite code copied')
                  }
                >
                  <Copy className='mr-1.5 h-3.5 w-3.5' />
                  Copy code
                </Button>
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  onClick={() =>
                    copyText(registerInviteUrl, 'Registration link copied')
                  }
                  disabled={!registerInviteUrl}
                >
                  <Link2 className='mr-1.5 h-3.5 w-3.5' />
                  Copy register link
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleRotateInvite}
                  disabled={rotatingInvite}
                >
                  <RefreshCw
                    className={`mr-1.5 h-3.5 w-3.5 ${rotatingInvite ? 'animate-spin' : ''}`}
                  />
                  New code
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Account & organization</DialogTitle>
            <DialogDescription>
              Update how your name appears.{' '}
              {isOrgOwner
                ? 'As the organization owner, you can also rename the organization.'
                : 'Only the member who created the workspace can change the organization name.'}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-2'>
            <div className='grid gap-2'>
              <Label htmlFor='nav-profile-name'>Your name</Label>
              <Input
                id='nav-profile-name'
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                autoComplete='name'
              />
            </div>
            {isOrgOwner && (
              <div className='grid gap-2'>
                <Label htmlFor='nav-org-name'>Organization name</Label>
                <Input
                  id='nav-org-name'
                  value={orgNameInput}
                  onChange={e => setOrgNameInput(e.target.value)}
                  autoComplete='organization'
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setProfileOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleSaveProfile}
              disabled={
                savingProfile ||
                !profileName.trim() ||
                (isOrgOwner && !orgNameInput.trim())
              }
            >
              {savingProfile ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
