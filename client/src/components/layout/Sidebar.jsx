import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShieldCheck,
    FileText,
    UserCheck,
    BookOpen,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();

    const menuItems = [
        {
            title: 'Main Dashboard',
            icon: <LayoutDashboard size={20} />,
            path: '/',
            roles: ['admin', 'hr', 'front_desk']
        },
        {
            title: 'Admin Dashboard',
            icon: <ShieldCheck size={20} />,
            path: '/admin',
            roles: ['admin']
        },
        {
            title: 'Admission Inquiry',
            icon: <FileText size={20} />,
            path: '/inquiries',
            roles: ['admin', 'hr', 'front_desk']
        },
        {
            title: 'Register Admission',
            icon: <UserCheck size={20} />,
            path: '/admissions',
            roles: ['admin', 'hr']
        },
        {
            title: 'Classes',
            icon: <BookOpen size={20} />,
            path: '/classes',
            roles: ['admin', 'hr']
        },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-background/30 backdrop-blur-sm border-r border-gray-200 hidden lg:flex flex-col z-10 shadow-sm">
            <div className="flex-1 py-6 px-4 space-y-1">
                {filteredMenu.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all group ${location.pathname === item.path
                            ? 'bg-secondary text-white hover:text-white shadow-md'
                            : 'text-gray-600 hover:bg-white/50 hover:text-secondary'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <span className={`${location.pathname === item.path ? 'text-white' : 'text-gray-400 group-hover:text-secondary'}`}>
                                {item.icon}
                            </span>
                            <span className="font-semibold text-sm tracking-wide">{item.title}</span>
                        </div>
                        {location.pathname === item.path && (
                            <div className="w-1.5 h-1.5 bg-background rounded-full"></div>
                        )}
                    </Link>
                ))}
            </div>

            <div className="p-4 border-t border-gray-100 italic text-[11px] text-gray-400 text-center">
                Fi Das Liceyum v1.0
            </div>
        </aside>
    );
};

export default Sidebar;
