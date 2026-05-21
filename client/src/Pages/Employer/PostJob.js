import React, { useState, useEffect, useContext, useRef } from 'react';
import { useForm } from "react-hook-form";
import { toast } from 'react-toastify';
import { LoginContext } from '../../components/ContextProvider/Context';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export const PostJob = () => {
    const { loginData } = useContext(LoginContext);
    const [company, setCompany] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');

    useEffect(() => {
        if (loginData && loginData._id) {
            fetchCompany();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginData]);

    const fetchCompany = async () => {
        try {
            const token = localStorage.getItem('usertoken');
            
            // Try my-company endpoint first
            let response = await fetch(`${process.env.REACT_APP_API_URL}/company/my-company`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            let result = await response.json();
            
            if (result.success && result.data) {
                setCompany(result.data);
                return;
            }
            
            // Fallback: try by-employer endpoint
            response = await fetch(`${process.env.REACT_APP_API_URL}/company/by-employer/${loginData._id}`);
            result = await response.json();
            
            if (result.success && result.data) {
                setCompany(result.data);
            } else if (result._id) {
                setCompany(result);
            }
        } catch (error) {
            console.error('Error fetching company:', error);
        }
    };

    const [jobId, setJobId] = useState(null);
    const [isPreview, setIsPreview] = useState(false);
    const saveTimeout = useRef(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        getValues,
        reset,
        formState: { errors }
    } = useForm({
        defaultValues:{
            jobTitle: "",
            employmentType: "",
            location: "",
            salaryMin: "",
            salaryMax: "",
            currency: "INR",
            experience: "",
            openings: 1,
            description: "",
            skills: "",
            applicationDeadline: "",
            requirements: ""
        }
    });

    const descriptionContent = watch('description');

    const saveToBackend = async (data, isPublished, showToast = true) => {
        if (!company) {
            if (showToast) toast.error("Please create a company profile first");
            return false;
        }
        
        const jobData = {
            ...data,
            skills: typeof data.skills === 'string' ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : data.skills,
            companyId: company._id,
            employerId: loginData._id,
            advancedQuestions: advancedQuestions,
            status: isPublished ? 'published' : 'draft',
            jobId: jobId
        };
        
        try {
            const url = jobId ? `${process.env.REACT_APP_API_URL}/jobs/update-job/${jobId}` : `${process.env.REACT_APP_API_URL}/jobs/post-job`;
            const method = jobId ? "PUT" : "POST";
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });

            const result = await response.json();

            if (response.ok || result.success) {
                if (!jobId && result.data && result.data._id) {
                    setJobId(result.data._id);
                }
                
                if (showToast) {
                    toast.success(isPublished ? "Job Posted Successfully" : "Draft Saved Successfully");
                }
                
                if (isPublished) {
                    navigate('/all-jobs');
                }
                return true;
            } else {
                if (showToast) toast.error(result.error || "Failed to save job");
                return false;
            }
        } catch (error) {
            console.error('Post job error:', error);
            if (showToast) toast.error("Failed to save job");
            return false;
        }
    };

    const onSubmit = async (data) => { 
        if (!data.description || data.description.trim() === '<p><br></p>') {
            toast.error("Job Description is required");
            return;
        }
        if (parseFloat(data.salaryMin) >= parseFloat(data.salaryMax)) {
            toast.error("Maximum salary must be greater than minimum salary");
            return;
        }
        await saveToBackend(data, true);
    }

    const handleSaveDraft = async (showToast = true) => {
        const data = getValues();
        await saveToBackend(data, false, showToast);
    };

    // ADVANCED SCREENING QUESTIONS
    const [advancedQuestions, setAdvancedQuestions] = useState([
        { questionType: 'yes_no', question: '', options: ['', ''] }
    ]);

    // Load Draft Data if editId is provided
    useEffect(() => {
        if (editId) {
            fetch(`${process.env.REACT_APP_API_URL}/jobs/current-job/${editId}`)
                .then((res) => res.json())
                .then((result) => {
                    setJobId(result._id);
                    reset({
                        jobTitle: result.jobTitle || "",
                        employmentType: result.employmentType || "",
                        location: result.location || "",
                        salaryMin: result.salaryMin || "",
                        salaryMax: result.salaryMax || "",
                        currency: result.currency || "INR",
                        experience: result.experience || "",
                        openings: result.openings || 1,
                        description: result.description || "",
                        skills: result.skills ? result.skills.join(', ') : "",
                        applicationDeadline: result.applicationDeadline ? new Date(result.applicationDeadline).toISOString().split('T')[0] : "",
                        requirements: result.requirements || ""
                    });
                    if (result.advancedQuestions && result.advancedQuestions.length > 0) {
                        setAdvancedQuestions(result.advancedQuestions);
                    }
                })
                .catch((error) => console.log(error));
        }
    }, [editId, reset]);

    // Autosave
    const formValues = watch();
    useEffect(() => {
        if (!company) return;

        if (saveTimeout.current) {
            clearTimeout(saveTimeout.current);
        }

        if (formValues.jobTitle && formValues.jobTitle.trim().length > 0) {
            saveTimeout.current = setTimeout(() => {
                handleSaveDraft(false);
            }, 3000);
        }

        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formValues, advancedQuestions, company]);

    const quickTemplates = [
        { label: 'Relocation', type: 'yes_no', question: 'Are you willing to relocate for this role?' },
        { label: 'Notice Period', type: 'mcq', question: 'What is your current notice period?', options: ['Immediate', '15 Days', '1 Month', '2 Months+'] },
        { label: 'Work Authorization', type: 'yes_no', question: 'Are you legally authorized to work in the country where this job is located?' },
        { label: 'Experience Match', type: 'yes_no', question: 'Do you have the minimum years of experience required for this role?' }
    ];

    const handleAddTemplate = (template) => {
        if (advancedQuestions.length < 10) {
            const newQuestions = [...advancedQuestions];
            // if first question is empty, replace it
            if (newQuestions.length === 1 && newQuestions[0].question === '') {
                newQuestions[0] = { questionType: template.type, question: template.question, options: template.options || ['', ''] };
            } else {
                newQuestions.push({ questionType: template.type, question: template.question, options: template.options || ['', ''] });
            }
            setAdvancedQuestions(newQuestions);
        } else {
            toast.warning("Maximum 10 questions allowed");
        }
    };

    const handleAddQuestion = () => {
        if (advancedQuestions.length < 10) {
            setAdvancedQuestions([...advancedQuestions, { questionType: 'yes_no', question: '', options: ['', ''] }]);
        }
    };

    const handleDeleteQuestion = (index) => {
        if (advancedQuestions.length > 1) {
            const newQuestions = advancedQuestions.filter((_, qIndex) => qIndex !== index);
            setAdvancedQuestions(newQuestions);
        }
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...advancedQuestions];
        newQuestions[index][field] = value;
        
        // Reset options if type changes
        if (field === 'questionType' && value === 'yes_no') {
            newQuestions[index].options = [];
        } else if (field === 'questionType' && (value === 'mcq' || value === 'msq')) {
            if (!newQuestions[index].options || newQuestions[index].options.length < 2) {
                newQuestions[index].options = ['', ''];
            }
        }
        
        setAdvancedQuestions(newQuestions);
    };

    const handleAddOption = (qIndex) => {
        const newQuestions = [...advancedQuestions];
        if (newQuestions[qIndex].options.length < 4) {
            newQuestions[qIndex].options.push('');
            setAdvancedQuestions(newQuestions);
        }
    };

    const handleDeleteOption = (qIndex, oIndex) => {
        const newQuestions = [...advancedQuestions];
        if (newQuestions[qIndex].options.length > 2) {
            newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
            setAdvancedQuestions(newQuestions);
        }
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...advancedQuestions];
        newQuestions[qIndex].options[oIndex] = value;
        setAdvancedQuestions(newQuestions);
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-slate-900 dark:to-slate-800 py-8 md:py-12">
            <div className="container-custom">
                {/* Page Header */}
                <div className="page-header text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                        Create Job Posting
                    </h1>
                    <p className="text-neutral-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Fill in the details below to post a new job opening and find the perfect candidate
                    </p>
                </div>

                {/* Company Alert */}
                {!company && (
                    <div className="alert-warning mb-6 max-w-4xl mx-auto">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>Please create a company profile first before posting a job.</span>
                    </div>
                )}

                {/* Main Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                        
                        {/* Job Details Section */}
                        <div className="form-section">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100 dark:border-slate-700">
                                <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Job Details</h2>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Basic information about the position</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="form-group">
                                    <label className="label">
                                        Job Title <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        {...register("jobTitle")} 
                                        placeholder="e.g., Full Stack Developer" 
                                        className="input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">
                                        Employment Type <span className="text-red-500">*</span>
                                    </label>
                                    <select {...register("employmentType")} required className="select">
                                        <option value="">Select employment type</option>
                                        <option value="Full Time">Full Time</option>
                                        <option value="Part Time">Part Time</option>
                                        <option value="Internship">Internship</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Freelance">Freelance</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="label">
                                        Location <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        {...register("location")} 
                                        placeholder="e.g., Hyderabad" 
                                        className="input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">
                                        Salary Details <span className="text-neutral-400 text-xs font-normal">(Annual)</span> <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                        <select {...register("currency")} required className="select">
                                            <option value="INR">₹ INR</option>
                                            <option value="USD">$ USD</option>
                                            <option value="EUR">€ EUR</option>
                                            <option value="GBP">£ GBP</option>
                                        </select>
                                        <input 
                                            type="number" 
                                            min="0"
                                            step="any"
                                            required 
                                            {...register("salaryMin")} 
                                            placeholder="Min" 
                                            className="input"
                                        />
                                        <input 
                                            type="number" 
                                            min="0"
                                            step="any"
                                            required 
                                            {...register("salaryMax")} 
                                            placeholder="Max" 
                                            className="input"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="label">
                                            Experience Level <span className="text-red-500">*</span>
                                        </label>
                                        <select {...register("experience")} required className="select">
                                            <option value="">Select experience</option>
                                            <option value="Fresher">Fresher</option>
                                            <option value="1-2 years">1–2 years</option>
                                            <option value="3-5 years">3–5 years</option>
                                            <option value="5+ years">5+ years</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">
                                            Number of Openings
                                        </label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            {...register("openings")} 
                                            onKeyDown={(e) => {
                                                if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === '.') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            className="input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="label">
                                        Application Deadline <span className="text-neutral-400 text-xs font-normal">(Optional)</span>
                                    </label>
                                    <input 
                                        type="date" 
                                        {...register("applicationDeadline")} 
                                        min={new Date().toISOString().split('T')[0]}
                                        className="input"
                                    />
                                    <p className="text-xs text-neutral-400 mt-1.5">
                                        After this date, candidates can no longer apply
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label className="label">
                                        Job Description <span className="text-red-500">*</span>
                                    </label>
                                    <div className="rounded-xl overflow-hidden shadow-sm">
                                        <ReactQuill 
                                            theme="snow" 
                                            value={descriptionContent} 
                                            onChange={(val) => setValue('description', val, { shouldValidate: true })}
                                            className="custom-quill"
                                            placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                                        />
                                    </div>
                                    {errors.description && <span className="text-xs text-red-500 mt-1">Description is required</span>}
                                </div>

                                <div className="form-group">
                                    <label className="label">
                                        Required Skills <span className="text-neutral-400 text-xs font-normal">(Comma separated)</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        {...register("skills")} 
                                        placeholder="e.g., React, Node.js, MongoDB" 
                                        className="input"
                                    />
                                    <p className="text-xs text-neutral-400 mt-1.5">
                                        List the core skills required for this role
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Candidate Form Section */}
                        <div className="form-section">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100 dark:border-slate-700">
                                <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Screening Questions</h2>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Add Yes/No questions for candidates</p>
                                </div>
                            </div>

                            {/* Info Banner */}
                            <div className="bg-accent-50 border border-accent-100 rounded-xl p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm text-accent-700">
                                        These questions help filter candidates during the application process. Candidates will answer with Yes or No.
                                    </p>
                                </div>
                            </div>

                            {/* Quick Add Templates */}
                            <div className="mb-6">
                                <p className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Quick Add Templates</p>
                                <div className="flex flex-wrap gap-2">
                                    {quickTemplates.map((template, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAddTemplate(template)}
                                            className="px-3 py-1.5 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300"
                                        >
                                            + {template.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Advanced Questions */}
                            <div className="space-y-6">
                                {advancedQuestions.map((q, index) => (
                                    <div key={index} className="group border border-neutral-200 dark:border-slate-700 rounded-xl p-4 relative bg-white dark:bg-slate-800 shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </span>
                                                <select 
                                                    value={q.questionType}
                                                    onChange={(e) => handleQuestionChange(index, 'questionType', e.target.value)}
                                                    className="select py-1.5 px-3 min-w-[140px] text-sm"
                                                >
                                                    <option value="yes_no">Yes / No</option>
                                                    <option value="mcq">Multiple Choice (Single)</option>
                                                    <option value="msq">Multiple Select (Many)</option>
                                                </select>
                                            </div>
                                            {advancedQuestions.length > 1 && (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDeleteQuestion(index)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all self-end sm:self-auto"
                                                    title="Remove question"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <input 
                                                type="text" 
                                                value={q.question}
                                                onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                                                required
                                                placeholder={q.questionType === 'yes_no' ? "e.g., Are you willing to relocate?" : "e.g., Which of these frameworks are you proficient in?"} 
                                                className="input"
                                            />

                                            {/* Options for MCQ/MSQ */}
                                            {(q.questionType === 'mcq' || q.questionType === 'msq') && (
                                                <div className="pl-4 border-l-2 border-neutral-200 dark:border-slate-700 space-y-3 mt-4">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Options (Max 4)</label>
                                                    {q.options.map((opt, oIndex) => (
                                                        <div key={oIndex} className="flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded-full border-2 border-neutral-300 flex-shrink-0"></div>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={opt}
                                                                onChange={(e) => handleOptionChange(index, oIndex, e.target.value)}
                                                                placeholder={`Option ${oIndex + 1}`}
                                                                className="input py-1.5"
                                                            />
                                                            {q.options.length > 2 && (
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleDeleteOption(index, oIndex)}
                                                                    className="text-red-400 hover:text-red-600 p-1"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    
                                                    {q.options.length < 4 && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleAddOption(index)}
                                                            className="text-sm font-medium text-secondary-600 hover:text-secondary-700 flex items-center gap-1 mt-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                            Add Option
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Question Button */}
                            {advancedQuestions.length < 10 && (
                                <button 
                                    type="button"
                                    onClick={handleAddQuestion} 
                                    className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-600 dark:text-slate-400 hover:border-secondary-400 hover:text-secondary-600 hover:bg-secondary-50 transition-all duration-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Another Question
                                </button>
                            )}

                            {advancedQuestions.length >= 10 && (
                                <p className="text-sm text-neutral-500 dark:text-slate-400 text-center mt-4">
                                    Maximum 10 questions allowed
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Submit Section */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button 
                            type="button"
                            onClick={() => navigate('/employer/dashboard')}
                            className="btn-outline w-full sm:w-auto px-6 py-3"
                        >
                            Cancel
                        </button>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <button 
                                type="button"
                                onClick={() => handleSaveDraft(true)}
                                className="px-6 py-3 border border-neutral-300 dark:border-slate-600 text-neutral-700 dark:text-slate-300 rounded-xl hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm w-full sm:w-auto"
                            >
                                Save Draft
                            </button>
                            <button 
                                type="button"
                                onClick={() => setIsPreview(true)}
                                className="px-6 py-3 bg-neutral-800 dark:bg-slate-700 text-white rounded-xl hover:bg-neutral-900 dark:hover:bg-slate-600 transition-colors font-medium text-sm w-full sm:w-auto flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Preview
                            </button>
                            <button 
                                type="submit"
                                className="btn-secondary w-full sm:w-auto px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Publish Job Post
                            </button>
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="flex items-center justify-center gap-2 mt-6 text-sm text-neutral-500 dark:text-slate-400">
                        {jobId ? (
                            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Draft autosaved
                            </span>
                        ) : (
                            <span>Autosaves securely to your drafts</span>
                        )}
                        <span>•</span>
                        <span>Visible to candidates only once published</span>
                    </div>
                </form>
                
                {/* Preview Modal */}
                {isPreview && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setIsPreview(false)}></div>
                        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                            
                            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Job Post Preview</h3>
                                </div>
                                <button type="button" onClick={() => setIsPreview(false)} className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 rounded-full hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors shadow-sm">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            
                            <div className="p-6 md:p-8 overflow-y-auto">
                                <div className="max-w-3xl mx-auto space-y-8">
                                    {/* Header */}
                                    <div>
                                        {company && (
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 pb-6 border-b border-neutral-100 dark:border-slate-800">
                                                <img 
                                                    src={company.companyLogo || "https://cdn-icons-png.flaticon.com/512/1000/1000282.png"} 
                                                    alt={company.companyName} 
                                                    className="w-16 h-16 rounded-xl object-cover border border-neutral-200 dark:border-slate-700 shadow-sm bg-white"
                                                />
                                                <div>
                                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                                                        {company.companyName}
                                                    </h2>
                                                    {company.contactEmail && (
                                                        <a href={`mailto:${company.contactEmail}`} className="text-sm text-secondary-600 dark:text-secondary-400 hover:underline flex items-center gap-1.5 mt-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                            Support: {company.contactEmail}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-4">{formValues.jobTitle || 'Job Title'}</h1>
                                        <div className="flex flex-wrap gap-2 sm:gap-4 text-sm">
                                            <span className="flex items-center gap-1.5 text-neutral-600 dark:text-slate-400 bg-neutral-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg font-medium">
                                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                {formValues.employmentType || 'Employment Type'}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-neutral-600 dark:text-slate-400 bg-neutral-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg font-medium">
                                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {formValues.currency} {formValues.salaryMin || '0'} - {formValues.salaryMax || '0'} {formValues.currency === 'INR' ? 'LPA' : 'Annual'}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-neutral-600 dark:text-slate-400 bg-neutral-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg font-medium">
                                                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {formValues.location || 'Location'}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-neutral-600 dark:text-slate-400 bg-neutral-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg font-medium">
                                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                {formValues.experience || 'Experience'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-slate-300 rich-text-content">
                                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">About the Role</h3>
                                        <div dangerouslySetInnerHTML={{ __html: descriptionContent || '<p>No description provided yet.</p>' }} />
                                    </div>

                                    {/* Skills */}
                                    {formValues.skills && (
                                        <div>
                                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Required Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {formValues.skills.split(',').map((skill, index) => (
                                                    <span key={index} className="px-3 py-1.5 bg-secondary-50 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400 text-sm font-medium rounded-lg border border-secondary-100 dark:border-secondary-800/50">
                                                        {skill.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Screening Questions Preview */}
                                    {advancedQuestions.length > 0 && advancedQuestions[0].question && (
                                        <div>
                                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Application Questions</h3>
                                            <div className="space-y-4">
                                                {advancedQuestions.map((q, idx) => q.question && (
                                                    <div key={idx} className="bg-neutral-50 dark:bg-slate-800/50 p-4 rounded-xl border border-neutral-100 dark:border-slate-700">
                                                        <p className="font-medium text-neutral-800 dark:text-slate-200 mb-2">{idx + 1}. {q.question}</p>
                                                        {q.questionType === 'yes_no' ? (
                                                            <div className="flex gap-4">
                                                                <span className="flex items-center gap-2 text-sm text-neutral-500"><div className="w-4 h-4 rounded-full border border-neutral-300"></div> Yes</span>
                                                                <span className="flex items-center gap-2 text-sm text-neutral-500"><div className="w-4 h-4 rounded-full border border-neutral-300"></div> No</span>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {q.options.map((opt, oIdx) => opt && (
                                                                    <div key={oIdx} className="flex items-center gap-2 text-sm text-neutral-500">
                                                                        <div className={`w-4 h-4 ${q.questionType === 'mcq' ? 'rounded-full' : 'rounded'} border border-neutral-300`}></div> {opt}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-4 border-t border-neutral-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsPreview(false)} className="btn-outline px-6">Close Preview</button>
                                <button type="button" onClick={() => {
                                    setIsPreview(false);
                                    handleSubmit(onSubmit)();
                                }} className="btn-secondary px-6">Publish Now</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
