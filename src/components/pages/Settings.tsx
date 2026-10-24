import { useState } from 'react'
import { Settings as SettingsIcon, User, Bell, Moon } from 'lucide-react'

function Settings() {
  const [name, setName] = useState('ScamShield User')
  const [language, setLanguage] = useState('English')
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)

  return (
    <div className="page-container">
      <div className="page-title">
        <SettingsIcon size={32} />
        <div>
          <h1>Settings</h1>
          <p>Manage your ScamShield AI preferences.</p>
        </div>
      </div>

      <div className="content-card settings-card">
        <h3>
          <User size={20} /> Profile
        </h3>

        <label htmlFor="name">Display name</label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <h3>Language</h3>

        <label htmlFor="language">Choose language</label>
        <select
          id="language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option>English</option>
          <option>Hindi</option>
          <option>Marathi</option>
        </select>

        <h3>
          <Moon size={20} /> Appearance
        </h3>

        <label className="toggle-row">
          <span>Dark mode preference</span>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(event) => setDarkMode(event.target.checked)}
          />
        </label>

        <h3>
          <Bell size={20} /> Notifications
        </h3>

        <label className="toggle-row">
          <span>Enable notifications preference</span>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(event) =>
              setNotifications(event.target.checked)
            }
          />
        </label>

        <button
          className="primary-button"
          onClick={() =>
            window.alert(
              `Preferences updated locally for ${name}.\nLanguage: ${language}\nDark mode preference: ${darkMode ? 'On' : 'Off'}\nNotifications preference: ${notifications ? 'On' : 'Off'}`,
            )
          }
        >
          Save Preferences
        </button>

        <p className="disclaimer">
          Preferences are temporary and are not saved to a server.
          Dark mode, language translation, and browser notifications
          are not implemented by these controls yet.
        </p>
      </div>
    </div>
  )
}

export default Settings