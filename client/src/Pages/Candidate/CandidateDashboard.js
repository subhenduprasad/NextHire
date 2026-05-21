import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { LoginContext } from "../../components/ContextProvider/Context";

export const CandidateDashboard = () => {
  const { loginData } = useContext(LoginContext);

  const storedUserRaw =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const storedUser =
    storedUserRaw && storedUserRaw !== "undefined" && storedUserRaw !== "null"
      ? JSON.parse(storedUserRaw)
      : null;

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pending: 0,
    shortlisted: 0,
    rejected: 0,
  });
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState({});

  useEffect(() => {
    const stored = storedUser;
    const userId = loginData?._id || stored?._id;
    if (userId) fetchDashboardData();
    else setIsLoading(false);
    // eslint-disable-next-line
  }, [loginData]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("usertoken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      let allApps = null;
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/application/my-applications`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) allApps = await res.json();
      } catch {}

      if (!Array.isArray(allApps)) {
        const resAll = await fetch(
          `${process.env.REACT_APP_API_URL}/application/all-application`
        );
        allApps = await resAll.json();
      }

      const currentUserId = loginData?._id || storedUser?._id;
      const userApps = allApps.filter((app) =>
        typeof app.candidateID === "object"
          ? app.candidateID?._id === currentUserId
          : app.candidateID === currentUserId
      );

      const pending = userApps.filter(
        (a) => a.applicationStatus !== "shortlist" && a.applicationStatus !== "rejected"
      );
      const shortlisted = userApps.filter((a) => a.applicationStatus === "shortlist");
      const rejected = userApps.filter((a) => a.applicationStatus === "rejected");

      setStats({
        totalApplications: userApps.length,
        pending: pending.length,
        shortlisted: shortlisted.length,
        rejected: rejected.length,
      });

      setApplications(userApps);

      const jobsData = {};
      await Promise.all(
        userApps.map(async (app) => {
          let jobId = typeof app.jobID === "object" ? app.jobID._id : app.jobID;
          if (!jobsData[jobId]) {
            try {
              const res = await fetch(
                `${process.env.REACT_APP_API_URL}/jobs/current-job/${jobId}`
              );
              jobsData[jobId] = await res.json();
            } catch {
              jobsData[jobId] = null;
            }
          }
        })
      );
      setJobs(jobsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const statusLabel = (s) =>
    s === "shortlist" ? "Shortlisted" : s === "rejected" ? "Rejected" : "Under Review";

  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <div className="skeleton h-10 w-72 mb-6"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 skeleton h-28"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome, {loginData?.userName || storedUser?.userName || "Candidate"} 👋
          </h1>
          <p className="text-neutral-600 dark:text-slate-400 mt-1">
            Track your job applications and opportunities
          </p>
        </div>
        <Link to="/all-posted-jobs" className="btn-primary">
          Find Jobs
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          ["Total Applications", stats.totalApplications],
          ["Under Review", stats.pending],
          ["Shortlisted", stats.shortlisted],
          ["Rejected", stats.rejected],
        ].map(([label, value], i) => (
          <div key={i} className="card p-6 text-center">
            <div className="text-3xl font-bold dark:text-white">{value}</div>
            <p className="text-neutral-500 dark:text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div className="p-6 border-b dark:border-slate-700/50 flex justify-between items-center">
          <h2 className="text-xl font-semibold dark:text-white">Recent Applications</h2>
          <Link to="/my-jobs" className="btn-ghost btn-sm">
            View All
          </Link>
        </div>

        <div className="p-6 space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-neutral-500 dark:text-slate-400 mb-4">
                You haven’t applied to any jobs yet.
              </p>
              <Link to="/all-posted-jobs" className="btn-primary">
                Browse Jobs
              </Link>
            </div>
          ) : (
            applications.slice(0, 6).map((app) => {
              const jobId =
                typeof app.jobID === "object" ? app.jobID._id : app.jobID;
              const job = jobs[jobId];

              return (
                <div
                  key={app._id}
                  className="p-5 border dark:border-slate-700/50 rounded-xl hover:shadow-soft transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold dark:text-slate-100">
                        {job?.jobTitle || "Loading..."}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">
                        {job?.employmentType} • {job?.salary} LPA
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge-warning">
                        {statusLabel(app.applicationStatus)}
                      </span>
                      {job && (
                        <Link
                          to={`/current-job/${job._id}`}
                          className="btn-ghost btn-sm"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
