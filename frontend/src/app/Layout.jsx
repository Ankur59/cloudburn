import { useEffect } from 'react';

const AppLayout = ({ children }) => {
  useEffect(() => {
    // Ensure dark mode is applied to html element
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED]" style={{ fontFamily: 'Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      {children}
    </div>
  );
};

export default AppLayout;

