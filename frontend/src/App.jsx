import React, { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import UserProfileForm from './components/UserProfileForm'
import './App.css'

function App() {
  const { loginWithRedirect, logout, isAuthenticated, isLoading, user, getAccessTokenSilently, getIdTokenClaims } = useAuth0();
  const [showProfileForm, setShowProfileForm] = useState(false);

  const handleSignUp = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup'
      }
    });
  };

  const handleLogin = () => {
    loginWithRedirect();
  };

  const handleLogout = () => {
    logout({ 
      logoutParams: { returnTo: window.location.origin } 
    });
    setShowProfileForm(false);
  };

  const handleProfileSubmit = () => {
    setShowProfileForm(false);
    // Potentially show a success message or redirect to a dashboard
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setShowProfileForm(true);
    } else {
      handleSignUp();
    }
  };

  // Log user profile info and sync with MongoDB when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Console log all user profile information
      console.log('Auth0 User Profile:', {
        sub: user.sub,
        name: user.name,
        email: user.email,
        picture: user.picture,
        email_verified: user.email_verified,
        updated_at: user.updated_at,
        ...user
      });

      // Get and log tokens
      const logTokens = async () => {
        try {
          const accessToken = await getAccessTokenSilently();
          const idTokenClaims = await getIdTokenClaims();
          
          console.log('Access Token:', accessToken);
          console.log('ID Token Claims:', idTokenClaims);
          console.log('Check localStorage for auth tokens:', Object.keys(localStorage).filter(key => key.includes('auth0')));
        } catch (error) {
          console.error('Error getting tokens:', error);
        }
      };

      logTokens();

      // Sync user with MongoDB
      const syncUserWithMongoDB = async () => {
        try {
          const response = await fetch('/api/users/auth0-sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: user.name || user.email,
              email: user.email
            })
          });

          const data = await response.json();
          
          if (response.ok) {
            console.log('User synced with MongoDB:', data);
          } else {
            console.error('Failed to sync user with MongoDB:', data.message);
          }
        } catch (error) {
          console.error('Error syncing user with MongoDB:', error);
        }
      };

      syncUserWithMongoDB();
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="app" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {showProfileForm ? (
        <UserProfileForm onSubmit={handleProfileSubmit} />
      ) : (
        <>
          {/* Header */}
          <header className="header">
            <div className="container">
              <nav className="navbar">
                <a href="#hero" className="logo">Scedulr</a>
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
                  <button className="cta-button" onClick={() => setShowProfileForm(true)}>Create Your Profile</button>
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
        </>
      )}
    </div>
  )
}

export default App
