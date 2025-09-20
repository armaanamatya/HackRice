import React, { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Routes, Route, useNavigate } from 'react-router-dom' // Import React Router components
import UserProfileForm from './components/UserProfileForm'
import DashboardPage from './components/DashboardPage'
import MatcherPage from './components/MatcherPage'
import ProfileDetailsPage from './components/ProfileDetailsPage'
import { detectUniversityFromEmail } from './utils/universityUtils'
import './App.css'

function App() {
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
  const [userData, setUserData] = useState(null);
  const [userSchedule, setUserSchedule] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Removed showProfileForm state as it's replaced by routing
  // const [showProfileForm, setShowProfileForm] = useState(false);

  // Refactored to use navigate
  const handleCreateProfileClick = () => {
    navigate('/create-profile');
  };

  const handleProfileSubmit = (data) => {
    setUserData(prevData => ({
      ...prevData,
      ...data,
    }));
    navigate('/dashboard'); // Navigate to dashboard after profile submission
  };

  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };

  const handleNavigateToMatcher = () => {
    navigate('/dashboard/matcher');
  };

  const handleNavigateToProfileDetails = () => {
    navigate('/dashboard/profile');
  };

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
      const userEmail = user.email;
      const detectedUniversity = detectUniversityFromEmail(userEmail);

      if (!userData) {
        setUserData({
          name: user.name || user.nickname || 'User',
          email: user.email,
          university: detectedUniversity,
        });
        // After initial setup, navigate to dashboard if on landing page
        if (window.location.pathname === '/' || window.location.pathname === '/create-profile') {
          navigate('/dashboard');
        }
      } else if (window.location.pathname === '/' || window.location.pathname === '/create-profile') {
        // If user is authenticated and userData exists, and they are on landing or profile creation, redirect to dashboard
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, userData, navigate]);

  // Conditional rendering for the landing page or a general layout
  const LandingPageContent = () => (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <nav className="navbar">
            <a href="/" className="logo">Scedulr</a>
            <div className="nav-buttons">
              {isAuthenticated ? (
                <button className="nav-button login-button" onClick={handleLogout}>Logout</button>
              ) : (
                <>
                  <button className="nav-button sign-up-button" onClick={handleSignUp}>Sign Up</button>
                  <button className="nav-button login-button" onClick={handleLogin}>Login</button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

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
              {/* Use navigate for profile creation */}
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

  return (
    <Routes>
      <Route path="/" element={<LandingPageContent />} />
      <Route path="/create-profile" element={<UserProfileForm onSubmit={handleProfileSubmit} initialData={userData} />} />
      <Route
        path="/dashboard"
        element={
          <DashboardPage
            userData={userData}
            onBackToDashboard={handleNavigateToDashboard}
            onNavigateToMatcher={handleNavigateToMatcher}
            onNavigateToProfileDetails={handleNavigateToProfileDetails}
            onScheduleUpdate={handleUserScheduleUpdate}
            userSchedule={userSchedule}
            onLogout={handleLogout}
          />
        }
      />
      <Route path="/dashboard/matcher" element={<MatcherPage onBackToDashboard={handleNavigateToDashboard} currentUserSchedule={userSchedule} />} />
      <Route
        path="/dashboard/profile"
        element={
          <ProfileDetailsPage
            userData={userData}
            onBackToDashboard={handleNavigateToDashboard}
          />
        }
      />
      {/* Redirect any unhandled paths to the landing page or a 404 page */}
      <Route path="*" element={<LandingPageContent />} />
    </Routes>
  );
}

export default App
