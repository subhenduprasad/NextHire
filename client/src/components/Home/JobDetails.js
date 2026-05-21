import React, { useState, useEffect, useContext } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import LogoURL from '../../assets/img/logo.jpeg'
import { SimilarJobs } from '../SimilarJobs'
import { LoginContext } from '../ContextProvider/Context'
import { toast } from 'react-toastify'
import { formatSalary } from '../../utils/formatters';

export const JobDetails = () => {
    const { loginData } = useContext(LoginContext);
    const navigate = useNavigate();
    const { id } = useParams();
    
    const [job, setJob] = useState();
    const [company, setCompany] = useState(null);
    const [hasApplied, setHasApplied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (loginData && job && job.applicants) {
            const alreadyApplied = job.applicants.some(
                applicant => applicant.applicant === loginData._id
            );
            setHasApplied(alreadyApplied);
        }
    }, [loginData, job]);

    useEffect(() => {
        if (!job) return;

        // Save original metadata to restore when component unmounts
        const originalTitle = document.title;
        const metaTags = {
            'description': document.querySelector('meta[name="description"]')?.getAttribute('content'),
            'og:title': document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
            'og:description': document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
            'og:image': document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
            'og:url': document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
            'twitter:title': document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
            'twitter:description': document.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
            'twitter:image': document.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
            'twitter:url': document.querySelector('meta[name="twitter:url"]')?.getAttribute('content'),
        };

        const compName = company?.companyName || 'NextHire';
        const jobTitle = job.jobTitle;
        const jobDesc = job.description 
            ? job.description.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
            : 'Explore this premium job opportunity on NextHire.';
        const logoImg = company?.companyLogo || LogoURL;
        const currentUrl = window.location.href;

        // Set new metadata
        document.title = `${jobTitle} at ${compName} | NextHire`;

        const setOrUpdateMeta = (attribute, value, isProperty = false) => {
            if (!value) return;
            const selector = isProperty ? `meta[property="${attribute}"]` : `meta[name="${attribute}"]`;
            let el = document.querySelector(selector);
            if (!el) {
                el = document.createElement('meta');
                if (isProperty) {
                    el.setAttribute('property', attribute);
                } else {
                    el.setAttribute('name', attribute);
                }
                document.head.appendChild(el);
            }
            el.setAttribute('content', value);
        };

        setOrUpdateMeta('description', jobDesc);
        setOrUpdateMeta('og:title', `${jobTitle} at ${compName}`, true);
        setOrUpdateMeta('og:description', jobDesc, true);
        setOrUpdateMeta('og:image', logoImg, true);
        setOrUpdateMeta('og:url', currentUrl, true);
        setOrUpdateMeta('twitter:title', `twitter:title`, false);
        document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', `${jobTitle} at ${compName}`);
        setOrUpdateMeta('twitter:description', jobDesc);
        setOrUpdateMeta('twitter:image', logoImg);
        setOrUpdateMeta('twitter:url', currentUrl);

        // Cleanup function to restore original tags on unmount
        return () => {
            document.title = originalTitle;
            const restoreMeta = (attribute, value, isProperty = false) => {
                const selector = isProperty ? `meta[property="${attribute}"]` : `meta[name="${attribute}"]`;
                const el = document.querySelector(selector);
                if (el) {
                    if (value) {
                        el.setAttribute('content', value);
                    } else {
                        el.remove();
                    }
                }
            };
            restoreMeta('description', metaTags['description']);
            restoreMeta('og:title', metaTags['og:title'], true);
            restoreMeta('og:description', metaTags['og:description'], true);
            restoreMeta('og:image', metaTags['og:image'], true);
            restoreMeta('og:url', metaTags['og:url'], true);
            restoreMeta('twitter:title', metaTags['twitter:title']);
            restoreMeta('twitter:description', metaTags['twitter:description']);
            restoreMeta('twitter:image', metaTags['twitter:image']);
            restoreMeta('twitter:url', metaTags['twitter:url']);
        };
    }, [job, company]);

    useEffect(() => {
        setIsLoading(true);
        fetch(`${process.env.REACT_APP_API_URL}/jobs/current-job/${id}`)
            .then(res => res.json())
            .then(data => { 
                setJob(data);
                if (data.companyId) {
                    let companyId = data.companyId;
                    if (typeof companyId === 'object' && companyId !== null) {
                        setCompany(companyId);
                    } else {
                        fetch(`${process.env.REACT_APP_API_URL}/company/company/${companyId}`)
                            .then(res => res.json())
                            .then(companyData => {
                                if (companyData.success && companyData.data) {
                                    setCompany(companyData.data);
                                } else if (companyData._id) {
                                    setCompany(companyData);
                                }
                            })
                            .catch(err => console.error('Error fetching company:', err));
                    }
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Error:', err);
                setIsLoading(false);
            });
    }, [id]);

    const getEmploymentTypeStyle = (type) => {
        const normalizedType = type?.toLowerCase();
        if (normalizedType?.includes('full')) return 'badge-accent';
        if (normalizedType?.includes('part')) return 'badge-warning';
        if (normalizedType?.includes('contract')) return 'badge-secondary';
        if (normalizedType?.includes('intern')) return 'badge-primary';
        if (normalizedType?.includes('remote')) return 'badge-success';
        return 'badge-neutral';
    };

    if (isLoading) {
        return (
            <div className='container-custom py-12'>
                <div className='max-w-4xl mx-auto'>
                    <div className='card p-8'>
                        <div className='flex items-center gap-6 mb-8'>
                            <div className='w-20 h-20 rounded-2xl bg-neutral-200 dark:bg-slate-700 animate-pulse' />
                            <div className='flex-1'>
                                <div className='h-8 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse mb-3 w-2/3' />
                                <div className='h-5 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-1/3' />
                            </div>
                        </div>
                        <div className='space-y-4'>
                            <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse' />
                            <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-5/6' />
                            <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-4/6' />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className='container-custom py-12'>
                <div className='empty-state'>
                    <div className='empty-state-icon'>🔍</div>
                    <h3 className='empty-state-title'>Job Not Found</h3>
                    <p className='empty-state-text'>The job you're looking for doesn't exist or has been removed.</p>
                    <Link to='/all-posted-jobs' className='btn-primary'>
                        Browse All Jobs
                    </Link>
                </div>
            </div>
        );
    }

    const isExpired = job.applicationDeadline && new Date() > new Date(job.applicationDeadline);

    return (
        <div className='bg-neutral-50 dark:bg-slate-900 min-h-screen'>
            {/* Header Banner */}
            <div className='bg-gradient-to-r from-primary to-primary-600 text-white py-12'>
                <div className='container-custom'>
                    <button 
                        onClick={() => navigate('/all-posted-jobs')} 
                        className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-semibold"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Jobs
                    </button>
                    <div className='flex flex-col md:flex-row items-start md:items-center gap-6'>
                        <div className='w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white dark:bg-slate-800 p-3 shadow-lg flex items-center justify-center'>
                            <img 
                                src={company?.companyLogo || LogoURL} 
                                alt="Company Logo" 
                                className="w-full h-full object-contain rounded-xl" 
                            />
                        </div>
                        <div className='flex-1'>
                            <h1 className='text-2xl md:text-3xl font-bold mb-2'>{job.jobTitle}</h1>
                            {company ? (
                                <Link 
                                    to={`/company/${company._id}`} 
                                    className='text-white/90 hover:text-white hover:underline text-lg'
                                >
                                    {company.companyName}
                                </Link>
                            ) : (
                                <span className='text-white/80'>Company</span>
                            )}
                            <div className='flex flex-wrap items-center gap-3 mt-4'>
                                <span className='flex items-center gap-1.5 text-white/90 text-sm'>
                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                                    </svg>
                                    {job.location}
                                </span>
                                <span className='flex items-center gap-1.5 text-white/90 text-sm'>
                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                                    </svg>
                                    Posted {new Date(job.createdAt || Date.now()).toLocaleDateString()}
                                </span>
                                {job.applicationDeadline && (
                                    <span className={`flex items-center gap-1.5 text-sm font-semibold px-2.5 py-0.5 rounded-full ${isExpired ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                                        <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                                        </svg>
                                        Closes {new Date(job.applicationDeadline).toLocaleDateString()}
                                    </span>
                                )}
                                <span className='flex items-center gap-1.5 text-white/90 text-sm'>
                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                                    </svg>
                                    {job.applicants?.length || 0} applicants
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='container-custom py-8'>
                <div className='grid lg:grid-cols-3 gap-8'>
                    {/* Main Content */}
                    <div className='lg:col-span-2 space-y-6'>
                        {/* Key Info Cards */}
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                            <div className='card p-4 text-center'>
                                <div className='w-10 h-10 mx-auto mb-2 rounded-xl bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center'>
                                    <svg className='w-5 h-5 text-accent-600 dark:text-accent-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                                    </svg>
                                </div>
                                <p className='text-xs text-neutral-500 dark:text-slate-400 mb-1'>Job Type</p>
                                <p className='font-semibold text-neutral-800 dark:text-slate-200'>{job.employmentType}</p>
                            </div>
                            <div className='card p-4 text-center'>
                                <div className='w-10 h-10 mx-auto mb-2 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center'>
                                    <svg className='w-5 h-5 text-green-600 dark:text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                    </svg>
                                </div>
                                <p className='text-xs text-neutral-500 dark:text-slate-400 mb-1'>Salary</p>
                                <p className='font-semibold text-neutral-800 dark:text-slate-200'>{formatSalary(job)}</p>
                            </div>
                            <div className='card p-4 text-center'>
                                <div className='w-10 h-10 mx-auto mb-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center'>
                                    <svg className='w-5 h-5 text-purple-600 dark:text-purple-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                                    </svg>
                                </div>
                                <p className='text-xs text-neutral-500 dark:text-slate-400 mb-1'>Location</p>
                                <p className='font-semibold text-neutral-800 dark:text-slate-200'>{job.location}</p>
                            </div>
                            <div className='card p-4 text-center'>
                                <div className='w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center'>
                                    <svg className='w-5 h-5 text-amber-600 dark:text-amber-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' />
                                    </svg>
                                </div>
                                <p className='text-xs text-neutral-500 dark:text-slate-400 mb-1'>Experience</p>
                                <p className='font-semibold text-neutral-800 dark:text-slate-200'>{job.experience || 'Any'}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className='card p-6'>
                            <h2 className='text-xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2'>
                                <svg className='w-5 h-5 text-secondary dark:text-secondary-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                                </svg>
                                Job Description
                            </h2>
                            <div className='prose prose-neutral max-w-none'>
                                <div 
                                    className='text-neutral-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap rich-text-content'
                                    dangerouslySetInnerHTML={{ __html: job.description }}
                                />
                            </div>
                        </div>

                        {/* Skills */}
                        {job.skills?.length > 0 && (
                            <div className='card p-6'>
                                <h2 className='text-xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2'>
                                    <svg className='w-5 h-5 text-secondary dark:text-secondary-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' />
                                    </svg>
                                    Required Skills
                                </h2>
                                <div className='flex flex-wrap gap-2'>
                                    {job.skills.map((skill, index) => (
                                        <span key={index} className='badge-neutral'>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className='space-y-6'>
                        {/* Apply Card */}
                        <div className='card p-6 sticky top-24'>
                            <div className='text-center mb-6'>
                                <p className='text-sm text-neutral-500 dark:text-slate-400 mb-1'>Salary Package</p>
                                <p className='text-3xl font-bold text-neutral-900 dark:text-white'>{formatSalary(job)}</p>
                            </div>
                            
                            {!loginData ? (
                                <button 
                                    onClick={() => {
                                        toast.info("Please login to apply");
                                        navigate('/login');
                                    }}
                                    className='btn-secondary w-full mb-3'
                                >
                                    Login to Apply
                                </button>
                            ) : loginData.role !== 'candidate' ? (
                                <div className='alert-info'>
                                    <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                    </svg>
                                    <span className='text-sm'>Only candidates can apply for jobs</span>
                                </div>
                            ) : isExpired ? (
                                <div className='space-y-3'>
                                    <div className='alert-error bg-red-50 text-red-700 dark:bg-red-900/30 flex items-center gap-2 p-3 rounded-xl border border-red-200 dark:border-red-800'>
                                        <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                        </svg>
                                        <span className='text-sm font-semibold'>Application Deadline Passed</span>
                                    </div>
                                    <button disabled className='w-full py-3 px-4 rounded-xl font-semibold bg-neutral-200 text-neutral-500 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed transition-colors text-center'>
                                        Applications Closed
                                    </button>
                                </div>
                            ) : hasApplied ? (
                                <div className='space-y-3'>
                                    <div className='alert-success'>
                                        <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                                        </svg>
                                        <span className='text-sm'>You've already applied!</span>
                                    </div>
                                    <Link to="/my-jobs" className='btn-outline w-full'>
                                        View My Applications
                                    </Link>
                                </div>
                            ) : (
                                <Link to={`/application-form/${job?._id}`} className='btn-secondary w-full'>
                                    Apply Now
                                    <svg className='w-5 h-5 ml-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 8l4 4m0 0l-4 4m4-4H3' />
                                    </svg>
                                </Link>
                            )}

                             <div className='divider' />

                             {/* Share Opportunity */}
                             <div className='mb-6'>
                                 <h3 className='font-semibold text-xs uppercase tracking-wider text-neutral-500 dark:text-slate-400 mb-3 flex items-center gap-2'>
                                     <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 10.742l4.754-2.484 9.172-11.314m-9.172 11.314l3.076 1.417 4.754 2.484M5.356 16.03l1.835-1.835m0 0l-1.835-1.835m1.835 1.835H21" />
                                     </svg>
                                     Share Job Opportunity
                                 </h3>
                                 <div className='grid grid-cols-4 gap-2'>
                                     {/* Copy Link Button */}
                                     <button 
                                         onClick={() => {
                                             navigator.clipboard.writeText(window.location.href);
                                             toast.success("Link copied to clipboard! 📋");
                                         }}
                                         title="Copy Job Link"
                                         className='flex flex-col items-center justify-center p-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer'
                                     >
                                         <div className='w-8 h-8 rounded-lg bg-neutral-100 dark:bg-slate-700 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform'>
                                             <svg className="w-4.5 h-4.5 text-neutral-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                             </svg>
                                         </div>
                                         <span className='text-[10px] font-semibold text-neutral-500 dark:text-slate-400'>Copy</span>
                                     </button>

                                     {/* Share to WhatsApp */}
                                     <a 
                                         href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this exciting job opening: *${job.jobTitle}* at *${company?.companyName || 'NextHire'}*\n📍 Location: ${job.location}\n💼 Type: ${job.employmentType}\n\nApply here: ${window.location.href}`)}`}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         title="Share on WhatsApp"
                                         className='flex flex-col items-center justify-center p-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer'
                                     >
                                         <div className='w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform'>
                                             <svg className="w-4.5 h-4.5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                                 <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.09-3.976c1.644.975 3.257 1.488 4.856 1.489 5.533 0 10.038-4.482 10.04-.997.001-2.673-1.04-5.187-2.931-7.078-1.89-1.891-4.4-2.933-7.085-2.934-5.54 0-10.045 4.482-10.047 10-.001 2.016.528 3.99 1.531 5.739l-.994 3.633 3.73-.963zm12.302-5.412c-.226-.113-1.336-.66-1.543-.736-.207-.076-.358-.113-.509.113-.151.226-.584.736-.716.887-.132.151-.264.169-.49.056-.226-.113-.957-.353-1.822-1.125-.673-.6-1.127-1.341-1.259-1.567-.132-.226-.014-.348.099-.461.102-.102.226-.264.339-.396.113-.132.151-.226.226-.377.075-.151.038-.283-.019-.396-.056-.113-.509-1.226-.697-1.679-.183-.441-.365-.381-.509-.388-.132-.007-.283-.008-.433-.008-.151 0-.396.056-.604.283-.207.227-.792.774-.792 1.887 0 1.113.811 2.189.924 2.34 1.113 1.479 2.502 2.656 4.708 3.51.524.203 1.01.357 1.353.467.526.167 1.004.143 1.382.086.422-.063 1.336-.547 1.525-1.075.189-.528.189-.981.132-1.075-.056-.094-.207-.151-.433-.264z" />
                                             </svg>
                                         </div>
                                         <span className='text-[10px] font-semibold text-neutral-500 dark:text-slate-400'>WhatsApp</span>
                                     </a>

                                     {/* Share to LinkedIn */}
                                     <a 
                                         href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         title="Share on LinkedIn"
                                         className='flex flex-col items-center justify-center p-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer'
                                     >
                                         <div className='w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform'>
                                             <svg className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                                 <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                             </svg>
                                         </div>
                                         <span className='text-[10px] font-semibold text-neutral-500 dark:text-slate-400'>LinkedIn</span>
                                     </a>

                                     {/* Share to X (Twitter) */}
                                     <a 
                                         href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this exciting job opening: ${job.jobTitle} at ${company?.companyName || 'NextHire'}\n`)}&url=${encodeURIComponent(window.location.href)}&hashtags=jobs,hiring,nexthire`}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         title="Share on X (Twitter)"
                                         className='flex flex-col items-center justify-center p-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer'
                                     >
                                         <div className='w-8 h-8 rounded-lg bg-neutral-100 dark:bg-slate-700 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform'>
                                             <svg className="w-3.5 h-3.5 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                                                 <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                             </svg>
                                         </div>
                                         <span className='text-[10px] font-semibold text-neutral-500 dark:text-slate-400'>X / Twitter</span>
                                     </a>
                                 </div>
                             </div>

                             <div className='divider' />

                            {/* Company Info */}
                            {company && (
                                <div>
                                    <h3 className='font-semibold text-neutral-800 dark:text-slate-200 mb-4'>About the Company</h3>
                                    <Link to={`/company/${company._id}`} className='flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-slate-700/50 transition-colors'>
                                        <div className='w-12 h-12 rounded-xl bg-neutral-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden'>
                                            {company.companyLogo ? (
                                                <img src={company.companyLogo} alt={company.companyName} className='w-full h-full object-contain' />
                                            ) : (
                                                <span className='text-lg font-bold text-secondary'>{company.companyName?.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className='font-semibold text-neutral-800 dark:text-slate-200'>{company.companyName}</p>
                                            <p className='text-sm text-neutral-500 dark:text-slate-400'>{company.industry}</p>
                                        </div>
                                    </Link>
                                </div>
                            )}

                            <p className='text-xs text-neutral-500 dark:text-slate-500 text-center mt-4'>
                                By applying, you agree to our terms and conditions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <SimilarJobs />
        </div>
    )
}
