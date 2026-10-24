import { useEffect, useState } from 'react'
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Moon,
  Sun,
  Globe,
  Save,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { API_BASE_URL } from '../../api'
import { useLanguage, type Language } from '../../context/LanguageContext'

type SettingsProps = {
  darkMode: boolean
  onDarkModeChange: (enabled: boolean) => void
}

const KEYS = {
  name: 'scamshield-display-name',
  notifications: 'scamshield-notifications',
}

function getSavedValue(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export default function Settings({
  darkMode,
  onDarkModeChange,
}: SettingsProps) {
  const { language, setLanguage, t } = useLanguage()

  const [name, setName] = useState(() =>
    getSavedValue(KEYS.name, 'ScamShield User'),
  )

  const [notifications, setNotifications] = useState(
    () => getSavedValue(KEYS.notifications, 'true') === 'true',
  )

  const [status, setStatus] = useState('')
  const [hasError, setHasError] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadRemoteSettings() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`)
        if (res.ok) {
          const data = await res.json()
          if (data.language && (data.language === 'English' || data.language === 'Hindi' || data.language === 'Marathi')) {
            setLanguage(data.language as Language)
          }
          if (typeof data.notifications_enabled === 'boolean') {
            setNotifications(data.notifications_enabled)
          }
          if (data.theme === 'dark' && !darkMode) {
            onDarkModeChange(true)
          }
        }
      } catch (e) {
        console.error('Remote settings load error:', e)
      }
    }
    loadRemoteSettings()
  }, [])

  async function savePreferences() {
    setSaving(true)
    try {
      localStorage.setItem(KEYS.name, name.trim())
      localStorage.setItem(
        KEYS.notifications,
        String(notifications),
      )
      localStorage.setItem(
        'scamshield-theme',
        darkMode ? 'dark' : 'light',
      )

      // Sync to Supabase database
      await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          theme: darkMode ? 'dark' : 'light',
          notifications_enabled: notifications,
        }),
      })

      setHasError(false)
      setStatus(t('settings.saved_success'))
    } catch (error) {
      console.error('[ScamShield] Could not save preferences:', error)
      setHasError(true)
      setStatus('Saved locally. Could not sync with database.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container settings-page">
      <div className="page-title">
        <div className="settings-title-icon">
          <SettingsIcon size={28} />
        </div>

        <div>
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="content-card settings-card">
        {/* Profile */}
        <section className="settings-section">
          <h3>
            <User size={20} />
            {t('settings.profile_section')}
          </h3>

          <label htmlFor="settings-name">{t('settings.display_name')}</label>

          <input
            id="settings-name"
            type="text"
            value={name}
            maxLength={60}
            placeholder="Enter your display name"
            onChange={(event) => {
              setName(event.target.value)
              setStatus('')
            }}
          />
        </section>

        {/* Language Selection */}
        <section className="settings-section">
          <h3>
            <Globe size={20} />
            {t('settings.lang_section')}
          </h3>

          <label htmlFor="settings-language">
            {t('settings.lang_choose')}
          </label>

          <select
            id="settings-language"
            value={language}
            onChange={(event) => {
              const selected = event.target.value as Language
              setLanguage(selected)
              setStatus('')
            }}
          >
            <option value="English">English</option>
            <option value="Hindi">हिन्दी (Hindi)</option>
            <option value="Marathi">मराठी (Marathi)</option>
          </select>
        </section>

        {/* Appearance */}
        <section className="settings-section">
          <h3>
            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
            {t('settings.appearance_section')}
          </h3>

          <div className="settings-option">
            <div className="settings-option-info">
              <strong>{t('settings.dark_mode')}</strong>
              <p>
                {darkMode
                  ? 'Dark mode is active'
                  : 'Light mode is active'}
              </p>
            </div>

            <label
              className="settings-switch"
              htmlFor="settings-dark-mode"
            >
              <input
                id="settings-dark-mode"
                type="checkbox"
                checked={darkMode}
                onChange={(event) => {
                  onDarkModeChange(event.target.checked)
                  setStatus('')
                }}
              />

              <span className="settings-switch-track" />
            </label>
          </div>
        </section>

        {/* Notifications */}
        <section className="settings-section">
          <h3>
            <Bell size={20} />
            {t('settings.notifications_section')}
          </h3>

          <div className="settings-option">
            <div className="settings-option-info">
              <strong>{t('settings.enable_notifications')}</strong>
              <p>Receive alert notices for high-risk scam detections.</p>
            </div>

            <label
              className="settings-switch"
              htmlFor="settings-notifications"
            >
              <input
                id="settings-notifications"
                type="checkbox"
                checked={notifications}
                onChange={(event) => {
                  setNotifications(event.target.checked)
                  setStatus('')
                }}
              />

              <span className="settings-switch-track" />
            </label>
          </div>
        </section>

        {/* Save */}
        <div className="settings-save-area">
          <button
            type="button"
            className="primary-button"
            disabled={saving}
            onClick={savePreferences}
          >
            {saving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
            {saving ? t('settings.saving') : t('settings.save_btn')}
          </button>

          {status && (
            <p
              className={
                hasError ? 'settings-error' : 'settings-success'
              }
              role="status"
            >
              {hasError ? (
                <AlertCircle size={18} />
              ) : (
                <ShieldCheck size={18} />
              )}

              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}