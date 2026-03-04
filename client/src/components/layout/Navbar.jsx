import React, { useState, useEffect } from 'react';
import { School, User, Settings, LogOut, Clock, Calendar } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    const formatTime = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).format(date);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 bg-primary shadow-lg border-b border-white/10 z-30">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <School className="h-8 w-8 text-background" />
                        <span className="ml-2 text-xl font-bold text-white">Fi Das Liceyum</span>
                    </div>

                    {/* Live Date/Time Display */}
                    <div className="hidden md:flex items-center gap-6 text-white/90">
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/5 backdrop-blur-sm shadow-inner">
                            <Calendar size={14} className="text-white/60" />
                            <span className="text-xs font-bold tracking-wide uppercase">{formatDate(currentTime)}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/5 backdrop-blur-sm shadow-inner">
                            <Clock size={14} className="text-white/60" />
                            <span className="text-xs font-mono font-bold">{formatTime(currentTime)}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium text-white/90 mr-2">
                            {user?.name} ({user?.role})
                        </div>
                        <button className="p-2 text-white/80 hover:text-white transition-colors">
                            <User className="h-6 w-6" />
                        </button>
                        <button className="p-2 text-white/80 hover:text-white transition-colors">
                            <Settings className="h-6 w-6" />
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 text-white/80 hover:text-red-300 transition-colors"
                        >
                            <LogOut className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
