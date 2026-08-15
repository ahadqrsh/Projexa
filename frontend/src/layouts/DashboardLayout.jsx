import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AuroraBackdrop from '@/components/three/AuroraBackdrop';

const DashboardLayout = () => {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen bg-base">
      <AuroraBackdrop showGrid={false} className="opacity-50" />
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <Outlet key={location.pathname} />
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
