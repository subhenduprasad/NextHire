import React from 'react';
import { Link } from 'react-router-dom';

const NetworkModal = ({ isOpen, onClose, title, dataList, type }) => {
    if (!isOpen) return null;

    const API_BASE_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:8000';
    
    const getPhotoUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-slide-up flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-slate-700 flex justify-between items-center bg-neutral-50 dark:bg-slate-800/80">
                    <h2 className="text-xl font-bold text-neutral-800 dark:text-white">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-200 dark:hover:bg-slate-700 rounded-full transition-colors text-neutral-500 dark:text-slate-400"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* List Body */}
                <div className="p-2 overflow-y-auto flex-1">
                    {!dataList || dataList.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-neutral-500 dark:text-slate-400 font-medium">No {title.toLowerCase()} found.</p>
                        </div>
                    ) : (
                        <ul className="space-y-1">
                            {dataList.map((item, index) => (
                                <li key={item._id || index}>
                                    <Link 
                                        to={item.companyName ? `/company/${item._id}` : `/profile/${item._id}`}
                                        onClick={onClose}
                                        className="flex items-center gap-4 p-3 hover:bg-neutral-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors w-full text-left"
                                    >
                                        <div className="w-12 h-12 flex-shrink-0 rounded-full border border-neutral-200 dark:border-slate-600 shadow-sm overflow-hidden bg-neutral-100 dark:bg-slate-700 flex items-center justify-center">
                                            {(item.profilePhoto || item.companyLogo) ? (
                                                <img 
                                                    src={getPhotoUrl(item.profilePhoto || item.companyLogo)} 
                                                    alt={item.userName || item.companyName} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-primary-500">
                                                    {(item.userName || item.companyName || 'U').charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                                                {item.userName || item.companyName}
                                            </h4>
                                            <p className="text-xs text-neutral-500 dark:text-slate-400 font-medium truncate capitalize">
                                                {item.role || item.industry || 'User'}
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NetworkModal;
