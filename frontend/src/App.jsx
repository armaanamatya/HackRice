import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, useNavigate } from "react-router-dom";
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
import ClassesPage from "./components/ClassesPage";
import ChatPage from "./components/ChatPage";
import BookmarkedCoursesPage from "./components/BookmarkedCoursesPage";
import { SocketProvider } from "./contexts/SocketContext";
import { detectUniversityFromEmail } from "./utils/universityUtils";
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
    navigate("/dashboard");
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

  const handleNavigateToBookmarks = () => {
    navigate("/dashboard/bookmarks");
  };

  const handleUserScheduleUpdate = (schedule) => {
    setUserSchedule(schedule);
  };

  const handleLogin = () => {
    sessionStorage.setItem("auth_intent", "login");
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: `http://localhost:5173/dashboard`,
        prompt: "login",
      },
    });
  };

  const handleSignUp = () => {
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
            setUserData(data.user);
            console.log("User data from backend:", data.user);
            console.log("User ID from backend:", data.user?._id);
            console.log(
              "Profile completed status from backend:",
              data.user?.profileCompleted
            );

            const currentPath = window.location.pathname;

            if (data.user && !data.user.profileCompleted) {
              if (currentPath !== "/create-profile") {
                navigate("/create-profile");
              }
            } else if (data.user && data.user.profileCompleted) {
              if (currentPath === "/create-profile" || currentPath === "/") {
                navigate("/dashboard");
              }
            }

            sessionStorage.removeItem("auth_intent");
          } else if (isMounted.current) {
            console.error("Backend sync failed:", data.message);
          }
        } catch (error) {
          if (isMounted.current) {
            console.error("Error syncing user with backend:", error);
          }
        }
      };

      if (!userData || userData.email !== user.email) {
        syncUserWithBackend();
      }
    }

    return () => {
      isMounted.current = false;
    };
  }, [isAuthenticated, user, navigate, userData]);

  const LandingPageContent = () => (
    <div className="app">
      <section className="hero" id="hero">
        <div className="container">
          <h1 className="hero-title">
            skedulr
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

      <section className="cta-section" id="cta-section">
        <div className="container">
          <h2>Ready to transform your academic experience?</h2>
          <button className="cta-button" onClick={handleSignUp}>
            Join Skedulr
          </button>
        </div>
      </section>

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
              onNavigateToClasses={handleNavigateToClasses}
              onNavigateToBookmarks={handleNavigateToBookmarks}
              userUniversity={userData?.university}
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
                userId={userData?._id}
                userUniversity={userData?.university}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile/:userId"
          element={
            <ProtectedRoute>
              <ProfileDetailsPage
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
      <Route
        path="/dashboard/bookmarks"
        element={
          <ProtectedRoute>
            <BookmarkedCoursesPage userData={userData} onBackToDashboard={handleNavigateToDashboard} />
          </ProtectedRoute>
        }
      />
        <Route path="*" element={<LandingPageContent />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;