import React, { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NotificationBell } from '../NotificationBell';
import { Home, Map, Cloud, Activity, Satellite, Brain, LogOut, Menu, X, Users, BookOpen, ChevronDown, UserCircle, Save } from 'lucide-react';
import { BrandLogo, Button, IconButton, Input, Modal } from './index';
import { authService } from '../../services/auth.service';
import { toast } from 'react-hot-toast';

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileForm, setProfileForm] = React.useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  React.useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
    navigate('/login');
  };

  const handleSaveProfile = async () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim() || !profileForm.email.trim()) {
      toast.error('Name and email are required.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedUser = await authService.updateProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
      });
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsProfileModalOpen(false);
      setIsProfileMenuOpen(false);
      toast.success('Profile updated.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, group: 'Overview' },
    { name: 'Fields', path: '/fields', icon: Map, group: 'Operations' },
    { name: 'Environmental', path: '/environmental', icon: Cloud, group: 'Operations' },
    { name: 'IoT Sensors', path: '/iot', icon: Activity, group: 'Operations' },
    { name: 'Satellite', path: '/satellite', icon: Satellite, group: 'Intelligence' },
    { name: 'Agronomy', path: '/agronomy', icon: BookOpen, group: 'Intelligence' },
    { name: 'AI Recommendations', path: '/ai', icon: Brain, group: 'Intelligence' },
    { name: 'Users', path: '/users', icon: Users, group: 'Admin', adminOnly: true },
  ];

  const isActive = (path: string) =>
    path === '/dashboard' ? location.pathname === path : location.pathname.startsWith(path);

  const visibleNavigation = navigation.filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN' || user?.role === 'MANAGER',
  );
  const isViewer = user?.role === 'VIEWER';

  const NavigationLinks = ({ onNavigate }: { onNavigate?: () => void }) => {
    const groups = visibleNavigation.reduce<Record<string, typeof visibleNavigation>>((acc, item) => {
      acc[item.group] = [...(acc[item.group] || []), item];
      return acc;
    }, {});

    return (
      <div className="space-y-5">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase text-primary-900/55">
              {group}
            </p>
            <div className="space-y-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                      active
                        ? 'bg-white text-primary-800 shadow-sm ring-1 ring-primary-200'
                        : 'text-gray-700 hover:bg-white/80 hover:text-gray-950 hover:shadow-sm'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                        active ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 group-hover:text-primary-700'
                      }`}
                    >
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-primary-100 bg-primary-50 lg:flex">
        <div className="flex h-16 items-center border-b border-primary-100 bg-white px-5">
          <Link to="/dashboard" className="flex items-center">
            <BrandLogo />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Main navigation">
          <NavigationLinks />
        </nav>
        <div className="border-t border-primary-100 bg-white p-4">
          <div className="mb-3 min-w-0 text-sm">
            <p className="truncate font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-gray-500">{user?.role}</p>
          </div>
          {!isViewer && (
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="mb-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <UserCircle size={18} aria-hidden="true" />
              Edit profile
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <LogOut size={18} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <IconButton
                label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden"
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </IconButton>
              <Link to="/dashboard" className="flex items-center lg:hidden">
                <BrandLogo markClassName="h-8 w-8" textClassName="text-lg font-bold text-gray-900" />
              </Link>
            </div>

            <div className="relative flex items-center gap-3">
              <NotificationBell />
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((current) => !current)}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-left shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-100 text-sm font-bold text-primary-800">
                  {(user?.firstName?.[0] || 'A').toUpperCase()}{(user?.lastName?.[0] || 'C').toUpperCase()}
                </div>
                <div className="hidden min-w-0 text-sm text-gray-700 sm:block">
                  <span className="block truncate font-semibold">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="truncate text-xs uppercase text-gray-500">{user?.role}</span>
                </div>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-12 z-40 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                  <div className="border-b border-gray-100 px-3 py-2 text-sm">
                    <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="truncate text-gray-500">{user?.email}</p>
                  </div>
                  {!isViewer && (
                    <button
                      type="button"
                      onClick={() => setIsProfileModalOpen(true)}
                      className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <UserCircle size={17} />
                      Edit profile
                    </button>
                  )}
                  {isViewer && (
                    <div className="mt-2 rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-800">
                      Demo preview is read-only.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {isMobileMenuOpen && (
            <nav className="border-t border-gray-200 px-4 py-3 lg:hidden" aria-label="Mobile navigation">
              <NavigationLinks onNavigate={() => setIsMobileMenuOpen(false)} />
            </nav>
          )}
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>

      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Update profile"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsProfileModalOpen(false)} disabled={isSavingProfile}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} isLoading={isSavingProfile} leftIcon={<Save size={18} />}>
              Save profile
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
          <Input
            label="First name"
            value={profileForm.firstName}
            onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))}
            required
          />
          <Input
            label="Last name"
            value={profileForm.lastName}
            onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))}
            required
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={profileForm.email}
          onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
          required
        />
        <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
          Role and active status are managed from User Management by an administrator.
        </p>
      </Modal>
    </div>
  );
};
