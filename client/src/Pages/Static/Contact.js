import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useApi } from '../../hooks/useApi';

export const Contact = () => {
    const { post } = useApi();
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await post('/api/support/contact', formData);
            if (res.success) {
                toast.success(res.data.message || "Thank you for contacting us! Our support team will reach out soon.");
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                toast.error(res.error || "Failed to send message. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting contact form:", error);
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 pb-16 pt-24 font-inter">
            <ToastContainer position="top-right" />
            <div className="container-custom">
                {/* Hero */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
                        Get in Touch
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-300">
                        Have a question, feedback, or a problem? Our support team and developers are here to help.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
                    {/* Contact Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Support Email</h3>
                            <p className="text-neutral-600 dark:text-neutral-400 mb-4">Our friendly team is here to help.</p>
                            <a href="mailto:support@nexthire.com" className="text-secondary-500 font-medium hover:underline">support@nexthire.com</a>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Office</h3>
                            <p className="text-neutral-600 dark:text-neutral-400 mb-4">Come say hello at our headquarters.</p>
                            <address className="not-italic text-neutral-800 dark:text-neutral-300">
                                123 Tech Park Avenue<br />
                                Bhubaneshwar, Odisha 751024<br />
                                India
                            </address>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Phone</h3>
                            <p className="text-neutral-600 dark:text-neutral-400 mb-4">Mon-Fri from 9am to 6pm.</p>
                            <a href="tel:+919876543210" className="text-secondary-500 font-medium hover:underline">+91 (987) 654-3210</a>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-neutral-100 dark:border-slate-700">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Your Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary dark:text-white transition-all"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Your Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary dark:text-white transition-all"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Subject</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary dark:text-white transition-all"
                                    placeholder="How can we help you?"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Message</label>
                                <textarea 
                                    required
                                    rows="5"
                                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary dark:text-white transition-all resize-none"
                                    placeholder="Tell us more about your query..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                ></textarea>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full btn-primary py-3 flex justify-center items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Sending...
                                    </>
                                ) : (
                                    "Send Message"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
