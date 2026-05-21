import React, { useState, useContext, useRef } from 'react';
import { LoginContext } from '../../components/ContextProvider/Context';
import { toast } from 'react-toastify';

const CreatePost = ({ onPostCreated }) => {
    const { loginData } = useContext(LoginContext);
    const [content, setContent] = useState('');
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        
        // Count how many PDFs are already attached
        const existingPdfsCount = files.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf')).length;
        
        let newFiles = [];
        let pdfAdded = false;
        let rejectedDueToPdfLimit = false;

        for (const file of selectedFiles) {
            const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
            const isValidType = file.type.startsWith('image/') || isPdf;
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
            
            if (!isValidType) {
                toast.error(`${file.name} is not a valid image or PDF.`);
                continue;
            }
            if (!isValidSize) {
                toast.error(`${file.name} exceeds the 10MB size limit.`);
                continue;
            }

            if (isPdf) {
                if (existingPdfsCount > 0 || pdfAdded) {
                    rejectedDueToPdfLimit = true;
                    continue;
                } else {
                    pdfAdded = true;
                }
            }

            newFiles.push(file);
        }

        if (rejectedDueToPdfLimit) {
            toast.error("You can upload a maximum of 1 document (PDF) per post.");
        }

        if (files.length + newFiles.length > 5) {
            toast.error("You can upload a maximum of 5 files.");
            const allowedCount = 5 - files.length;
            newFiles = newFiles.slice(0, allowedCount);
        }

        if (newFiles.length > 0) {
            setFiles([...files, ...newFiles]);
        }

        // Reset the file input so that the same file selection can be triggered again
        if (e.target) {
            e.target.value = '';
        }
    };

    const removeFile = (index) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!content.trim() && files.length === 0) {
            toast.error('Post content or attachments cannot be empty.');
            return;
        }

        setIsLoading(true);

        try {
            let uploadedImages = [];
            let uploadedPdfs = [];

            // 1. Upload files if any
            if (files.length > 0) {
                const formData = new FormData();
                files.forEach(file => {
                    formData.append('media', file);
                });

                const uploadRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/upload/post-media`, {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                
                if (uploadRes.ok && uploadData.success) {
                    uploadedImages = uploadData.images;
                    uploadedPdfs = uploadData.pdfs;
                } else {
                    throw new Error(uploadData.message || 'Failed to upload media');
                }
            }

            // 2. Create post
            const postReq = {
                userId: loginData._id,
                content,
                images: uploadedImages,
                pdfs: uploadedPdfs
            };

            const postRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postReq)
            });

            const postData = await postRes.json();
            
            if (postRes.ok && postData.success) {
                toast.success('Post created successfully!');
                setContent('');
                setFiles([]);
                if (onPostCreated) {
                    onPostCreated(postData.post);
                }
            } else {
                throw new Error(postData.message || 'Failed to create post');
            }
        } catch (error) {
            toast.error(error.message || 'An error occurred while posting.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!loginData) return null;

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const profilePic = loginData.profilePhoto 
        ? (loginData.profilePhoto.startsWith('http') ? loginData.profilePhoto : `${API_BASE_URL}${loginData.profilePhoto}`)
        : null;

    return (
        <div className="card p-5 mb-6 border border-white/60 dark:border-slate-700/50 shadow-soft bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl">
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    {profilePic ? (
                        <img src={profilePic} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-slate-600 shadow-sm" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold text-lg">
                            {loginData.userName?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write a message..."
                            className="w-full bg-neutral-50 dark:bg-slate-900/50 border border-neutral-200 dark:border-slate-700 rounded-xl p-3 text-neutral-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 resize-none min-h-[100px]"
                        ></textarea>
                        
                        {files.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {files.map((file, i) => (
                                    <div key={i} className="relative group flex items-center bg-neutral-100 dark:bg-slate-700 rounded-lg p-2 pr-8 border border-neutral-200 dark:border-slate-600 text-sm overflow-hidden">
                                        <span className="truncate max-w-[150px] text-neutral-700 dark:text-slate-200 font-medium">{file.name}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => removeFile(i)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 p-0.5 bg-red-50 dark:bg-red-900/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 dark:border-slate-700 pt-3">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    multiple 
                                    accept="image/*,application/pdf"
                                    onChange={handleFileChange}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current.click()}
                                    className="p-2 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Photo
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current.click()}
                                    className="p-2 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v6h6" /></svg>
                                    Document (PDF)
                                </button>
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={isLoading || (!content.trim() && files.length === 0)}
                                className="btn-primary rounded-xl px-6 py-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> Posting...</>
                                ) : 'Post'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
