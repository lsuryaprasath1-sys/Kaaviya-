"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings Form State
  const [settings, setSettings] = useState({
    id: "",
    name: "Khaaviya",
    birthday_date: "2026-12-26T00:00",
    intro_title: "For someone very special...",
    intro_message: "Every second brings a new reason to smile, and a special moment is quietly making its way to you.",
    birthday_message: "Happy Birthday, Khaaviya! 🎂❤️",
    final_message: "Every picture has a story. Every memory has a feeling. And today is all about you, Khaaviya. ❤️",
    theme: "velvet",
    music_url: ""
  });
  
  const [saveStatus, setSaveStatus] = useState("");

  // Check existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.email === "kaaviya@birthday.com") {
        setIsLoggedIn(true);
        fetchSettings();
      }
    };
    checkSession();
  }, [isLoggedIn]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("birthday_settings")
        .select("*")
        .single();
      
      if (data && !error) {
        // Format ISO date to datetime-local compatible format (YYYY-MM-DDThh:mm)
        const localDate = new Date(data.birthday_date).toISOString().slice(0, 16);
        setSettings({
          ...data,
          birthday_date: localDate
        });
      }
    } catch (err) {
      console.error("Error loading settings from Supabase:", err);
    }
  };

  // Credentials check gateway
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    if (username.trim() === "kaaviya" && password === "26/12") {
      const adminEmail = "kaaviya@birthday.com";
      const adminPassword = "kaaviya_26_12"; // standard compliant password for Supabase Auth policies

      try {
        // Try logging in
        let { data, error } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
        });

        if (error) {
          // If user does not exist (first run), auto-signup the account
          if (error.message.includes("Invalid login credentials")) {
            const { error: signUpError } = await supabase.auth.signUp({
              email: adminEmail,
              password: adminPassword
            });

            if (!signUpError) {
              // Retry sign in
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: adminEmail,
                password: adminPassword
              });

              if (!retryError) {
                setIsLoggedIn(true);
              } else {
                setLoginError("Supabase login retry failed: " + retryError.message);
              }
            } else {
              setLoginError("Failed to register admin profile in Supabase Auth: " + signUpError.message);
            }
          } else {
            setLoginError("Supabase authentication failed: " + error.message);
          }
        } else {
          setIsLoggedIn(true);
        }
      } catch (err) {
        setLoginError("An unexpected authentication error occurred.");
      }
    } else {
      setLoginError("Invalid username or password! ❌");
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveStatus("Saving...");

    try {
      // Format datetime-local string to standard ISO format
      const formattedDate = new Date(settings.birthday_date).toISOString();
      const updatedData = {
        ...settings,
        birthday_date: formattedDate,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("birthday_settings")
        .upsert(updatedData);

      if (!error) {
        setSaveStatus("Saved successfully! ❤️");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus("Save failed: " + error.message);
      }
    } catch (err) {
      setSaveStatus("Save error: " + err.message);
    }
  };

  const updateField = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // LOGIN GATEWAY VIEW
  if (!isLoggedIn) {
    return (
      <div className="admin-modal" style={{ opacity: 1, visibility: "visible", position: "relative", minHeight: "100vh", background: "var(--bg-primary)" }}>
        <div className="modal-content glass-panel" style={{ margin: "auto", top: "10vh" }}>
          <Link href="/" className="close-modal" style={{ textDecoration: "none" }}>&times;</Link>
          
          <h2 className="admin-modal-title">
            <i className="fas fa-lock"></i> Owner Portal
          </h2>
          <p className="admin-modal-subtitle">Authenticate to configure files and settings.</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="adminUsername">Username</label>
              <input 
                type="text" 
                id="adminUsername" 
                className="form-control" 
                required 
                placeholder="Enter username" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="off" 
              />
            </div>
            
            <div className="form-group" style={{ marginTop: "15px" }}>
              <label htmlFor="adminPassword">Password</label>
              <input 
                type="password" 
                id="adminPassword" 
                className="form-control" 
                required 
                placeholder="Enter password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {loginError && <p className="error-message">{loginError}</p>}
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: "25px", width: "100%", justifyContent: "center" }}
              disabled={isLoading}
            >
              <span>{isLoading ? "Authenticating..." : "Unlock Admin Dashboard"}</span> 
              <i className="fas fa-key"></i>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // DASHBOARD CONTROL PANEL VIEW
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "40px 20px" }}>
      <div className="main-container show" style={{ maxWidth: "800px", padding: 0 }}>
        
        {/* Navigation header */}
        <header className="main-header" style={{ marginBottom: "30px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ textAlign: "left" }}>
            <h1 style={{ fontSize: "2rem", margin: 0 }}>Control Dashboard</h1>
            <p className="subtitle" style={{ fontSize: "0.85rem", letterSpacing: "1px", marginTop: "5px" }}>Connected to Supabase PostgreSQL</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/memories" className="btn btn-secondary" style={{ padding: "10px 20px" }}>
              <i className="fas fa-images"></i> Manage Files
            </Link>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: "10px 20px", background: "rgba(220, 53, 69, 0.2)", color: "#ff8080", borderColor: "rgba(220, 53, 69, 0.4)" }}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </header>

        {/* Dashboard Form */}
        <div className="glass-panel" style={{ width: "100%", padding: "30px", marginBottom: "30px" }}>
          <h2 className="admin-modal-title" style={{ justifyContent: "flex-start", marginBottom: "25px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
            <i className="fas fa-cogs" style={{ color: "var(--color-romantic)" }}></i> Birthday settings
          </h2>
          
          <form onSubmit={handleSaveSettings}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="form-group">
                <label>Surprise For (Name)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={settings.name} 
                  onChange={e => updateField("name", e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Birthday Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="form-control" 
                  value={settings.birthday_date} 
                  onChange={e => updateField("birthday_date", e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "20px" }}>
              <label>Surprise Audio URL (Background Music - MP3 link)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. assets/audio/music.mp3 or web url"
                value={settings.music_url} 
                onChange={e => updateField("music_url", e.target.value)} 
              />
            </div>

            <div className="form-group" style={{ marginTop: "20px" }}>
              <label>Intro Title (Mystery Page)</label>
              <input 
                type="text" 
                className="form-control" 
                value={settings.intro_title} 
                onChange={e => updateField("intro_title", e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ marginTop: "20px" }}>
              <label>Intro Subtext (Mystery Page)</label>
              <textarea 
                className="form-control" 
                rows="2" 
                value={settings.intro_message} 
                onChange={e => updateField("intro_message", e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ marginTop: "20px" }}>
              <label>Birthday Wishes Quote (Celebration Page)</label>
              <textarea 
                className="form-control" 
                rows="3" 
                value={settings.final_message} 
                onChange={e => updateField("final_message", e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ marginTop: "20px" }}>
              <label>Happy Birthday Message Title (Celebration Card)</label>
              <input 
                type="text" 
                className="form-control" 
                value={settings.birthday_message} 
                onChange={e => updateField("birthday_message", e.target.value)} 
                required 
              />
            </div>

            {/* Theme Selector */}
            <div className="form-group" style={{ marginTop: "25px" }}>
              <label>Surprise Layout Theme</label>
              <div className="theme-grid" style={{ marginTop: "8px" }}>
                {[
                  { id: "velvet", name: "Romantic Velvet", colors: "linear-gradient(135deg, #1e0915, #ff5277)" },
                  { id: "starry", name: "Starry Gold", colors: "linear-gradient(135deg, #0b192c, #ffd700)" },
                  { id: "lavender", name: "Sweet Lavender", colors: "linear-gradient(135deg, #2a004e, #e0b0ff)" },
                  { id: "ocean", name: "Ocean Coral", colors: "linear-gradient(135deg, #001f3f, #ff6b6b)" }
                ].map(themeOpt => (
                  <button 
                    key={themeOpt.id}
                    type="button" 
                    className={`theme-select-btn ${settings.theme === themeOpt.id ? "active" : ""}`}
                    onClick={() => updateField("theme", themeOpt.id)}
                  >
                    <span className="theme-color-dot" style={{ background: themeOpt.colors }}></span>
                    {themeOpt.name}
                  </button>
                ))}
              </div>
            </div>

            {saveStatus && <p className="subtitle" style={{ color: "var(--color-romantic)", marginTop: "15px", textAlign: "center" }}>{saveStatus}</p>}

            <div style={{ marginTop: "30px", display: "flex", gap: "15px" }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                <i className="fas fa-save"></i> Save Settings
              </button>
              <Link href="/" className="btn btn-secondary" style={{ padding: "14px 30px" }}>
                View Website
              </Link>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
