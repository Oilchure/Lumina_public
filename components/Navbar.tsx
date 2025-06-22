
import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpenIcon, DocumentTextIcon, ClipboardDocumentCheckIcon, ArrowDownOnSquareIcon, FolderPlusIcon, SquaresFourIcon } from './icons'; // Changed BrainIcon to SquaresFourIcon

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const Navbar: React.FC = () => {
  const navItems: NavItem[] = [
    { to: '/words', label: '词汇', icon: <BookOpenIcon className="w-5 h-5 mr-2" /> },
    { to: '/knowledge', label: '知识点', icon: <DocumentTextIcon className="w-5 h-5 mr-2" /> },
    { to: '/tasks', label: '任务', icon: <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2" /> },
    { to: '/outline', label: '大纲', icon: <FolderPlusIcon className="w-5 h-5 mr-2" /> },
    { to: '/mindmap', label: '思维导图', icon: <SquaresFourIcon className="w-5 h-5 mr-2" /> }, // Changed BrainIcon to SquaresFourIcon
    { to: '/data', label: '数据', icon: <ArrowDownOnSquareIcon className="w-5 h-5 mr-2" /> },
  ];

  const linkClasses = "flex items-center px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors";
  const activeLinkClasses = "flex items-center px-3 py-2 bg-blue-500 text-white rounded-md shadow-md";


  return (
    <nav className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">Lumina</span>
            </NavLink>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => isActive ? activeLinkClasses : linkClasses}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="md:hidden flex items-center">
            {/* Mobile menu button could go here if needed */}
          </div>
        </div>
      </div>
      {/* Mobile Menu (collapsible) */}
      <div className="md:hidden border-t border-slate-200 dark:border-slate-700">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
                 <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => isActive ? `${activeLinkClasses} block` : `${linkClasses} block`}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
            ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
