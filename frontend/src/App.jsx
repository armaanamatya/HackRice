import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, useNavigate } from "react-router-dom"; // Import React Router components
import {
  IconUsers,
  IconBook,
  IconHome,
  IconChartBar,
  IconMessageCircle,
} from "@tabler/icons-react";
import UserProfileForm from "./components/UserProfileForm";
import DashboardPage from "./components/DashboardPage";
import MatcherPage from "./components/MatcherPage";
import ProfileDetailsPage from "./components/ProfileDetailsPage";
import ClassesPage from "./components/ClassesPage"; // Import the new ClassesPage
import ChatPage from "./components/ChatPage"; // Import the new ChatPage
import { SocketProvider } from "./contexts/SocketContext"; // Import Socket context
// import SettingsPage from "./components/SettingsPage"; // Import the new SettingsPage
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

  const handleNavigateToProfileDetails = (userId) => {
    navigate(
      userId
        ? `/dashboard/profile/${userId}`
        : `/dashboard/profile/${userData?._id}`
    );
  };

  const handleNavigateToClasses = () => {
    navigate("/dashboard/classes");
  };

  // const handleNavigateToSettings = () => {
  //   navigate("/dashboard/settings");
  // };

  const handleUserScheduleUpdate = (schedule) => {
    setUserSchedule(schedule);
  };

  const handleLogin = () => {
    // Store login intent to differentiate from signup
    sessionStorage.setItem("auth_intent", "login");
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: `http://localhost:5173/dashboard`,
        prompt: "login",
      },
    });
  };

  const handleSignUp = () => {
    // Store signup intent to differentiate from login
    sessionStorage.setItem("auth_intent", "signup");
    loginWithRedirect({
      screen_hint: "signup",
      authorizationParams: {
        redirect_uri: `http://localhost:5173/create-profile`,
        prompt: "login",
      },
    });
  };

  const handleLogout = () => {
    logout({ returnTo: "http://localhost:5173" });
  };

  const handleGetStarted = () => {
    // Store signup intent for new users
    sessionStorage.setItem("auth_intent", "signup");
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: `http://localhost:5173/create-profile`,
        prompt: "login",
      },
    });
  };

  useEffect(() => {
    const isMounted = {
      current: true,
    };

    console.log(
      "Auth status changed. isAuthenticated:",
      isAuthenticated,
      "user:",
      user
    );
    if (isAuthenticated && user) {
      // Fetch or sync user data from your backend
      const syncUserWithBackend = async () => {
        try {
          console.log("Syncing user with backend...");
          const response = await fetch("/api/users/auth0-sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              auth0Id: user.sub,
              name: user.name,
              email: user.email,
              university: detectUniversityFromEmail(user.email),
            }),
          });
          const data = await response.json();

          if (isMounted.current && response.ok) {
            setUserData(data.user); // Set the full user data from backend
            console.log("User data from backend:", data.user);
            console.log("User ID from backend:", data.user?._id);
            console.log(
              "Profile completed status from backend:",
              data.user?.profileCompleted
            );

            // Conditional redirection based on profileCompleted status
            const currentPath = window.location.pathname;

            if (data.user && !data.user.profileCompleted) {
              // If profile is not completed, ensure user is on profile creation page
              if (currentPath !== "/create-profile") {
                navigate("/create-profile");
              }
            } else if (data.user && data.user.profileCompleted) {
              // If profile is completed and user is on profile page or landing, redirect to dashboard
              if (currentPath === "/create-profile" || currentPath === "/") {
                navigate("/dashboard");
              }
              // If user is already on dashboard or other protected routes, let them stay
            }

            // Clear auth intent after processing
            sessionStorage.removeItem("auth_intent");
          } else if (isMounted.current) {
            console.error("Backend sync failed:", data.message);
            // Optionally handle error, e.g., redirect to an error page or show a message
          }
        } catch (error) {
          if (isMounted.current) {
            console.error("Error syncing user with backend:", error);
            // Handle network or other errors
          }
        }
      };

      // Only sync if userData is not yet loaded or if user changes (e.g., after logout/login)
      if (!userData || userData.email !== user.email) {
        syncUserWithBackend();
      }
    }

    return () => {
      isMounted.current = false;
    };
  }, [isAuthenticated, user, navigate, userData]);

  // Landing Page Content (without header, as it will be handled by MainLayout for authenticated routes)
  const LandingPageContent = () => (
    <div className="app">
      {/* Header */}
      {/* <header className="header">
        <div className="container">
          <nav className="navbar">
            <a href="/" className="logo">Skedulr</a>
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
            skedulr
            {/* <span className="terminal-cursor">_</span> */}
          </h1>
          <p className="hero-subtitle">
            turning awkward schedules into effortless connections
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
                Welcome, {user.name || "User"}!
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
            <button className="cta-button" onClick={handleSignUp}>
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
              <a href="mailto:support@skedulr.com">Let us know!</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="cta-section">
        <div className="container">
          <h2>Ready to transform your academic experience?</h2>
          <button className="cta-button" onClick={handleSignUp}>
            Join Skedulr
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 Skedulr. Built for students, by students.</p>
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
      navigate("/");
      return (
        <div className="app-loading-container">
          <div className="app-loading-card">
            <div className="app-loading-spinner"></div>
            <div className="app-loading-content">
              <h3>Redirecting</h3>
              <p>Taking you to the login page...</p>
            </div>
          </div>
        </div>
      );
    }
    return children;
  };

  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<LandingPageContent />} />
        <Route
          path="/create-profile"
          element={
            userData && userData._id && !userData.profileCompleted ? (
              <UserProfileForm
                onSubmit={handleProfileSubmit}
                initialData={userData}
              />
            ) : (
              <div className="app-loading-container">
                <div className="app-loading-card">
                  <div className="app-loading-spinner"></div>
                  <div className="app-loading-content">
                    <h3>Loading Profile</h3>
                    <p>Preparing your profile setup...</p>
                  </div>
                </div>
              </div>
            )
          }
        />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage
              userData={userData}
              onBackToDashboard={handleNavigateToDashboard}
              onNavigateToMatcher={handleNavigateToMatcher}
              onNavigateToProfileDetails={handleNavigateToProfileDetails}
              onScheduleUpdate={handleUserScheduleUpdate}
              userSchedule={userSchedule}
              onLogout={handleLogout}
              onNavigateToClasses={handleNavigateToClasses} // Pass the new prop here
              userUniversity={userData?.university} // Pass user's university
              // onNavigateToSettings={handleNavigateToSettings} // Pass the new prop here
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/matcher"
        element={
          <ProtectedRoute>
            <MatcherPage
              onBackToDashboard={handleNavigateToDashboard}
              currentUserSchedule={userSchedule}
              userId={userData?._id} // Pass userId to MatcherPage
              userUniversity={userData?.university} // Pass userUniversity to MatcherPage
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/profile/:userId"
        element={
          <ProtectedRoute>
            <ProfileDetailsPage
              // userData={userData} // ProfileDetailsPage will fetch its own data
              // setUserData={setUserData} // No longer needed here as ProfileDetailsPage manages its own data
              onBackToDashboard={handleNavigateToDashboard}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/classes"
        element={
          <ProtectedRoute>
            <ClassesPage userData={userData} userSchedule={userSchedule} onBackToDashboard={handleNavigateToDashboard} />
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/dashboard/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      /> */}
      {/* Redirect any unhandled paths to the landing page or a 404 page */}
      <Route path="*" element={<LandingPageContent />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;
