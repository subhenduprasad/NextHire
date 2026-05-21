import React, { useState } from 'react';
import { toast } from 'react-toastify';

export const ShareModal = ({ isOpen, onClose, shareUrl, userName }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Profile URL copied to clipboard! 📋");
        setTimeout(() => setCopied(false), 3000);
    };

    // Text formats for sharing
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`Check out ${userName}'s professional profile on NextHire Career Portal!\n\nView details here:`);
    const encodedXText = encodeURIComponent(`Check out ${userName}'s candidate profile on NextHire Career Portal! @nexthire #hiring #career`);
    const emailSubject = encodeURIComponent(`Candidate Profile - ${userName} on NextHire`);
    const emailBody = encodeURIComponent(`Hi,\n\nI wanted to share ${userName}'s candidate profile from the NextHire Career Portal with you.\n\nView the profile here: ${shareUrl}\n\nBest regards,\nNextHire Team`);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}></div>
            
            {/* Modal Body */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-slide-up flex flex-col border border-neutral-100 dark:border-slate-700/80 transition-all duration-300">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-neutral-100 dark:border-slate-700/60 flex justify-between items-center bg-neutral-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share Profile
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5 font-medium">Spread the word or share with hiring managers</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-200/60 dark:hover:bg-slate-700 rounded-full transition-all text-neutral-500 dark:text-slate-400 cursor-pointer active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Copy Link Input Field */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-wider">Profile Link</label>
                        <div className="flex gap-2 bg-neutral-50 dark:bg-slate-900/50 p-1.5 border border-neutral-200 dark:border-slate-700 rounded-2xl">
                            <input 
                                type="text" 
                                readOnly 
                                value={shareUrl} 
                                className="flex-1 bg-transparent px-3 text-sm text-neutral-700 dark:text-slate-300 font-medium font-mono focus:outline-none select-all truncate" 
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shadow-sm cursor-pointer select-none active:scale-95 ${
                                    copied 
                                        ? 'bg-green-500 text-white shadow-green-200 dark:shadow-none' 
                                        : 'bg-primary hover:bg-primary-600 text-white shadow-primary-200 dark:shadow-none'
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        Copy Link
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Social Media Grid */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-wider block">Share on Social Channels</label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* WhatsApp */}
                            <a 
                                href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-100 dark:border-slate-700 bg-neutral-50/30 dark:bg-slate-800/40 hover:bg-green-50/50 dark:hover:bg-green-950/20 hover:border-green-300 dark:hover:border-green-900 group transition-all duration-300 cursor-pointer active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.09-3.976c1.644.975 3.257 1.488 4.856 1.489 5.533 0 10.038-4.482 10.04-.997.001-2.673-1.04-5.187-2.931-7.078-1.89-1.891-4.4-2.933-7.085-2.934-5.54 0-10.045 4.482-10.047 10-.001 2.016.528 3.99 1.531 5.739l-.994 3.633 3.73-.963zm12.302-5.412c-.226-.113-1.336-.66-1.543-.736-.207-.076-.358-.113-.509.113-.151.226-.584.736-.716.887-.132.151-.264.169-.49.056-.226-.113-.957-.353-1.822-1.125-.673-.6-1.127-1.341-1.259-1.567-.132-.226-.014-.348.099-.461.102-.102.226-.264.339-.396.113-.132.151-.226.226-.377.075-.151.038-.283-.019-.396-.056-.113-.509-1.226-.697-1.679-.183-.441-.365-.381-.509-.388-.132-.007-.283-.008-.433-.008-.151 0-.396.056-.604.283-.207.227-.792.774-.792 1.887 0 1.113.811 2.189.924 2.34 1.113 1.479 2.502 2.656 4.708 3.51.524.203 1.01.357 1.353.467.526.167 1.004.143 1.382.086.422-.063 1.336-.547 1.525-1.075.189-.528.189-.981.132-1.075-.056-.094-.207-.151-.433-.264z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <span className="block text-xs font-bold text-neutral-800 dark:text-slate-200">WhatsApp</span>
                                    <span className="block text-[10px] text-neutral-400 font-medium">Send to contacts</span>
                                </div>
                            </a>

                            {/* LinkedIn */}
                            <a 
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-100 dark:border-slate-700 bg-neutral-50/30 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-900 group transition-all duration-300 cursor-pointer active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <span className="block text-xs font-bold text-neutral-800 dark:text-slate-200">LinkedIn</span>
                                    <span className="block text-[10px] text-neutral-400 font-medium">Post to feed</span>
                                </div>
                            </a>

                            {/* X / Twitter */}
                            <a 
                                href={`https://twitter.com/intent/tweet?text=${encodedXText}&url=${encodedUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-100 dark:border-slate-700 bg-neutral-50/30 dark:bg-slate-800/40 hover:bg-neutral-100 dark:hover:bg-slate-700/50 hover:border-neutral-300 dark:hover:border-slate-600 group transition-all duration-300 cursor-pointer active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-4 h-4 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <span className="block text-xs font-bold text-neutral-800 dark:text-slate-200">X / Twitter</span>
                                    <span className="block text-[10px] text-neutral-400 font-medium">Share updates</span>
                                </div>
                            </a>

                            {/* Email */}
                            <a 
                                href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
                                className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-100 dark:border-slate-700 bg-neutral-50/30 dark:bg-slate-800/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-900 group transition-all duration-300 cursor-pointer active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <span className="block text-xs font-bold text-neutral-800 dark:text-slate-200">Email</span>
                                    <span className="block text-[10px] text-neutral-400 font-medium">Send email</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
