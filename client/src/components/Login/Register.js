import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import logoURL from '../../assets/img/logo.jpeg';
import { Country, State, City } from "country-state-city";

export const Register = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // OTP Flow states
    const [step, setStep] = useState(1);
    const [registrationData, setRegistrationData] = useState(null);
    const [otpValue, setOtpValue] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue
    } = useForm({
        defaultValues: {
            // common required
            userEmail: "",
            userPassword: "",
            confirmPassword: "",
            role: "candidate",
            country: "",
            state: "",
            city: "",
            zipCode: "",
            
            // common optional
            profilePhoto: "",
            bannerPhoto: "",
            bio: "",

            // Person required
            firstName: "",
            lastName: "",
            gender: "",

            // Person optional
            middleName: "",
            phone: "",
            skills: "",

            // Employer required
            companyName: "",
            shortName: "",
            companyIndustry: "Technology",

            // Employer optional
            contactMail: "",
            contactPhone: "",
            companyWebsite: "",

            isAssigned: false,
            applications: []
        }
    });

    const password = watch("userPassword");
    const selectedRole = watch("role");
    const watchCountry = watch("country");
    const watchState = watch("state");

    const countries = Country.getAllCountries();
    const states = watchCountry ? State.getStatesOfCountry(watchCountry) : [];
    const cities = watchState ? City.getCitiesOfState(watchCountry, watchState) : [];

    const onSubmitDetails = async (data) => {
        const { confirmPassword, ...userData } = data;
        
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/send-register-otp`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: userData.userEmail.toLowerCase().trim()
                })
            });

            const result = await response.json();

            if (result.success) {
                // If skills is comma separated string, split it
                if (typeof userData.skills === 'string' && userData.skills.trim() !== '') {
                    userData.skills = userData.skills.split(',').map(s => s.trim());
                } else if (!userData.skills) {
                    userData.skills = [];
                }

                setRegistrationData({
                    ...userData,
                    userEmail: userData.userEmail.toLowerCase().trim()
                });
                setStep(2);
                toast.success("OTP sent to your email!");
            } else {
                toast.error(result.error || "Failed to send OTP");
            }
        } catch (err) {
            console.error('OTP request error:', err);
            toast.error("Unable to connect to server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpVerify = async (e) => {
        e.preventDefault();
        if (!otpValue || otpValue.length < 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            for (const key in registrationData) {
                if (key === 'profilePhoto' || key === 'bannerPhoto') {
                    const fileList = registrationData[key];
                    if (fileList && fileList.length > 0) {
                        formData.append(key, fileList[0]);
                    }
                } else if (Array.isArray(registrationData[key])) {
                    registrationData[key].forEach(val => formData.append(key, val));
                } else {
                    formData.append(key, registrationData[key]);
                }
            }
            formData.append('otp', otpValue);

            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Account created successfully!");
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                toast.error(result.error || "Registration failed");
            }
        } catch (err) {
            console.error('Registration error:', err);
            toast.error("Unable to connect to server");
        } finally {
            setIsLoading(false);
        }
    };

    const industries = ["Technology", "Healthcare", "Finance", "Education", "Manufacturing", "Retail", "Real Estate", "Consulting", "Media & Entertainment", "Transportation", "Other"];

    return (
        <div className='py-12 px-4 min-h-[80vh] flex flex-col justify-center'>
            <div className='max-w-4xl mx-auto w-full'>
                <div className='text-center mb-8'>
                    <Link to='/' className='inline-flex items-center gap-3 mb-6 text-left hover:opacity-80 transition-opacity'>
                        <div className='relative'>
                            <img src={logoURL} alt="NextHire" className='relative w-12 h-12 rounded-xl object-cover ring-2 ring-neutral-100 dark:ring-slate-700 shadow-sm' />
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className='font-extrabold text-3xl tracking-tight text-primary dark:text-white leading-none'>
                                Next<span className='text-secondary'>Hire</span>
                            </span>
                            <span className='text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1'>
                                Career Portal
                            </span>
                        </div>
                    </Link>
                    <h1 className='text-2xl font-bold text-neutral-900 dark:text-white mb-2'>
                        {step === 1 ? 'Create your account' : 'Verify your Email'}
                    </h1>
                    <p className='text-neutral-600 dark:text-slate-400'>
                        {step === 1 ? 'Join thousands of professionals and companies' : 'Enter the OTP sent to your email address'}
                    </p>
                </div>

                <div className='form-section bg-white/80 dark:bg-slate-800/80 border-white/80 dark:border-slate-700/50'>
                    {step === 1 ? (
                        <form onSubmit={handleSubmit(onSubmitDetails)}>
                            
                            {/* Account Type & Role Selection */}
                            <div className='mb-8 border-b pb-6 dark:border-slate-700'>
                                <h3 className='form-section-title mb-4'>What brings you to NextHire?</h3>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                                    {/* User / Individual Account Type */}
                                    <div 
                                        onClick={() => {
                                            setValue("role", "candidate");
                                        }}
                                        className={`cursor-pointer rounded-2xl border-2 p-5 flex items-center gap-4 transition-all duration-300 ease-in-out shadow-sm hover:-translate-y-0.5 hover:shadow-md ${selectedRole !== 'employer' ? 'border-secondary bg-secondary/10 ring-2 ring-secondary/20' : 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-secondary/50'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm transition-colors ${selectedRole !== 'employer' ? 'bg-secondary text-white' : 'bg-neutral-100 dark:bg-slate-700'}`}>
                                            👤
                                        </div>
                                        <div>
                                            <h4 className='font-bold text-lg text-neutral-800 dark:text-slate-200'>User / Individual</h4>
                                            <p className='text-xs text-neutral-500 dark:text-slate-400 mt-0.5'>Register as a Job Seeker, Recruiter, or Coordinator</p>
                                        </div>
                                    </div>

                                    {/* Employer / Company Account Type */}
                                    <div 
                                        onClick={() => {
                                            setValue("role", "employer");
                                        }}
                                        className={`cursor-pointer rounded-2xl border-2 p-5 flex items-center gap-4 transition-all duration-300 ease-in-out shadow-sm hover:-translate-y-0.5 hover:shadow-md ${selectedRole === 'employer' ? 'border-secondary bg-secondary/10 ring-2 ring-secondary/20' : 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-secondary/50'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm transition-colors ${selectedRole === 'employer' ? 'bg-secondary text-white' : 'bg-neutral-100 dark:bg-slate-700'}`}>
                                            🏢
                                        </div>
                                        <div>
                                            <h4 className='font-bold text-lg text-neutral-800 dark:text-slate-200'>Employer / Company</h4>
                                            <p className='text-xs text-neutral-500 dark:text-slate-400 mt-0.5'>Register your company to hire top talent</p>
                                        </div>
                                    </div>
                                </div>

                                {/* User Specific Sub-Role Selection */}
                                {selectedRole !== 'employer' && (
                                    <div className='mt-4 p-5 rounded-2xl bg-neutral-50/50 dark:bg-slate-900/40 border border-neutral-100 dark:border-slate-800/80 transition-all duration-300'>
                                        <h4 className='text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5'>
                                            <span>🎯</span> Choose your specific role <span className='text-red-500'>*</span>
                                        </h4>
                                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                                            {[
                                                { id: 'candidate', label: 'Candidate', description: 'Job Seeker', icon: '🎯' },
                                                { id: 'recruiter', label: 'Recruiter', description: 'Hiring Professional', icon: '👥' },
                                                { id: 'coordinator', label: 'Coordinator', description: 'HR Admin', icon: '📋' }
                                            ].map((role) => (
                                                <label 
                                                    key={role.id} 
                                                    className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col gap-1 transition-all duration-300 hover:-translate-y-0.5 ${selectedRole === role.id ? 'border-secondary bg-secondary/10' : 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-secondary/50'}`}
                                                >
                                                    <input type="radio" value={role.id} {...register("role")} className="hidden" />
                                                    <div className='flex items-center gap-2'>
                                                        <span className='text-xl'>{role.icon}</span>
                                                        <span className='font-bold text-sm text-neutral-800 dark:text-slate-200'>{role.label}</span>
                                                    </div>
                                                    <span className='text-[11px] text-neutral-500 dark:text-slate-400 mt-1 leading-tight'>{role.description}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className='grid lg:grid-cols-2 gap-8'>
                                
                                {/* Left Column */}
                                <div className='space-y-4'>
                                    {selectedRole === 'employer' ? (
                                        <>
                                            <div className='form-group'>
                                                <label className='label'>Company Registered Name (Inc, Pvt) *</label>
                                                <input type='text' {...register("companyName", { required: "Company Name is required", minLength: { value: 2, message: "Min 2 characters" }, maxLength: { value: 100, message: "Max 100 characters" } })} className={`input ${errors.companyName ? 'input-error' : ''}`} disabled={isLoading} />
                                                {errors.companyName && <p className='text-red-500 text-sm mt-1'>{errors.companyName.message}</p>}
                                            </div>
                                            <div className='form-group'>
                                                <label className='label'>Short Name (No Inc, Pvt) *</label>
                                                <input type='text' {...register("shortName", { required: "Short Name is required", minLength: { value: 2, message: "Min 2 characters" }, maxLength: { value: 50, message: "Max 50 characters" } })} className={`input ${errors.shortName ? 'input-error' : ''}`} disabled={isLoading} />
                                                {errors.shortName && <p className='text-red-500 text-sm mt-1'>{errors.shortName.message}</p>}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className='grid grid-cols-2 gap-4'>
                                                <div className='form-group'>
                                                    <label className='label'>First Name *</label>
                                                    <input type='text' {...register("firstName", { required: "First Name is required", minLength: { value: 2, message: "Min 2 characters" }, maxLength: { value: 50, message: "Max 50 characters" } })} className={`input ${errors.firstName ? 'input-error' : ''}`} disabled={isLoading} />
                                                    {errors.firstName && <p className='text-red-500 text-sm mt-1'>{errors.firstName.message}</p>}
                                                </div>
                                                <div className='form-group'>
                                                    <label className='label'>Middle Name</label>
                                                    <input type='text' {...register("middleName", { maxLength: { value: 50, message: "Max 50 characters" } })} className={`input ${errors.middleName ? 'input-error' : ''}`} disabled={isLoading} />
                                                    {errors.middleName && <p className='text-red-500 text-sm mt-1'>{errors.middleName.message}</p>}
                                                </div>
                                            </div>
                                            <div className='form-group'>
                                                <label className='label'>Last Name *</label>
                                                <input type='text' {...register("lastName", { required: "Last Name is required", minLength: { value: 2, message: "Min 2 characters" }, maxLength: { value: 50, message: "Max 50 characters" } })} className={`input ${errors.lastName ? 'input-error' : ''}`} disabled={isLoading} />
                                                {errors.lastName && <p className='text-red-500 text-sm mt-1'>{errors.lastName.message}</p>}
                                            </div>
                                        </>
                                    )}

                                    <div className='form-group'>
                                        <label className='label'>{selectedRole === 'employer' ? 'Company Personal Email *' : 'Email Address *'}</label>
                                        <input type='email' {...register("userEmail", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email format" }})} className={`input ${errors.userEmail ? 'input-error' : ''}`} disabled={isLoading} />
                                        {errors.userEmail && <p className='text-red-500 text-sm mt-1'>{errors.userEmail.message}</p>}
                                    </div>

                                    <div className='form-group'>
                                        <label className='label'>Password *</label>
                                        <div className='relative'>
                                            <input type={showPassword ? 'text' : 'password'} {...register("userPassword", { required: "Password is required", minLength: { value: 6, message: "Min. 6 characters" }})} className={`input pr-12 ${errors.userPassword ? 'input-error' : ''}`} disabled={isLoading} />
                                            <button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600'>
                                                {showPassword ? "Hide" : "Show"}
                                            </button>
                                        </div>
                                        {errors.userPassword && <p className='text-red-500 text-sm mt-1'>{errors.userPassword.message}</p>}
                                    </div>

                                    <div className='form-group'>
                                        <label className='label'>Confirm Password *</label>
                                        <input type='password' {...register("confirmPassword", { required: "Confirm your password", validate: value => value === password || "Passwords do not match" })} className={`input ${errors.confirmPassword ? 'input-error' : ''}`} disabled={isLoading} />
                                        {errors.confirmPassword && <p className='text-red-500 text-sm mt-1'>{errors.confirmPassword.message}</p>}
                                    </div>

                                    {selectedRole === 'employer' ? (
                                        <div className='form-group'>
                                            <label className='label'>Platform Industry *</label>
                                            <select {...register("companyIndustry", { required: "Industry is required" })} className={`select ${errors.companyIndustry ? 'input-error' : ''}`} disabled={isLoading}>
                                                <option value="">Select an Industry</option>
                                                {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                                            </select>
                                            {errors.companyIndustry && <p className='text-red-500 text-sm mt-1'>{errors.companyIndustry.message}</p>}
                                        </div>
                                    ) : (
                                        <div className='form-group'>
                                            <label className='label'>Gender *</label>
                                            <div className='flex gap-4 mt-1'>
                                                {['Male', 'Female', 'Other'].map((g) => (
                                                    <label key={g} className='flex items-center gap-2 cursor-pointer'>
                                                        <input {...register("gender", { required: "Gender is required" })} type="radio" value={g} className='w-4 h-4 text-secondary' disabled={isLoading} />
                                                        <span className='text-neutral-700 dark:text-slate-200'>{g}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {errors.gender && <p className='text-red-500 text-sm mt-1'>{errors.gender.message}</p>}
                                        </div>
                                    )}
                                </div>

                                {/* Right Column Location & Media */}
                                <div className='space-y-4'>
                                    {/* Location cascade */}
                                    <div className='form-group'>
                                        <label className='label'>Country *</label>
                                        <select {...register("country", { required: "Country is required" })} className={`select ${errors.country ? 'input-error' : ''}`} disabled={isLoading}>
                                            <option value="">Select Country</option>
                                            {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                                        </select>
                                        {errors.country && <p className='text-red-500 text-sm mt-1'>{errors.country.message}</p>}
                                    </div>

                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='form-group'>
                                            <label className='label'>State *</label>
                                            <select {...register("state", { required: "State is required" })} className={`select ${errors.state ? 'input-error' : ''}`} disabled={isLoading || !watchCountry}>
                                                <option value="">Select State</option>
                                                {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                                            </select>
                                            {errors.state && <p className='text-red-500 text-sm mt-1'>{errors.state.message}</p>}
                                        </div>
                                        <div className='form-group'>
                                            <label className='label'>City *</label>
                                            <select {...register("city", { required: "City is required" })} className={`select ${errors.city ? 'input-error' : ''}`} disabled={isLoading || !watchState}>
                                                <option value="">Select City</option>
                                                {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                            </select>
                                            {errors.city && <p className='text-red-500 text-sm mt-1'>{errors.city.message}</p>}
                                        </div>
                                    </div>
                                    
                                    <div className='form-group'>
                                        <label className='label'>PIN / ZIP Code *</label>
                                        <input type='text' {...register("zipCode", { required: "PIN/ZIP is required", pattern: { value: /^[A-Za-z0-9\s-]{3,10}$/, message: "Invalid PIN/ZIP format" } })} placeholder='123456' className={`input ${errors.zipCode ? 'input-error' : ''}`} disabled={isLoading} />
                                        {errors.zipCode && <p className='text-red-500 text-sm mt-1'>{errors.zipCode.message}</p>}
                                    </div>

                                    <div className='form-group'>
                                        <label className='label'>{selectedRole === 'employer' ? 'Company Logo *' : 'Profile Photo'}</label>
                                        <input type='file' accept='image/*' {...register("profilePhoto", { required: selectedRole === 'employer' ? "Logo is required" : false })} className={`input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 bg-transparent ${errors.profilePhoto ? 'input-error' : ''}`} disabled={isLoading} />
                                        {errors.profilePhoto && <p className='text-red-500 text-sm mt-1'>{errors.profilePhoto.message}</p>}
                                    </div>

                                    {/* Optionals can be hidden behind advanced toggle or shown simply */}
                                    <h4 className='text-sm font-semibold text-neutral-800 dark:text-white pt-4'>Optional Info</h4>
                                    
                                    <div className='form-group'>
                                        <label className='label'>Banner Photo</label>
                                        <input type='file' accept='image/*' {...register("bannerPhoto")} className='input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 bg-transparent' disabled={isLoading} />
                                    </div>

                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='form-group'>
                                            <label className='label'>{selectedRole === 'employer' ? 'Contact Phone' : 'Phone Number'}</label>
                                            <input 
                                                type='text' 
                                                {...register(selectedRole === 'employer' ? "contactPhone" : "phone", {
                                                    pattern: {
                                                        value: /^[0-9]{10}$/,
                                                        message: "Must be exactly 10 digits"
                                                    },
                                                    onChange: (e) => {
                                                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                                                    }
                                                })} 
                                                maxLength="10"
                                                className={`input ${errors[selectedRole === 'employer' ? "contactPhone" : "phone"] ? 'input-error' : ''}`} 
                                                disabled={isLoading} 
                                            />
                                            {errors[selectedRole === 'employer' ? "contactPhone" : "phone"] && (
                                                <p className='text-red-500 text-sm mt-1'>
                                                    {errors[selectedRole === 'employer' ? "contactPhone" : "phone"].message}
                                                </p>
                                            )}
                                        </div>
                                        {selectedRole === 'employer' && (
                                            <div className='form-group'>
                                                <label className='label'>Public Contact Mail</label>
                                                <input type='email' {...register("contactMail", { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email format" } })} className={`input ${errors.contactMail ? 'input-error' : ''}`} disabled={isLoading} />
                                                {errors.contactMail && <p className='text-red-500 text-sm mt-1'>{errors.contactMail.message}</p>}
                                            </div>
                                        )}
                                    </div>

                                    {selectedRole === 'employer' ? (
                                        <div className='form-group'>
                                            <label className='label'>Company Website</label>
                                            <input type='url' {...register("companyWebsite", { pattern: { value: /^https?:\/\/.+/, message: "Must start with http:// or https://" } })} className={`input ${errors.companyWebsite ? 'input-error' : ''}`} disabled={isLoading} />
                                            {errors.companyWebsite && <p className='text-red-500 text-sm mt-1'>{errors.companyWebsite.message}</p>}
                                        </div>
                                    ) : (
                                        <div className='form-group'>
                                            <label className='label'>Skills (comma separated)</label>
                                            <input type='text' {...register("skills")} placeholder='React, Python, Design' className='input' disabled={isLoading} />
                                        </div>
                                    )}

                                    <div className='form-group'>
                                        <label className='label'>Bio / About</label>
                                        <textarea {...register("bio", { maxLength: { value: 500, message: "Max 500 characters" } })} rows="2" className={`input py-2 resize-none ${errors.bio ? 'input-error' : ''}`} disabled={isLoading}></textarea>
                                        {errors.bio && <p className='text-red-500 text-sm mt-1'>{errors.bio.message}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className='mt-8 pt-6 border-t border-neutral-100 dark:border-slate-700 flex justify-center'>
                                <button type="submit" disabled={isLoading} className='btn-secondary w-full max-w-md py-3.5'>
                                    {isLoading ? 'Sending OTP...' : 'Continue to Verification'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex justify-center">
                            <form onSubmit={handleOtpVerify} className='space-y-5 w-full max-w-md'>
                                <div className='form-group w-full'>
                                    <label className='label text-center block'>Enter 6-Digit Verification Code</label>
                                    <input type='text' value={otpValue} onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder='•• •• ••' className='input text-center text-xl tracking-widest' disabled={isLoading} maxLength={6} />
                                    <p className='text-sm text-neutral-500 dark:text-slate-400 text-center mt-2'>We sent a code to <span className="font-medium text-neutral-800 dark:text-slate-200">{registrationData?.userEmail}</span></p>
                                </div>
                                <button type="submit" disabled={isLoading || otpValue.length !== 6} className='btn-secondary w-full py-3.5 mt-4'>
                                    {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                                </button>
                                <button type="button" onClick={() => setStep(1)} className='btn-outline w-full py-3.5 mt-2'>Back to Details</button>
                            </form>
                        </div>
                    )}
                </div>

                <p className='text-center text-neutral-600 dark:text-slate-400 mt-6'>
                    Already have an account?{' '}
                    <Link to='/login' className='text-secondary-600 dark:text-secondary-400 font-semibold hover:text-secondary-700 dark:hover:text-secondary-300'>Sign in</Link>
                </p>
            </div>
        </div>
    );
};
