import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShieldCheck,
    FileText,
    UserCheck,
    BookOpen,
    CreditCard,
    Receipt,
    ChevronRight,
    MessageCircle,
    MessageSquare,
    Settings
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
            title: 'Student Directory',
            icon: <UserCheck size={20} />, // Changing to generic User or Users is better but UserCheck is imported
            path: '/students',
            roles: ['admin', 'hr', 'teacher', 'front_desk']
        },
        {
            title: 'Classes',
            icon: <BookOpen size={20} />,
            path: '/classes',
            roles: ['admin', 'hr']
        },
        {
            title: 'Fee Management',
            icon: <CreditCard size={20} />,
            path: '/fees',
            roles: ['admin', 'hr']
        },
        {
            title: 'Fee Collection',
            icon: <Receipt size={20} />,
            path: '/challans',
            roles: ['admin', 'hr', 'front_desk']
        },
        {
            title: 'Communications',
            icon: <MessageCircle size={20} />,
            path: '/communications',
            roles: ['admin', 'hr', 'front_desk']
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

            {/* Settings Section */}
            <nav className="px-4 pb-4 space-y-1">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    System Settings
                </h3>
                <NavLink
                    to="/settings/whatsapp"
                    className={({ isActive }) =>
                        `flex items-center justify-between px-4 py-3 rounded-lg transition-all group ${isActive
                            ? 'bg-secondary text-white hover:text-white shadow-md'
                            : 'text-gray-600 hover:bg-white/50 hover:text-secondary'
                        }`
                    }
                >
                    <div className="flex items-center space-x-3">
                        <span className={`${location.pathname === '/settings/whatsapp' ? 'text-white' : 'text-gray-400 group-hover:text-secondary'}`}>
                            <Settings size={20} />
                        </span>
                        <span className="font-semibold text-sm tracking-wide">WhatsApp API</span>
                    </div>
                    {location.pathname === '/settings/whatsapp' && (
                        <div className="w-1.5 h-1.5 bg-background rounded-full"></div>
                    )}
                </NavLink>

                <NavLink
                    to="/settings/sms"
                    className={({ isActive }) =>
                        `flex items-center justify-between px-4 py-3 rounded-lg transition-all group ${isActive
                            ? 'bg-secondary text-white hover:text-white shadow-md'
                            : 'text-gray-600 hover:bg-white/50 hover:text-secondary'
                        }`
                    }
                >
                    <div className="flex items-center space-x-3">
                        <span className={`${location.pathname === '/settings/sms' ? 'text-white' : 'text-gray-400 group-hover:text-secondary'}`}>
                            <MessageSquare size={20} />
                        </span>
                        <span className="font-semibold text-sm tracking-wide">SMS Gateway Setup</span>
                    </div>
                    {location.pathname === '/settings/sms' && (
                        <div className="w-1.5 h-1.5 bg-background rounded-full"></div>
                    )}
                </NavLink>
            </nav>

            <div className="p-4 border-t border-gray-100 italic text-[11px] text-gray-400 text-center">
                Fi Das Liceyum v1.0
            </div>
        </aside>
    );
};

export default Sidebar;
