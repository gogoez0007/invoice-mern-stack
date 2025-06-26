import React from 'react';

export function Card({ children, className = '' }) {
    return (
        <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm p-4 ${className}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {children}
            </div>
        </div>
    );
}

export function CardContent({ children, className = '' }) {
    return (
        <div className={`p-4 border rounded-lg bg-gray-50 ${className}`}>
            {children}
        </div>
    );
}
