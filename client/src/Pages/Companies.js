import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Companies = () => {
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('');

    const industries = [
        "All Industries",
        "Technology",
        "Healthcare",
        "Finance",
        "Education",
        "Manufacturing",
        "Retail",
        "Real Estate",
        "Consulting",
        "Media & Entertainment",
        "Transportation",
        "Other"
    ];

    useEffect(() => {
        fetchCompanies();
    }, [selectedIndustry, searchTerm]);

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            let url = `${process.env.REACT_APP_API_URL}/company/all-companies`;
            const params = new URLSearchParams();
            
            if (selectedIndustry && selectedIndustry !== 'All Industries') {
                params.append('industry', selectedIndustry);
            }
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                setCompanies(result.data);
            } else if (Array.isArray(result)) {
                setCompanies(result);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const hasFilters = searchTerm || (selectedIndustry && selectedIndustry !== 'All Industries');

    return (
        <div className='bg-neutral-50 dark:bg-slate-900 min-h-screen'>
            {/* Header */}
            <div className='bg-white dark:bg-slate-800/80 border-b border-neutral-100 dark:border-slate-700/50'>
                <div className='container-custom py-8 flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2'>Explore Companies</h1>
                        <p className='text-neutral-600 dark:text-slate-400'>Discover amazing companies and find your next career opportunity</p>
                    </div>
                    {/* Tabs */}
                    <div className="flex bg-neutral-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                        <Link to="/all-posted-jobs" className="px-6 py-2 rounded-lg text-sm font-semibold text-neutral-500 hover:text-neutral-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all">Jobs</Link>
                        <Link to="/companies" className="px-6 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-slate-800 text-primary dark:text-white shadow-sm transition-all">Companies</Link>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className='bg-white dark:bg-slate-800/80 border-b border-neutral-100 dark:border-slate-700/50 sticky top-16 md:top-20 z-30 shadow-sm'>
                <div className='container-custom py-4'>
                    <div className='flex flex-col md:flex-row gap-4 justify-center max-w-2xl mx-auto'>
                        <div className='flex-1 relative'>
                            <svg className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                            </svg>
                            <input
                                type='text'
                                placeholder='Search companies...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='input pl-12'
                            />
                        </div>
                        <select
                            value={selectedIndustry}
                            onChange={(e) => setSelectedIndustry(e.target.value)}
                            className='select md:w-56'
                        >
                            {industries.map((industry) => (
                                <option key={industry} value={industry}>{industry}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='container-custom py-12'>
                {/* Results Count */}
                <div className='mb-6 flex items-center justify-between'>
                    <p className='text-neutral-600 dark:text-slate-400'>
                        <span className='font-bold text-neutral-900 dark:text-white'>{companies.length}</span> companies
                        {hasFilters && <span className='text-sm ml-2'>(filtered)</span>}
                    </p>
                </div>

                {/* Companies Grid */}
                {isLoading ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className='card p-6'>
                                <div className='flex items-start gap-4'>
                                    <div className='w-16 h-16 rounded-xl bg-neutral-200 dark:bg-slate-700 animate-pulse' />
                                    <div className='flex-1'>
                                        <div className='h-5 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse mb-2' />
                                        <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-1/2' />
                                    </div>
                                </div>
                                <div className='mt-4 space-y-2'>
                                    <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse' />
                                    <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-3/4' />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : companies.length === 0 ? (
                    <div className='empty-state'>
                        <div className='empty-state-icon'>🏢</div>
                        <h3 className='empty-state-title'>No Companies Found</h3>
                        <p className='empty-state-text'>
                            {hasFilters 
                                ? "No companies match your search criteria. Try adjusting your filters."
                                : "There are no companies listed at the moment."}
                        </p>
                        {hasFilters && (
                            <button 
                                onClick={() => { setSearchTerm(''); setSelectedIndustry('All Industries'); }}
                                className='btn-primary'
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {companies.map((company) => (
                            <CompanyCard key={company._id} company={company} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const CompanyCard = ({ company }) => {
    return (
        <Link to={`/company/${company._id}`} className='card-hover group'>
            <div className='p-6'>
                <div className='flex items-center gap-4 mb-4'>
                    <div className='w-16 h-16 rounded-xl bg-neutral-50 dark:bg-slate-700/50 border border-neutral-100 dark:border-slate-600/50 flex items-center justify-center flex-shrink-0 overflow-hidden'>
                        {company.companyLogo ? (
                            <img src={company.companyLogo} alt={company.companyName} className='w-full h-full object-cover' />
                        ) : (
                            <span className='text-2xl font-bold text-secondary'>{company.companyName?.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div>
                        <h3 className='font-bold text-lg text-neutral-900 dark:text-white group-hover:text-secondary transition-colors'>{company.companyName}</h3>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-slate-300 mt-1'>
                            {company.industry || 'Technology'}
                        </span>
                    </div>
                </div>
                
                <p className='text-sm text-neutral-600 dark:text-slate-400 line-clamp-2 min-h-[40px]'>
                    {company.description || 'No description available'}
                </p>

                <div className='mt-6 pt-4 border-t border-neutral-100 dark:border-slate-700/50 flex items-center justify-between'>
                    {company.location && (
                        <span className='flex items-center gap-1.5 text-sm text-neutral-500 dark:text-slate-400'>
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                            </svg>
                            {company.location}
                        </span>
                    )}
                    <span className='text-sm font-semibold text-secondary-600 flex items-center gap-1'>
                        View Profile
                        <svg className='w-4 h-4 group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default Companies;
