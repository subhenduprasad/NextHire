import React, { useEffect, useState, useContext } from 'react'
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify'
import { LoginContext } from '../../components/ContextProvider/Context';
import { formatSalary } from '../../utils/formatters';

export const AllJobs = () => {
    const { loginData } = useContext(LoginContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') || 'published';
    
    const [jobs, setJobs] = useState([]);
    const [company, setCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCompany = async () => {
            if (!loginData?._id) return;
            
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/company/by-employer/${loginData._id}`
                );
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        setCompany(result.data);
                    } else if (result._id) {
                        setCompany(result);
                    }
                }
            } catch (error) {
                console.error('Error fetching company:', error);
            }
        };
        fetchCompany();
    }, [loginData]);

    const fetchJobs = async () => {
        if (!company?._id) {
            setIsLoading(false);
            return;
        }
        
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/jobs/by-company/${company._id}`
            );
            const result = await response.json();
            if (result.success && result.data) {
                setJobs(result.data);
            } else if (Array.isArray(result)) {
                setJobs(result);
            } else {
                setJobs([]);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (company) {
            fetchJobs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [company]);

    const handleDeleteJob = async (id) => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/jobs/delete-job/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                toast.success("Job deleted successfully");
                fetchJobs();
            } else {
                toast.error("Failed to delete job");
            }
        } catch (error) {
            console.error("Error deleting job:", error);
            toast.error("Unable to delete job");
        }
    };

    const publishedJobs = jobs.filter(j => j.status !== 'draft');
    const draftJobs = jobs.filter(j => j.status === 'draft');
    const displayJobs = currentTab === 'drafts' ? draftJobs : publishedJobs;

    return (
        <div className='bg-neutral-50 dark:bg-slate-900 min-h-screen'>
            {/* Header */}
            <div className='bg-white dark:bg-slate-800 border-b border-neutral-100 dark:border-slate-700'>
                <div className='container-custom py-8'>
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                        <div>
                            <h1 className='text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white'>
                                {company ? `${company.companyName} - Jobs` : 'All Posted Jobs'}
                            </h1>
                            <p className='text-neutral-600 dark:text-slate-400 mt-1'>Manage your job listings</p>
                        </div>
                        <Link to='/post-job' className='btn-secondary'>
                            <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4' />
                            </svg>
                            Post New Job
                        </Link>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex items-center gap-6 mt-8 border-b border-neutral-200 dark:border-slate-700">
                        <button 
                            onClick={() => setSearchParams({ tab: 'published' })}
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${currentTab === 'published' ? 'border-primary text-primary dark:text-primary-400 dark:border-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                        >
                            Published Jobs ({publishedJobs.length})
                        </button>
                        <button 
                            onClick={() => setSearchParams({ tab: 'drafts' })}
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${currentTab === 'drafts' ? 'border-primary text-primary dark:text-primary-400 dark:border-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                        >
                            Drafts ({draftJobs.length})
                        </button>
                    </div>
                </div>
            </div>

            <div className='container-custom py-8'>
                {isLoading ? (
                    <LoadingSkeleton />
                ) : !company ? (
                    <EmptyState 
                        icon={
                            <svg className='w-12 h-12 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                            </svg>
                        }
                        title="No Company Found"
                        description="Please create a company first to manage jobs."
                        actionLink="/create-company"
                        actionText="Create Company"
                    />
                ) : displayJobs.length === 0 ? (
                    <EmptyState 
                        icon={
                            <svg className='w-12 h-12 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                            </svg>
                        }
                        title={currentTab === 'drafts' ? "No Drafts" : "No Jobs Posted Yet"}
                        description={currentTab === 'drafts' ? "You haven't saved any job drafts yet." : "Create your first job posting to start receiving applications."}
                        actionLink="/post-job"
                        actionText="Post Your First Job"
                    />
                ) : (
                    <>
                        {/* Stats - Only show for published tab */}
                        {currentTab === 'published' && (
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
                                <div className='card p-4'>
                                    <div className='text-2xl font-bold text-neutral-900 dark:text-white'>{publishedJobs.length}</div>
                                    <div className='text-sm text-neutral-500 dark:text-slate-400'>Total Jobs</div>
                                </div>
                                <div className='card p-4'>
                                    <div className='text-2xl font-bold text-secondary-600'>
                                        {publishedJobs.filter(j => j.isActive !== false).length}
                                    </div>
                                    <div className='text-sm text-neutral-500 dark:text-slate-400'>Active Jobs</div>
                                </div>
                                <div className='card p-4'>
                                    <div className='text-2xl font-bold text-accent-600'>
                                        {publishedJobs.reduce((acc, job) => acc + (job.applicants?.length || 0), 0)}
                                    </div>
                                    <div className='text-sm text-neutral-500 dark:text-slate-400'>Total Applicants</div>
                                </div>
                                <div className='card p-4'>
                                    <div className='text-2xl font-bold text-amber-600'>
                                        {Math.round(publishedJobs.reduce((acc, job) => acc + (job.applicants?.length || 0), 0) / Math.max(publishedJobs.length, 1))}
                                    </div>
                                    <div className='text-sm text-neutral-500 dark:text-slate-400'>Avg. Applicants</div>
                                </div>
                            </div>
                        )}

                        {/* Jobs Table */}
                        <div className='card overflow-hidden'>
                            <div className='bg-gradient-to-r from-primary to-primary-600 px-6 py-4'>
                                <h2 className='text-lg font-semibold text-white'>
                                    {currentTab === 'drafts' ? 'Your Saved Drafts' : 'Your Job Listings'}
                                </h2>
                            </div>
                            
                            {/* Desktop Table */}
                            <div className='hidden md:block'>
                                <table className='table'>
                                    <thead>
                                        <tr>
                                            <th>Job Title</th>
                                            <th>Salary</th>
                                            <th>Location</th>
                                            <th>Deadline</th>
                                            <th>Applicants</th>
                                            <th>Status</th>
                                            <th className='text-right'>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayJobs.map((job) => (
                                            <tr key={job._id} className='hover:bg-neutral-50 dark:bg-slate-900'>
                                                <td>
                                                    <div className='font-medium text-neutral-900 dark:text-white'>{job.jobTitle}</div>
                                                    <div className='text-sm text-neutral-500 dark:text-slate-400'>{job.employmentType}</div>
                                                </td>
                                                <td className='text-neutral-700 dark:text-slate-300'>{formatSalary(job)}</td>
                                                <td className='text-neutral-700 dark:text-slate-300'>{job.location}</td>
                                                <td className='text-neutral-700 dark:text-slate-300'>
                                                    {job.applicationDeadline ? (
                                                        <span className={new Date() > new Date(job.applicationDeadline) ? 'text-red-500 font-medium' : ''}>
                                                            {new Date(job.applicationDeadline).toLocaleDateString()}
                                                        </span>
                                                    ) : 'N/A'}
                                                </td>
                                                <td>
                                                    <span className='badge-accent'>{job.applicants?.length || 0}</span>
                                                </td>
                                                <td>
                                                    <span className={job.isActive !== false ? 'badge-success' : 'badge-neutral'}>
                                                        {job.isActive !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className='flex items-center justify-end gap-2'>
                                                        <Link 
                                                            to={`/current-job/${job._id}`}
                                                            className='p-2 text-neutral-500 dark:text-slate-400 hover:text-primary hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-lg transition-colors'
                                                            title='View'
                                                        >
                                                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                                            </svg>
                                                        </Link>
                                                        <Link 
                                                            to={job.status === 'draft' ? `/post-job?edit=${job._id}` : `/update-job/${job._id}`}
                                                            className='p-2 text-neutral-500 dark:text-slate-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors'
                                                            title='Edit'
                                                        >
                                                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                                                            </svg>
                                                        </Link>
                                                        <button 
                                                            onClick={() => handleDeleteJob(job._id)}
                                                            className='p-2 text-neutral-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                                                            title='Delete'
                                                        >
                                                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className='md:hidden divide-y divide-neutral-100'>
                                {displayJobs.map((job) => (
                                    <div key={job._id} className='p-4'>
                                        <div className='flex items-start justify-between gap-3 mb-3'>
                                            <div>
                                                <h3 className='font-semibold text-neutral-900 dark:text-white'>{job.jobTitle}</h3>
                                                <p className='text-sm text-neutral-500 dark:text-slate-400'>{job.employmentType}</p>
                                            </div>
                                            <span className={job.isActive !== false ? 'badge-success' : 'badge-neutral'}>
                                                {job.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className='flex flex-wrap gap-3 text-sm text-neutral-600 dark:text-slate-400 mb-4'>
                                            <span>{formatSalary(job)}</span>
                                            <span>•</span>
                                            <span>{job.location}</span>
                                            {job.applicationDeadline && (
                                                <>
                                                    <span>•</span>
                                                    <span className={new Date() > new Date(job.applicationDeadline) ? 'text-red-500' : ''}>
                                                        Due: {new Date(job.applicationDeadline).toLocaleDateString()}
                                                    </span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>{job.applicants?.length || 0} applicants</span>
                                        </div>
                                        <div className='flex gap-2'>
                                            <Link to={`/current-job/${job._id}`} className='btn-outline btn-sm flex-1'>View</Link>
                                            <Link to={job.status === 'draft' ? `/post-job?edit=${job._id}` : `/update-job/${job._id}`} className='btn-primary btn-sm flex-1'>Edit</Link>
                                            <button 
                                                onClick={() => handleDeleteJob(job._id)}
                                                className='btn-sm px-3 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg'
                                            >
                                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

function LoadingSkeleton() {
    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className='card p-4'>
                        <div className='h-8 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse mb-2' />
                        <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-2/3' />
                    </div>
                ))}
            </div>
            <div className='card p-6'>
                <div className='space-y-4'>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className='flex items-center gap-4 animate-pulse'>
                            <div className='flex-1 space-y-2'>
                                <div className='h-5 bg-neutral-200 dark:bg-slate-700 rounded w-1/3' />
                                <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded w-1/4' />
                            </div>
                            <div className='h-6 bg-neutral-200 dark:bg-slate-700 rounded w-20' />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function EmptyState({ icon, title, description, actionLink, actionText }) {
    return (
        <div className='card'>
            <div className='empty-state py-16'>
                <div className='w-20 h-20 bg-neutral-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6'>
                    {icon}
                </div>
                <h3 className='empty-state-title'>{title}</h3>
                <p className='empty-state-text'>{description}</p>
                <Link to={actionLink} className='btn-primary'>
                    {actionText}
                </Link>
            </div>
        </div>
    );
}
