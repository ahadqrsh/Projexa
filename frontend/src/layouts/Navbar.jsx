import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Menu, Moon, Sun, LogOut, User, Settings, Bell } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Dropdown, { DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/features/auth/authSlice';
import { selectTheme, toggleTheme, setMobileNav } from '@/features/ui/uiSlice';
import { paths } from '@/routes/paths';

const Navbar = ({ title, subtitle }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector(selectTheme);
  const { user } = useAuth();

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Signed out');
    navigate(paths.login);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-subtle bg-base/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => dispatch(setMobileNav(true))}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-content-secondary transition-colors hover:bg-surface hover:text-content-primary lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          {title && (
            <h1 className="truncate text-base font-semibold text-content-primary sm:text-lg">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="hidden truncate text-xs text-content-secondary sm:block">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => dispatch(toggleTheme())}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="rounded-lg p-2.5 text-content-secondary transition-colors hover:bg-surface hover:text-content-primary"
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          <button
            type="button"
            aria-label="Notifications"
            title="Notifications arrive in Phase 6"
            className="relative rounded-lg p-2.5 text-content-muted transition-colors hover:bg-surface"
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>

          <Dropdown
            trigger={
              <button type="button" className="ml-1 flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-surface">
                <Avatar src={user?.avatar?.url} name={user?.name} size="sm" />
              </button>
            }
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-content-primary">{user?.name}</p>
              <p className="truncate text-xs text-content-muted">{user?.email}</p>
              <Badge variant="primary" className="mt-2">
                {user?.role}
              </Badge>
            </div>
            <DropdownDivider />
            <Link to={paths.profile}>
              <DropdownItem icon={<User className="h-4 w-4" />}>Profile</DropdownItem>
            </Link>
            <Link to={paths.settings}>
              <DropdownItem icon={<Settings className="h-4 w-4" />}>Settings</DropdownItem>
            </Link>
            <DropdownDivider />
            <DropdownItem icon={<LogOut className="h-4 w-4" />} danger onClick={handleLogout}>
              Sign out
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
