import React from 'react';

const Input = ({ label, error, ...props }) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <input
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-agri-primary focus:border-agri-primary transition-colors outline-none ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default Input;
