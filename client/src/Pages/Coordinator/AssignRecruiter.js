import React, { useContext, useState, useEffect } from 'react'
import { useForm } from "react-hook-form"
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { LoginContext } from '../../components/ContextProvider/Context'
import { formatSalary } from '../../utils/formatters';

export const AssignRecruiter = () => {
    const { loginData } = useContext(LoginContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState();
    const [recruiters, setRecruiters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const placeholderQuestions = [
        "Willing to relocate?",
        "Sufficient experience?",
        "Recommended?",
        "Good fit for the role?",
        "Strong problem-solving?"
    ]

    useEffect(() => {
        const fetchData = async () => {
            try {
                const jobRes = await fetch(`${process.env.REACT_APP_API_URL}/jobs/current-job/${id}`);
                const jobData = await jobRes.json();
                setJob(jobData);

                let companyId = loginData?.companyId;
                if (typeof companyId === 'object' && companyId !== null) companyId = companyId._id;
                
                if (companyId) {
                    const companyRes = await fetch(`${process.env.REACT_APP_API_URL}/company/company/${companyId}`);
                    const companyData = await companyRes.json();
                    const company = companyData.success ? companyData.data : companyData;
                    
                    if (company && company._id) {
                        const usersRes = await fetch(`${process.env.REACT_APP_API_URL}/users/all-users`);
                        const usersData = await usersRes.json();
                        const usersArray = Array.isArray(usersData) ? usersData : (usersData.data || []);

                        const companyRecruiters = usersArray.filter((user) => {
                            if (user.role !== "recruiter") return false;
                            let userCompanyId = user.companyId;
                            if (typeof userCompanyId === 'object' && userCompanyId !== null) {
                                userCompanyId = userCompanyId._id;
                            }
                            return userCompanyId === company._id;
                        });
                        setRecruiters(companyRecruiters);
                    }
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setIsLoading(false);
            }
        };
        
        if (loginData) {
            fetchData();
        }
    }, [id, loginData]);

    const { register, handleSubmit } = useForm({
        defaultValues: {
            jobID: "",
            recruiterID: "",
            feedbackForm: [""]
        }
    });

    const onSubmit = async (data) => {
        if (!data.recruiterID) {
            toast.error("Please select a recruiter");
            return;
        }

        setIsSubmitting(true);
        try {
            const feedbackQuestions = (data.feedbackForm || []).filter(q => q && q.trim() !== '');
            
            const newData = {
                jobID: id,
                recruiterID: data.recruiterID,
                feedbackForm: feedbackQuestions
            };
            
            const recruiterRes = await fetch(`${process.env.REACT_APP_API_URL}/recruiter/post-recruiter`, {
                method: "POST",
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(newData)
            });
            const recruiterResult = await recruiterRes.json();
            
            if (recruiterResult.success || recruiterRes.ok) {
                await fetch(`${process.env.REACT_APP_API_URL}/users/update-user/${data.recruiterID}`, {
                    method: "PUT",
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ isAssigned: true })
                });
                
                toast.success("Recruiter assigned successfully!");
                navigate('/coordinator/review');
            } else {
                toast.error(recruiterResult.message || "Failed to assign recruiter");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while assigning recruiter");
        } finally {
            setIsSubmitting(false);
        }
    };

    const [questions, setQuestions] = useState([{ question: '', answer: '' }]);
    const [questionSize, setQuestionSize] = useState(0);
    
    const addQuestion = () => {
        setQuestionSize(questionSize + 1);
        setQuestions([...questions, { question: '', answer: '' }]);
    };
    
    const handleDeleteQuestion = (index) => {
        const newQuestions = questions.filter((_, qIndex) => qIndex !== index);
        setQuestions(newQuestions);
        setQuestionSize(questionSize - 1);
    };

    if (isLoading) {
        return (
            <div className='bg-neutral-50 dark:bg-slate-900 min-h-screen py-8'>
                <div className='container-custom'>
                    <div className='max-w-4xl mx-auto'>
                        <div className='card p-8'>
                            <div className='space-y-6'>
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className='h-16 bg-neutral-200 dark:bg-slate-700 rounded-xl animate-pulse' />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (recruiters.length === 0) {
        return (
            <div className='container-custom py-12'>
                <div className='card max-w-xl mx-auto'>
                    <div className='empty-state py-16'>
                        <div className='w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6'>
                            <svg className='w-10 h-10 text-amber-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                            </svg>
                        </div>
                        <h2 className='empty-state-title'>No Recruiters Available</h2>
                        <p className='empty-state-text'>
                            There are no available recruiters in your company to assign to this job.
                        </p>
                        <button 
                            onClick={() => navigate('/coordinator/review')}
                            className='btn-primary'
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-neutral-50 dark:bg-slate-900 min-h-screen py-8'>
            <div className='container-custom'>
                <div className='max-w-4xl mx-auto'>
                    {/* Header */}
                    <div className='flex items-center gap-4 mb-8'>
                        <Link 
                            to='/coordinator/review' 
                            className='p-2 hover:bg-neutral-200 rounded-xl transition-colors'
                        >
                            <svg className='w-6 h-6 text-neutral-600 dark:text-slate-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M10 19l-7-7m0 0l7-7m-7 7h18' />
                            </svg>
                        </Link>
                        <div>
                            <h1 className='text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white'>Assign Recruiter</h1>
                            <p className='text-neutral-600 dark:text-slate-400'>Assign a recruiter to review candidates for this job</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className='grid lg:grid-cols-2 gap-6'>
                            {/* Job Details */}
                            {job && (
                                <div className='card p-6'>
                                    <div className='flex items-center gap-3 mb-6'>
                                        <div className='w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center'>
                                            <svg className='w-5 h-5 text-accent-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                                            </svg>
                                        </div>
                                        <h2 className='text-lg font-semibold text-neutral-900 dark:text-white'>Job Details</h2>
                                    </div>

                                    <div className='space-y-4'>
                                        <div>
                                            <h3 className='text-xl font-bold text-neutral-900 dark:text-white'>{job.jobTitle}</h3>
                                            <p className='text-secondary-600 dark:text-secondary-400'>NextHire</p>
                                        </div>

                                        <div className='grid grid-cols-2 gap-3'>
                                            <div className='p-3 bg-secondary-50 dark:bg-secondary-900/40 rounded-xl text-center'>
                                                <p className='text-xs text-neutral-500 dark:text-slate-400'>Type</p>
                                                <p className='font-semibold text-neutral-800 dark:text-slate-200'>{job.employmentType}</p>
                                            </div>
                                            <div className='p-3 bg-accent-50 dark:bg-accent-900/40 rounded-xl text-center'>
                                                <p className='text-xs text-neutral-500 dark:text-slate-400'>Salary</p>
                                                <p className='font-semibold text-neutral-800 dark:text-slate-200'>{formatSalary(job)}</p>
                                            </div>
                                            <div className='p-3 bg-secondary-50 dark:bg-secondary-900/40 rounded-xl text-center'>
                                                <p className='text-xs text-neutral-500 dark:text-slate-400'>Location</p>
                                                <p className='font-semibold text-neutral-800 dark:text-slate-200'>{job.location}</p>
                                            </div>
                                            <div className='p-3 bg-accent-50 dark:bg-accent-900/40 rounded-xl text-center'>
                                                <p className='text-xs text-neutral-500 dark:text-slate-400'>Applicants</p>
                                                <p className='font-semibold text-neutral-800 dark:text-slate-200'>{job.applicants?.length || 0}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className='font-semibold text-neutral-800 dark:text-slate-200 mb-2'>Description</h4>
                                            <p className='text-sm text-neutral-600 dark:text-slate-400 line-clamp-4'>
                                                {job.description ? job.description.replace(/<[^>]*>?/gm, '') : ''}
                                            </p>
                                        </div>

                                        <div className='pt-4 border-t border-neutral-100 dark:border-slate-700'>
                                            <label className='label'>Select Recruiter *</label>
                                            <select {...register('recruiterID')} className='select'>
                                                <option value=''>Choose a recruiter...</option>
                                                {recruiters.map((recruiter) => (
                                                    <option key={recruiter._id} value={recruiter._id}>
                                                        {recruiter.userName} ({recruiter.userEmail})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Feedback Form */}
                            <div className='card p-6'>
                                <div className='flex items-center gap-3 mb-6'>
                                    <div className='w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center'>
                                        <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className='text-lg font-semibold text-neutral-900 dark:text-white'>Feedback Form</h2>
                                        <p className='text-sm text-neutral-500 dark:text-slate-400'>Yes/No questions for recruiter</p>
                                    </div>
                                </div>

                                <div className='space-y-4'>
                                    {questions.map((_, index) => (
                                        <div key={index} className='group'>
                                            <label className='label'>Question {index + 1}</label>
                                            <div className='flex items-center gap-2'>
                                                <input 
                                                    type='text' 
                                                    {...register(`feedbackForm.${index}`)} 
                                                    placeholder={placeholderQuestions[index] || 'Enter your question'} 
                                                    className='input flex-1'
                                                />
                                                {questions.length > 1 && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleDeleteQuestion(index)}
                                                        className='p-2.5 text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all'
                                                    >
                                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {questionSize < 4 && (
                                    <button 
                                        type="button"
                                        onClick={addQuestion} 
                                        className='w-full mt-4 p-3 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-600 dark:text-slate-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2'
                                    >
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4' />
                                        </svg>
                                        Add Question
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className='flex justify-center gap-4 mt-8'>
                            <Link to='/coordinator/review' className='btn-outline'>
                                Cancel
                            </Link>
                            <button 
                                type='submit' 
                                disabled={isSubmitting}
                                className='btn-secondary'
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className='animate-spin -ml-1 mr-2 h-5 w-5' fill='none' viewBox='0 0 24 24'>
                                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                                        </svg>
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7' />
                                        </svg>
                                        Approve & Assign
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
