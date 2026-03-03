import React from 'react';
import { School, User, Settings, LogOut } from 'lucide-react';

import { useAuth } from '../../store/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 bg-primary shadow-lg border-b border-white/10 z-30">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <School className="h-8 w-8 text-background" />
                        <span className="ml-2 text-xl font-bold text-white">Fi Das Liceyum</span>
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
