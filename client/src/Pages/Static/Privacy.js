import React from 'react';

export const Privacy = () => {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 pb-16 pt-24 font-inter">
            <div className="container-custom max-w-4xl">
                <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl shadow-sm border border-neutral-100 dark:border-slate-700">
                    <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6">Privacy Policy</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-8">Last updated: April 15, 2026</p>
                    
                    <div className="space-y-8 text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">1. Information We Collect</h2>
                            <p>We collect information that you provide directly to us, such as when you create an account, update your profile, submit a job application, or communicate with us. This information may include your name, email address, phone number, resume, employment history, education, and any other information you choose to provide.</p>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">2. How We Use Your Information</h2>
                            <p>We use the information we collect to provide, maintain, and improve our services. This includes matching candidates with relevant job opportunities, allowing employers to review profiles, personalizing your experience, and sending you important updates regarding your account or applications.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">3. Information Sharing</h2>
                            <p>We do not sell your personal information. We only share your data with employers when you explicitly apply for their job postings or choose to make your profile public for recruiters. We may also share information with third-party vendors who provide essential infrastructure services, subject to strict confidentiality agreements.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">4. Security</h2>
                            <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. We regularly review our security policies and update our infrastructure to ensure your data is safe.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">5. Contact Us</h2>
                            <p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at privacy@nexthire.com.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};
