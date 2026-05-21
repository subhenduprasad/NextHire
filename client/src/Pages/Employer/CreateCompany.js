import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { LoginContext } from '../../components/ContextProvider/Context';

export const CreateCompany = () => {
    const { loginData } = useContext(LoginContext);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasCompany, setHasCompany] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    useEffect(() => {
        const checkCompany = async () => {
            if (!loginData?._id) {
                setIsLoading(false);
                return;
            }
            
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/company/by-employer/${loginData._id}`
                );
                if (response.ok) {
                    const result = await response.json();
                    if (result.data?._id || result._id) {
                        setHasCompany(true);
                    }
                }
            } catch (error) {
                console.error('Error checking company:', error);
            } finally {
                setIsLoading(false);
            }
        };
        checkCompany();
    }, [loginData]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/company/create`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('usertoken')}`
                    },
                    body: JSON.stringify(data)
                }
            );

            const result = await response.json();

            if (response.ok && (result.success || result.data)) {
                toast.success('Company created successfully!');
                navigate('/employer/dashboard');
            } else {
                toast.error(result.message || 'Failed to create company');
            }
        } catch (error) {
            console.error('Error creating company:', error);
            toast.error('An error occurred while creating company');
        } finally {
            setIsSubmitting(false);
        }
    };

    const industries = [
        'Technology', 'Finance', 'Healthcare', 'Education', 
        'Manufacturing', 'Retail', 'Consulting', 'Media & Entertainment',
        'Real Estate', 'Transportation', 'Other'
    ];

    if (isLoading) {
        return (
            <div className='container-custom py-12'>
                <div className='max-w-2xl mx-auto'>
                    <div className='card p-8'>
                        <div className='text-center mb-8'>
                            <div className='h-8 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-64 mx-auto mb-4' />
                            <div className='h-5 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-80 mx-auto' />
                        </div>
                        <div className='space-y-6'>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i}>
                                    <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-24 mb-2' />
                                    <div className='h-12 bg-neutral-200 dark:bg-slate-700 rounded-xl animate-pulse' />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (hasCompany) {
        return (
            <div className='container-custom py-12'>
                <div className='card max-w-xl mx-auto'>
                    <div className='empty-state py-16'>
                        <div className='w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6'>
                            <svg className='w-10 h-10 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                        </div>
                        <h2 className='empty-state-title'>Company Already Exists</h2>
                        <p className='empty-state-text'>You already have a company registered.</p>
                        <button 
                            onClick={() => navigate('/employer/dashboard')}
                            className='btn-primary'
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-neutral-50 dark:bg-slate-900 min-h-screen py-12'>
            <div className='container-custom'>
                <div className='max-w-2xl mx-auto'>
                    {/* Header */}
                    <div className='text-center mb-8'>
                        <div className='w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                            <svg className='w-8 h-8 text-secondary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                            </svg>
                        </div>
                        <h1 className='text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2'>Create Your Company</h1>
                        <p className='text-neutral-600 dark:text-slate-400'>Set up your company profile to start posting jobs</p>
                    </div>

                    {/* Form */}
                    <div className='card p-6 md:p-8'>
                        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                            {/* Company Name */}
                            <div className='form-group'>
                                <label className='label'>Company Name *</label>
                                <input
                                    type='text'
                                    {...register('companyName', { required: 'Company name is required' })}
                                    className={`input ${errors.companyName ? 'input-error' : ''}`}
                                    placeholder='Enter company name'
                                />
                                {errors.companyName && (
                                    <p className='text-red-500 text-sm mt-1'>{errors.companyName.message}</p>
                                )}
                            </div>

                            {/* Industry */}
                            <div className='form-group'>
                                <label className='label'>Industry *</label>
                                <select
                                    {...register('industry', { required: 'Industry is required' })}
                                    className={`select ${errors.industry ? 'input-error' : ''}`}
                                >
                                    <option value=''>Select Industry</option>
                                    {industries.map(ind => (
                                        <option key={ind} value={ind}>{ind}</option>
                                    ))}
                                </select>
                                {errors.industry && (
                                    <p className='text-red-500 text-sm mt-1'>{errors.industry.message}</p>
                                )}
                            </div>

                            {/* Location */}
                            <div className='form-group'>
                                <label className='label'>Location *</label>
                                <input
                                    type='text'
                                    {...register('location', { required: 'Location is required' })}
                                    className={`input ${errors.location ? 'input-error' : ''}`}
                                    placeholder='City, Country'
                                />
                                {errors.location && (
                                    <p className='text-red-500 text-sm mt-1'>{errors.location.message}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className='form-group'>
                                <label className='label'>Company Description *</label>
                                <textarea
                                    {...register('description', { required: 'Description is required' })}
                                    rows={4}
                                    className={`input ${errors.description ? 'input-error' : ''}`}
                                    placeholder='Tell us about your company, culture, and what makes it a great place to work...'
                                />
                                {errors.description && (
                                    <p className='text-red-500 text-sm mt-1'>{errors.description.message}</p>
                                )}
                            </div>

                            {/* Website */}
                            <div className='form-group'>
                                <label className='label'>Website</label>
                                <input
                                    type='url'
                                    {...register('website')}
                                    className='input'
                                    placeholder='https://www.example.com'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                {/* Employee Count */}
                                <div className='form-group'>
                                    <label className='label'>Employee Count</label>
                                    <select {...register('employeeCount')} className='select'>
                                        <option value=''>Select</option>
                                        <option value='1-10'>1-10</option>
                                        <option value='11-50'>11-50</option>
                                        <option value='51-200'>51-200</option>
                                        <option value='201-500'>201-500</option>
                                        <option value='500+'>500+</option>
                                    </select>
                                </div>

                                {/* Founded Year */}
                                <div className='form-group'>
                                    <label className='label'>Founded Year</label>
                                    <input
                                        type='number'
                                        {...register('foundedYear')}
                                        className='input'
                                        placeholder='2020'
                                        min='1900'
                                        max={new Date().getFullYear()}
                                    />
                                </div>
                            </div>

                            {/* Company Logo URL */}
                            <div className='form-group'>
                                <label className='label'>Company Logo URL</label>
                                <input
                                    type='url'
                                    {...register('companyLogo')}
                                    className='input'
                                    placeholder='https://example.com/logo.png'
                                />
                                <p className='text-sm text-neutral-500 dark:text-slate-400 mt-1'>Enter a URL to your company logo image</p>
                            </div>

                            {/* Submit Buttons */}
                            <div className='flex flex-col sm:flex-row gap-3 pt-4'>
                                <button
                                    type='submit'
                                    disabled={isSubmitting}
                                    className='btn-secondary flex-1'
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className='animate-spin -ml-1 mr-2 h-5 w-5' fill='none' viewBox='0 0 24 24'>
                                                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4' />
                                            </svg>
                                            Create Company
                                        </>
                                    )}
                                </button>
                                <Link to='/employer/dashboard' className='btn-outline flex-1 text-center'>
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Help Text */}
                    <p className='text-center text-sm text-neutral-500 dark:text-slate-400 mt-6'>
                        Need help? Contact us at{' '}
                        <a href='mailto:support@nexthire.com' className='text-secondary-600 hover:underline'>
                            support@nexthire.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};
