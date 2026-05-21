import React from 'react'
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoURL from '../../assets/img/logo.jpeg'
import { formatSalary } from '../../utils/formatters';

export const FeaturedJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [companies, setCompanies] = useState({});
    const [isLoading, setIsLoading] = useState(true);

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
        fetch(`${process.env.REACT_APP_API_URL}/jobs/all-jobs`)
            .then(res => res.json())
            .then(data => {
                const featuredJobs = data.slice(0, 6);
                setJobs(featuredJobs);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Error fetching jobs:', err);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return (
            <section className='section bg-white dark:bg-slate-900'>
                <div className='container-custom'>
                    <div className='section-title'>
                        <h2 className='text-neutral-900 dark:text-white'>Featured Opportunities</h2>
                        <p className='text-neutral-600 dark:text-slate-400'>Discover handpicked jobs from top companies</p>
                    </div>
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
                </div>
            </section>
        );
    }

    return (
        <section className='section bg-white dark:bg-slate-900'>
            <div className='container-custom'>
                <div className='section-title'>
                    <h2 className='text-neutral-900 dark:text-white font-bold text-3xl mb-3'>Featured Opportunities</h2>
                    <p className='text-neutral-600 dark:text-slate-400'>Discover handpicked jobs from top companies around the world</p>
                </div>
                
                <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {jobs.map((job, key) => {
                        let companyId = job.companyId;
                        if (typeof companyId === 'object' && companyId !== null) {
                            return <JobCard key={key} job={job} company={companyId} />;
                        }
                        return <JobCard key={key} job={job} company={companies[companyId]} />;
                    })}
                </div>

                <div className='text-center mt-12'>
                    <Link to='/all-posted-jobs' className='btn-primary'>
                        View All Jobs
                        <svg className='w-5 h-5 ml-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 8l4 4m0 0l-4 4m4-4H3' />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
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
                        <h3 className='font-semibold text-lg text-neutral-800 dark:text-white mb-1 group-hover:text-secondary-700 dark:group-hover:text-secondary-400 transition-colors truncate'>
                            {job.jobTitle}
                        </h3>
                        {company ? (
                            <Link 
                                to={`/company/${company._id}`} 
                                className='text-sm text-secondary-600 hover:text-secondary-700 hover:underline'
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
                        Apply Now
                        <svg className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    )
}
