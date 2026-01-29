import React from "react";
import "./auth.css";
import ThemeToggle from './ThemeToggle';

export default function Auth({
  authPage,
  setAuthPage,
  loginData,
  setLoginData,
  registerData,
  setRegisterData,
  showPassword,
  setShowPassword,
  handleLogin,
  handleRegister,
  loading,
  message,
}) {
  return (
    <div className="auth-wrapper" dir="ltr">
      <div className="auth-image-side">
        <div className="auth-image-content">
          <div className="logo-circle">📚</div>
          <h1 className="brand-title">LMS</h1>
          <p className="brand-sub">Your complete platform to manage libraries and books easily.</p>
        </div>
      </div>

      <div className="auth-form-side">
        <ThemeToggle />
        <div className="auth-card">
          <div className="auth-header">
            <h2>{authPage === "login" ? "Welcome back!" : "Create a new account"}</h2>
            <p className="muted">{authPage === "login" ? "Please enter your details to sign in" : "Join our readers community"}</p>
          </div>

          {message && <div className="auth-message">{message}</div>}

          {authPage === "login" ? (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div className="form-group">
                <label className="form-label">Username or Email</label>
                <div className="input-group">
                  <div className="input-icon">👤</div>
                  <input
                    type="text"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="auth-input"
                    placeholder="Enter username or email"
                    required
                  />
                </div>
              </div>

              <div className="form-group-lg">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <div className="input-icon">🔒</div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="auth-input"
                    placeholder="Enter your password"
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="toggle password">{showPassword ? '🙈' : '👁️'}</button>
                </div>
              </div>

              <button className="btn gradient-btn" disabled={loading}>{loading ? '...' : 'Sign In'}</button>

              <div className="auth-footer">
                Don’t have an account? <button type="button" className="link-btn" onClick={() => setAuthPage("register")}>Create account</button>
              </div>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-group">
                  <div className="input-icon">👤</div>
                  <input type="text" value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} className="auth-input" placeholder="Choose a username" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="input-group">
                  <div className="input-icon">📧</div>
                  <input type="email" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} className="auth-input" placeholder="Enter your email" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <div className="input-icon">🔒</div>
                  <input type={showPassword ? 'text' : 'password'} value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} className="auth-input" placeholder="Enter a password" required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</button>
                </div>
              </div>

              <div className="form-group-lg">
                <label className="form-label">Confirm Password</label>
                <div className="input-group">
                  <div className="input-icon">🔒</div>
                  <input type={showPassword ? 'text' : 'password'} value={registerData.confirm} onChange={(e) => setRegisterData({ ...registerData, confirm: e.target.value })} className="auth-input" placeholder="Re-enter your password" required />
                </div>
              </div>

              <button className="btn gradient-btn" disabled={loading}>{loading ? '...' : 'Create account'}</button>

              <div className="auth-footer">Already have an account? <button type="button" className="link-btn" onClick={() => setAuthPage('login')}>Sign in here</button></div>
            </form>
          )}

          <div className="test-account-info">Test accounts:<br /> admin@test.com / adminpass <br /> emad12@gmail.com / emad123</div>
        </div>
      </div>
    </div>
  );
}
