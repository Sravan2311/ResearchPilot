import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Cpu, 
  FileText, 
  Plus, 
  Trash2, 
  Settings, 
  AlertCircle, 
  Activity, 
  Database, 
  Key, 
  CheckCircle2, 
  Layers, 
  LogOut, 
  User, 
  Mail, 
  Lock, 
  History, 
  ChevronRight, 
  Calendar,
  X,
  Bell,
  Award,
  Info,
  MessageSquare,
  Send,
  MoreVertical
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Auth Form State
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');

  // Main App State
  const [files, setFiles] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Contact Form State
  const [contactName, setContactName] = useState(username || '');
  const [contactEmail, setContactEmail] = useState(email || '');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);

  // SMTP Configuration State
  const [smtpUser, setSmtpUser] = useState(localStorage.getItem('smtpUser') || '');
  const [smtpPassword, setSmtpPassword] = useState(localStorage.getItem('smtpPassword') || '');
  const [smtpHost, setSmtpHost] = useState(localStorage.getItem('smtpHost') || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(localStorage.getItem('smtpPort') || '587');

  // Profile and Password Reset State
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [role, setRole] = useState('Researcher');
  const [createdAt, setCreatedAt] = useState(0);
  const [profileLoading, setProfileLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('gaps');
  
  // Pipeline/Dossier Outputs
  const [logs, setLogs] = useState([]);
  const [papers, setPapers] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [error, setError] = useState(null);
  
  // Historical Dossiers
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  // Notification & Inline Confirm States
  const [notifications, setNotifications] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  // Navigation State
  const [currentView, setCurrentView] = useState('dashboard');

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const logsEndRef = useRef(null);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      localStorage.setItem('email', email);
      fetchHistory();
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
    }
  }, [token]);

  // Sync contact details on user change
  useEffect(() => {
    if (username) setContactName(username);
    if (email) setContactEmail(email);
  }, [username, email]);

  // Sync SMTP config to localStorage
  useEffect(() => {
    localStorage.setItem('smtpUser', smtpUser);
    localStorage.setItem('smtpPassword', smtpPassword);
    localStorage.setItem('smtpHost', smtpHost);
    localStorage.setItem('smtpPort', smtpPort);
  }, [smtpUser, smtpPassword, smtpHost, smtpPort]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Fetch past dossiers
  const fetchHistory = async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistoryList(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFullName(data.full_name || '');
        setInstitution(data.institution || '');
        setRole(data.role || 'Researcher');
        setCreatedAt(data.created_at || 0);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          institution: institution,
          role: role
        })
      });
      if (response.ok) {
        addNotification('Profile settings updated successfully!', 'success');
        fetchUserProfile();
      } else {
        const data = await response.json();
        addNotification(data.detail || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      addNotification('Connection error while updating profile.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = isRegister ? 'register' : 'login';
    const payload = isRegister 
      ? { username: formUsername, email: formEmail, password: formPassword }
      : { email: formEmail, password: formPassword };

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed.');
      }

      if (isRegister) {
        // Automatically switch to login on successful register
        setIsRegister(false);
        setFormPassword('');
        addNotification('Registration successful! Please login with your credentials.', 'success');
      } else {
        // Save token and info
        setToken(data.token);
        setUsername(data.username);
        setEmail(data.email);
        addNotification(`Welcome back, ${data.username}! Login successful.`, 'success');
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    const oldUser = username;
    setToken('');
    setUsername('');
    setEmail('');
    setPapers([]);
    setMatrix([]);
    setGaps([]);
    setLogs([]);
    setHistoryList([]);
    setSelectedHistoryId(null);
    addNotification(`Goodbye, ${oldUser}! Signed out successfully.`, 'info');
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const pdfs = selectedFiles.filter(file => file.type === 'application/pdf');
    if (pdfs.length !== selectedFiles.length) {
      addNotification('Only PDF files are supported for paper extraction.', 'warning');
    }
    setFiles(prev => [...prev, ...pdfs]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfs = droppedFiles.filter(file => file.type === 'application/pdf');
    if (pdfs.length !== droppedFiles.length) {
      addNotification('Only PDF files are supported for paper extraction.', 'warning');
    }
    setFiles(prev => [...prev, ...pdfs]);
  };

  const startAnalysis = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    setError(null);
    setLogs([{ timestamp: Date.now() / 1000, agent: 'Coordinator Agent', message: 'Initializing pipeline. Uploading files to server...' }]);
    setPapers([]);
    setMatrix([]);
    setGaps([]);
    setSelectedHistoryId(null);
    setCurrentView('monitor'); // Redirect to Agent Monitor tab to see real-time log!

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    if (apiKey) formData.append('api_key', apiKey);
    if (baseUrl) formData.append('base_url', baseUrl);

    try {
      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process files.');
      }

      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
        setPapers(data.papers);
        setMatrix(data.matrix);
        setGaps(data.gaps);
        setFiles([]);
        fetchHistory(); // Refresh historical dossiers list
        addNotification('Literature survey analysis completed successfully!', 'success');
        setCurrentView('dashboard'); // Redirect back to Dashboard to show comparison matrix and gaps!
      } else {
        setError('Analysis failed: Coordinator agent reported errors.');
        setLogs(data.logs || []);
      }
    } catch (err) {
      setError(err.message || 'Error communicating with backend API.');
      setLogs(prev => [
        ...prev,
        { timestamp: Date.now() / 1000, agent: 'Coordinator Agent', message: `Critical Failure: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryEntry = (entry) => {
    setSelectedHistoryId(entry.id);
    setPapers(entry.papers);
    setMatrix(entry.matrix);
    setGaps(entry.gaps);
    setLogs([
      { timestamp: entry.timestamp, agent: 'Coordinator Agent', message: `Loaded historical dossier from ${new Date(entry.timestamp * 1000).toLocaleString()}` }
    ]);
  };

  const deleteHistoryEntry = async (id, e) => {
    e.stopPropagation(); // Avoid triggering card load
    try {
      const response = await fetch(`${BACKEND_URL}/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        if (selectedHistoryId === id) {
          setPapers([]);
          setMatrix([]);
          setGaps([]);
          setLogs([]);
          setSelectedHistoryId(null);
        }
        addNotification('Dossier survey deleted from history database.', 'success');
        setConfirmDeleteId(null);
        fetchHistory();
      } else {
        const data = await response.json();
        addNotification(data.detail || 'Failed to delete history entry.', 'error');
      }
    } catch (err) {
      addNotification('Error deleting history entry.', 'error');
    }
  };

  const getAgentBadgeClass = (agent) => {
    switch (agent) {
      case 'Coordinator Agent': return 'coordinator';
      case 'PDF Reader Agent': return 'pdf-reader';
      case 'Research Gap Agent': return 'research-gap';
      default: return '';
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      // 1. Sync to local database
      const dbResponse = await fetch(`${BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: contactSubject,
          message: contactMessage,
          smtp_config: null
        })
      });
      
      // 2. Dispatch email directly from user browser to bypass server spam blocks
      const ticketId = `RP-${Math.floor(Date.now() / 1000) % 1000000}`;
      const emailResponse = await fetch('https://formsubmit.co/ajax/saisravanrajm@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          "Ticket ID": ticketId,
          "Sender Name": contactName,
          "Sender Email": contactEmail,
          "Ticket Subject": contactSubject,
          "Message Details": contactMessage,
          "Timestamp": new Date().toLocaleString(),
          "_subject": `[ResearchPilot Admin Ticket] - ${contactSubject}`
        })
      });

      if (dbResponse.ok && emailResponse.ok) {
        addNotification('Ticket sent to database & dispatched to admin email!', 'success');
        setContactSubject('');
        setContactMessage('');
      } else if (dbResponse.ok) {
        // Database succeeded, but email requires verification activation link click
        addNotification('Ticket stored. Verification activation email sent to your Gmail!', 'info');
        setContactSubject('');
        setContactMessage('');
      } else {
        const data = await dbResponse.json();
        addNotification(data.detail || 'Failed to submit ticket details.', 'error');
      }
    } catch (err) {
      addNotification('Connection error while submitting ticket.', 'error');
    } finally {
      setContactLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      addNotification('Please enter both your current and new passwords.', 'error');
      return;
    }
    setResetPasswordLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        addNotification('Password reset successfully!', 'success');
        setOldPassword('');
        setNewPassword('');
        setShowProfile(false);
      } else {
        addNotification(data.detail || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      addNotification('Connection error while resetting password.', 'error');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // --- Auth View Screen ---
  if (!token) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="bg-glow"></div>
        <div className="bg-glow-secondary"></div>

        <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--primary-glow)', borderRadius: '50%', marginBottom: '1rem' }}>
              <Brain className="rotating-icon" style={{ color: 'var(--primary)', width: '36px', height: '36px' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '2rem' }}>
              ResearchPilot <span style={{ color: 'var(--accent)' }}>AI</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Multi-Agent Literature Survey Suite
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {authError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                <AlertCircle size={16} style={{ color: 'var(--error)' }} />
                <span style={{ color: 'var(--error)', fontWeight: 500 }}>{authError}</span>
              </div>
            )}

            {isRegister && (
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Username" 
                  required
                  className="input-pill" 
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                />
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                placeholder="Email Address" 
                required
                className="input-pill" 
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                placeholder="Password" 
                required
                className="input-pill" 
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-action" disabled={authLoading} style={{ marginTop: '0.5rem' }}>
              {authLoading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </span>{' '}
            <button 
              className="tab-button" 
              style={{ color: 'var(--primary)', padding: 0, border: 'none', borderBottom: '1px dashed var(--primary)', fontSize: '0.85rem' }}
              onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
            >
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Dashboard App View ---
  return (
    <div className="app-container">
      <div className="bg-glow"></div>
      <div className="bg-glow-secondary"></div>

      {/* Top Header Section */}
      <header className="app-header">
        <div className="brand-section">
          <h1 className="brand-logo">
            <Brain className="rotating-icon" style={{ color: '#818cf8', width: 28, height: 28 }} />
            ResearchPilot <span style={{ color: '#a855f7' }}>AI</span>
          </h1>
          <span className="brand-badge">Multi-Agent Suite</span>
        </div>

        <div className="api-settings" style={{ gap: '1rem' }}>
          {/* User Profile Button + Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              className="input-pill" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: showProfile ? 'var(--bg-tertiary)' : 'var(--glass-bg)' }}
              onClick={() => {
                setShowProfile(!showProfile);
                setShowSettings(false);
                setShowMobileMenu(false);
              }}
            >
              <User size={15} style={{ color: 'var(--primary)' }} />
              <span className="hide-on-mobile" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{username}</span>
            </button>

            {showProfile && (
              <div 
                className="glass-panel" 
                style={{ 
                  position: 'absolute', 
                  top: 'calc(100% + 0.75rem)', 
                  right: 0, 
                  width: '220px', 
                  padding: '1rem', 
                  zIndex: 1010, 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ padding: '0.25rem 0.5rem' }}>
                  <span style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-primary)', fontWeight: 700 }}>{username}</span>
                  <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <button 
                    onClick={() => {
                      setCurrentView('profile');
                      setShowProfile(false);
                      fetchUserProfile();
                    }}
                    className="nav-link"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.55rem 0.75rem', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)' }}
                  >
                    <User size={14} style={{ marginRight: '0.4rem' }} />
                    Profile Settings
                  </button>

                  <button 
                    onClick={handleSignOut} 
                    className="nav-link"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.55rem 0.75rem', color: 'var(--error)', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)' }}
                  >
                    <LogOut size={14} style={{ marginRight: '0.4rem' }} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings Button + Floating Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              className="input-pill" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: showSettings ? 'var(--bg-tertiary)' : 'var(--glass-bg)' }}
              onClick={() => {
                setShowSettings(!showSettings);
                setShowProfile(false);
                setShowMobileMenu(false);
              }}
            >
              <Settings size={16} />
              <span className="hide-on-mobile">LLM Settings</span>
            </button>
            
            {showSettings && (
              <div 
                className="glass-panel" 
                style={{ 
                  position: 'absolute', 
                  top: 'calc(100% + 0.75rem)', 
                  right: 0, 
                  width: '300px', 
                  padding: '1.25rem', 
                  zIndex: 1010, 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Key size={14} style={{ color: 'var(--primary)' }} />
                  LLM Settings
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Configure custom API endpoints for local models (e.g. Ollama or LM Studio).
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 600 }}>API Key</label>
                    <input 
                      type="password" 
                      placeholder="sk-..." 
                      className="input-pill"
                      style={{ width: '100%', fontSize: '0.8rem' }}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 600 }}>Base URL</label>
                    <input 
                      type="text" 
                      placeholder="http://localhost:11434/v1" 
                      className="input-pill"
                      style={{ width: '100%', fontSize: '0.8rem' }}
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button (Three Dots) */}
          <div className="mobile-menu-container" style={{ position: 'relative' }}>
            <button 
              className="input-pill mobile-menu-btn" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '0.55rem', background: showMobileMenu ? 'var(--bg-tertiary)' : 'var(--glass-bg)' }}
              onClick={() => {
                setShowMobileMenu(!showMobileMenu);
                setShowSettings(false);
                setShowProfile(false);
              }}
            >
              <MoreVertical size={18} />
            </button>

            {showMobileMenu && (
              <div 
                className="glass-panel mobile-nav-dropdown"
                style={{ 
                  position: 'absolute', 
                  top: 'calc(100% + 0.75rem)', 
                  right: 0, 
                  width: '200px', 
                  padding: '0.75rem', 
                  zIndex: 1010, 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <button 
                  className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => { setCurrentView('dashboard'); setShowMobileMenu(false); }}
                >
                  <Layers size={14} />
                  <span>Dashboard</span>
                </button>
                <button 
                  className={`nav-link ${currentView === 'history' ? 'active' : ''}`}
                  onClick={() => { setCurrentView('history'); setShowMobileMenu(false); }}
                >
                  <History size={14} />
                  <span>Research History</span>
                </button>
                <button 
                  className={`nav-link ${currentView === 'monitor' ? 'active' : ''}`}
                  onClick={() => { setCurrentView('monitor'); setShowMobileMenu(false); }}
                >
                  <Cpu size={14} />
                  <span>Agent Monitor</span>
                </button>
                <button 
                  className={`nav-link ${currentView === 'about' ? 'active' : ''}`}
                  onClick={() => { setCurrentView('about'); setShowMobileMenu(false); }}
                >
                  <Info size={14} />
                  <span>About System</span>
                </button>
                <button 
                  className={`nav-link ${currentView === 'contact' ? 'active' : ''}`}
                  onClick={() => { setCurrentView('contact'); setShowMobileMenu(false); }}
                >
                  <MessageSquare size={14} />
                  <span>Contact</span>
                </button>
                <button 
                  className={`nav-link ${currentView === 'profile' ? 'active' : ''}`}
                  onClick={() => { setCurrentView('profile'); fetchUserProfile(); setShowMobileMenu(false); }}
                >
                  <User size={14} />
                  <span>User Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Section: Sidebar Navigation + Pages Content */}
      <div className="main-body-container">
        
        {/* Left Navigation Sidebar */}
        <aside className="app-sidebar">
          <nav className="sidebar-nav">
            <button 
              className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              <Layers size={15} />
              <span>Dashboard</span>
            </button>
            <button 
              className={`nav-link ${currentView === 'history' ? 'active' : ''}`}
              onClick={() => setCurrentView('history')}
            >
              <History size={15} />
              <span>Research History</span>
            </button>
            <button 
              className={`nav-link ${currentView === 'monitor' ? 'active' : ''}`}
              onClick={() => setCurrentView('monitor')}
            >
              <Cpu size={15} />
              <span>Agent Monitor</span>
            </button>
            <button 
              className={`nav-link ${currentView === 'about' ? 'active' : ''}`}
              onClick={() => setCurrentView('about')}
            >
              <Info size={15} />
              <span>About System</span>
            </button>
            <button 
              className={`nav-link ${currentView === 'contact' ? 'active' : ''}`}
              onClick={() => setCurrentView('contact')}
            >
              <MessageSquare size={15} />
              <span>Contact</span>
            </button>
            <button 
              className={`nav-link ${currentView === 'profile' ? 'active' : ''}`}
              onClick={() => { setCurrentView('profile'); fetchUserProfile(); }}
            >
              <User size={15} />
              <span>User Profile</span>
            </button>
          </nav>
        </aside>

        {/* Middle Pages Content Area */}
        <main className="main-content">
      {currentView === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
          
          {/* Horizontal Upload Panel */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'row', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 4vw, 2rem)' }}>
            <div style={{ flex: '1 1 300px' }}>
              <h2 className="agent-monitor-title" style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={18} style={{ color: 'var(--primary)' }} />
                Analyze Research Papers
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Upload multiple research PDFs to automatically extract comparative literature matrices and formulate novel project ideas.
              </p>
            </div>

            <div 
              className="upload-container"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('pdf-input').click()}
              style={{ flex: '1 1 300px', padding: '1.25rem 1rem', background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed' }}
            >
              <input 
                type="file" 
                id="pdf-input" 
                multiple 
                accept=".pdf" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              <FileText className="upload-icon" style={{ fontSize: '1.5rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }} />
              <div className="upload-title" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Drop PDFs or click to browse</div>
            </div>

            <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '220px' }}>
              {files.length > 0 ? (
                <div className="file-list" style={{ maxHeight: '80px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                  {files.map((file, idx) => (
                    <div className="file-item" key={idx} style={{ padding: '0.25rem 0.4rem', margin: '0.15rem 0' }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%', fontSize: '0.725rem' }}>
                        📄 {file.name}
                      </span>
                      <button className="file-remove" onClick={(e) => { e.stopPropagation(); removeFile(idx); }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                  No papers selected
                </div>
              )}

              <button 
                className="btn-action" 
                onClick={startAnalysis}
                disabled={files.length === 0 || loading}
                style={{ width: '100%', padding: '0.6rem 1rem', fontSize: '0.85rem' }}
              >
                {loading ? (
                  <>
                    <Activity size={15} className="rotating-icon" />
                    Analyzing Papers...
                  </>
                ) : (
                  <>
                    <Brain size={15} />
                    Analyze Literature
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Results (Matrix / Gaps) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          
          {error && (
            <div className="glass-panel" style={{ borderColor: 'var(--error)', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <AlertCircle size={20} style={{ color: 'var(--error)', shrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--error)' }}>Connection Error: </strong>
                <span style={{ color: 'var(--text-secondary)' }}>{error}</span>
              </div>
            </div>
          )}

          {gaps.length > 0 || matrix.length > 0 ? (
            <div className="glass-panel" style={{ flexGrow: 1 }}>
              
              {/* Tab Navigation */}
              <div className="tabs-container">
                <button 
                  className={`tab-button ${activeTab === 'gaps' ? 'active' : ''}`}
                  onClick={() => setActiveTab('gaps')}
                >
                  <Award size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                  IEEE Research Gaps
                </button>
                <button 
                  className={`tab-button ${activeTab === 'matrix' ? 'active' : ''}`}
                  onClick={() => setActiveTab('matrix')}
                >
                  <Database size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                  Literature Comparison Matrix
                </button>
              </div>

              {/* Research Gaps Content */}
              {activeTab === 'gaps' && (
                <div className="gaps-container">
                  {gaps.map((gap, idx) => (
                    <div className="glass-panel gap-card" key={idx}>
                      <div className="gap-card-header">
                        <div className="gap-title-group">
                          <span className="gap-badge-id">Proposed Direction {idx + 1}</span>
                          <h4 className="gap-card-title">{gap.title}</h4>
                        </div>
                        <div className="gap-novelty-badge">
                          Novelty Score: {gap.novelty_score}%
                        </div>
                      </div>

                      <div className="gap-proposed-title">
                        <strong>Proposed IEEE Title:</strong> <br/>
                        <span style={{ fontStyle: 'italic' }}>{gap.proposed_title}</span>
                      </div>

                      <p className="gap-description">{gap.description}</p>

                      <div className="gap-meta-grid">
                        <div className="gap-meta-item">
                          <strong>Technologies Involved:</strong>
                          <div>
                            {gap.technologies.map((tech, i) => (
                              <span className="tech-tag" key={i}>{tech}</span>
                            ))}
                          </div>
                        </div>
                        <div className="gap-meta-item">
                          <strong>Evidence Basis:</strong>
                          <span>{gap.evidence}</span>
                        </div>
                        <div className="gap-meta-item">
                          <strong>Suggested Datasets:</strong>
                          <span>{gap.datasets.join(', ')}</span>
                        </div>
                        <div className="gap-meta-item">
                          <strong>Key Metrics to Target:</strong>
                          <span>{gap.metrics.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Matrix Content */}
              {activeTab === 'matrix' && (
                <div className="matrix-wrapper">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th>Paper Title</th>
                        <th>Objective</th>
                        <th>Proposed Method</th>
                        <th>Dataset</th>
                        <th>Results</th>
                        <th>Weakness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.map((row, idx) => (
                        <tr key={idx}>
                          <td><strong>{row.title}</strong></td>
                          <td>{row.objective}</td>
                          <td>{row.methodology}</td>
                          <td>{row.dataset}</td>
                          <td>{row.results}</td>
                          <td><span style={{ color: '#fda4af' }}>{row.weakness}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          ) : (
            // Empty State UI
            <div className="glass-panel empty-state" style={{ flexGrow: 1 }}>
              <Brain className="empty-state-icon" style={{ color: 'var(--text-muted)' }} />
              <h3 className="empty-state-title">No Literature Analyzed</h3>
              <p className="empty-state-text">
                Upload your research paper PDFs on the left pane and run the agentic pipeline to extract literature survey matrices and formulate novel research directions.
              </p>
            </div>
          )}

        </div>
      </div>
      )}

      {currentView === 'about' && (
        <div style={{ width: '100%', maxHeight: '100%', overflowY: 'auto', paddingRight: '4px' }} className="contact-scroll">
          <div className="glass-panel" style={{ width: '100%', padding: 'clamp(1.25rem, 5vw, 3rem)', animation: 'slideIn 0.35s ease', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Header section */}
            <div>
              <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.12em', display: 'block', marginBottom: '0.4rem' }}>System Architecture</span>
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2.2rem', margin: 0, color: 'var(--text-primary)', lineHeight: '1.25', fontWeight: 800 }}>
                About ResearchPilot AI
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.025rem', lineHeight: '1.7', marginTop: '0.85rem', maxWidth: '850px' }}>
                ResearchPilot AI is a state-of-the-art **Multi-Agent Scientific Literature Analysis** suite designed for researchers and academics. By coordinating specialized autonomous agents, it automates scientific literature parsing, compiles comparative matrices, and flags unexplored research gaps suitable for IEEE publication scopes.
              </p>
            </div>

            {/* Performance/Key Metrics Stat Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>~85%</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>Literature Survey Time Reduction</span>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(168, 85, 247, 0.03)', border: '1px solid rgba(168, 85, 247, 0.15)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>4 +</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>Specialized Heuristic AI Agents</span>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>100%</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>Explainable Evidence Citations</span>
              </div>
            </div>

            {/* Stepper Timeline Pipeline Section */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '1.5rem', fontWeight: 700 }}>
                🤖 Autonomous Agent Ingestion Pipeline
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid var(--glass-border)' }}>
                {/* Step 1 */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 'calc(-1.5rem - 6px)', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }}></div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem', display: 'block' }}>Phase 1: Semantic Parsing & Reading</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>PDF Reader Agent</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Extracts metadata and maps content structures (Abstracts, Methods, Performance Metrics, Limitations) directly from PDF publications using semantic layout analysis.
                  </p>
                </div>
                
                {/* Step 2 */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 'calc(-1.5rem - 6px)', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem', display: 'block' }}>Phase 2: Comparative Synthesis</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>Comparison Agent</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Aligns all parsed parameters side-by-side inside an interactive literature matrix, benchmarking algorithms, datasets, and weaknesses.
                  </p>
                </div>

                {/* Step 3 */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 'calc(-1.5rem - 6px)', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem', display: 'block' }}>Phase 3: Research Gap Detection</strong>
                  <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>Research Gap Agent</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Runs heuristic inference models over the matrix to identify algorithmic deficiencies, missing evaluations, and outlines concrete, novel title ideas.
                  </p>
                </div>

                {/* Step 4 */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 'calc(-1.5rem - 6px)', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--secondary)', boxShadow: '0 0 8px var(--secondary)' }}></div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem', display: 'block' }}>Phase 4: Orchestrated Delivery</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Coordinator Agent</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Manages multi-agent workflow loops, triggers toast logs updates, and compiles the final explainable research dossier.
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Architecture Block */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: 700 }}>
                💻 System Tech Stack
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                Built as a modern decoupled full-stack application using production-ready standards:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>FRONTEND CORE</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>React 18 + Vite HMR</span>
                </div>
                <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>BACKEND CORE</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>FastAPI + Uvicorn</span>
                </div>
                <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>DATABASE LAYER</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>MongoDB (PyMongo)</span>
                </div>
                <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>PARSING HEURISTICS</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>PyMuPDF + JSON Schema</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {currentView === 'history' && (
        <div className="glass-panel" style={{ width: '100%', padding: 'clamp(1rem, 5vw, 2.5rem)', animation: 'slideIn 0.35s ease' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'clamp(1.35rem, 5vw, 2rem)', marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History style={{ color: 'var(--accent)' }} />
            Your Research History
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Browse and reload your past literature survey dossiers and extracted research gaps.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '1.25rem' }}>
            {historyLoading ? (
              <div style={{ color: 'var(--text-secondary)', padding: '2rem', gridColumn: '1 / -1', textAlign: 'center' }}>Loading history database...</div>
            ) : historyList.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '3rem', gridColumn: '1 / -1', textAlign: 'center' }}>
                <History size={48} style={{ opacity: 0.3, marginBottom: '1rem', marginLeft: 'auto', marginRight: 'auto' }} />
                <p>No historical dossiers found. Start by analyzing papers on the Dashboard!</p>
              </div>
            ) : (
              historyList.map((entry) => (
                <div 
                  key={entry.id}
                  onClick={() => {
                    if (confirmDeleteId !== entry.id) {
                      loadHistoryEntry(entry);
                      setCurrentView('dashboard'); // Redirect to dashboard to view loaded data!
                      addNotification('Loaded historical dossier into view.', 'info');
                    }
                  }}
                  className="file-item" 
                  style={{ 
                    cursor: 'pointer', 
                    background: selectedHistoryId === entry.id ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                    borderColor: selectedHistoryId === entry.id ? 'var(--primary)' : 'var(--glass-border)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    height: '100%',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      📚 {entry.papers.length} Papers Analyzed
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                      {entry.papers.map((p, pIdx) => (
                        <span key={pIdx} style={{ background: 'rgba(255,255,255,0.04)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {p.title.replace('Title: ', '').slice(0, 30)}...
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={11} />
                      {new Date(entry.timestamp * 1000).toLocaleDateString()} at {new Date(entry.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                    {confirmDeleteId === entry.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span 
                          className="confirm-badge" 
                          onClick={(e) => { e.stopPropagation(); deleteHistoryEntry(entry.id, e); }}
                          style={{ padding: '0.3rem 0.75rem' }}
                        >
                          Confirm
                        </span>
                        <span 
                          className="confirm-badge" 
                          style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)', padding: '0.3rem 0.75rem' }}
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                        >
                          Cancel
                        </span>
                      </div>
                    ) : (
                      <button 
                        className="file-remove" 
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(entry.id); }}
                        style={{ padding: '0.4rem', borderRadius: '50%' }}
                        title="Delete survey record"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {currentView === 'monitor' && (
        <div className="glass-panel" style={{ width: '100%', padding: 'clamp(1rem, 5vw, 2.5rem)', animation: 'slideIn 0.35s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Cpu className={loading ? "rotating-icon" : ""} style={{ color: 'var(--secondary)' }} />
              Agent Pipeline Monitor
            </h2>
            {loading && (
              <span style={{ fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--secondary)', color: 'var(--secondary)', padding: '0.3rem 0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                <span className="pulse-dot"></span> Active Pipeline Running...
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Monitor execution trace logs and cooperative communication history between the Coordinator, PDF Reader, and Gap Detection agents.
          </p>

          <div className="agent-logs-container" style={{ maxHeight: '550px', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 1rem' }}>
                <Cpu size={48} style={{ opacity: 0.2, marginBottom: '1rem', marginLeft: 'auto', marginRight: 'auto' }} />
                <p>No active logs. Run a literature analysis on the Dashboard to trace agent telemetry!</p>
              </div>
            ) : (
              logs.map((log, idx) => (
                <div className="agent-log-card" key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: '1rem', animation: 'slideIn 0.25s ease' }}>
                  <span className={`agent-badge ${getAgentBadgeClass(log.agent)}`} style={{ minWidth: '130px', textAlign: 'center', flexShrink: 0 }}>
                    {log.agent}
                  </span>
                  <span className="agent-log-message" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5', fontFamily: 'var(--font-mono, monospace)' }}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {currentView === 'contact' && (
        <div style={{ width: '100%', maxHeight: '100%', overflowY: 'auto', paddingRight: '4px' }} className="contact-scroll">
          <div className="glass-panel" style={{ width: '100%', padding: 'clamp(1rem, 5vw, 2.5rem)', animation: 'slideIn 0.35s ease', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 'clamp(1.5rem, 5vw, 2.5rem)', alignItems: 'start' }}>
            
            {/* Left Column: Professional Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div>
                <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.12em', display: 'block', marginBottom: '0.4rem' }}>Feedback & Assistance</span>
                <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', margin: 0, color: 'var(--text-primary)', lineHeight: '1.25', fontWeight: 800 }}>
                  Discuss Academic Heuristics & Scope.
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6', marginTop: '0.85rem' }}>
                  Have feature recommendations about the multi-agent literature survey pipeline, target IEEE scopes, or need custom agent logic? Drop our project developers a note.
                </p>
              </div>

              {/* Status & Info Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Email Support Card */}
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={20} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Mailbox</span>
                    <a href={`mailto:saisravanrajm@gmail.com`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      saisravanrajm@gmail.com
                    </a>
                  </div>
                </div>

                {/* Academic Lab Card */}
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Award size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Research Lab Location</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>
                      MRU
                    </span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>
                      Research & Development Block
                    </span>
                  </div>
                </div>

                {/* System Status Card */}
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Cpu size={20} style={{ color: 'var(--secondary)' }} />
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pipeline Health</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>
                      IEEE Extraction v1.1.0
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                      <span className="pulse-dot" style={{ width: '6px', height: '6px' }}></span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--secondary)', fontWeight: 600 }}>MongoDB Connection Live</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Contact & Message Form */}
            <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: 'clamp(1rem, 4vw, 2rem)', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.35rem', margin: '0 0 1.25rem 0', color: 'var(--text-primary)', fontWeight: 700 }}>
                Submit Admin Ticket
              </h3>
              
              <form 
                onSubmit={handleContactSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Your Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="John Doe" 
                    className="input-pill" 
                    style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem 0.9rem' }} 
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="john@example.com" 
                    className="input-pill" 
                    style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem 0.9rem' }} 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Subject</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Feature request / Feedback" 
                    className="input-pill" 
                    style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem 0.9rem' }} 
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                  />
                  
                  {/* Subject Quick Tags */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {['Bug Report', 'Feature Idea', 'IEEE Scope', 'Agent Logs Trace'].map((tag) => (
                      <span 
                        key={tag}
                        onClick={() => setContactSubject(tag)}
                        style={{ 
                          fontSize: '0.675rem', 
                          padding: '0.2rem 0.55rem', 
                          background: contactSubject === tag ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)', 
                          border: '1px solid',
                          borderColor: contactSubject === tag ? 'var(--primary)' : 'var(--glass-border)',
                          color: contactSubject === tag ? 'var(--primary)' : 'var(--text-secondary)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'var(--transition-fast)'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Message Details</label>
                  <textarea 
                    required 
                    placeholder="Describe your suggestion or bug report..." 
                    className="input-pill" 
                    rows={4}
                    style={{ width: '100%', resize: 'vertical', minHeight: '90px', borderRadius: 'var(--radius-md)', padding: '0.75rem 0.9rem', fontSize: '0.85rem' }}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-action" 
                  disabled={contactLoading} 
                  style={{ marginTop: '0.25rem', width: '100%', padding: '0.7rem 1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {contactLoading ? (
                    <>
                      <Activity size={15} className="rotating-icon" />
                      Submitting admin ticket...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Submit Admin Ticket
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {currentView === 'profile' && (
        <div style={{ width: '100%', maxHeight: '100%', overflowY: 'auto', paddingRight: '4px' }} className="contact-scroll">
          <div className="glass-panel" style={{ width: '100%', padding: 'clamp(1.25rem, 5vw, 3rem)', animation: 'slideIn 0.35s ease', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Header section */}
            <div>
              <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.12em', display: 'block', marginBottom: '0.4rem' }}>User Settings</span>
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', margin: 0, color: 'var(--text-primary)', lineHeight: '1.25', fontWeight: 800 }}>
                Profile Settings
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginTop: '0.85rem', maxWidth: '650px' }}>
                Manage your academic credentials, display preferences, and account security parameters.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 'clamp(1.5rem, 5vw, 2.5rem)', alignItems: 'start' }}>
              
              {/* Left Column: Profile metadata form */}
              <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: 'clamp(1rem, 4vw, 2rem)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)', fontWeight: 700, borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                  Academic Credentials
                </h3>
                
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Username</label>
                    <input 
                      type="text" 
                      disabled 
                      className="input-pill" 
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem 0.9rem', opacity: 0.6, cursor: 'not-allowed' }} 
                      value={username}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Email Address</label>
                    <input 
                      type="email" 
                      disabled 
                      className="input-pill" 
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem 0.9rem', opacity: 0.6, cursor: 'not-allowed' }} 
                      value={email}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Display Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dr. Sravan" 
                      className="input-pill" 
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem 0.9rem' }} 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Institution / Affiliation</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Malla Reddy University" 
                      className="input-pill" 
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem 0.9rem' }} 
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Academic Role</label>
                    <select
                      className="input-pill"
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem 0.9rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Researcher">Researcher</option>
                      <option value="Professor">Professor</option>
                      <option value="Student">Graduate Student</option>
                      <option value="Coordinator">Project Coordinator</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-action" 
                    disabled={profileLoading} 
                    style={{ marginTop: '0.5rem', width: '100%', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    {profileLoading ? 'Saving Credentials...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>

              {/* Right Column: Account Security & Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Password Reset Form Card */}
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: 'clamp(1rem, 4vw, 2rem)', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', margin: '0 0 1.25rem 0', color: 'var(--text-primary)', fontWeight: 700, borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                    Account Security
                  </h3>
                  
                  <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Current Password</label>
                      <input 
                        type="password" 
                        required 
                        placeholder="••••••••" 
                        className="input-pill" 
                        style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem 0.9rem' }} 
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>New Password</label>
                      <input 
                        type="password" 
                        required 
                        placeholder="••••••••" 
                        className="input-pill" 
                        style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem 0.9rem' }} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn-action" 
                      disabled={resetPasswordLoading} 
                      style={{ marginTop: '0.5rem', width: '100%', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
                    >
                      {resetPasswordLoading ? 'Updating Password...' : 'Reset Account Password'}
                    </button>
                  </form>
                </div>

                {/* Account Details & Stats Card */}
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: 'clamp(1rem, 3.5vw, 1.5rem)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Account Metadata
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Account Created:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{createdAt ? new Date(createdAt * 1000).toLocaleDateString() : 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Saved Dossiers:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{historyList.length} dossiers</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      </main>
      </div>

      {/* Toast Notifications Container */}
      <div className="notification-container">
        {notifications.map(n => (
          <div key={n.id} className={`notification-toast ${n.type}`}>
            {n.type === 'success' && <CheckCircle2 size={16} style={{ color: 'var(--secondary)' }} />}
            {n.type === 'error' && <AlertCircle size={16} style={{ color: 'var(--error)' }} />}
            {n.type === 'warning' && <AlertCircle size={16} style={{ color: 'var(--warning)' }} />}
            {n.type === 'info' && <Bell size={16} style={{ color: 'var(--primary)' }} />}
            <span className="notification-message">{n.message}</span>
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', marginLeft: 'auto' }}
              onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
