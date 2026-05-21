import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import logoURL from '../assets/img/logo.jpeg';
import { formatSalary } from '../utils/formatters';

export const SimilarJobs = () => {
    const { id } = useParams();
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
        setIsLoading(true);
        fetch(`${process.env.REACT_APP_API_URL}/jobs/all-jobs`)
            .then(res => res.json())
            .then(data => {
                const filteredJobs = data
                    .filter(job => job._id !== id)
                    .slice(0, 4);
                setJobs(filteredJobs);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Error:', err);
                setIsLoading(false);
            });
    }, [id]);

    if (isLoading || jobs.length === 0) return null;

    return (
        <section className='bg-neutral-50 dark:bg-slate-900 py-12'>
            <div className='container-custom'>
                <div className='flex items-center justify-between mb-8'>
                    <h2 className='text-xl md:text-2xl font-bold text-neutral-900 dark:text-white'>Similar Opportunities</h2>
                    <Link 
                        to='/all-posted-jobs'
                        className='text-secondary-600 hover:text-secondary-700 font-medium text-sm flex items-center gap-1'
                    >
                        View All
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
                        </svg>
                    </Link>
                </div>

                <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                    {jobs.map((job) => {
                        let companyId = job.companyId;
                        let company = null;
                        if (typeof companyId === 'object' && companyId !== null) {
                            company = companyId;
                        } else {
                            company = companies[companyId];
                        }
                        
                        return (
                            <Link 
                                key={job._id} 
                                to={`/current-job/${job._id}`}
                                className='card-hover group'
                            >
                                <div className='p-5'>
                                    <div className='flex items-center gap-3 mb-3'>
                                        <div className='w-12 h-12 rounded-xl bg-neutral-50 dark:bg-slate-800 border border-neutral-100 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0'>
                                            {company?.companyLogo ? (
                                                <img 
                                                    src={company.companyLogo} 
                                                    alt={company.companyName} 
                                                    className='w-full h-full object-contain p-1.5' 
                                                />
                                            ) : (
                                                <span className='text-lg font-bold text-secondary'>
                                                    {company?.companyName?.charAt(0) || 'C'}
                                                </span>
                                            )}
                                        </div>
                                        <div className='min-w-0'>
                                            <h3 className='font-semibold text-neutral-800 dark:text-slate-200 truncate group-hover:text-secondary-700 dark:group-hover:text-secondary-400 transition-colors'>
                                                {job.jobTitle}
                                            </h3>
                                            <p className='text-sm text-neutral-500 dark:text-slate-400 truncate'>
                                                {company?.companyName || 'Company'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className='flex items-center justify-between text-sm'>
                                        <span className='text-neutral-500 dark:text-slate-400 flex items-center gap-1'>
                                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                                            </svg>
                                            {job.location}
                                        </span>
                                        <span className='font-semibold text-secondary-600'>
                                            {formatSalary(job)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
