import { NavLink, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  Settings,
  User,
  ChevronLeft,
  Zap,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { paths } from '@/routes/paths';
import { useAuth } from '@/hooks/useAuth';
import {
  selectSidebarCollapsed,
  toggleSidebar,
  setMobileNav,
  selectMobileNavOpen,
} from '@/features/ui/uiSlice';
import ProgressBar from '@/components/ui/ProgressBar';

const navItems = [
  { to: paths.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: paths.projects, label: 'My Projects', icon: FolderKanban },
  { to: paths.newProject, label: 'New Project', icon: Plus },
];

const bottomItems = [
  { to: paths.profile, label: 'Profile', icon: User },
  { to: paths.settings, label: 'Settings', icon: Settings },
];

const NavItem = ({ item, collapsed, onNavigate }) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === paths.projects}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
          'transition-all duration-200 ease-smooth',
          isActive
            ? 'text-white'
            : 'text-content-secondary hover:bg-surface hover:text-content-primary'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 shadow-glow"
            />
          )}
          <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full z-30 ml-3 hidden whitespace-nowrap rounded-md border border-strong bg-elevated px-2.5 py-1.5 text-xs shadow-lifted group-hover:block">
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

const SidebarContent = ({ collapsed, onNavigate }) => {
  const { credits } = useAuth();
  const used = credits?.used ?? 0;
  const limit = credits?.limit ?? 0;
  const remaining = Math.max(limit - used, 0);
  const percentUsed = limit ? (used / limit) * 100 : 0;

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link
        to={paths.dashboard}
        onClick={onNavigate}
        className={cn('flex items-center gap-2.5 px-1', collapsed && 'justify-center')}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 font-mono text-xs font-bold text-white shadow-glow">
          PX
        </span>
        {!collapsed && (
          <span className="truncate text-sm font-bold text-content-primary">Projexa</span>
        )}
      </Link>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        {bottomItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>

      {!collapsed && (
        <div className="rounded-xl border border-subtle bg-surface/60 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-content-secondary">
              <Zap className="h-3.5 w-3.5 text-accent-400" />
              AI Credits
            </span>
            <span className="font-mono text-content-primary">
              {remaining}/{limit}
            </span>
          </div>
          <ProgressBar value={100 - percentUsed} size="sm" className="mt-2.5" />
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const dispatch = useDispatch();
  const collapsed = useSelector(selectSidebarCollapsed);
  const mobileOpen = useSelector(selectMobileNavOpen);

  return (
    <>
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 border-r border-subtle bg-surface/50 backdrop-blur-xl lg:block',
          'transition-[width] duration-300 ease-smooth',
          collapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-strong bg-elevated text-content-secondary shadow transition-colors hover:text-primary-400"
        >
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(setMobileNav(false))}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-strong bg-elevated lg:hidden"
            >
              <SidebarContent collapsed={false} onNavigate={() => dispatch(setMobileNav(false))} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
