import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import {
  User, Lock, Bell, Globe, Moon, Shield, Save,
  Eye, EyeOff, Check, AlertTriangle
} from 'lucide-react'

// ── Section wrapper ────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#101827] border border-[#1E293B] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1E293B]">
        <h2 className="text-white font-bold text-sm">{title}</h2>
        {subtitle && <p className="text-[#94A3B8] text-xs mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
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

// ── Toggle ─────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1E293B]/50 last:border-0">
      <span className="text-sm text-[#94A3B8]">{label}</span>
      <button onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 ${checked ? 'bg-[#10B981]' : 'bg-[#1E293B]'}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

// ── Saved banner ───────────────────────────────────────────────
function SavedBanner({ show }: { show: boolean }) {
  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 bg-[#10B981] text-white px-5 py-3 rounded-2xl shadow-2xl shadow-[#10B981]/30 transition-all duration-500 z-50
      ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <Check size={16} strokeWidth={3} />
      <span className="text-sm font-bold">Modifications enregistrées</span>
    </div>
  )
}

// ── Settings Page ──────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profil')
  const [showPwd, setShowPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [saved, setSaved] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [lang, setLang] = useState('fr')
  const [notifs, setNotifs] = useState({
    email: true, push: true, risques: true, rapports: false, budget: true
  })
  const [profile, setProfile] = useState({
    prenom: user?.prenom ?? 'Admin',
    nom: user?.nom ?? 'DevProject',
    email: user?.email ?? 'admin@sigp.ci',
    role: user?.role ?? 'Administrateur',
    telephone: '',
    organisation: 'Ministère du Développement',
  })
  const [pwd, setPwd] = useState({ actuel: '', nouveau: '', confirm: '' })

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const tabs = [
    { id: 'profil',        label: 'Profil',          icon: User    },
    { id: 'securite',      label: 'Sécurité',         icon: Lock    },
    { id: 'notifications', label: 'Notifications',    icon: Bell    },
    { id: 'preferences',   label: 'Préférences',      icon: Globe   },
    { id: 'roles',         label: 'Rôles',            icon: Shield  },
  ]

  const initials = `${profile.prenom?.[0] ?? 'A'}${profile.nom?.[0] ?? 'D'}`

  return (
    <div className="p-6 space-y-6 min-h-full">

      {/* Title */}
      <div>
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
            <>
              <Section title="Informations du profil" subtitle="Mettez à jour vos informations personnelles">
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#1E293B]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center text-white text-xl font-black shadow-xl">
                    {initials}
                  </div>
                  <div>
                    <p className="text-white font-bold">{profile.prenom} {profile.nom}</p>
                    <p className="text-[#94A3B8] text-xs mt-0.5">{profile.role}</p>
                    <button className="mt-2 text-xs text-[#10B981] hover:underline font-semibold">
                      Modifier la photo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Prénom">
                    <Input value={profile.prenom} onChange={e => setProfile(s => ({ ...s, prenom: e.target.value }))} />
                  </Field>
                  <Field label="Nom">
                    <Input value={profile.nom} onChange={e => setProfile(s => ({ ...s, nom: e.target.value }))} />
                  </Field>
                  <Field label="Adresse email" hint="Utilisé pour les notifications et la connexion">
                    <Input type="email" value={profile.email} onChange={e => setProfile(s => ({ ...s, email: e.target.value }))} />
                  </Field>
                  <Field label="Téléphone">
                    <Input value={profile.telephone} onChange={e => setProfile(s => ({ ...s, telephone: e.target.value }))} placeholder="+225 07..." />
                  </Field>
                  <Field label="Organisation" hint="Votre institution ou organisation d'appartenance">
                    <Input value={profile.organisation} onChange={e => setProfile(s => ({ ...s, organisation: e.target.value }))} />
                  </Field>
                  <Field label="Rôle">
                    <div className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-[#94A3B8]">
                      {profile.role} <span className="ml-2 text-[10px] text-[#94A3B8]/50">(modifiable via Rôles)</span>
                    </div>
                  </Field>
                </div>
              </Section>

              <div className="flex justify-end">
                <button onClick={save}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#10B981]/20 active:scale-95">
                  <Save size={15} /> Enregistrer les modifications
                </button>
              </div>
            </>
          )}

          {/* SÉCURITÉ */}
          {activeTab === 'securite' && (
            <>
              <Section title="Changement de mot de passe" subtitle="Utilisez un mot de passe fort d'au moins 8 caractères">
                <div className="space-y-4">
                  <Field label="Mot de passe actuel">
                    <div className="relative">
                      <Input type={showPwd ? 'text' : 'password'} value={pwd.actuel} onChange={e => setPwd(s => ({ ...s, actuel: e.target.value }))} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white">
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Nouveau mot de passe">
                    <div className="relative">
                      <Input type={showNewPwd ? 'text' : 'password'} value={pwd.nouveau} onChange={e => setPwd(s => ({ ...s, nouveau: e.target.value }))} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowNewPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white">
                        {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirmer le nouveau mot de passe">
                    <Input type="password" value={pwd.confirm} onChange={e => setPwd(s => ({ ...s, confirm: e.target.value }))} placeholder="••••••••" />
                    {pwd.nouveau && pwd.confirm && pwd.nouveau !== pwd.confirm && (
                      <p className="text-red-400 text-[11px] mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                  </Field>
                </div>
              </Section>

              <Section title="Paramètres de sécurité" subtitle="Options de sécurité avancées">
                <Toggle checked label="Authentification à deux facteurs (2FA)" onChange={() => {}} />
                <Toggle checked label="Alertes de connexion par email" onChange={() => {}} />
                <Toggle checked={false} label="Sessions actives simultanées" onChange={() => {}} />
              </Section>

              <div className="flex justify-end">
                <button onClick={save}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#10B981]/20 active:scale-95">
                  <Save size={15} /> Mettre à jour le mot de passe
                </button>
              </div>
            </>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <>
              <Section title="Gestion des notifications" subtitle="Choisissez comment et quand vous être notifié">
                <div className="space-y-1">
                  <Toggle checked={notifs.email} onChange={() => setNotifs(s => ({ ...s, email: !s.email }))} label="Notifications par email" />
                  <Toggle checked={notifs.push} onChange={() => setNotifs(s => ({ ...s, push: !s.push }))} label="Notifications push navigateur" />
                  <Toggle checked={notifs.risques} onChange={() => setNotifs(s => ({ ...s, risques: !s.risques }))} label="Alertes risques critiques" />
                  <Toggle checked={notifs.budget} onChange={() => setNotifs(s => ({ ...s, budget: !s.budget }))} label="Dépassements budgétaires" />
                  <Toggle checked={notifs.rapports} onChange={() => setNotifs(s => ({ ...s, rapports: !s.rapports }))} label="Génération de rapports" />
                </div>
              </Section>

              <div className="flex justify-end">
                <button onClick={save}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#10B981]/20 active:scale-95">
                  <Save size={15} /> Enregistrer
                </button>
              </div>
            </>
          )}

          {/* PRÉFÉRENCES */}
          {activeTab === 'preferences' && (
            <>
              <Section title="Thème" subtitle="Apparence de l'interface">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark',  label: 'Sombre',   bg: 'bg-[#0A0F1E]', border: 'border-[#1E293B]' },
                    { id: 'light', label: 'Clair',    bg: 'bg-slate-100',  border: 'border-slate-300' },
                    { id: 'auto',  label: 'Système',  bg: 'bg-gradient-to-br from-[#0A0F1E] to-slate-100', border: 'border-[#1E293B]' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200
                        ${theme === t.id ? 'border-[#10B981] ring-2 ring-[#10B981]/20' : 'border-[#1E293B] hover:border-white/20'}`}>
                      <div className={`h-16 ${t.bg} ${t.border}`} />
                      <div className="px-3 py-2 bg-[#0A0F1E] border-t border-[#1E293B]">
                        <p className="text-white text-xs font-semibold">{t.label}</p>
                      </div>
                      {theme === t.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center">
                          <Check size={11} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Langue et région" subtitle="Préférences régionales">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Langue de l'interface">
                    <select value={lang} onChange={e => setLang(e.target.value)}
                      className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-[#10B981]/50">
                      <option value="fr">🇫🇷 Français</option>
                      <option value="en">🇬🇧 English</option>
                      <option value="ar">🇸🇦 العربية</option>
                    </select>
                  </Field>
                  <Field label="Fuseau horaire">
                    <select className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-[#10B981]/50">
                      <option>UTC+0 — Abidjan</option>
                      <option>UTC+1 — Douala</option>
                      <option>UTC+2 — Nairobi</option>
                    </select>
                  </Field>
                </div>
              </Section>

              <div className="flex justify-end">
                <button onClick={save}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#10B981]/20 active:scale-95">
                  <Save size={15} /> Enregistrer les préférences
                </button>
              </div>
            </>
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

      <SavedBanner show={saved} />
    </div>
  )
}
