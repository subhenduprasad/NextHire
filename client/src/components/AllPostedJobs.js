import React from 'react'
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import logoURL from '../assets/img/logo.jpeg'
import { formatSalary } from '../utils/formatters';

export const AllPostedJobs = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [jobs, setJobs] = useState([]);
    const [companies, setCompanies] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        location: searchParams.get('location') || '',
        employmentType: searchParams.get('employmentType') || '',
        companyId: searchParams.get('company') || ''
    });

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/company/all-companies`)
            .then(res => res.json())
            .then(response => {
                const companyMap = {};
                const companiesArray = response.data || response || [];
                if (Array.isArray(companiesArray)) {
                    companiesArray.forEach(company => {
                        companyMap[company._id] = company;
                    });
                }
                setCompanies(companyMap);
            })
            .catch(err => console.error('Error fetching companies:', err));
    }, []);

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filters.search) params.append('search', filters.search);
                if (filters.location) params.append('location', filters.location);
                if (filters.employmentType) params.append('employmentType', filters.employmentType);
                if (filters.companyId) params.append('companyId', filters.companyId);
                
                const response = await fetch(`${process.env.REACT_APP_API_URL}/jobs/all-jobs?${params.toString()}`);
                const data = await response.json();
                setJobs(data);
            } catch (error) {
                console.error('Error fetching jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search so we don't fetch on every keystroke
        const delaySearch = setTimeout(() => {
            fetchJobs();
        }, 400);

        return () => clearTimeout(delaySearch);
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        
        setSearchParams(prev => {
            if (value) prev.set(name, value);
            else prev.delete(name);
            return prev;
        }, { replace: true });
    };

    const clearFilters = () => {
        setFilters({ search: '', location: '', employmentType: '', companyId: '' });
        setSearchParams({}, { replace: true });
    };

    const hasFilters = filters.search || filters.location || filters.employmentType || filters.companyId;

    return (
        <div className='bg-neutral-50 dark:bg-slate-900 min-h-screen'>
            {/* Header */}
            <div className='bg-white dark:bg-slate-800/80 border-b border-neutral-100 dark:border-slate-700/50'>
                <div className='container-custom py-8 flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2'>Browse All Jobs</h1>
                        <p className='text-neutral-600 dark:text-slate-400'>Find your next opportunity from {jobs.length} available positions</p>
                    </div>
                    {/* Tabs */}
                    <div className="flex bg-neutral-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                        <Link to="/all-posted-jobs" className="px-6 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-slate-800 text-primary dark:text-white shadow-sm transition-all">Jobs</Link>
                        <Link to="/companies" className="px-6 py-2 rounded-lg text-sm font-semibold text-neutral-500 hover:text-neutral-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all">Companies</Link>
                    </div>
                </div>
            </div>
            
            {/* Filters */}
            <div className='bg-white dark:bg-slate-800/80 border-b border-neutral-100 dark:border-slate-700/50 sticky top-16 md:top-20 z-30'>
                <div className='container-custom py-4'>
                    <div className='flex flex-col md:flex-row gap-3'>
                        <div className='flex-1 relative'>
                            <svg className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                            </svg>
                            <input
                                type='text'
                                name='search'
                                placeholder='Job title, keywords, or company'
                                value={filters.search}
                                onChange={handleFilterChange}
                                className='input pl-12'
                            />
                        </div>
                        <div className='flex-1 relative'>
                            <svg className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                            </svg>
                            <input
                                type='text'
                                name='location'
                                placeholder='City, state, or remote'
                                value={filters.location}
                                onChange={handleFilterChange}
                                className='input pl-12'
                            />
                        </div>
                        <select
                            name='employmentType'
                            value={filters.employmentType}
                            onChange={handleFilterChange}
                            className='select md:w-48'
                        >
                            <option value=''>All Job Types</option>
                            <option value='Full-time'>Full-time</option>
                            <option value='Part-time'>Part-time</option>
                            <option value='Contract'>Contract</option>
                            <option value='Internship'>Internship</option>
                            <option value='Remote'>Remote</option>
                        </select>
                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className='btn-ghost text-neutral-600'
                            >
                                <svg className='w-5 h-5 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                                </svg>
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className='container-custom py-8'>
                {/* Results Count */}
                <div className='flex items-center justify-between mb-6'>
                    <p className='text-neutral-600 dark:text-slate-400'>
                        <span className='font-semibold text-neutral-900 dark:text-white'>{jobs.length}</span> jobs found
                        {hasFilters && <span className='text-sm ml-2'>(filtered)</span>}
                    </p>
                </div>

                {loading ? (
                    <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className='card p-6'>
                                <div className='flex items-center gap-4 mb-4'>
                                    <div className='w-14 h-14 rounded-xl bg-neutral-200 animate-pulse' />
                                    <div className='flex-1'>
                                        <div className='h-5 bg-neutral-200 rounded animate-pulse mb-2' />
                                        <div className='h-4 bg-neutral-200 rounded animate-pulse w-2/3' />
                                    </div>
                                </div>
                                <div className='space-y-2'>
                                    <div className='h-4 bg-neutral-200 rounded animate-pulse' />
                                    <div className='h-4 bg-neutral-200 rounded animate-pulse w-3/4' />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : jobs.length === 0 ? (
                    <div className='empty-state'>
                        <div className='empty-state-icon'>🔍</div>
                        <h3 className='empty-state-title'>No Jobs Found</h3>
                        <p className='empty-state-text'>
                            {hasFilters 
                                ? "No jobs match your current filters. Try adjusting your search criteria."
                                : "There are no job listings available at the moment. Check back soon!"}
                        </p>
                        {hasFilters && (
                            <button onClick={clearFilters} className='btn-primary'>
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {jobs.map((job, key) => {
                            let companyId = job.companyId;
                            if (typeof companyId === 'object' && companyId !== null) {
                                return <JobCard key={key} job={job} company={companyId} />;
                            }
                            return <JobCard key={key} job={job} company={companies[companyId]} />;
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

function JobCard({ job, company }) {
    const getEmploymentTypeStyle = (type) => {
        const normalizedType = type?.toLowerCase();
        if (normalizedType?.includes('full')) return 'badge-accent';
        if (normalizedType?.includes('part')) return 'badge-warning';
        if (normalizedType?.includes('contract')) return 'badge-secondary';
        if (normalizedType?.includes('intern')) return 'badge-primary';
        if (normalizedType?.includes('remote')) return 'badge-success';
        return 'badge-neutral';
    };

    return (
        <div className='card-hover group'>
            <div className='p-6'>
                {/* Header */}
                <div className='flex items-start gap-4 mb-4'>
                    <div className='w-14 h-14 rounded-xl bg-neutral-50 dark:bg-slate-700/50 border border-neutral-100 dark:border-slate-600/50 flex items-center justify-center overflow-hidden flex-shrink-0'>
                        {company?.companyLogo ? (
                            <img 
                                src={company.companyLogo} 
                                alt={company.companyName} 
                                className='w-full h-full object-contain p-2' 
                            />
                        ) : (
                            <span className='text-xl font-bold text-secondary'>
                                {company?.companyName?.charAt(0) || 'C'}
                            </span>
                        )}
                    </div>
                    <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-lg text-neutral-800 dark:text-slate-100 mb-1 group-hover:text-secondary-700 dark:group-hover:text-secondary-400 transition-colors truncate'>
                            {job.jobTitle}
                        </h3>
                        {company ? (
                            <Link 
                                to={`/company/${company._id}`} 
                                className='text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-700 hover:underline'
                            >
                                {company.companyName}
                            </Link>
                        ) : (
                            <span className='text-sm text-neutral-500 dark:text-slate-400'>Company</span>
                        )}
                    </div>
                </div>
                
                {/* Tags */}
                <div className='flex flex-wrap gap-2 mb-4'>
                    <span className={getEmploymentTypeStyle(job.employmentType)}>
                        {job.employmentType}
                    </span>
                    {(job.salary || job.salaryMin) && (
                        <span className='badge-success'>
                            {formatSalary(job)}
                        </span>
                    )}
                    {job.applicationDeadline && (
                        <span className={`badge ${new Date() > new Date(job.applicationDeadline) ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'badge-neutral'}`}>
                            {new Date() > new Date(job.applicationDeadline) ? 'Closed' : `Apply by ${new Date(job.applicationDeadline).toLocaleDateString()}`}
                        </span>
                    )}
                </div>

                {/* Description */}
                <p className='text-sm text-neutral-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed'>
                    {job.description ? job.description.replace(/<[^>]*>?/gm, '').substring(0, 120) : ''}...
                </p>

                {/* Footer */}
                <div className='flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-slate-700/50'>
                    <div className='flex items-center text-neutral-500 dark:text-slate-400 text-sm'>
                        <svg className='w-4 h-4 mr-1.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                        </svg>
                        {job.location}
                    </div>
                    <Link 
                        to={`/current-job/${job._id}`}
                        className='inline-flex items-center text-sm font-semibold text-secondary-600 hover:text-secondary-700 transition-colors'
                    >
                        View Details
                        <svg className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    )
}
