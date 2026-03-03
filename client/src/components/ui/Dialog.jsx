import React from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Info,
    XCircle,
    X
} from 'lucide-react';

const Dialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    isConfirm = false,
    confirmText = 'OK',
    cancelText = 'Cancel'
}) => {
    if (!isOpen) return null;

    const config = {
        success: {
            icon: <CheckCircle2 className="h-10 w-10 text-green-500" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-100',
            btnColor: 'bg-green-500 hover:bg-green-600'
        },
        error: {
            icon: <XCircle className="h-10 w-10 text-red-500" />,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-100',
            btnColor: 'bg-red-500 hover:bg-red-600'
        },
        warning: {
            icon: <AlertCircle className="h-10 w-10 text-amber-500" />,
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-100',
            btnColor: 'bg-amber-500 hover:bg-amber-600'
        },
        info: {
            icon: <Info className="h-10 w-10 text-blue-500" />,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-100',
            btnColor: 'bg-blue-500 hover:bg-blue-600'
        }
    };

    const current = config[type] || config.info;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
            <div
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header/Banner */}
                <div className={`h-2 ${current.btnColor}`} />

                <div className="p-8 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className={`mx-auto w-20 h-20 rounded-full ${current.bgColor} flex items-center justify-center mb-6`}>
                        {current.icon}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-800 mb-3">{title}</h3>
                    <p className="text-gray-500 leading-relaxed mb-8">{message}</p>

                    <div className="flex gap-4">
                        {isConfirm ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3.5 rounded-2xl border-2 border-gray-100 text-gray-500 font-bold hover:bg-gray-50 transition-all transform active:scale-95"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 px-6 py-3.5 rounded-2xl text-white font-bold shadow-lg transition-all transform active:scale-95 ${current.btnColor}`}
                                >
                                    {confirmText}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className={`w-full px-6 py-3.5 rounded-2xl text-white font-bold shadow-lg transition-all transform active:scale-95 ${current.btnColor}`}
                            >
                                {confirmText}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dialog;
