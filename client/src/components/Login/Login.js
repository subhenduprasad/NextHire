import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { toast } from 'react-toastify';
import { LoginContext } from '../ContextProvider/Context';
import logoURL from '../../assets/img/logo.jpeg';

export const Login = () => {
    const { login } = useContext(LoginContext);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // OTP State Validation Step
    const [step, setStep] = useState(1);
    const [credentials, setCredentials] = useState(null);
    const [otpValue, setOtpValue] = useState("");
    const [resetEmail, setResetEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        let interval = null;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else if (resendTimer === 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmitCredentials = async (data) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/send-login-otp`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: data.userEmail.toLowerCase().trim(),
                    userPassword: data.userPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                setCredentials({
                    userEmail: data.userEmail.toLowerCase().trim(),
                    userPassword: data.userPassword
                });
                setStep(2);
                setResendTimer(60);
                toast.success("OTP sent to your email");
            } else {
                toast.error(result.error || "Invalid credentials");
            }
        } catch (err) {
            console.error('Login error:', err);
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
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...credentials,
                    otp: otpValue
                })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('usertoken', result.token);
                // Also trigger me route
                const meRes = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${result.token}` }
                });
                const meData = await meRes.json();
                if (meData.success && meData.data) {
                    login(meData.data, result.token);
                } else {
                    login(result.user, result.token);
                }
                toast.success("Welcome back!");
                navigate('/');
            } else {
                toast.error(result.error || "Invalid OTP");
            }
        } catch (err) {
            console.error('OTP verify error:', err);
            toast.error("Unable to connect to server");
        } finally {
            setIsLoading(false);
        }
    }

    const handleForgotPasswordRequest = async (e) => {
        e.preventDefault();
        if (!resetEmail) {
            toast.error("Please enter your email");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/send-password-reset-otp`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: resetEmail })
            });

            const result = await response.json();
            if (result.success) {
                setStep(4);
                setResendTimer(60);
                toast.success("Password reset OTP sent to your email");
            } else {
                toast.error(result.error || "User not found");
            }
        } catch (err) {
            console.error('Reset request error:', err);
            toast.error("Unable to connect to server");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!otpValue || otpValue.length < 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: resetEmail, otp: otpValue, newPassword })
            });

            const result = await response.json();
            if (result.success) {
                toast.success("Password updated successfully! Please login.");
                setStep(1);
                setResetEmail("");
                setOtpValue("");
                setNewPassword("");
            } else {
                toast.error(result.error || "Invalid OTP");
            }
        } catch (err) {
            console.error('Password reset error:', err);
            toast.error("Unable to connect to server");
        } finally {
            setIsLoading(false);
        }
    }

    const handleResendOtp = async () => {
        setIsLoading(true);
        try {
            const endpoint = step === 2 ? '/auth/send-login-otp' : '/auth/send-password-reset-otp';
            const bodyData = step === 2 
                ? { userEmail: credentials.userEmail, userPassword: credentials.userPassword }
                : { userEmail: resetEmail };

            const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            const result = await response.json();
            if (result.success) {
                setResendTimer(60);
                toast.success("OTP resent to your email");
            } else {
                toast.error(result.error || "Failed to resend OTP");
            }
        } catch (err) {
            console.error('Resend OTP error:', err);
            toast.error("Unable to connect to server");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='min-h-[80vh] flex items-center justify-center py-12 px-4'>
            <div className='w-full max-w-md'>
                {/* Logo & Header */}
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
                        {step === 1 ? 'Welcome back' : step === 2 ? 'Verify your Account' : step === 3 ? 'Reset Password' : 'Create New Password'}
                    </h1>
                    <p className='text-neutral-600 dark:text-slate-400'>
                        {step === 1 ? 'Sign in to access your account' : step === 2 ? 'Enter the OTP sent to your email' : step === 3 ? "Enter your email to receive a reset code" : 'Enter the OTP and your new password'}
                    </p>
                </div>

                {/* Form Area depending on step */}
                <div className='form-section bg-white/80 dark:bg-slate-800/80 border-white/80 dark:border-slate-700/50'>
                    {step === 1 ? (
                        <form onSubmit={handleSubmit(onSubmitCredentials)} className='space-y-5'>
                            {/* Email Field */}
                            <div className='form-group'>
                                <label className='label'>Email Address</label>
                                <div className='relative'>
                                    <svg className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207' />
                                    </svg>
                                    <input 
                                        type='email' 
                                        {...register("userEmail", { 
                                            required: "Email is required",
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: "Please enter a valid email"
                                            }
                                        })} 
                                        placeholder='you@example.com' 
                                        className={`input pl-12 ${errors.userEmail ? 'input-error' : ''}`}
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.userEmail && (
                                    <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                        </svg>
                                        {errors.userEmail.message}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className='form-group'>
                                <div className='flex items-center justify-between mb-2'>
                                    <label className='label mb-0'>Password</label>
                                    <button type="button" onClick={() => { setStep(3); setResetEmail(""); }} className='text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 bg-transparent border-none p-0 cursor-pointer'>
                                        Forgot password?
                                    </button>
                                </div>
                                <div className='relative'>
                                    <svg className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                                    </svg>
                                    <input 
                                        type={showPassword ? 'text' : 'password'}
                                        {...register("userPassword", { 
                                            required: "Password is required",
                                            minLength: {
                                                value: 6,
                                                message: "Password must be at least 6 characters"
                                            }
                                        })} 
                                        placeholder='Enter your password' 
                                        className={`input pl-12 pr-12 ${errors.userPassword ? 'input-error' : ''}`}
                                        disabled={isLoading}
                                    />
                                    <button 
                                        type='button'
                                        onClick={() => setShowPassword(!showPassword)}
                                        className='absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600'
                                    >
                                        {showPassword ? (
                                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                                            </svg>
                                        ) : (
                                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.userPassword && (
                                    <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                        </svg>
                                        {errors.userPassword.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className='btn-secondary w-full py-3.5'
                            >
                                {isLoading ? (
                                    <>
                                        <svg className='animate-spin -ml-1 mr-2 h-5 w-5 inline-block' fill='none' viewBox='0 0 24 24'>
                                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                                        </svg>
                                        Sending OTP...
                                    </>
                                ) : (
                                    'Sign In / Request OTP'
                                )}
                            </button>
                        </form>
                    ) : step === 2 ? (
                        <form onSubmit={handleOtpVerify} className='space-y-5'>
                            <div className='form-group'>
                                <label className='label text-center block'>Enter 6-Digit Verification Code</label>
                                <input 
                                    type='text' 
                                    value={otpValue}
                                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder='•• •• ••' 
                                    className='input text-center text-xl tracking-widest'
                                    disabled={isLoading}
                                    maxLength={6}
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isLoading || otpValue.length !== 6}
                                className='btn-secondary w-full py-3.5 mt-4'
                            >
                                {isLoading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            
                            <div className='flex justify-center mt-3'>
                                <button 
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendTimer > 0 || isLoading}
                                    className='text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 disabled:text-neutral-400 dark:disabled:text-slate-500 bg-transparent border-none p-0 cursor-pointer font-medium'
                                >
                                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                                </button>
                            </div>
                            
                            <button 
                                type="button"
                                onClick={() => { setStep(1); setResendTimer(0); setOtpValue(""); }}
                                className='btn-outline w-full py-3.5 mt-2'
                            >
                                Back to Login
                            </button>
                        </form>
                    ) : step === 3 ? (
                        <form onSubmit={handleForgotPasswordRequest} className='space-y-5'>
                            <div className='form-group'>
                                <label className='label'>Account Email</label>
                                <input 
                                    type='email' 
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder='you@example.com' 
                                    className='input'
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <button type="submit" disabled={isLoading} className='btn-secondary w-full py-3.5 mt-4'>
                                {isLoading ? 'Sending OTP...' : 'Send Reset Code'}
                            </button>
                            
                            <button type="button" onClick={() => setStep(1)} className='btn-outline w-full py-3.5 mt-2'>
                                Back to Login
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordReset} className='space-y-5'>
                            <div className='form-group'>
                                <label className='label text-center block'>Verification Code</label>
                                <input 
                                    type='text' 
                                    value={otpValue}
                                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder='6-digit OTP' 
                                    className='input text-center tracking-widest'
                                    disabled={isLoading}
                                    maxLength={6}
                                    required
                                />
                            </div>
                            <div className='form-group'>
                                <label className='label block'>New Password</label>
                                <input 
                                    type='password' 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder='At least 6 characters' 
                                    className='input'
                                    disabled={isLoading}
                                    minLength={6}
                                    required
                                />
                            </div>

                            <button type="submit" disabled={isLoading || otpValue.length !== 6 || newPassword.length < 6} className='btn-secondary w-full py-3.5 mt-4'>
                                {isLoading ? 'Resetting...' : 'Save New Password'}
                            </button>
                            
                            <div className='flex justify-center mt-3'>
                                <button 
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendTimer > 0 || isLoading}
                                    className='text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 disabled:text-neutral-400 dark:disabled:text-slate-500 bg-transparent border-none p-0 cursor-pointer font-medium'
                                >
                                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                                </button>
                            </div>
                            
                            <button type="button" onClick={() => { setStep(1); setResendTimer(0); setOtpValue(""); }} className='btn-outline w-full py-3.5 mt-2'>
                                Back to Login
                            </button>
                        </form>
                    )}

                    {/* Divider */}
                    <div className='relative my-6'>
                        <div className='absolute inset-0 flex items-center'>
                            <div className='w-full border-t border-neutral-200 dark:border-slate-700' />
                        </div>
                        <div className='relative flex justify-center text-sm'>
                            <span className='px-4 bg-white dark:bg-slate-800 text-neutral-500 dark:text-slate-400'>New to NextHire?</span>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <Link 
                        to='/signup'
                        className='btn-outline w-full block text-center'
                    >
                        Create an account
                    </Link>
                </div>

                {/* Terms */}
                <p className='text-center text-sm text-neutral-500 dark:text-slate-400 mt-6'>
                    By signing in, you agree to our{' '}
                    <Link to='#' className='text-secondary-600 dark:text-secondary-400 hover:underline'>Terms</Link>
                    {' '}and{' '}
                    <Link to='#' className='text-secondary-600 dark:text-secondary-400 hover:underline'>Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
};
