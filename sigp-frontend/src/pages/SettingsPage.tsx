import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import {
  User, Lock, Bell, Globe, Moon, Shield, Save,
  Eye, EyeOff, Check, AlertTriangle, Camera, Trash2, ChevronRight, Info, Loader2, Clock, Activity, ShieldCheck, X, ShieldAlert, MonitorSmartphone, Smartphone, Key, History, Mail, Send, Briefcase, CalendarClock, MessageSquare, Settings2, TrendingUp, BellRing, Sun, Palette, Globe2, LayoutTemplate, Accessibility, Calendar, Coins, Hash, Type, RefreshCw
} from 'lucide-react'

// ── Section wrapper ────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#101827] border border-[#1E293B] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1E293B]">
        <h2 className="text-white font-bold text-sm">{title}</h2>
        {subtitle && <p className="text-[#94A3B8] text-xs mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  )
}

// ── Form field ─────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[#94A3B8]/60 text-[10px] mt-1">{hint}</p>}
    </div>
  )
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5
        text-sm text-white placeholder:text-[#94A3B8]/50
        focus:outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/10
        transition-all duration-200"
    />
  )
}

// ── Locked Field ───────────────────────────────────────────────
function LockedField({ value, tooltip }: { value: string; tooltip: string }) {
  return (
    <div className="relative group w-full bg-[#050810] border border-[#1E293B] rounded-xl px-4 py-2.5 flex items-center justify-between overflow-visible">
      <input
        type="text"
        readOnly
        value={value}
        className="bg-transparent text-sm text-[#94A3B8] w-full focus:outline-none cursor-default selection:bg-[#10B981]/30 selection:text-white"
      />
      <Lock size={14} className="text-[#94A3B8]/50 shrink-0 ml-2" />
      
      {/* Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-[#1E293B] text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl text-center flex items-center gap-1.5">
          <Info size={12} className="text-[#3B82F6] shrink-0" />
          {tooltip}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1E293B]" />
      </div>
    </div>
  )
}

// ── Phone Input ────────────────────────────────────────────────
function PhoneInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [prefix, setPrefix] = useState('+225')
  const [number, setNumber] = useState(value.replace(/^\+\d+\s*/, ''))

  useEffect(() => {
    // Si la valeur externe change (ex: initialisation)
    const match = value.match(/^(\+\d+)\s*(.*)$/)
    if (match) {
      setPrefix(match[1])
      setNumber(match[2])
    } else if (value && !value.startsWith('+')) {
      setNumber(value)
    }
  }, [value])

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^\d\s-]/g, '')
    setNumber(newNumber)
    onChange(`${prefix} ${newNumber}`.trim())
  }

  const handlePrefixChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrefix = e.target.value
    setPrefix(newPrefix)
    onChange(`${newPrefix} ${number}`.trim())
  }

  return (
    <div className="flex gap-2 w-full">
      <select 
        value={prefix} 
        onChange={handlePrefixChange}
        className="w-24 bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-2 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]/50 cursor-pointer"
      >
        <option value="+225">🇨🇮 +225</option>
        <option value="+33">🇫🇷 +33</option>
        <option value="+1">🇺🇸 +1</option>
        <option value="+221">🇸🇳 +221</option>
        <option value="+223">🇲🇱 +223</option>
        <option value="+226">🇧🇫 +226</option>
      </select>
      <input
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder="07 00 00 00 00"
        className="flex-1 bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#94A3B8]/50 focus:outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/10 transition-all duration-200"
      />
    </div>
  )
}

// ── Toggle ─────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: () => void; label?: string; disabled?: boolean }) {
  return (
    <div className={`flex items-center ${label ? 'justify-between py-3 border-b border-[#1E293B]/50 last:border-0' : ''}`}>
      {label && <span className="text-sm text-[#94A3B8]">{label}</span>}
      <button onClick={disabled ? undefined : onChange} disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 ${checked ? 'bg-[#10B981]' : 'bg-[#1E293B]'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

// ── Saved banner ───────────────────────────────────────────────
function SavedBanner({ show, type = 'success', message = 'Modifications enregistrées' }: { show: boolean; type?: 'success' | 'error'; message?: string }) {
  const isSuccess = type === 'success'
  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 text-white px-5 py-3 rounded-2xl shadow-2xl transition-all duration-500 z-50
      ${isSuccess ? 'bg-[#10B981] shadow-[#10B981]/30' : 'bg-red-500 shadow-red-500/30'}
      ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      {isSuccess ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
      <span className="text-sm font-bold">{message}</span>
    </div>
  )
}

// ── Role Formatter ─────────────────────────────────────────────
function formatRole(role: string) {
  const mapping: Record<string, string> = {
    'ADMINISTRATEUR': 'Administrateur',
    'COORDONNATEUR': 'Coordonnateur',
    'RESPONSABLE_FINANCIER': 'Responsable Financier',
    'BAILLEUR': 'Bailleur de fonds',
    'UTILISATEUR': 'Utilisateur Standard'
  }
  return mapping[role.toUpperCase()] || role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

// ── Settings Page ──────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profil')
  const [showPwd, setShowPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [toast, setToast] = useState<{show: boolean, type: 'success'|'error', message: string}>({show: false, type: 'success', message: ''})
  
  const [initialPrefs, setInitialPrefs] = useState({
    theme: 'dark',
    region: {
      lang: 'fr',
      timezone: 'UTC+0 - Abidjan',
      dateFormat: 'JJ/MM/AAAA',
      timeFormat: '24h',
      currency: 'XOF (Franc CFA)',
      numberFormat: '1 234 567,89'
    },
    display: {
      homePage: 'Tableau de bord',
      density: 'Confortable',
      pagination: '25'
    },
    a11y: {
      reduceMotion: false,
      highContrast: false,
      textSize: 'Standard'
    }
  })
  const [prefs, setPrefs] = useState(initialPrefs)
  const isPrefsDirty = JSON.stringify(prefs) !== JSON.stringify(initialPrefs)
  const [showReloadModal, setShowReloadModal] = useState(false)
  
  const [initialNotifs, setInitialNotifs] = useState({
    channels: { email: true, push: true, sms: false },
    emailFreq: 'Immédiat',
    alerts: {
      budget: { enabled: true, threshold: '5%', channels: { email: true, push: true }, frequency: 'Immédiat' },
      tresorerie: { enabled: true, channels: { email: true, push: false }, frequency: 'Immédiat' },
      validations: { enabled: true, channels: { email: true, push: true }, frequency: 'Quotidien' },
      rapports: { enabled: false, channels: { email: true, push: false }, frequency: 'Hebdomadaire' },
      risques: { enabled: true, channels: { email: true, push: true }, frequency: 'Immédiat' },
      echeances: { enabled: false, channels: { email: false, push: false }, frequency: 'Quotidien' },
      mentions: { enabled: true, channels: { email: false, push: true }, frequency: 'Immédiat' }
    },
    dnd: { enabled: false, start: '21:00', end: '08:00', days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'] }
  })
  const [notifs, setNotifs] = useState(initialNotifs)
  const isNotifsDirty = JSON.stringify(notifs) !== JSON.stringify(initialNotifs)
  
  const [initialProfile, setInitialProfile] = useState({
    prenom: user?.prenom ?? 'Admin',
    nom: user?.nom ?? 'DevProject',
    email: user?.email ?? 'admin@sigp.ci',
    role: user?.role ?? 'ADMINISTRATEUR',
    telephone: '+225 0700000000',
    organisation: 'Ministère du Développement',
  })
  const [profile, setProfile] = useState(initialProfile)
  const [pwd, setPwd] = useState({ actuel: '', nouveau: '', confirm: '' })
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── States Sécurité ──────────────────────────────────────────
  const [is2FAEnabled, setIs2FAEnabled] = useState(true)
  const [show2FAModal, setShow2FAModal] = useState<'activate' | 'deactivate' | 'recovery' | null>(null)
  const [modalInput, setModalInput] = useState('')
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome sur Windows', location: 'Abidjan, Côte d’Ivoire', ip: '102.123.45.67', time: 'il y a 5 minutes', current: true },
    { id: 2, device: 'Firefox sur Android', location: 'Yamoussoukro, Côte d’Ivoire', ip: '196.200.10.2', time: 'hier à 18:42', current: false },
  ])

  const pwdRules = {
    length: pwd.nouveau.length >= 8,
    upper: /[A-Z]/.test(pwd.nouveau),
    lower: /[a-z]/.test(pwd.nouveau),
    number: /[0-9]/.test(pwd.nouveau),
    special: /[^A-Za-z0-9]/.test(pwd.nouveau)
  }
  const pwdScore = Object.values(pwdRules).filter(Boolean).length
  const pwdMatch = pwd.nouveau !== '' && pwd.nouveau === pwd.confirm
  const canSubmitPwd = pwdScore === 5 && pwdMatch && pwd.actuel !== ''

  const isDirty = JSON.stringify(profile) !== JSON.stringify(initialProfile) || avatarUrl !== null || isNotifsDirty || isPrefsDirty

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Apply theme to <html> when prefs.theme changes
  useEffect(() => {
    const root = document.documentElement
    const applyTheme = (dark: boolean) => {
      if (dark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
    if (prefs.theme === 'dark') {
      applyTheme(true)
    } else if (prefs.theme === 'light') {
      applyTheme(false)
    } else {
      // 'auto' — follow system preference
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mq.matches)
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [prefs.theme])

  const saveProfile = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setInitialProfile(profile)
    setAvatarUrl(null)
    setIsSaving(false)
    setToast({show: true, type: 'success', message: 'Profil mis à jour avec succès'})
    setTimeout(() => setToast(s => ({...s, show: false})), 3000)
  }

  const cancelProfileChanges = () => {
    if (confirm('Voulez-vous vraiment annuler vos modifications ?')) {
      setProfile(initialProfile)
      setAvatarUrl(null)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setToast({show: true, type: 'error', message: 'L\'image ne doit pas dépasser 2 Mo'})
      setTimeout(() => setToast(s => ({...s, show: false})), 3000)
      return
    }
    setAvatarUrl(URL.createObjectURL(file))
  }

  const save = () => {
    setToast({show: true, type: 'success', message: 'Modifications enregistrées'})
    setTimeout(() => setToast(s => ({...s, show: false})), 3000)
  }

  const handleUpdatePassword = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setPwd({ actuel: '', nouveau: '', confirm: '' })
    setIsSaving(false)
    setToast({show: true, type: 'success', message: 'Mot de passe mis à jour avec succès.'})
    setTimeout(() => setToast(s => ({...s, show: false})), 3000)
  }

  const handle2FAAction = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    if (show2FAModal === 'activate') setIs2FAEnabled(true)
    if (show2FAModal === 'deactivate') setIs2FAEnabled(false)
    setShow2FAModal(null)
    setModalInput('')
    setIsSaving(false)
    setToast({show: true, type: 'success', message: 'Paramètres 2FA mis à jour.'})
    setTimeout(() => setToast(s => ({...s, show: false})), 3000)
  }

  const handleDisconnectSession = (id?: number) => {
    if (confirm('Confirmer la déconnexion de ' + (id ? 'cet appareil' : 'tous les autres appareils') + ' ?')) {
      if (id) setSessions(s => s.filter(x => x.id !== id))
      else setSessions(s => s.filter(x => x.current))
      setToast({show: true, type: 'success', message: 'Session(s) déconnectée(s).'})
      setTimeout(() => setToast(s => ({...s, show: false})), 3000)
    }
  }

  const saveNotifs = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setInitialNotifs(notifs)
    setIsSaving(false)
    setToast({show: true, type: 'success', message: 'Préférences de notifications mises à jour.'})
    setTimeout(() => setToast(s => ({...s, show: false})), 3000)
  }

  const cancelNotifsChanges = () => {
    if (confirm('Voulez-vous vraiment annuler vos modifications ?')) {
      setNotifs(initialNotifs)
    }
  }

  const testNotification = () => {
    setToast({show: true, type: 'success', message: 'Ding! Ceci est une notification de test.'})
    setTimeout(() => setToast(s => ({...s, show: false})), 3000)
  }

  const updateAlert = (key: keyof typeof notifs.alerts, field: string, value: any) => {
    setNotifs(s => ({
      ...s,
      alerts: {
        ...s.alerts,
        [key]: {
          ...s.alerts[key],
          [field]: value
        }
      }
    }))
  }
  
  const updateAlertChannel = (key: keyof typeof notifs.alerts, channel: 'email'|'push', value: boolean) => {
    setNotifs(s => ({
      ...s,
      alerts: {
        ...s.alerts,
        [key]: {
          ...s.alerts[key],
          channels: {
            ...s.alerts[key].channels,
            [channel]: value
          }
        }
      }
    }))
  }

  const toggleDndDay = (day: string) => {
    setNotifs(s => ({
      ...s,
      dnd: {
        ...s.dnd,
        days: s.dnd.days.includes(day) ? s.dnd.days.filter(d => d !== day) : [...s.dnd.days, day]
      }
    }))
  }

  const savePrefs = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    const langChanged = initialPrefs.region.lang !== prefs.region.lang
    setInitialPrefs(prefs)
    setIsSaving(false)
    if (langChanged) {
      setShowReloadModal(true)
    } else {
      setToast({show: true, type: 'success', message: 'Préférences mises à jour avec succès.'})
      setTimeout(() => setToast(s => ({...s, show: false})), 3000)
    }
  }

  const cancelPrefsChanges = () => {
    if (confirm('Voulez-vous vraiment annuler vos modifications ?')) {
      setPrefs(initialPrefs)
    }
  }

  const handleReload = () => {
    window.location.reload()
  }

  const allTabs = [
    { id: 'profil',        label: 'Profil',          icon: User    },
    { id: 'securite',      label: 'Sécurité',         icon: Lock    },
    { id: 'notifications', label: 'Notifications',    icon: Bell    },
    { id: 'preferences',   label: 'Préférences',      icon: Globe   },
    { id: 'roles',         label: 'Rôles',            icon: Shield  },
  ]
  const tabs = (user?.role as string) === 'Administrateur' ? allTabs : allTabs.filter(t => t.id !== 'roles')

  const initials = `${profile.prenom?.[0] ?? 'A'}${profile.nom?.[0] ?? 'D'}`
  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Paramètres'

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-full">

      {/* Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8] mb-3">
          <span className="hover:text-white cursor-pointer transition-colors">Accueil</span>
          <ChevronRight size={12} />
          <span className="hover:text-white cursor-pointer transition-colors">Paramètres</span>
          <ChevronRight size={12} />
          <span className="text-[#10B981]">{activeTabLabel}</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Paramètres</h1>
        <p className="text-[#94A3B8] text-sm mt-0.5">Gérez votre compte et vos préférences</p>
      </div>

      <div className="flex gap-6">
        {/* ── Sidebar tabs ── */}
        <div className="w-52 shrink-0">
          <div className="bg-[#101827] border border-[#1E293B] rounded-2xl p-2 space-y-0.5">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                  ${activeTab === id
                    ? 'bg-[#10B981]/10 text-[#10B981]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                  }`}>
                <Icon size={16} />
                {label}
              </button>
            ))}
            <div className="my-2 border-t border-[#1E293B]" />
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
              <AlertTriangle size={16} /> Déconnexion
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* PROFIL */}
          {activeTab === 'profil' && (
            <div className="space-y-6 pb-24">
              <Section title="Informations personnelles" subtitle="Gérez votre identité et vos coordonnées">
                {/* Avatar */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center text-white text-3xl font-black shadow-xl overflow-hidden border-4 border-[#101827]">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#10B981] hover:bg-[#059669] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                    >
                      <Camera size={14} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png" onChange={handleAvatarChange} />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-white font-bold text-lg">{profile.prenom} {profile.nom}</h3>
                    <p className="text-[#94A3B8] text-sm mt-0.5">{formatRole(profile.role)}</p>
                    <div className="mt-3 flex items-center justify-center sm:justify-start gap-3">
                      <button onClick={() => fileInputRef.current?.click()} className="text-xs font-semibold text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 px-3 py-1.5 rounded-lg transition-colors">
                        Changer la photo
                      </button>
                      {(avatarUrl) && (
                        <button onClick={() => setAvatarUrl(null)} className="text-xs font-semibold text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors">
                          Supprimer
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-[#94A3B8]/60 mt-2">Format JPG ou PNG. Max 2 Mo.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Prénom">
                    <Input value={profile.prenom} onChange={e => setProfile(s => ({ ...s, prenom: e.target.value }))} />
                  </Field>
                  <Field label="Nom">
                    <LockedField value={profile.nom} tooltip="Information gérée par l'administrateur" />
                  </Field>
                  <Field label="Téléphone">
                    <PhoneInput value={profile.telephone} onChange={val => setProfile(s => ({ ...s, telephone: val }))} />
                  </Field>
                </div>
              </Section>

              <Section title="Informations professionnelles" subtitle="Détails de votre fonction dans le système">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Organisation">
                    <LockedField value={profile.organisation} tooltip="Votre structure d'appartenance ne peut pas être modifiée" />
                  </Field>
                  <Field label="Rôle">
                    <div className="relative group w-full bg-[#050810] border border-[#1E293B] rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-[#3B82F6]" />
                        <span className="text-sm text-white font-semibold">{formatRole(profile.role)}</span>
                      </div>
                      <Lock size={14} className="text-[#94A3B8]/50" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        <div className="bg-[#1E293B] text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl text-center">
                          Attribué automatiquement. Géré depuis l'onglet Rôles.
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1E293B]" />
                      </div>
                    </div>
                  </Field>
                </div>
              </Section>

              <Section title="Informations système" subtitle="Données techniques du compte">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Adresse email">
                    <LockedField value={profile.email} tooltip="Pour modifier cette adresse, contactez un administrateur" />
                  </Field>
                  <Field label="ID Utilisateur">
                    <LockedField value="USR-2026-8942A" tooltip="Identifiant unique généré par le système" />
                  </Field>
                  <Field label="Création du compte">
                    <div className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 flex items-center gap-2 text-[#94A3B8] text-sm">
                      <Clock size={14} /> 12 Janvier 2026
                    </div>
                  </Field>
                  <Field label="Statut du compte">
                    <div className="w-full bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl px-4 py-2.5 flex items-center gap-2 text-[#10B981] font-semibold text-sm">
                      <Check size={16} strokeWidth={3} /> Compte actif
                    </div>
                  </Field>
                </div>
              </Section>

              <div className="bg-[#050810] border border-[#1E293B] rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-[#1E293B] flex items-center justify-center shrink-0">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                      Sécurité du compte
                    </h3>
                    <ul className="text-sm text-[#94A3B8] space-y-1.5 mb-4">
                      <li className="flex items-center gap-2"><Clock size={12} className="text-[#3B82F6]"/> Dernière connexion : il y a 2 heures</li>
                      <li className="flex items-center gap-2"><Lock size={12} className="text-[#10B981]"/> Authentification à deux facteurs : Activée</li>
                      <li className="flex items-center gap-2"><Activity size={12} className="text-[#F59E0B]"/> Sessions actives : 3</li>
                    </ul>
                    <button onClick={() => setActiveTab('securite')} className="text-xs font-bold text-white bg-[#1E293B] hover:bg-[#334155] px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-max">
                      Gérer la sécurité <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions sticky bar */}
              <div className="flex justify-end gap-3 mt-6">
                {isDirty && (
                  <button onClick={cancelProfileChanges}
                    className="px-6 py-2.5 text-[#94A3B8] hover:text-white font-bold text-sm rounded-xl transition-all hover:bg-white/5">
                    Annuler les modifications
                  </button>
                )}
                <button onClick={saveProfile} disabled={!isDirty || isSaving}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 font-bold text-sm rounded-xl transition-all shadow-lg min-w-[260px]
                    ${isDirty 
                      ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20 active:scale-95 cursor-pointer' 
                      : 'bg-[#1E293B] text-[#94A3B8] cursor-not-allowed shadow-none'}`}>
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}

          {/* SÉCURITÉ */}
          {activeTab === 'securite' && (
            <div className="space-y-6 pb-24">
              {/* Carte 1 : Résumé de sécurité */}
              <div className="bg-[#050810] border border-[#10B981]/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full blur-3xl" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0 border border-[#10B981]/20">
                    <ShieldCheck size={24} className="text-[#10B981]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">Sécurité du compte</h3>
                    <p className="text-sm text-[#94A3B8] mb-3">Votre compte est bien protégé. Statut : <span className="text-[#10B981] font-bold">Bon</span></p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <span className="flex items-center gap-2 text-[#10B981]"><Check size={14}/> 2FA activée</span>
                      <span className="flex items-center gap-2 text-[#10B981]"><Check size={14}/> Alertes activées</span>
                      <span className="flex items-center gap-2 text-[#F59E0B]"><AlertTriangle size={14}/> {sessions.length} session{sessions.length > 1 ? 's' : ''} active{sessions.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte 2 : Changement de mot de passe */}
              <Section title="Changement de mot de passe" subtitle="Sécurisez votre accès avec un mot de passe robuste">
                <div className="space-y-6">
                  <Field label="Mot de passe actuel">
                    <div className="relative group">
                      <Input type={showPwd ? 'text' : 'password'} value={pwd.actuel} onChange={e => setPwd(s => ({ ...s, actuel: e.target.value }))} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPwd(v => !v)} title={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors p-1">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>
                  
                  <div className="pt-2 border-t border-[#1E293B]">
                    <Field label="Nouveau mot de passe">
                      <div className="relative group">
                        <Input type={showNewPwd ? 'text' : 'password'} value={pwd.nouveau} onChange={e => setPwd(s => ({ ...s, nouveau: e.target.value }))} placeholder="••••••••" />
                        <button type="button" onClick={() => setShowNewPwd(v => !v)} title={showNewPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors p-1">
                          {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </Field>

                    {pwd.nouveau.length > 0 && (
                      <div className="mt-3 space-y-3 bg-[#0A0F1E] p-4 rounded-xl border border-[#1E293B]">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-[#94A3B8]">Force du mot de passe</span>
                          <span className={pwdScore < 3 ? 'text-red-400' : pwdScore < 5 ? 'text-[#F59E0B]' : 'text-[#10B981]'}>
                            {pwdScore < 3 ? 'Faible' : pwdScore < 5 ? 'Moyen' : 'Fort'}
                          </span>
                        </div>
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`flex-1 rounded-full transition-colors duration-300 ${
                              i <= pwdScore 
                                ? (pwdScore < 3 ? 'bg-red-400' : pwdScore < 5 ? 'bg-[#F59E0B]' : 'bg-[#10B981]')
                                : 'bg-[#1E293B]'
                            }`} />
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 text-xs mt-2">
                          <span className={`flex items-center gap-1.5 ${pwdRules.length ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>{pwdRules.length ? <Check size={12}/> : <div className="w-1 h-1 rounded-full bg-current ml-1 mr-0.5"/>} 8 caractères minimum</span>
                          <span className={`flex items-center gap-1.5 ${pwdRules.upper ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>{pwdRules.upper ? <Check size={12}/> : <div className="w-1 h-1 rounded-full bg-current ml-1 mr-0.5"/>} Une majuscule</span>
                          <span className={`flex items-center gap-1.5 ${pwdRules.lower ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>{pwdRules.lower ? <Check size={12}/> : <div className="w-1 h-1 rounded-full bg-current ml-1 mr-0.5"/>} Une minuscule</span>
                          <span className={`flex items-center gap-1.5 ${pwdRules.number ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>{pwdRules.number ? <Check size={12}/> : <div className="w-1 h-1 rounded-full bg-current ml-1 mr-0.5"/>} Un chiffre</span>
                          <span className={`flex items-center gap-1.5 ${pwdRules.special ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>{pwdRules.special ? <Check size={12}/> : <div className="w-1 h-1 rounded-full bg-current ml-1 mr-0.5"/>} Un caractère spécial</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Field label="Confirmer le nouveau mot de passe">
                    <Input type="password" value={pwd.confirm} onChange={e => setPwd(s => ({ ...s, confirm: e.target.value }))} placeholder="••••••••" />
                    {pwd.confirm.length > 0 && !pwdMatch && (
                      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertTriangle size={12} /> Les mots de passe ne correspondent pas.</p>
                    )}
                  </Field>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between border-t border-[#1E293B] gap-4">
                    <p className="text-xs text-[#94A3B8]">Dernière modification : <span className="text-white">il y a 3 mois</span></p>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {(pwd.actuel || pwd.nouveau || pwd.confirm) && (
                        <button onClick={() => setPwd({ actuel: '', nouveau: '', confirm: '' })} className="px-4 py-2.5 text-sm font-semibold text-[#94A3B8] hover:text-white transition-colors">
                          Annuler
                        </button>
                      )}
                      <button 
                        onClick={handleUpdatePassword} 
                        disabled={!canSubmitPwd || isSaving}
                        className={`flex items-center justify-center gap-2 px-6 py-2.5 font-bold text-sm rounded-xl transition-all shadow-lg flex-1 sm:flex-none min-w-[240px]
                          ${canSubmitPwd 
                            ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20 active:scale-95 cursor-pointer' 
                            : 'bg-[#1E293B] text-[#94A3B8] cursor-not-allowed shadow-none'}`}
                      >
                        {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Mettre à jour le mot de passe
                      </button>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Carte 3 : 2FA */}
              <Section title="Authentification à deux facteurs (2FA)" subtitle="Protégez votre compte avec un code supplémentaire.">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0A0F1E] border border-[#1E293B] rounded-xl gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white font-semibold text-sm">Statut :</span>
                      {is2FAEnabled 
                        ? <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 flex items-center gap-1"><Check size={12}/> Activée</span>
                        : <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1E293B] text-[#94A3B8] border border-[#334155] flex items-center gap-1"><X size={12}/> Désactivée</span>
                      }
                    </div>
                    {is2FAEnabled && <p className="text-xs text-[#94A3B8]">Méthode : Application d'authentification (ex: Google Authenticator)</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {is2FAEnabled ? (
                      <>
                        <button onClick={() => setShow2FAModal('recovery')} className="px-4 py-2 bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-semibold rounded-lg transition-colors border border-[#334155]">
                          Codes de récupération
                        </button>
                        <button onClick={() => setShow2FAModal('deactivate')} className="px-4 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-semibold rounded-lg transition-colors">
                          Désactiver
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setShow2FAModal('activate')} className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-[#10B981]/20">
                        Activer la 2FA
                      </button>
                    )}
                  </div>
                </div>
              </Section>

              {/* Carte 4 : Alertes */}
              <Section title="Alertes de sécurité" subtitle="Gérez les notifications relatives à la sécurité de votre compte">
                <div className="space-y-1">
                  <Toggle checked label="Alertes de connexion par email" onChange={() => {}} />
                  <p className="text-xs text-[#94A3B8] px-2 pb-3">Recevoir un email lorsqu'une nouvelle connexion depuis un appareil inconnu est détectée.</p>
                  
                  <Toggle checked label="Alertes en cas de changement de mot de passe" onChange={() => {}} />
                  <p className="text-xs text-[#94A3B8] px-2 pb-2">Recevoir une notification immédiate si votre mot de passe ou vos paramètres 2FA sont modifiés.</p>
                </div>
              </Section>

              {/* Carte 5 : Sessions */}
              <Section title="Gestion des sessions actives" subtitle="Consultez les appareils actuellement connectés à votre compte">
                <div className="space-y-3">
                  {sessions.length === 0 ? (
                    <p className="text-sm text-[#94A3B8] py-4 text-center">Aucune session active trouvée.</p>
                  ) : sessions.map(session => (
                    <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0A0F1E] border border-[#1E293B] rounded-xl gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg mt-0.5 ${session.current ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#1E293B] text-[#94A3B8]'}`}>
                          {session.device.includes('Android') || session.device.includes('iPhone') ? <Smartphone size={18} /> : <MonitorSmartphone size={18} />}
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold flex items-center gap-2">
                            {session.device} 
                            {session.current && <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.5 rounded uppercase tracking-wider">Session actuelle</span>}
                          </p>
                          <p className="text-xs text-[#94A3B8] mt-0.5">{session.location} • IP: {session.ip}</p>
                          <p className="text-xs text-[#94A3B8] mt-0.5 flex items-center gap-1"><Clock size={10}/> Dernière activité : {session.time}</p>
                        </div>
                      </div>
                      {!session.current && (
                        <button onClick={() => handleDisconnectSession(session.id)} className="text-xs font-semibold text-[#94A3B8] hover:text-white border border-[#1E293B] hover:border-[#334155] px-4 py-2 rounded-lg transition-all w-max bg-[#1E293B]">
                          Déconnecter
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {sessions.length > 1 && (
                    <div className="pt-3 flex justify-end">
                      <button onClick={() => handleDisconnectSession()} className="text-xs font-semibold text-white bg-[#1E293B] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-transparent px-4 py-2 rounded-xl transition-all">
                        Déconnecter tous les autres appareils
                      </button>
                    </div>
                  )}
                </div>
              </Section>

              {/* Carte 6 : Historique */}
              <Section title="Historique de sécurité" subtitle="Journal des dernières activités liées à la sécurité de votre compte">
                <div className="space-y-4">
                  {[
                    { id: 1, action: 'Connexion réussie', desc: 'Chrome - Windows - Abidjan', time: 'Aujourd\'hui à 09:12', icon: Activity, color: 'text-[#10B981]' },
                    { id: 2, action: 'Mot de passe modifié', desc: 'Par l\'utilisateur', time: '12/01/2026 à 16:40', icon: Key, color: 'text-[#3B82F6]' },
                    { id: 3, action: 'Tentative de connexion échouée', desc: 'Adresse IP : 196.200.10.45', time: 'il y a 3 jours', icon: ShieldAlert, color: 'text-red-400' },
                  ].map(log => (
                    <div key={log.id} className="flex gap-4">
                      <div className={`mt-0.5 ${log.color}`}>
                        <log.icon size={16} />
                      </div>
                      <div className="flex-1 border-b border-[#1E293B]/50 pb-4">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className="text-sm font-semibold text-white">{log.action}</p>
                          <span className="text-xs text-[#94A3B8]">{log.time}</span>
                        </div>
                        <p className="text-xs text-[#94A3B8]">{log.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Modales 2FA (simulées en overlay) */}
              {show2FAModal && (
                <div className="fixed inset-0 bg-[#0A0F1E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-[#050810] border border-[#1E293B] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                    {show2FAModal === 'activate' && (
                      <>
                        <h3 className="text-lg font-bold text-white mb-2">Activer l'authentification à deux facteurs</h3>
                        <div className="text-sm text-[#94A3B8] mb-6 space-y-2">
                          <p>1. Scannez ce QR Code avec Google Authenticator ou Authy.</p>
                          <div className="bg-white p-2 rounded-xl w-32 h-32 mx-auto my-4 flex items-center justify-center border-4 border-[#1E293B]">
                            <span className="text-black font-bold text-xs text-center leading-tight">QR CODE<br/>(Simulé)</span>
                          </div>
                          <p>2. Entrez le code à 6 chiffres généré par l'application.</p>
                          <p className="text-xs text-[#F59E0B]">3. N'oubliez pas de sauvegarder vos codes de récupération.</p>
                        </div>
                        <Input placeholder="123456" value={modalInput} onChange={e => setModalInput(e.target.value)} maxLength={6} className="text-center tracking-[0.5em] font-mono text-lg" />
                      </>
                    )}
                    {show2FAModal === 'deactivate' && (
                      <>
                        <h3 className="text-lg font-bold text-white mb-2">Désactiver la 2FA ?</h3>
                        <p className="text-sm text-[#94A3B8] mb-4">Pour votre sécurité, veuillez entrer votre mot de passe actuel afin de confirmer cette action.</p>
                        <Input type="password" placeholder="Mot de passe actuel" value={modalInput} onChange={e => setModalInput(e.target.value)} />
                      </>
                    )}
                    {show2FAModal === 'recovery' && (
                      <>
                        <h3 className="text-lg font-bold text-white mb-2">Codes de récupération</h3>
                        <p className="text-sm text-[#94A3B8] mb-4">Entrez votre mot de passe pour voir ou régénérer vos codes de sécurité.</p>
                        <Input type="password" placeholder="Mot de passe actuel" value={modalInput} onChange={e => setModalInput(e.target.value)} />
                      </>
                    )}
                    
                    <div className="flex gap-3 justify-end mt-6">
                      <button onClick={() => {setShow2FAModal(null); setModalInput('')}} className="px-4 py-2 text-sm font-semibold text-[#94A3B8] hover:text-white transition-colors">
                        Annuler
                      </button>
                      <button onClick={handle2FAAction} disabled={!modalInput || isSaving} className={`px-6 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${show2FAModal === 'deactivate' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-[#10B981] hover:bg-[#059669] text-white'} disabled:opacity-50`}>
                        {isSaving && <Loader2 size={14} className="animate-spin" />}
                        {show2FAModal === 'deactivate' ? 'Désactiver' : 'Confirmer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 pb-24">
              {/* Carte 1 : Résumé des alertes */}
              <div className="bg-[#050810] border border-[#1E293B] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <BellRing size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">Résumé des alertes</h3>
                    <p className="text-sm text-[#94A3B8]">
                      Vous recevez actuellement <span className="text-white font-bold">{Object.values(notifs.alerts).filter(a => a.enabled).length} types d'alertes</span> actifs.
                    </p>
                  </div>
                </div>
                <button onClick={testNotification} className="px-4 py-2 bg-[#1E293B] hover:bg-[#334155] text-white text-sm font-semibold rounded-xl transition-colors border border-[#334155] flex items-center gap-2 whitespace-nowrap">
                  <Send size={14} /> Envoyer une notification test
                </button>
              </div>

              {/* Carte 2 : Canaux de communication */}
              <Section title="Canaux de communication" subtitle="Gérez vos moyens de contact globaux">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0A0F1E] border border-[#1E293B] rounded-xl gap-4">
                    <div className="flex items-start gap-3">
                      <Mail className="text-[#94A3B8] mt-0.5" size={18} />
                      <div>
                        <div className="flex items-center gap-3"><p className="text-white text-sm font-bold">Notifications par email</p></div>
                        <p className="text-xs text-[#94A3B8] mt-0.5">Recevoir les alertes sur {profile.email || 'finance@sigp.ci'}</p>
                        {notifs.channels.email && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#94A3B8]">Fréquence globale :</span>
                            <select value={notifs.emailFreq} onChange={(e) => setNotifs(s => ({...s, emailFreq: e.target.value}))} className="bg-[#1E293B] border border-[#334155] text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-[#10B981]">
                              <option>Immédiat</option>
                              <option>Digest quotidien à 8h</option>
                              <option>Digest hebdomadaire</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    <Toggle checked={notifs.channels.email} onChange={() => setNotifs(s => ({...s, channels: {...s.channels, email: !s.channels.email}}))} />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0A0F1E] border border-[#1E293B] rounded-xl gap-4">
                    <div className="flex items-start gap-3">
                      <MonitorSmartphone className="text-[#94A3B8] mt-0.5" size={18} />
                      <div>
                        <p className="text-white text-sm font-bold">Notifications push navigateur</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">Alertes en temps réel même hors de l'application</p>
                      </div>
                    </div>
                    <Toggle checked={notifs.channels.push} onChange={() => setNotifs(s => ({...s, channels: {...s.channels, push: !s.channels.push}}))} />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#050810] border border-[#1E293B] rounded-xl gap-4 opacity-50">
                    <div className="flex items-start gap-3">
                      <Smartphone className="text-[#94A3B8] mt-0.5" size={18} />
                      <div>
                        <p className="text-white text-sm font-bold flex items-center gap-2">Notifications SMS <span className="text-[10px] bg-[#1E293B] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Optionnel</span></p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">Pour les urgences extrêmes uniquement</p>
                      </div>
                    </div>
                    <button className="text-xs font-bold text-[#94A3B8] bg-[#1E293B] px-3 py-1.5 rounded-lg cursor-not-allowed border border-[#334155]">Désactivé</button>
                  </div>
                </div>
              </Section>

              {/* Carte 3 : Alertes Métier */}
              <Section title={`Alertes Métier (${formatRole(user?.role || 'Utilisateur')})`} subtitle="Configurez les alertes spécifiques à votre rôle">
                <div className="space-y-4">
                  {/* Budget */}
                  <div className={`p-4 border rounded-xl transition-colors ${notifs.alerts.budget.enabled ? 'bg-[#0A0F1E] border-[#1E293B]' : 'bg-[#050810] border-[#1E293B]/50'}`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <TrendingUp className={`${notifs.alerts.budget.enabled ? 'text-[#10B981]' : 'text-[#94A3B8]'} mt-0.5`} size={18} />
                        <div>
                          <p className="text-white text-sm font-bold">Dépassements budgétaires</p>
                          <p className="text-xs text-[#94A3B8] mt-0.5">Alerte lorsqu'un projet dépasse son budget alloué</p>
                        </div>
                      </div>
                      <Toggle checked={notifs.alerts.budget.enabled} onChange={() => updateAlert('budget', 'enabled', !notifs.alerts.budget.enabled)} />
                    </div>
                    {notifs.alerts.budget.enabled && (
                      <div className="mt-4 pt-4 border-t border-[#1E293B] flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#94A3B8] font-semibold">Seuil :</span>
                          <select value={notifs.alerts.budget.threshold} onChange={(e) => updateAlert('budget', 'threshold', e.target.value)} className="bg-[#1E293B] border border-[#334155] text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-[#10B981]">
                            <option>5%</option>
                            <option>10%</option>
                            <option>20%</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.budget.channels.email} onChange={(e) => updateAlertChannel('budget', 'email', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.email} /> Email</label>
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.budget.channels.push} onChange={(e) => updateAlertChannel('budget', 'push', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.push} /> Push</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#94A3B8] font-semibold">Fréquence :</span>
                          <select value={notifs.alerts.budget.frequency} onChange={(e) => updateAlert('budget', 'frequency', e.target.value)} className="bg-[#1E293B] border border-[#334155] text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-[#10B981]">
                            <option>Immédiat</option>
                            <option>Quotidien</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Trésorerie */}
                  <div className={`p-4 border rounded-xl transition-colors ${notifs.alerts.tresorerie.enabled ? 'bg-[#0A0F1E] border-[#1E293B]' : 'bg-[#050810] border-[#1E293B]/50'}`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Activity className={`${notifs.alerts.tresorerie.enabled ? 'text-[#3B82F6]' : 'text-[#94A3B8]'} mt-0.5`} size={18} />
                        <div>
                          <p className="text-white text-sm font-bold">Alertes de trésorerie</p>
                          <p className="text-xs text-[#94A3B8] mt-0.5">Seuils de trésorerie critique ou excédentaire</p>
                        </div>
                      </div>
                      <Toggle checked={notifs.alerts.tresorerie.enabled} onChange={() => updateAlert('tresorerie', 'enabled', !notifs.alerts.tresorerie.enabled)} />
                    </div>
                    {notifs.alerts.tresorerie.enabled && (
                      <div className="mt-4 pt-4 border-t border-[#1E293B] flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.tresorerie.channels.email} onChange={(e) => updateAlertChannel('tresorerie', 'email', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.email} /> Email</label>
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.tresorerie.channels.push} onChange={(e) => updateAlertChannel('tresorerie', 'push', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.push} /> Push</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#94A3B8] font-semibold">Fréquence :</span>
                          <select value={notifs.alerts.tresorerie.frequency} onChange={(e) => updateAlert('tresorerie', 'frequency', e.target.value)} className="bg-[#1E293B] border border-[#334155] text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-[#10B981]">
                            <option>Immédiat</option>
                            <option>Quotidien</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Validations */}
                  <div className={`p-4 border rounded-xl transition-colors ${notifs.alerts.validations.enabled ? 'bg-[#0A0F1E] border-[#1E293B]' : 'bg-[#050810] border-[#1E293B]/50'}`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Check className={`${notifs.alerts.validations.enabled ? 'text-[#8B5CF6]' : 'text-[#94A3B8]'} mt-0.5`} size={18} />
                        <div>
                          <p className="text-white text-sm font-bold">Validations en attente</p>
                          <p className="text-xs text-[#94A3B8] mt-0.5">Factures, paiements ou avenants à valider depuis +24h</p>
                        </div>
                      </div>
                      <Toggle checked={notifs.alerts.validations.enabled} onChange={() => updateAlert('validations', 'enabled', !notifs.alerts.validations.enabled)} />
                    </div>
                    {notifs.alerts.validations.enabled && (
                      <div className="mt-4 pt-4 border-t border-[#1E293B] flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.validations.channels.email} onChange={(e) => updateAlertChannel('validations', 'email', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.email} /> Email</label>
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.validations.channels.push} onChange={(e) => updateAlertChannel('validations', 'push', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.push} /> Push</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#94A3B8] font-semibold">Fréquence :</span>
                          <select value={notifs.alerts.validations.frequency} onChange={(e) => updateAlert('validations', 'frequency', e.target.value)} className="bg-[#1E293B] border border-[#334155] text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-[#10B981]">
                            <option>Quotidien (9h00)</option>
                            <option>Immédiat</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rapports */}
                  <div className={`p-4 border rounded-xl transition-colors ${notifs.alerts.rapports.enabled ? 'bg-[#0A0F1E] border-[#1E293B]' : 'bg-[#050810] border-[#1E293B]/50'}`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Briefcase className={`${notifs.alerts.rapports.enabled ? 'text-[#F59E0B]' : 'text-[#94A3B8]'} mt-0.5`} size={18} />
                        <div>
                          <p className="text-white text-sm font-bold">Rapports générés</p>
                          <p className="text-xs text-[#94A3B8] mt-0.5">Lorsqu'un rapport mensuel ou trimestriel est disponible</p>
                        </div>
                      </div>
                      <Toggle checked={notifs.alerts.rapports.enabled} onChange={() => updateAlert('rapports', 'enabled', !notifs.alerts.rapports.enabled)} />
                    </div>
                    {notifs.alerts.rapports.enabled && (
                      <div className="mt-4 pt-4 border-t border-[#1E293B] flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.rapports.channels.email} onChange={(e) => updateAlertChannel('rapports', 'email', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.email} /> Email</label>
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.rapports.channels.push} onChange={(e) => updateAlertChannel('rapports', 'push', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.push} /> Push</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#94A3B8] font-semibold">Fréquence :</span>
                          <select value={notifs.alerts.rapports.frequency} onChange={(e) => updateAlert('rapports', 'frequency', e.target.value)} className="bg-[#1E293B] border border-[#334155] text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-[#10B981]">
                            <option>Hebdomadaire (Lundi)</option>
                            <option>Mensuel (le 1er)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Section>

              {/* Carte 4 : Activité Projets */}
              <Section title="Activité Projets" subtitle="Suivez l'avancement et les risques">
                <div className="space-y-4">
                  {/* Risques */}
                  <div className="p-4 bg-[#0A0F1E] border border-red-500/30 rounded-xl">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-400 mt-0.5" size={18} />
                        <div>
                          <p className="text-white text-sm font-bold">Alertes risques critiques</p>
                          <p className="text-xs text-[#94A3B8] mt-0.5">Changement de statut vers "Critique" sur un projet suivi</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded font-bold uppercase tracking-wider">Obligatoire</span>
                        <Toggle checked={true} onChange={() => {}} disabled />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#1E293B] flex flex-wrap items-center gap-x-6 gap-y-3">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.risques.channels.email} onChange={(e) => updateAlertChannel('risques', 'email', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.email} /> Email</label>
                        <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.risques.channels.push} onChange={(e) => updateAlertChannel('risques', 'push', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.push} /> Push</label>
                      </div>
                      <span className="text-xs text-red-400 font-semibold bg-red-500/10 px-2.5 py-1 rounded-lg">Immédiat</span>
                    </div>
                  </div>

                  {/* Échéances */}
                  <div className={`p-4 border rounded-xl transition-colors ${notifs.alerts.echeances.enabled ? 'bg-[#0A0F1E] border-[#1E293B]' : 'bg-[#050810] border-[#1E293B]/50'}`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <CalendarClock className={`${notifs.alerts.echeances.enabled ? 'text-[#10B981]' : 'text-[#94A3B8]'} mt-0.5`} size={18} />
                        <div>
                          <p className="text-white text-sm font-bold">Échéances proches</p>
                          <p className="text-xs text-[#94A3B8] mt-0.5">Jalons ou deadlines dans moins de 48h</p>
                        </div>
                      </div>
                      <Toggle checked={notifs.alerts.echeances.enabled} onChange={() => updateAlert('echeances', 'enabled', !notifs.alerts.echeances.enabled)} />
                    </div>
                    {notifs.alerts.echeances.enabled && (
                      <div className="mt-4 pt-4 border-t border-[#1E293B] flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.echeances.channels.email} onChange={(e) => updateAlertChannel('echeances', 'email', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.email} /> Email</label>
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.echeances.channels.push} onChange={(e) => updateAlertChannel('echeances', 'push', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.push} /> Push</label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mentions */}
                  <div className={`p-4 border rounded-xl transition-colors ${notifs.alerts.mentions.enabled ? 'bg-[#0A0F1E] border-[#1E293B]' : 'bg-[#050810] border-[#1E293B]/50'}`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <MessageSquare className={`${notifs.alerts.mentions.enabled ? 'text-[#10B981]' : 'text-[#94A3B8]'} mt-0.5`} size={18} />
                        <div>
                          <p className="text-white text-sm font-bold">Commentaires et mentions</p>
                          <p className="text-xs text-[#94A3B8] mt-0.5">Quand quelqu'un vous mentionne dans un commentaire</p>
                        </div>
                      </div>
                      <Toggle checked={notifs.alerts.mentions.enabled} onChange={() => updateAlert('mentions', 'enabled', !notifs.alerts.mentions.enabled)} />
                    </div>
                    {notifs.alerts.mentions.enabled && (
                      <div className="mt-4 pt-4 border-t border-[#1E293B] flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.mentions.channels.email} onChange={(e) => updateAlertChannel('mentions', 'email', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.email} /> Email</label>
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={notifs.alerts.mentions.channels.push} onChange={(e) => updateAlertChannel('mentions', 'push', e.target.checked)} className="accent-[#10B981]" disabled={!notifs.channels.push} /> Push</label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Section>

              {/* Carte 5 : Plages horaires */}
              <Section title="Plages horaires (Mode Silence)" subtitle="Suspendez les notifications non critiques durant la nuit ou les week-ends">
                <div className={`p-4 border rounded-xl transition-colors ${notifs.dnd.enabled ? 'bg-[#0A0F1E] border-[#1E293B]' : 'bg-[#050810] border-[#1E293B]/50'}`}>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Moon className={`${notifs.dnd.enabled ? 'text-[#8B5CF6]' : 'text-[#94A3B8]'} mt-0.5`} size={18} />
                      <div>
                        <p className="text-white text-sm font-bold">Activer le mode silence</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">Les alertes critiques (dépassements, risques) ignoreront ce mode.</p>
                      </div>
                    </div>
                    <Toggle checked={notifs.dnd.enabled} onChange={() => setNotifs(s => ({...s, dnd: {...s.dnd, enabled: !s.dnd.enabled}}))} />
                  </div>
                  {notifs.dnd.enabled && (
                    <div className="mt-4 pt-4 border-t border-[#1E293B] space-y-4">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#94A3B8] font-semibold">De :</span>
                          <input type="time" value={notifs.dnd.start} onChange={(e) => setNotifs(s => ({...s, dnd: {...s.dnd, start: e.target.value}}))} className="bg-[#1E293B] border border-[#334155] text-sm text-white font-bold rounded-lg px-3 py-1.5 outline-none focus:border-[#10B981]" />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#94A3B8] font-semibold">À :</span>
                          <input type="time" value={notifs.dnd.end} onChange={(e) => setNotifs(s => ({...s, dnd: {...s.dnd, end: e.target.value}}))} className="bg-[#1E293B] border border-[#334155] text-sm text-white font-bold rounded-lg px-3 py-1.5 outline-none focus:border-[#10B981]" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-[#94A3B8] font-semibold mb-3">Jours d'activation :</p>
                        <div className="flex flex-wrap gap-2">
                          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                            <button key={day} onClick={() => toggleDndDay(day)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${notifs.dnd.days.includes(day) ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 shadow-sm shadow-[#10B981]/10' : 'bg-[#1E293B] text-[#94A3B8] border border-transparent hover:border-[#334155]'}`}>
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              {/* Boutons d'actions globaux */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-end border-t border-[#1E293B] gap-4">
                <div className="flex gap-2 w-full sm:w-auto">
                  {isNotifsDirty && (
                    <button onClick={cancelNotifsChanges} className="px-4 py-2.5 text-sm font-semibold text-[#94A3B8] hover:text-white transition-colors">
                      Annuler
                    </button>
                  )}
                  <button 
                    onClick={saveNotifs} 
                    disabled={!isNotifsDirty || isSaving}
                    className={`flex items-center justify-center gap-2 px-6 py-2.5 font-bold text-sm rounded-xl transition-all shadow-lg flex-1 sm:flex-none min-w-[260px]
                      ${isNotifsDirty 
                        ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20 active:scale-95 cursor-pointer' 
                        : 'bg-[#1E293B] text-[#94A3B8] cursor-not-allowed shadow-none'}`}
                  >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Enregistrer les modifications
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PRÉFÉRENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 pb-24">
              {/* THÈME */}
              <Section title="Thème" subtitle="Apparence de l'interface">
                <p className="text-xs text-[#94A3B8] mb-4">Le thème sombre est recommandé pour une utilisation prolongée.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'dark',  label: 'Sombre',   icon: Moon,    bg: 'bg-[#0A0F1E]', preview: <div className="w-full h-full bg-[#0A0F1E] border border-[#1E293B] rounded-t-lg"></div> },
                    { id: 'light', label: 'Clair',    icon: Sun,     bg: 'bg-[#F8FAFC]', preview: <div className="w-full h-full bg-white border border-slate-200 rounded-t-lg"></div> },
                    { id: 'auto',  label: 'Système',  icon: MonitorSmartphone, bg: 'bg-[#0A0F1E]', preview: <div className="w-full h-full flex"><div className="w-1/2 h-full bg-[#0A0F1E] border-t border-l border-[#1E293B] rounded-tl-lg"></div><div className="w-1/2 h-full bg-white border-t border-r border-slate-200 rounded-tr-lg"></div></div> },
                  ].map(t => (
                    <button key={t.id} onClick={() => setPrefs(s => ({...s, theme: t.id}))}
                      className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200
                        ${prefs.theme === t.id ? 'border-[#10B981] bg-[#10B981]/5 shadow-lg shadow-[#10B981]/10' : 'border-[#1E293B] bg-[#050810] hover:border-[#334155]'}`}>
                      <t.icon size={24} className={`mb-3 ${prefs.theme === t.id ? 'text-[#10B981]' : 'text-[#94A3B8]'}`} />
                      <p className={`text-sm font-bold mb-4 ${prefs.theme === t.id ? 'text-white' : 'text-[#94A3B8]'}`}>{t.label}</p>
                      <div className="w-full h-16 rounded-lg overflow-hidden flex items-end justify-center px-4 pt-4 bg-[#1E293B]/30 border border-[#1E293B]/50">
                        {t.preview}
                      </div>
                      {prefs.theme === t.id && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </Section>

              {/* LANGUE ET RÉGION */}
              <Section title="Langue et région" subtitle="Paramètres régionaux de l'application">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2"><Globe2 size={14} /> Langue de l'interface</label>
                    <select value={prefs.region.lang} onChange={e => setPrefs(s => ({...s, region: {...s.region, lang: e.target.value}}))}
                      className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white appearance-none outline-none focus:border-[#10B981]">
                      <option value="fr">🇫🇷 Français</option>
                      <option value="en">🇬🇧 English</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2"><Clock size={14} /> Fuseau horaire</label>
                    <select value={prefs.region.timezone} onChange={e => setPrefs(s => ({...s, region: {...s.region, timezone: e.target.value}}))}
                      className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white appearance-none outline-none focus:border-[#10B981]">
                      <option>UTC+0 - Abidjan</option>
                      <option>UTC+1 - Douala</option>
                      <option>UTC+2 - Nairobi</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2"><Calendar size={14} /> Format de date</label>
                    <select value={prefs.region.dateFormat} onChange={e => setPrefs(s => ({...s, region: {...s.region, dateFormat: e.target.value}}))}
                      className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white appearance-none outline-none focus:border-[#10B981]">
                      <option>JJ/MM/AAAA (ex: 15/01/2026)</option>
                      <option>MM/JJ/AAAA (ex: 01/15/2026)</option>
                      <option>AAAA-MM-JJ (ex: 2026-01-15)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2"><Clock size={14} /> Format de l'heure</label>
                    <select value={prefs.region.timeFormat} onChange={e => setPrefs(s => ({...s, region: {...s.region, timeFormat: e.target.value}}))}
                      className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white appearance-none outline-none focus:border-[#10B981]">
                      <option>24h (ex: 14:30)</option>
                      <option>12h AM/PM (ex: 02:30 PM)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2"><Coins size={14} /> Devise par défaut</label>
                    <select value={prefs.region.currency} onChange={e => setPrefs(s => ({...s, region: {...s.region, currency: e.target.value}}))}
                      className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white appearance-none outline-none focus:border-[#10B981]">
                      <option>XOF (Franc CFA)</option>
                      <option>EUR (€)</option>
                      <option>USD ($)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2"><Hash size={14} /> Format des nombres</label>
                    <select value={prefs.region.numberFormat} onChange={e => setPrefs(s => ({...s, region: {...s.region, numberFormat: e.target.value}}))}
                      className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white appearance-none outline-none focus:border-[#10B981]">
                      <option>Espace pour milliers, virgule pour décimales (ex: 1 250 000,00)</option>
                      <option>Virgule pour milliers, point pour décimales (ex: 1,250,000.00)</option>
                    </select>
                  </div>
                </div>
              </Section>

              {/* AFFICHAGE ET COMPORTEMENT */}
              <Section title="Affichage et comportement" subtitle="Personnalisez votre navigation au quotidien">
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2"><LayoutTemplate size={14} /> Page d'accueil par défaut</label>
                    <select value={prefs.display.homePage} onChange={e => setPrefs(s => ({...s, display: {...s.display, homePage: e.target.value}}))}
                      className="w-full sm:w-1/2 bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white appearance-none outline-none focus:border-[#10B981]">
                      <option>Tableau de bord</option>
                      <option>Projets</option>
                      <option>Tâches à valider</option>
                    </select>
                    <p className="text-xs text-[#94A3B8] mt-1">Détermine où vous arrivez après connexion.</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2 mb-2"><Eye size={14} /> Densité d'affichage</label>
                    <div className="flex gap-2">
                      {['Confortable', 'Compact'].map(d => (
                        <button key={d} onClick={() => setPrefs(s => ({...s, display: {...s.display, density: d}}))}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${prefs.display.density === d ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30' : 'bg-[#1E293B] text-[#94A3B8] border-transparent hover:border-[#334155]'}`}>
                          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${prefs.display.density === d ? 'border-[#10B981]' : 'border-[#94A3B8]'}`}>
                            {prefs.display.density === d && <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />}
                          </div>
                          {d}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-2">Le mode compact est recommandé pour consulter de longs tableaux budgétaires.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2"><LayoutTemplate size={14} /> Éléments par page (Pagination)</label>
                    <select value={prefs.display.pagination} onChange={e => setPrefs(s => ({...s, display: {...s.display, pagination: e.target.value}}))}
                      className="w-full sm:w-1/4 bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white appearance-none outline-none focus:border-[#10B981]">
                      <option>10 éléments</option>
                      <option>25 éléments</option>
                      <option>50 éléments</option>
                      <option>100 éléments</option>
                    </select>
                  </div>
                </div>
              </Section>

              {/* ACCESSIBILITÉ */}
              <Section title="Accessibilité" subtitle="Ajustez l'interface pour un meilleur confort visuel">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#0A0F1E] border border-[#1E293B] rounded-xl">
                      <div>
                        <p className="text-white text-sm font-bold flex items-center gap-2"><Accessibility size={16} className="text-[#94A3B8]" /> Réduire les animations</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">Désactive les transitions et effets visuels complexes.</p>
                      </div>
                      <Toggle checked={prefs.a11y.reduceMotion} onChange={() => setPrefs(s => ({...s, a11y: {...s.a11y, reduceMotion: !s.a11y.reduceMotion}}))} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0A0F1E] border border-[#1E293B] rounded-xl">
                      <div>
                        <p className="text-white text-sm font-bold flex items-center gap-2"><Sun size={16} className="text-[#94A3B8]" /> Contraste élevé</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">Améliore la lisibilité des textes sur le fond sombre.</p>
                      </div>
                      <Toggle checked={prefs.a11y.highContrast} onChange={() => setPrefs(s => ({...s, a11y: {...s.a11y, highContrast: !s.a11y.highContrast}}))} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2 mb-2"><Type size={14} /> Taille du texte</label>
                    <div className="flex gap-2">
                      {['Standard', 'Grand', 'Très grand'].map(ts => (
                        <button key={ts} onClick={() => setPrefs(s => ({...s, a11y: {...s.a11y, textSize: ts}}))}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${prefs.a11y.textSize === ts ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30' : 'bg-[#1E293B] text-[#94A3B8] border-transparent hover:border-[#334155]'}`}>
                          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${prefs.a11y.textSize === ts ? 'border-[#10B981]' : 'border-[#94A3B8]'}`}>
                            {prefs.a11y.textSize === ts && <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />}
                          </div>
                          {ts}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Boutons d'actions globaux */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-end border-t border-[#1E293B] gap-4">
                <div className="flex gap-2 w-full sm:w-auto">
                  {isPrefsDirty && (
                    <button onClick={cancelPrefsChanges} className="px-4 py-2.5 text-sm font-semibold text-[#94A3B8] hover:text-white transition-colors">
                      Annuler
                    </button>
                  )}
                  <button 
                    onClick={savePrefs} 
                    disabled={!isPrefsDirty || isSaving}
                    className={`flex items-center justify-center gap-2 px-6 py-2.5 font-bold text-sm rounded-xl transition-all shadow-lg flex-1 sm:flex-none min-w-[260px]
                      ${isPrefsDirty 
                        ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20 active:scale-95 cursor-pointer' 
                        : 'bg-[#1E293B] text-[#94A3B8] cursor-not-allowed shadow-none'}`}
                  >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Enregistrer les préférences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RÔLES */}
          {activeTab === 'roles' && (
            <Section title="Gestion des rôles et permissions" subtitle="Contrôle d'accès basé sur les rôles (RBAC)">
              <div className="space-y-3">
                {[
                  { role: 'Administrateur', desc: 'Accès complet à toutes les fonctionnalités', color: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20', perms: ['Lecture', 'Écriture', 'Suppression', 'Administration'] },
                  { role: 'Coordonnateur',  desc: 'Gestion des projets et rapports',            color: 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20', perms: ['Lecture', 'Écriture', 'Rapports'] },
                  { role: 'Responsable PTBA', desc: 'Planification budgétaire uniquement',      color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20', perms: ['Lecture', 'PTBA', 'Budget'] },
                  { role: 'Bailleur de fonds', desc: 'Lecture seule et rapports bailleurs',     color: 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/20', perms: ['Lecture', 'Rapports'] },
                ].map(({ role, desc, color, perms }) => (
                  <div key={role} className="flex items-center justify-between py-4 border-b border-[#1E293B]/50 last:border-0">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${color}`}>{role}</span>
                        {user?.role === role && (
                          <span className="text-[10px] text-[#10B981] font-semibold">● Votre rôle</span>
                        )}
                      </div>
                      <p className="text-[#94A3B8] text-xs">{desc}</p>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {perms.map(p => (
                          <span key={p} className="text-[10px] text-[#94A3B8] bg-[#1E293B] px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    </div>
                    <button className="text-xs text-[#94A3B8] hover:text-white border border-[#1E293B] hover:border-white/20 px-3 py-1.5 rounded-xl transition-all">
                      Modifier
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          )}

        </div>
      </div>

      {/* Modal de rechargement (Changement de langue) */}
      {showReloadModal && (
        <div className="fixed inset-0 bg-[#0A0F1E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#050810] border border-[#1E293B] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <RefreshCw size={20} className="text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-white">Rechargement nécessaire</h3>
            </div>
            <p className="text-sm text-[#94A3B8] mb-6">
              Le changement de langue nécessite de recharger la page. Vos modifications non sauvegardées sur d'autres onglets seront perdues.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowReloadModal(false)} className="px-4 py-2 text-sm font-semibold text-[#94A3B8] hover:text-white transition-colors">
                Annuler
              </button>
              <button onClick={handleReload} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-colors">
                Recharger maintenant
              </button>
            </div>
          </div>
        </div>
      )}

      <SavedBanner show={toast.show} type={toast.type} message={toast.message} />
    </div>
  )
}
