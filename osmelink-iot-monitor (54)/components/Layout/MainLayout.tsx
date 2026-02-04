import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
// @ts-ignore
import { Outlet } from 'react-router-dom';

const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
      {/* Sidebar - Collapsible */}
      <Sidebar isCollapsed={sidebarCollapsed} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Fixed Top Header */}
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;