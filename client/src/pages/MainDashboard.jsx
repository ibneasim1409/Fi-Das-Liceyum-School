import React from 'react';
import { Users, FileText, UserCheck } from 'lucide-react';

const MainDashboard = () => {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Main Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Students</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">1,240</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Users className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-secondary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Inquiries</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">85</p>
                        </div>
                        <div className="p-3 bg-secondary/10 rounded-full">
                            <FileText className="h-8 w-8 text-secondary" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary/60">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Admissions</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">312</p>
                        </div>
                        <div className="p-3 bg-primary/5 rounded-full">
                            <UserCheck className="h-8 w-8 text-primary/80" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome to Fi Das Liceyum School ERP</h2>
                <p className="text-gray-600 leading-relaxed">
                    This is your central hub for managing school operations. Use the sidebar to navigate through inquiries, admissions, and class management.
                </p>
            </div>
        </div>
    );
};

export default MainDashboard;
