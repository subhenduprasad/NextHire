import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { LoginContext } from '../../components/ContextProvider/Context';
import { toast } from 'react-toastify';

export const TeamManagement = () => {
    const { loginData } = useContext(LoginContext);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState({ coordinators: [], recruiters: [] });
    const [newMember, setNewMember] = useState({ email: '', role: 'coordinator' });
    const [addingMember, setAddingMember] = useState(false);

    useEffect(() => {
        const fetchCompany = async () => {
            if (!loginData?._id) return;
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/company/my-company`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('usertoken')}`
                        }
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.data) {
                        const companyData = data.data;
                        setCompany(companyData);
                        await fetchTeamMembers(companyData);
                        setLoading(false);
                        return;
                    }
                }
                const fallbackRes = await fetch(`${process.env.REACT_APP_API_URL}/company/by-employer/${loginData._id}`);
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    if (fallbackData && fallbackData.data) {
                        setCompany(fallbackData.data);
                        await fetchTeamMembers(fallbackData.data);
                    } else {
                        setCompany(null);
                    }
                } else {
                    setCompany(null);
                }
            } catch (error) {
                console.error('Error fetching company:', error);
                toast.error('Failed to load company data');
            } finally {
                setLoading(false);
            }
        };
        fetchCompany();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginData]);

    const fetchTeamMembers = async (companyData) => {
        try {
            const coordinatorPromises = (companyData.coordinators || []).map(id => {
                const userId = typeof id === 'object' ? id._id : id;
                return fetch(`${process.env.REACT_APP_API_URL}/users/user/${userId}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(data => data?.data || data);
            });
            const recruiterPromises = (companyData.recruiters || []).map(id => {
                const userId = typeof id === 'object' ? id._id : id;
                return fetch(`${process.env.REACT_APP_API_URL}/users/user/${userId}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(data => data?.data || data);
            });

            const [coordinators, recruiters] = await Promise.all([
                Promise.all(coordinatorPromises),
                Promise.all(recruiterPromises)
            ]);

            setTeamMembers({
                coordinators: coordinators.filter(c => c !== null),
                recruiters: recruiters.filter(r => r !== null)
            });
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!newMember.email) {
            toast.error('Please enter an email address');
            return;
        }

        setAddingMember(true);
        try {
            const usersResponse = await fetch(`${process.env.REACT_APP_API_URL}/users/all-users`);
            const usersResult = await usersResponse.json();
            const usersArray = usersResult.data || usersResult || [];
            const user = usersArray.find(u => u.userEmail === newMember.email && u.role === newMember.role);

            if (!user) {
                toast.error(`No ${newMember.role} found with that email`);
                return;
            }

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/company/add-member/${company._id}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('usertoken')}`
                    },
                    body: JSON.stringify({
                        userId: user._id,
                        role: newMember.role
                    })
                }
            );

            if (response.ok) {
                const result = await response.json();
                const updatedCompany = result.data || result.company || result;
                setCompany(updatedCompany);
                await fetchTeamMembers(updatedCompany);
                setNewMember({ email: '', role: 'coordinator' });
                toast.success(`${newMember.role} added successfully!`);
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to add team member');
            }
        } catch (error) {
            console.error('Error adding member:', error);
            toast.error('Failed to add team member');
        } finally {
            setAddingMember(false);
        }
    };

    const handleRemoveMember = async (userId, role) => {
        if (!window.confirm(`Are you sure you want to remove this ${role}?`)) return;

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/company/remove-member/${company._id}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('usertoken')}`
                    },
                    body: JSON.stringify({ userId, role })
                }
            );

            if (response.ok) {
                const result = await response.json();
                const updatedCompany = result.data || result.company || result;
                setCompany(updatedCompany);
                await fetchTeamMembers(updatedCompany);
                toast.success(`${role} removed successfully!`);
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to remove team member');
            }
        } catch (error) {
            console.error('Error removing member:', error);
            toast.error('Failed to remove team member');
        }
    };

    if (loading) {
        return (
            <div className='container-custom py-8'>
                <div className='page-header mb-8'>
                    <div className='h-8 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-48 mb-2' />
                    <div className='h-5 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-72' />
                </div>
                <div className='card p-6 mb-6'>
                    <div className='h-6 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-40 mb-4' />
                    <div className='flex gap-4'>
                        <div className='flex-1 h-12 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse' />
                        <div className='w-40 h-12 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse' />
                        <div className='w-32 h-12 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse' />
                    </div>
                </div>
                {[1, 2].map(i => (
                    <div key={i} className='card p-6 mb-6'>
                        <div className='h-6 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-32 mb-4' />
                        <div className='space-y-3'>
                            {[1, 2].map(j => (
                                <div key={j} className='h-16 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse' />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!company) {
        return (
            <div className='container-custom py-12'>
                <div className='card max-w-xl mx-auto'>
                    <div className='empty-state py-16'>
                        <div className='w-20 h-20 bg-neutral-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6'>
                            <svg className='w-10 h-10 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                            </svg>
                        </div>
                        <h3 className='empty-state-title'>No Company Found</h3>
                        <p className='empty-state-text'>Please create a company first to manage your team.</p>
                        <Link to='/create-company' className='btn-primary'>
                            Create Company
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-neutral-50 dark:bg-slate-900 min-h-screen'>
            {/* Header */}
            <div className='bg-white dark:bg-slate-800 border-b border-neutral-100 dark:border-slate-700'>
                <div className='container-custom py-8'>
                    <div className='flex items-center gap-4'>
                        <div className='w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center'>
                            <svg className='w-6 h-6 text-secondary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                            </svg>
                        </div>
                        <div>
                            <h1 className='text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white'>Team Management</h1>
                            <p className='text-neutral-600 dark:text-slate-400'>Manage coordinators and recruiters for {company.companyName}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='container-custom py-8'>
                {/* Add Team Member Form */}
                <div className='card p-6 mb-8'>
                    <div className='flex items-center gap-3 mb-6'>
                        <div className='w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center'>
                            <svg className='w-5 h-5 text-accent-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' />
                            </svg>
                        </div>
                        <h2 className='text-lg font-semibold text-neutral-900 dark:text-white'>Add Team Member</h2>
                    </div>
                    
                    <form onSubmit={handleAddMember} className='flex flex-col md:flex-row gap-4'>
                        <div className='flex-1'>
                            <input
                                type='email'
                                placeholder='Enter team member email'
                                value={newMember.email}
                                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                className='input'
                            />
                        </div>
                        <select
                            value={newMember.role}
                            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                            className='select md:w-48'
                        >
                            <option value='coordinator'>Coordinator</option>
                            <option value='recruiter'>Recruiter</option>
                        </select>
                        <button
                            type='submit'
                            disabled={addingMember}
                            className='btn-secondary whitespace-nowrap'
                        >
                            {addingMember ? (
                                <>
                                    <svg className='animate-spin -ml-1 mr-2 h-4 w-4' fill='none' viewBox='0 0 24 24'>
                                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                                    </svg>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4' />
                                    </svg>
                                    Add Member
                                </>
                            )}
                        </button>
                    </form>
                    <div className='mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl'>
                        <p className='text-sm text-amber-800 flex items-start gap-2'>
                            <svg className='w-5 h-5 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                            The user must already be registered with the appropriate role (coordinator or recruiter) before you can add them.
                        </p>
                    </div>
                </div>

                <div className='grid md:grid-cols-2 gap-6'>
                    {/* Coordinators */}
                    <div className='card'>
                        <div className='bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                                <svg className='w-5 h-5 text-white opacity-80' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
                                </svg>
                                <h2 className='text-lg font-semibold text-white'>Coordinators</h2>
                            </div>
                            <span className='badge bg-white/20 dark:bg-slate-800/20 text-white'>{teamMembers.coordinators.length}</span>
                        </div>
                        <div className='p-4'>
                            {teamMembers.coordinators.length === 0 ? (
                                <div className='text-center py-8'>
                                    <div className='w-12 h-12 bg-neutral-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3'>
                                        <svg className='w-6 h-6 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                                        </svg>
                                    </div>
                                    <p className='text-neutral-500 dark:text-slate-400 text-sm'>No coordinators added yet</p>
                                </div>
                            ) : (
                                <div className='space-y-3'>
                                    {teamMembers.coordinators.map((member) => (
                                        <MemberCard 
                                            key={member._id} 
                                            member={member} 
                                            role="coordinator"
                                            onRemove={handleRemoveMember}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recruiters */}
                    <div className='card'>
                        <div className='bg-gradient-to-r from-secondary-600 to-secondary-700 px-6 py-4 flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                                <svg className='w-5 h-5 text-white opacity-80' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                                </svg>
                                <h2 className='text-lg font-semibold text-white'>Recruiters</h2>
                            </div>
                            <span className='badge bg-white/20 dark:bg-slate-800/20 text-white'>{teamMembers.recruiters.length}</span>
                        </div>
                        <div className='p-4'>
                            {teamMembers.recruiters.length === 0 ? (
                                <div className='text-center py-8'>
                                    <div className='w-12 h-12 bg-neutral-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3'>
                                        <svg className='w-6 h-6 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                                        </svg>
                                    </div>
                                    <p className='text-neutral-500 dark:text-slate-400 text-sm'>No recruiters added yet</p>
                                </div>
                            ) : (
                                <div className='space-y-3'>
                                    {teamMembers.recruiters.map((member) => (
                                        <MemberCard 
                                            key={member._id} 
                                            member={member} 
                                            role="recruiter"
                                            onRemove={handleRemoveMember}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

function MemberCard({ member, role, onRemove }) {
    return (
        <div className='flex items-center justify-between p-4 bg-neutral-50 dark:bg-slate-900 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-xl transition-colors group'>
            <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center'>
                    <span className='text-primary-700 font-semibold text-sm'>
                        {member.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                </div>
                <div>
                    <p className='font-medium text-neutral-900 dark:text-white'>{member.userName}</p>
                    <p className='text-sm text-neutral-500 dark:text-slate-400'>{member.userEmail}</p>
                </div>
            </div>
            <button
                onClick={() => onRemove(member._id, role)}
                className='opacity-0 group-hover:opacity-100 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-all'
            >
                Remove
            </button>
        </div>
    );
}
