import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, useNavigate } from "react-router-dom"; // Import React Router components
import {
  IconUsers,
  IconBook,
  IconHome,
  IconChartBar,
} from "@tabler/icons-react";
import UserProfileForm from "./components/UserProfileForm";
import DashboardPage from "./components/DashboardPage";
import MatcherPage from "./components/MatcherPage";
import ProfileDetailsPage from "./components/ProfileDetailsPage";
import { detectUniversityFromEmail } from "./utils/universityUtils";
// Using actual logos from public folder
// import utLogo from './assets/university-logos/ut.svg'
// import tamuLogo from './assets/university-logos/tamu.svg'
// import untLogo from './assets/university-logos/unt.svg'
import "./App.css";

function App() {
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
  const [userData, setUserData] = useState(null);
  const [userSchedule, setUserSchedule] = useState(null);
  const navigate = useNavigate();

  const handleCreateProfileClick = () => {
    navigate("/create-profile");
  };

  const handleProfileSubmit = (data) => {
    setUserData((prevData) => ({
      ...prevData,
      ...data,
    }));
    navigate("/dashboard"); // Navigate to dashboard after profile submission
  };

  const handleNavigateToDashboard = () => {
    navigate("/dashboard");
  };

  const handleNavigateToMatcher = () => {
    navigate("/dashboard/matcher");
  };

  const handleNavigateToProfileDetails = () => {
    navigate("/dashboard/profile");
  };

  const handleUserScheduleUpdate = (schedule) => {
    setUserSchedule(schedule);
  };

  const handleLogin = () => {
    loginWithRedirect();
  };

  const handleSignUp = () => {
    loginWithRedirect({ screen_hint: "signup" });
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
          const response = await fetch("/api/users/auth0-sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              university: detectUniversityFromEmail(user.email),
            }),
          });
          const data = await response.json();

          if (response.ok) {
            setUserData(data.user); // Set the full user data from backend

            // Conditional redirection based on profileCompleted status
            if (data.user && !data.user.profileCompleted) {
              // If profile is not completed, redirect to profile creation
              if (window.location.pathname !== "/create-profile") {
                navigate("/create-profile");
              }
            } else if (data.user && data.user.profileCompleted) {
              // If profile is completed, redirect to dashboard
              if (window.location.pathname !== "/dashboard") {
                navigate("/dashboard");
              }
            }
          } else {
            console.error("Backend sync failed:", data.message);
            // Optionally handle error, e.g., redirect to an error page or show a message
          }
        } catch (error) {
          console.error("Error syncing user with backend:", error);
          // Handle network or other errors
        }
      };

      // Only sync if userData is not yet loaded or if user changes (e.g., after logout/login)
      if (!userData || userData.email !== user.email) {
        syncUserWithBackend();
      }
    }
  }, [isAuthenticated, user, navigate, userData]);

  // Landing Page Content (without header, as it will be handled by MainLayout for authenticated routes)
  const LandingPageContent = () => (
    <div className="app">
      {/* Header */}
      {/* <header className="header">
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
      </header> */}

      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="container">
          <h1 className="hero-title">
            scedulr
            {/* <span className="terminal-cursor">_</span> */}
          </h1>
          <p className="hero-subtitle">
            connect with classmates, build communities, and excel academically
          </p>
          {isAuthenticated && user ? (
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  marginBottom: "20px",
                  color: "#666",
                  fontWeight: "500",
                }}
              >
                Welcome, {user.name || user.email}!
              </p>
              {/* Use navigate for profile creation */}
              <button
                className="cta-button"
                onClick={() => navigate("/create-profile")}
              >
                Create Your Profile
              </button>
            </div>
          ) : (
            <button className="cta-button" onClick={handleGetStarted}>
              Get Started
            </button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="features-header">
            <h2 className="section-title">Everything you need to succeed</h2>
            <p className="section-subtitle">
              Powerful tools to connect, collaborate, and excel in your academic
              journey
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <IconUsers size={28} className="feature-icon" />
              </div>
              <div className="feature-content">
                <h3>Smart Connections</h3>
                <p>
                  Discover classmates through intelligent matching based on
                  shared courses, interests, and academic goals.
                </p>
                <div className="feature-badge">Social</div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <IconBook size={28} className="feature-icon" />
              </div>
              <div className="feature-content">
                <h3>Academic Sync</h3>
                <p>
                  Seamlessly upload and sync your schedules across multiple
                  universities to find study partners.
                </p>
                <div className="feature-badge">Integration</div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <IconHome size={28} className="feature-icon" />
              </div>
              <div className="feature-content">
                <h3>Community Hubs</h3>
                <p>
                  Auto-generated Discord servers and study groups for every
                  class, fostering collaborative learning.
                </p>
                <div className="feature-badge">Community</div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <IconChartBar size={28} className="feature-icon" />
              </div>
              <div className="feature-content">
                <h3>Smart Insights</h3>
                <p>
                  Get personalized academic recommendations and insights based
                  on class statistics and trends.
                </p>
                <div className="feature-badge">Analytics</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* University Support */}
      <section className="universities" id="universities">
        <div className="container">
          <div className="universities-header">
            <h2 className="section-title">Trusted by students across Texas</h2>
            <p className="section-subtitle">
              Connect with classmates from leading universities and expand your
              academic network
            </p>
          </div>
          <div className="university-grid">
            {/* <div className="university-card">
              <div className="university-logo">
                <img src={utLogo} alt="University of Texas" />
              </div>
              <div className="university-info">
                <h3>University of Texas</h3>
                <p>Austin</p>
              </div>
            </div> */}
            <div className="university-card">
              <div className="university-logo">
                <img
                  src="/University_of_Houston_Logo.svg"
                  alt="University of Houston"
                />
              </div>
              <div className="university-info">
                <h3>University of Houston</h3>
                <p>Houston</p>
              </div>
            </div>
            <div className="university-card">
              <div className="university-logo">
                <img src="/Rice.webp" alt="Rice University" />
              </div>
              <div className="university-info">
                <h3>Rice University</h3>
                <p>Houston</p>
              </div>
            </div>
            {/* <div className="university-card">
              <div className="university-logo">
                <img src={tamuLogo} alt="Texas A&M University" />
              </div>
              <div className="university-info">
                <h3>Texas A&M</h3>
                <p>College Station</p>
              </div>
            </div> */}
            {/* <div className="university-card">
              <div className="university-logo">
                <img src={untLogo} alt="University of North Texas" />
              </div>
              <div className="university-info">
                <h3>University of North Texas</h3>
                <p>Denton</p>
              </div>
            </div> */}
            <div className="university-card">
              <div className="university-logo">
                <img src="/UT_Dallas.png" alt="UT Dallas" />
              </div>
              <div className="university-info">
                <h3>UT Dallas</h3>
                <p>Richardson</p>
              </div>
            </div>
          </div>
          <div className="university-cta">
            <p>
              Don't see your university?{" "}
              <a href="mailto:support@scedulr.com">Let us know!</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="cta-section">
        <div className="container">
          <h2>Ready to transform your academic experience?</h2>
          <button className="cta-button" onClick={handleGetStarted}>
            Join Scedulr
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 Scedulr. Built for students, by students.</p>
          <p>
            <a
              href="mailto:info@email.com"
              style={{ color: "#888", textDecoration: "none" }}
            >
              info@email.com
            </a>
          </p>
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
      <Route
        path="/create-profile"
        element={
          <UserProfileForm
            onSubmit={handleProfileSubmit}
            initialData={userData}
          />
        }
      />
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
      <Route
        path="/dashboard/matcher"
        element={
          <MatcherPage
            onBackToDashboard={handleNavigateToDashboard}
            currentUserSchedule={userSchedule}
          />
        }
      />
      <Route
        path="/dashboard/profile"
        element={
          <ProfileDetailsPage
            userData={userData}
            setUserData={setUserData}
            onBackToDashboard={handleNavigateToDashboard}
          />
        }
      />
      {/* Redirect any unhandled paths to the landing page or a 404 page */}
      <Route path="*" element={<LandingPageContent />} />
    </Routes>
  );
}

export default App;
