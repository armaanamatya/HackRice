import React, { useState } from 'react'
import UserProfileForm from './components/UserProfileForm'
import './App.css'

function App() {
  const [showProfileForm, setShowProfileForm] = useState(false);

  const handleCreateProfileClick = () => {
    setShowProfileForm(true);
  };

  const handleProfileSubmit = () => {
    setShowProfileForm(false);
    // Potentially show a success message or redirect to a dashboard
  };

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
                  <button className="nav-button sign-up-button" onClick={handleCreateProfileClick}>Sign Up</button>
                  <button className="nav-button login-button">Login</button>
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
              <button className="cta-button" onClick={handleCreateProfileClick}>Get Started</button>
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
              <button className="cta-button" onClick={handleCreateProfileClick}>Join Scedulr</button>
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
