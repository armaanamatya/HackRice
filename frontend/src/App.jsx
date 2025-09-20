import React, { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Routes, Route, useNavigate, Outlet } from 'react-router-dom' // Import Outlet
import UserProfileForm from './components/UserProfileForm'
import DashboardPage from './components/DashboardPage'
import MatcherPage from './components/MatcherPage'
import ProfileDetailsPage from './components/ProfileDetailsPage'
import MainLayout from './components/MainLayout' // Import MainLayout
import { detectUniversityFromEmail } from './utils/universityUtils'
import './App.css'

function App() {
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
  const [userData, setUserData] = useState(null);
  const [userSchedule, setUserSchedule] = useState(null);
  const navigate = useNavigate();

  const handleCreateProfileClick = () => {
    navigate('/create-profile');
  };

  const handleProfileSubmit = (data) => {
    setUserData(prevData => ({
      ...prevData,
      ...data,
    }));
    navigate('/dashboard');
  };

  // These navigation handlers are now directly used by Sidebar/MainLayout
  // and don't need to be passed down through props anymore for most cases.
  const handleNavigateToDashboard = () => navigate('/dashboard');
  const handleNavigateToMatcher = () => navigate('/dashboard/matcher');
  const handleNavigateToProfileDetails = () => navigate('/dashboard/profile');

  const handleUserScheduleUpdate = (schedule) => {
    setUserSchedule(schedule);
  };

  const handleLogin = () => {
    loginWithRedirect();
  };

  const handleSignUp = () => {
    loginWithRedirect({ screen_hint: 'signup' });
  };

  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
  };

  const handleGetStarted = () => {
    loginWithRedirect();
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      // Fetch or sync user data from your backend
      const syncUserWithBackend = async () => {
        try {
          const response = await fetch('/api/users/auth0-sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: user.name, email: user.email, university: detectUniversityFromEmail(user.email) }),
          });
          const data = await response.json();

          if (response.ok) {
            setUserData(data.user); // Set the full user data from backend
            
            // Conditional redirection based on profileCompleted status
            if (data.user && !data.user.profileCompleted) {
              // If profile is not completed, redirect to profile creation
              if (window.location.pathname !== '/create-profile') {
                navigate('/create-profile');
              }
            } else if (data.user && data.user.profileCompleted) {
              // If profile is completed, redirect to dashboard
              if (window.location.pathname !== '/dashboard') {
                navigate('/dashboard');
              }
            }
          } else {
            console.error('Backend sync failed:', data.message);
            // Optionally handle error, e.g., redirect to an error page or show a message
          }
        } catch (error) {
          console.error('Error syncing user with backend:', error);
          // Handle network or other errors
        }
      };

      // Only sync if userData is not yet loaded or if user changes (e.g., after logout/login)
      if (!userData || userData.email !== user.email) {
        syncUserWithBackend();
      }
    }
  }, [isAuthenticated, user, navigate, userData]); // Added userData to dependency array

  // Landing Page Content (without header, as it will be handled by MainLayout for authenticated routes)
  const LandingPageContent = () => (
    <div className="app">
      {/* Header removed from here - it will be global or per-layout */}

      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="container">
          <h1 className="hero-title">Scedulr</h1>
          <p className="hero-subtitle">
            Connect with classmates, build communities, and excel academically
          </p>
          {isAuthenticated && user ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '20px', color: '#fff' }}>Welcome, {user.name || user.email}!</p>
              <button className="cta-button" onClick={() => navigate('/create-profile')}>Create Your Profile</button>
            </div>
          ) : (
            <button className="cta-button" onClick={handleGetStarted}>Get Started</button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <h2 className="section-title">Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Social & Networking</h3>
              <p>Add friends and connect with classmates through suggested connections based on shared courses and interests.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Academic Integration</h3>
              <p>Upload schedules and transcripts to discover classmates in your courses across multiple universities.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏘️</div>
              <h3>Community Building</h3>
              <p>Auto-generate Discord servers for each class and form study groups with like-minded students.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Insights & Analytics</h3>
              <p>Access class statistics, grade distributions, and personalized academic recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* University Support */}
      <section className="universities" id="universities">
        <div className="container">
          <h2 className="section-title">Multi-University Support</h2>
          <div className="university-logos">
            <div className="university-item">UT</div>
            <div className="university-item">UH</div>
            <div className="university-item">Rice</div>
            <div className="university-item">+ More</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="cta-section">
        <div className="container">
          <h2>Ready to transform your academic experience?</h2>
          <button className="cta-button" onClick={handleGetStarted}>Join Scedulr</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Scedulr. Built for students, by students.</p>
          <p><a href="mailto:info@hackrice15.com" style={{ color: '#b0b0b0', textDecoration: 'none' }}>info@hackrice15.com</a></p>
        </div>
      </footer>
    </div>
  );

  // A protected route component that renders children only if authenticated
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return null; // or a loading spinner
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPageContent />} />
      <Route path="/create-profile" element={<UserProfileForm onSubmit={handleProfileSubmit} initialData={userData} />} />

      {/* Authenticated routes nested under MainLayout */}
      <Route element={<ProtectedRoute><MainLayout userData={userData} onLogout={handleLogout} /></ProtectedRoute>}>
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              userData={userData}
              onScheduleUpdate={handleUserScheduleUpdate}
              userSchedule={userSchedule}
            />
          }
        />
        <Route
          path="/dashboard/matcher"
          element={<MatcherPage currentUserSchedule={userSchedule} />}
        />
        <Route
          path="/dashboard/profile"
          element={<ProfileDetailsPage userData={userData} setUserData={setUserData} onBackToDashboard={handleNavigateToDashboard} />}
        />
      </Route>

      {/* Catch all for unhandled paths */}
      <Route path="*" element={<LandingPageContent />} />
    </Routes>
  );
}

export default App
