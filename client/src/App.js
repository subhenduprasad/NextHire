import { Routes, Route, useLocation } from 'react-router-dom';
import './index.css';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { Home } from './Pages/Employer/Home';
import { Navbar } from './components/Navbar';
import { PostJob } from './Pages/Employer/PostJob';
import { AllJobs } from './Pages/Employer/AllJobs';
import { EmployerDashboard } from './Pages/Employer/EmployerDashboard';
import { Login } from './components/Login/Login';
import { Register } from './components/Login/Register';
import { RecruiterDashboard } from './Pages/Recruiter/RecruiterDashboard';
import { RecruiterJobApplications } from './Pages/Recruiter/RecruiterJobApplications';
import { CoordinatorDashboard } from './Pages/Coordinator/CoordinatorDashboard';
import { JobDetails } from './components/Home/JobDetails';
import { CandidateProfile } from './Pages/Recruiter/CandidateProfile';
import { ShortlistedCandidates } from './components/ShortlistedCandidates';
import { ShortlistedDetails } from './components/ShortlistedDetails';
import { ApplicationForm } from './Pages/Candidate/ApplicationForm';
import { AssignRecruiter } from './Pages/Coordinator/AssignRecruiter';
import { Footer } from './components/Footer';
import { AllPostedJobs } from './components/AllPostedJobs';
import { Dashboard } from './Pages/Dashboard';
import { useContext, useEffect } from 'react';
import { LoginContext } from './components/ContextProvider/Context';
import { UpdateJob } from './Pages/Employer/UpdateJob';
import { MyJobs } from './Pages/Candidate/MyJobs';
import { CandidateDashboard } from './Pages/Candidate/CandidateDashboard';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { Companies } from './Pages/Companies';
import { CompanyDetails } from './Pages/CompanyDetails';
import { TeamManagement } from './Pages/Employer/TeamManagement';
import { CreateCompany } from './Pages/Employer/CreateCompany';
import { Profile } from './Pages/Profile';
import { Settings } from './Pages/Settings';
import { Feed } from './Pages/Feed';
import { PublicProfile } from './Pages/PublicProfile';
import { About } from './Pages/Static/About';
import { Contact } from './Pages/Static/Contact';
import { Privacy } from './Pages/Static/Privacy';
import { Terms } from './Pages/Static/Terms';
import { Cookies } from './Pages/Static/Cookies';
import { Pricing } from './Pages/Static/Pricing';
import { Resources } from './Pages/Static/Resources';
import { Chat } from './Pages/Chat/Chat';
import { Activity } from './Pages/Activity';
import { SinglePost } from './Pages/SinglePost';

function App() {
  const { isLoading } = useContext(LoginContext);
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let pageTitle = 'NextHire Career Portal';
    
    if (path.startsWith('/employer/dashboard')) pageTitle = 'Employer Dashboard - NextHire';
    else if (path.startsWith('/candidate/dashboard')) pageTitle = 'Candidate Dashboard - NextHire';
    else if (path.startsWith('/recruiter/review')) pageTitle = 'Review Applications - NextHire';
    else if (path.startsWith('/coordinator/review')) pageTitle = 'Coordinator Dashboard - NextHire';
    else if (path.startsWith('/feed')) pageTitle = 'Feed - NextHire';
    else if (path.startsWith('/all-posted-jobs') || path.startsWith('/all-jobs')) pageTitle = 'Jobs - NextHire';
    else if (path.startsWith('/companies')) pageTitle = 'Companies - NextHire';
    else if (path.startsWith('/chat')) pageTitle = 'Messages - NextHire';
    else if (path.startsWith('/profile') || path.startsWith('/candidate/')) pageTitle = 'Profile - NextHire';
    else if (path.startsWith('/settings')) pageTitle = 'Settings - NextHire';
    else if (path.startsWith('/current-job/')) pageTitle = 'Job Details - NextHire';
    
    document.title = pageTitle;
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-slate-900">
      <Routes>
        <Route path='/' element={<Navbar />}> 
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path='/current-job/:id' element={<JobDetails />} />
          <Route path='/all-posted-jobs' element={<AllPostedJobs />} />
          <Route path='/companies' element={<Companies />} />
          <Route path='/company/:id' element={<CompanyDetails />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/privacy' element={<Privacy />} />
          <Route path='/terms' element={<Terms />} />
          <Route path='/cookies' element={<Cookies />} />
          <Route path='/pricing' element={<Pricing />} />
          <Route path='/resources' element={<Resources />} />
          <Route path='/employer-resources' element={<Resources />} />
          <Route path='/feed' element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          } />
          
          {/* Auth Routes - Only for non-authenticated users */}
          <Route path='/login' element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path='/signup' element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />

          {/* Protected Routes - Employer */}
          <Route path='/employer/dashboard' element={
            <ProtectedRoute allowedRoles={['employer']}>
              <EmployerDashboard />
            </ProtectedRoute>
          } />
          <Route path='/create-company' element={
            <ProtectedRoute allowedRoles={['employer']}>
              <CreateCompany />
            </ProtectedRoute>
          } />
          <Route path='/post-job' element={
            <ProtectedRoute allowedRoles={['employer']}>
              <PostJob />
            </ProtectedRoute>
          } />
          <Route path='/all-jobs' element={
            <ProtectedRoute allowedRoles={['employer']}>
              <AllJobs />
            </ProtectedRoute>
          } />
          <Route path='/update-job/:id' element={
            <ProtectedRoute allowedRoles={['employer']}>
              <UpdateJob />
            </ProtectedRoute>
          } />
          <Route path='/team' element={
            <ProtectedRoute allowedRoles={['employer']}>
              <TeamManagement />
            </ProtectedRoute>
          } />

          {/* Protected Routes - Candidate */}
          <Route path='/candidate/dashboard' element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <CandidateDashboard />
            </ProtectedRoute>
          } />
          <Route path='/application-form/:id' element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <ApplicationForm />
            </ProtectedRoute>
          } />
          <Route path='/my-jobs' element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <MyJobs />
            </ProtectedRoute>
          } />

          {/* Protected Routes - Recruiter */}
          <Route path='/recruiter/review' element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <RecruiterDashboard />
            </ProtectedRoute>
          } />
          <Route path='/recruiter/job/:id/applications' element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <RecruiterJobApplications />
            </ProtectedRoute>
          } />
          <Route path='/candidate/:id' element={
            <ProtectedRoute allowedRoles={['recruiter', 'coordinator', 'employer']}>
              <CandidateProfile />
            </ProtectedRoute>
          } />

          {/* Protected Routes - Coordinator */}
          <Route path='/coordinator/review' element={
            <ProtectedRoute allowedRoles={['coordinator']}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          } />
          <Route path='/assign-recruiter/:id' element={
            <ProtectedRoute allowedRoles={['coordinator']}>
              <AssignRecruiter />
            </ProtectedRoute>
          } />

          {/* Protected Routes - Multiple Roles */}
          <Route path='/profile/:id' element={
            <ProtectedRoute allowedRoles={['recruiter', 'coordinator', 'employer', 'candidate']}>
              <PublicProfile />
            </ProtectedRoute>
          } />
          
          <Route path='/shortlist' element={
            <ProtectedRoute allowedRoles={['recruiter', 'coordinator', 'employer']}>
              <ShortlistedCandidates />
            </ProtectedRoute>
          } />
          <Route path='/shortlist/details/:candidate_id/:job_id' element={
            <ProtectedRoute allowedRoles={['recruiter', 'coordinator', 'employer']}>
              <ShortlistedDetails />
            </ProtectedRoute>
          } />

          {/* Dashboard - Authenticated users */}
          <Route path='/dash' element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path='/chat' element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          
          <Route path='/profile' element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path='/activity' element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          } />
          
          <Route path='/post/:id' element={
            <ProtectedRoute>
              <SinglePost />
            </ProtectedRoute>
          } />
          
          <Route path='/settings' element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Catch-all route */}
          <Route path='*' element={<Home />} />
        </Route>
      </Routes>

      {['/', '/feed', '/companies'].includes(location.pathname) || location.pathname.startsWith('/job/') ? <Footer /> : null}
    </div>
  );
}

export default App;
