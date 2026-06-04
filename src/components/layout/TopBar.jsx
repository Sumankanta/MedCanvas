import { useState } from 'react'
import {
  ChevronDown,
  CircleHelp,
  Download,
  FileText,
  Globe,
  Grid3X3,
  HeartPulse,
  Info,
  LogOut,
  Moon,
  PanelLeft,
  PanelRight,
  PenLine,
  RefreshCw,
  Shield,
  Settings,
  Sun,
  User,
} from 'lucide-react'

const ACCENT_COLORS = ['#1570ef', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']

const SETTING_TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Sun },
  { id: 'dashboard', label: 'Dashboard', icon: Grid3X3 },
  { id: 'reports', label: 'Data & Reports', icon: FileText },
  { id: 'accessibility', label: 'Accessibility', icon: CircleHelp },
  { id: 'system', label: 'System', icon: Globe },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'help', label: 'Help & Support', icon: Info },
]

function SettingField({ label, children }) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`settings-toggle${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={label}
    >
      <span />
    </button>
  )
}

export default function TopBar({
  dashboardTitle, onUpdateDashboardTitle,
  showDraftBadge = true,
  isPreviewMode, onSetPreviewMode,
  onUndo, onRedo, canUndo, canRedo,
  zoom, onZoom, leftOpen, rightOpen, onToggleLeft, onToggleRight,
  onApplyTemplate,
  onSaveDraft,
  onExport,
  isExporting = false,
  settings,
  effectiveTheme = 'light',
  onSettingsChange,
  onRefreshData,
  onDownloadPatientData,
}) {
  const [publishOpen, setPublishOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState('appearance')
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const scheduledOn = settings?.themeMode === 'scheduled' && settings?.scheduleEnabled
  const currentModeLabel = settings?.themeMode === 'scheduled'
    ? scheduledOn ? `Scheduled (${effectiveTheme})` : 'Scheduled off'
    : effectiveTheme === 'dark' ? 'Dark mode' : 'Light mode'

  const update = (patch) => onSettingsChange?.(patch)

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-mark"><HeartPulse size={22} /></div>
        <div className="brand-copy">
          <span className="brand-name">PHC Platform</span>
          <span className="brand-subtitle">Medical Drive</span>
        </div>
        <div className="topbar-title-wrap">
          <span className="breadcrumb">Dashboard Builder</span>
          <span className="breadcrumb-sep">&gt;</span>
          {isEditingTitle ? (
            <input
              autoFocus
              className="breadcrumb current"
              style={{ border: '1px solid #d0d5dd', background: 'transparent', padding: '2px 6px', borderRadius: '4px', width: '250px', outline: 'none' }}
              value={dashboardTitle}
              onChange={(e) => onUpdateDashboardTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            />
          ) : (
            <>
              <span className="breadcrumb current" onClick={() => setIsEditingTitle(true)} style={{ cursor: 'pointer' }}>
                {dashboardTitle || 'Untitled Dashboard'}
              </span>
              <button className="icon-btn" title="Rename dashboard" onClick={() => setIsEditingTitle(true)}>
                <PenLine size={13} />
              </button>
            </>
          )}
          {showDraftBadge && <span className="draft-badge">Draft</span>}
        </div>
      </div>

      <div className="topbar-center topbar-center--main">
        <button className={`mode-btn ${!isPreviewMode ? 'active' : ''}`} onClick={() => onSetPreviewMode(false)}>Design</button>
        <button className={`mode-btn ${isPreviewMode ? 'active' : ''}`} onClick={() => onSetPreviewMode(true)}>Preview</button>
        <div className="settings-pop-wrap">
          <button
            className={`mode-btn ${settingsOpen ? 'active' : ''}`}
            onClick={() => {
              setPublishOpen(false)
              setSettingsOpen((v) => !v)
            }}
            aria-expanded={settingsOpen}
            aria-haspopup="dialog"
          >
            <Settings size={13} /> Settings
          </button>
          {settingsOpen && (
            <div className="settings-popover" role="dialog" aria-label="Dashboard settings">
              <div className="settings-popover-head">
                <div>
                  <span>Settings</span>
                  <p>Profile, appearance, reports, system and support</p>
                </div>
                <span className="settings-current-mode">{currentModeLabel}</span>
              </div>

              <div className="settings-shell">
                <nav className="settings-menu" aria-label="Settings sections">
                  {SETTING_TABS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      className={activeSettingsTab === id ? 'active' : ''}
                      onClick={() => setActiveSettingsTab(id)}
                    >
                      <Icon size={14} />
                      <span>{label}</span>
                    </button>
                  ))}
                  <button type="button" className="settings-menu-danger" onClick={() => alert('Logout requested. Connect this action to your authentication flow when login is enabled.')}>
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </nav>

                <div className="settings-content">
                  {activeSettingsTab === 'profile' && (
                    <section className="settings-section">
                      <h3>Profile Settings</h3>
                      <SettingField label="Display name">
                        <input value={settings.profileName} onChange={(e) => update({ profileName: e.target.value })} />
                      </SettingField>
                      <SettingField label="Email">
                        <input value={settings.profileEmail} onChange={(e) => update({ profileEmail: e.target.value })} />
                      </SettingField>
                      <div className="settings-row">
                        <span>Notification Settings</span>
                        <Toggle checked={settings.notificationsEnabled} onChange={(value) => update({ notificationsEnabled: value })} label="Notification Settings" />
                      </div>
                    </section>
                  )}

                  {activeSettingsTab === 'appearance' && (
                    <section className="settings-section">
                      <h3>Appearance</h3>
                      <div className="theme-choice-group theme-choice-group--three" role="group" aria-label="Choose color theme">
                        <button type="button" className={`theme-choice${settings.themeMode === 'light' ? ' active' : ''}`} onClick={() => update({ themeMode: 'light', scheduleEnabled: false })} aria-pressed={settings.themeMode === 'light'}>
                          <Sun size={15} /><span>Light</span>
                        </button>
                        <button type="button" className={`theme-choice${settings.themeMode === 'dark' ? ' active' : ''}`} onClick={() => update({ themeMode: 'dark', scheduleEnabled: false })} aria-pressed={settings.themeMode === 'dark'}>
                          <Moon size={15} /><span>Dark</span>
                        </button>
                        <button type="button" className={`theme-choice${settings.themeMode === 'scheduled' ? ' active' : ''}`} onClick={() => update({ themeMode: 'scheduled', scheduleEnabled: false, scheduleMode: settings.scheduleMode || 'sunset' })} aria-pressed={settings.themeMode === 'scheduled'}>
                          <RefreshCw size={15} /><span>Scheduled</span>
                        </button>
                      </div>
                      {settings.themeMode === 'scheduled' && (
                        <div className="schedule-settings-card">
                          <div className="settings-row settings-row--plain">
                            <span>Enable Scheduled</span>
                            <Toggle checked={Boolean(settings.scheduleEnabled)} onChange={(enabled) => update({ scheduleEnabled: enabled, scheduleMode: settings.scheduleMode || 'sunset' })} label="Scheduled theme" />
                          </div>
                          {settings.scheduleEnabled ? (
                            <>
                              <div className="schedule-mode-list" role="radiogroup" aria-label="Scheduled theme mode">
                                <button
                                  type="button"
                                  className={settings.scheduleMode === 'sunset' ? 'active' : ''}
                                  onClick={() => update({ scheduleMode: 'sunset' })}
                                  aria-pressed={settings.scheduleMode === 'sunset'}
                                >
                                  <span>Sunset to sunrise</span>
                                  <i />
                                </button>
                                <button
                                  type="button"
                                  className={settings.scheduleMode === 'custom' ? 'active' : ''}
                                  onClick={() => update({ scheduleMode: 'custom' })}
                                  aria-pressed={settings.scheduleMode === 'custom'}
                                >
                                  <span>Custom</span>
                                  <i />
                                </button>
                              </div>
                              {settings.scheduleMode === 'custom' ? (
                                <div className="schedule-time-grid">
                                  <SettingField label="Light mode">
                                    <input type="time" value={settings.scheduleLightTime} onChange={(e) => update({ scheduleLightTime: e.target.value })} />
                                  </SettingField>
                                  <SettingField label="Dark mode">
                                    <input type="time" value={settings.scheduleDarkTime} onChange={(e) => update({ scheduleDarkTime: e.target.value })} />
                                  </SettingField>
                                </div>
                              ) : (
                                <p className="schedule-helper">Automatically switch to Dark mode at sunset and switch to Light mode at sunrise.</p>
                              )}
                            </>
                          ) : (
                            <p className="schedule-helper">Turn on Scheduled to choose Sunset to sunrise or Custom times.</p>
                          )}
                        </div>
                      )}
                      <SettingField label="Theme color selection">
                        <div className="settings-swatches">
                          {ACCENT_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={settings.accentColor === color ? 'active' : ''}
                              style={{ background: color }}
                              onClick={() => update({ accentColor: color })}
                              aria-label={`Set accent color ${color}`}
                            />
                          ))}
                        </div>
                      </SettingField>
                      <SettingField label={`Font size adjustment (${settings.fontScale}%)`}>
                        <input type="range" min="85" max="125" step="5" value={settings.fontScale} onChange={(e) => update({ fontScale: Number(e.target.value) })} />
                      </SettingField>
                      <SettingField label="Dashboard layout preferences">
                        <select value={settings.dashboardLayout} onChange={(e) => update({ dashboardLayout: e.target.value })}>
                          <option value="comfortable">Comfortable</option>
                          <option value="compact">Compact</option>
                          <option value="spacious">Spacious</option>
                        </select>
                      </SettingField>
                    </section>
                  )}

                  {activeSettingsTab === 'dashboard' && (
                    <section className="settings-section">
                      <h3>Dashboard Preferences</h3>
                      <SettingField label="Default landing page">
                        <select value={settings.defaultLandingPage} onChange={(e) => update({ defaultLandingPage: e.target.value })}>
                          <option value="builder">Dashboard Builder</option>
                          <option value="preview">Preview Mode</option>
                          <option value="reports">Reports</option>
                        </select>
                      </SettingField>
                      <div className="settings-row"><span>Widget Visibility: Charts</span><Toggle checked={settings.showCharts} onChange={(value) => update({ showCharts: value })} label="Show charts" /></div>
                      <div className="settings-row"><span>Widget Visibility: Stats</span><Toggle checked={settings.showStats} onChange={(value) => update({ showStats: value })} label="Show stats" /></div>
                      <div className="settings-row"><span>Widget Visibility: Tables</span><Toggle checked={settings.showTables} onChange={(value) => update({ showTables: value })} label="Show tables" /></div>
                      <SettingField label="Grid and layout settings">
                        <select value={settings.gridDensity} onChange={(e) => update({ gridDensity: e.target.value })}>
                          <option value="normal">Normal grid</option>
                          <option value="dense">Dense grid</option>
                          <option value="relaxed">Relaxed grid</option>
                        </select>
                      </SettingField>
                      <SettingField label="Auto refresh interval">
                        <select value={settings.autoRefreshInterval} onChange={(e) => update({ autoRefreshInterval: Number(e.target.value) })}>
                          <option value="0">Off</option>
                          <option value="1">Every 1 minute</option>
                          <option value="5">Every 5 minutes</option>
                          <option value="15">Every 15 minutes</option>
                        </select>
                      </SettingField>
                      <button type="button" className="settings-action" onClick={onRefreshData}><RefreshCw size={14} /> Refresh now</button>
                    </section>
                  )}

                  {activeSettingsTab === 'reports' && (
                    <section className="settings-section">
                      <h3>Data & Reports</h3>
                      <SettingField label="Report generation preferences">
                        <select value={settings.reportFormat} onChange={(e) => update({ reportFormat: e.target.value })}>
                          <option value="pdf">PDF report</option>
                          <option value="excel">Excel / CSV report</option>
                        </select>
                      </SettingField>
                      <div className="settings-row"><span>Include patient data</span><Toggle checked={settings.includePatientData} onChange={(value) => update({ includePatientData: value })} label="Include patient data" /></div>
                      <button type="button" className="settings-action" onClick={() => onExport?.('pdf')} disabled={isExporting}><FileText size={14} /> Export PDF</button>
                      <button type="button" className="settings-action" onClick={onDownloadPatientData}><Download size={14} /> Export Excel / Download Patient Data</button>
                    </section>
                  )}

                  {activeSettingsTab === 'accessibility' && (
                    <section className="settings-section">
                      <h3>Accessibility</h3>
                      <SettingField label={`Font scaling (${settings.fontScale}%)`}>
                        <input type="range" min="85" max="130" step="5" value={settings.fontScale} onChange={(e) => update({ fontScale: Number(e.target.value) })} />
                      </SettingField>
                      <div className="settings-row"><span>High Contrast Mode</span><Toggle checked={settings.highContrast} onChange={(value) => update({ highContrast: value })} label="High Contrast Mode" /></div>
                      <div className="settings-row"><span>Screen Reader Support</span><Toggle checked={settings.screenReader} onChange={(value) => update({ screenReader: value })} label="Screen Reader Support" /></div>
                    </section>
                  )}

                  {activeSettingsTab === 'system' && (
                    <section className="settings-section">
                      <h3>System Settings</h3>
                      <SettingField label="Language selection">
                        <select value={settings.language} onChange={(e) => update({ language: e.target.value })}>
                          <option value="en">English</option>
                          <option value="hi">Hindi</option>
                          <option value="mr">Marathi</option>
                        </select>
                      </SettingField>
                      <SettingField label="Time Zone">
                        <select value={settings.timeZone} onChange={(e) => update({ timeZone: e.target.value })}>
                          <option value="Asia/Kolkata">Asia/Kolkata</option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">America/New_York</option>
                        </select>
                      </SettingField>
                      <SettingField label="Date & Time Format">
                        <select value={settings.dateTimeFormat} onChange={(e) => update({ dateTimeFormat: e.target.value })}>
                          <option value="dd-mm-yyyy">DD-MM-YYYY</option>
                          <option value="mm-dd-yyyy">MM-DD-YYYY</option>
                          <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                        </select>
                      </SettingField>
                    </section>
                  )}

                  {activeSettingsTab === 'security' && (
                    <section className="settings-section">
                      <h3>Security Settings</h3>
                      <div className="settings-row"><span>Two-factor authentication</span><Toggle checked={settings.twoFactorEnabled} onChange={(value) => update({ twoFactorEnabled: value })} label="Two-factor authentication" /></div>
                      <button type="button" className="settings-action" onClick={() => alert('Password change can be connected after authentication is added.')}>Change password</button>
                      <button type="button" className="settings-action settings-action--danger" onClick={() => alert('Logout requested. Connect this action to your authentication flow when login is enabled.')}><LogOut size={14} /> Logout</button>
                    </section>
                  )}

                  {activeSettingsTab === 'help' && (
                    <section className="settings-section">
                      <h3>Help & Support</h3>
                      <button type="button" className="settings-action" onClick={() => alert('User Guide: Drag widgets, edit properties, save drafts, and publish reports from the top bar.')}>User Guide</button>
                      <button type="button" className="settings-action" onClick={() => { window.location.href = 'mailto:support@phc.local?subject=MedCanvas%20Support' }}>Contact Support</button>
                      <button type="button" className="settings-action" onClick={() => { window.location.href = 'mailto:feedback@phc.local?subject=MedCanvas%20Feedback' }}>Feedback</button>
                      <div className="settings-about">
                        <strong>About Application</strong>
                        <span>MedCanvas Dashboard Builder</span>
                        <span>Version Information: 0.0.0</span>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <button className={`panel-toggle-btn ${leftOpen ? 'active' : ''}`} onClick={onToggleLeft} title={leftOpen ? 'Hide widgets panel' : 'Show widgets panel'}>
          <PanelLeft size={14} />
          <span>Widgets</span>
        </button>
        <button className={`panel-toggle-btn ${rightOpen ? 'active' : ''}`} onClick={onToggleRight} title={rightOpen ? 'Hide properties panel' : 'Show properties panel'}>
          <PanelRight size={14} />
          <span>Properties</span>
        </button>

        <button className="btn btn-ghost" onClick={onSaveDraft} title="Save draft">
          <RefreshCw size={14} />
          <span>Save Draft</span>
        </button>

        <div className="template-pop-wrap">
          <button className="btn btn-cyan" onClick={() => setPublishOpen((v) => !v)} disabled={isExporting}>
            {isExporting ? 'Publishing...' : 'Publish'}
          </button>
          {publishOpen && (
            <div className="template-popover" style={{ width: 184, right: 0, left: 'auto' }}>
              <div className="template-popover-head">Export format</div>
              <div className="template-grid" style={{ gridTemplateColumns: '1fr', gap: 6 }}>
                <button className="template-card" onClick={() => { onExport?.('pdf'); setPublishOpen(false) }}>
                  <div className="template-title">Export PDF</div>
                  <div className="template-desc">Printable snapshot</div>
                </button>
                <button className="template-card" onClick={() => { onExport?.('jpg'); setPublishOpen(false) }}>
                  <div className="template-title">Export JPG</div>
                  <div className="template-desc">Image snapshot</div>
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="avatar-btn" title="Account">SK <ChevronDown size={12} /></button>
      </div>
    </header>
  )
}
