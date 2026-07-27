import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-custom py-6">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;