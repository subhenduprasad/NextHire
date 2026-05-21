import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FeedSearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef(null);
    const navigate = useNavigate();

    const getPhotoUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        return `${baseUrl}${path}`;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/search?q=${encodeURIComponent(query)}`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.success) {
                    setResults(data.results);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(fetchResults, 400);
        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleResultClick = (item) => {
        setIsFocused(false);
        setQuery('');
        if (item.type === 'company') {
            navigate(`/company/${item.id}`);
        } else {
            navigate(`/profile/${item.id}`);
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full z-40 mb-6">
            <div className={`relative flex items-center transition-all duration-300 bg-white dark:bg-slate-800 rounded-full border ${isFocused ? 'border-primary dark:border-primary' : 'border-neutral-200 dark:border-slate-700'} px-4 py-3 h-14`}>
                <svg className={`w-5 h-5 mr-3 transition-colors ${isFocused ? 'text-primary' : 'text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    className="flex-1 bg-transparent border-transparent focus:border-transparent outline-none focus:outline-none focus:ring-0 text-neutral-800 dark:text-white placeholder-neutral-400 placeholder:font-light"
                    placeholder="Search profiles, recruiters, or companies..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                />
                
                {isSearching && (
                    <div className="spinner border-t-primary w-5 h-5 ml-2"></div>
                )}
            </div>

            {isFocused && query.trim() && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-neutral-100 dark:border-slate-700 overflow-hidden max-h-96 overflow-y-auto">
                    {isSearching ? (
                        <div className="p-4 text-center text-sm text-neutral-500">Searching...</div>
                    ) : results.length > 0 ? (
                        <ul className="py-2">
                            {results.map((item) => (
                                <li 
                                    key={item.id}
                                    onClick={() => handleResultClick(item)}
                                    className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-neutral-500">
                                        {item.photo ? (
                                            <img src={getPhotoUrl(item.photo)} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{item.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-neutral-900 dark:text-white truncate">{item.name}</div>
                                        <div className="text-xs text-neutral-500 dark:text-slate-400 capitalize truncate">{item.subtitle} • {item.type}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-6 text-center">
                            <span className="text-neutral-400 block mb-2">No results found for "{query}"</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
