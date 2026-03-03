import React, { createContext, useContext, useState, useCallback } from 'react';
import Dialog from '../components/ui/Dialog';

const DialogContext = createContext(null);

export const DialogProvider = ({ children }) => {
    const [dialog, setDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        isConfirm: false,
        confirmText: 'OK',
        cancelText: 'Cancel',
        resolve: null
    });

    const showAlert = useCallback((title, message, type = 'info') => {
        setDialog({
            isOpen: true,
            title,
            message,
            type,
            isConfirm: false,
            confirmText: 'Got it',
            resolve: null
        });
    }, []);

    const showConfirm = useCallback((title, message, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel') => {
        return new Promise((resolve) => {
            setDialog({
                isOpen: true,
                title,
                message,
                type,
                isConfirm: true,
                confirmText,
                cancelText,
                resolve
            });
        });
    }, []);

    const handleClose = () => {
        if (dialog.resolve) {
            dialog.resolve(false);
        }
        setDialog(prev => ({ ...prev, isOpen: false }));
    };

    const handleConfirm = () => {
        if (dialog.resolve) {
            dialog.resolve(true);
        }
        setDialog(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <DialogContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <Dialog
                isOpen={dialog.isOpen}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
                isConfirm={dialog.isConfirm}
                confirmText={dialog.confirmText}
                cancelText={dialog.cancelText}
            />
        </DialogContext.Provider>
    );
};

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
};
