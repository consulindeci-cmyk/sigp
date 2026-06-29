import { PageHeader } from '@/components/layout/PageHeader';
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  Eye, EyeOff, AlertCircle, Mail, Lock, Shield,
  LayoutDashboard, Coins, AlertTriangle, FileText,
  User, Check
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const schema = z.object({
  email: z.string().email('Email invalide').min(1, 'Requis'),
  mot_de_passe: z.string().min(6, 'Minimum 6 caractères'),
  role: z.string().optional()
})
type FormData = z.infer<typeof schema>

function getStrength(pwd: string) {
  if (pwd.length === 0) return { label: '', bars: ['bg-muted-200', 'bg-muted-200', 'bg-muted-200'] }
  if (pwd.length < 5)   return { label: 'Faible',  bars: ['bg-red-400',    'bg-muted-200',  'bg-muted-200'] }
  if (pwd.length < 8)   return { label: 'Moyen',   bars: ['bg-orange-400', 'bg-orange-400', 'bg-muted-200'] }
  return                       { label: 'Fort',    bars: ['bg-[#1d9e75]',  'bg-[#1d9e75]',  'bg-[#1d9e75]'] }
}

const FEATURES = [
  { Icon: LayoutDashboard, title: 'Tableau de bord',    sub: 'Vue consolidée des KPIs',          color: 'text-blue-400   bg-blue-500/10'   },
  { Icon: Coins,           title: 'Budget & PTBA',       sub: 'Suivi financier rigoureux',         color: 'text-[#1d9e75] bg-[#1d9e75]/10' },
  { Icon: AlertTriangle,   title: 'Gestion des risques', sub: 'Matrice et plan d\'atténuation',    color: 'text-orange-400 bg-orange-500/10' },
  { Icon: FileText,        title: 'Rapports bailleurs',  sub: 'Génération automatique',            color: 'text-indigo-400 bg-indigo-500/10' },
] as const

export default function LoginPage() {
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const emailRef = useRef<HTMLInputElement>(null)

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
    setError, setValue, watch
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', mot_de_passe: '', role: 'Administrateur' }
  })

  useEffect(() => { emailRef.current?.focus() }, [])

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.mot_de_passe)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('root', { message: 'Identifiants incorrects ou accès refusé.' })
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    }
  }

  const { ref: hookFormEmailRef, ...emailRest } = register('email')
  const pwdValue = watch('mot_de_passe') ?? ''
  const strength = getStrength(pwdValue)

  const fillCredentials = (email: string, mdp: string) => {
    setValue('email', email, { shouldValidate: true })
    setValue('mot_de_passe', mdp, { shouldValidate: true })
  }

  const DEMO_USERS = [
    { label: 'Super Admin', email: 'admin@sigp.ci', pwd: 'Admin@2026' },
    { label: 'Coordonnateur', email: 'coord@sigp.ci', pwd: 'Coord@2026' },
    { label: 'Financier', email: 'finance@sigp.ci', pwd: 'Finance@2026' },
    { label: 'Bailleur', email: 'bailleur@banquemonde.org', pwd: 'Bailleur@2026' },
    { label: 'Auditeur', email: 'audit@sigp.ci', pwd: 'Audit@2026' },
  ]

  return (
    // ROOT : h-screen + overflow-hidden strict
    <div className="h-screen w-screen overflow-hidden flex font-sans antialiased bg-white selection:bg-[#1d9e75]/20">

      {/* ══════════════════════════════════════════════
          COLONNE GAUCHE — Présentation
          Masquée sur < lg, visible sur lg+
      ══════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex w-[52%] flex-col h-full overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #0a1628 0%, #0d1e36 55%, #0f2540 100%)' }}
      >
        {/* Blobs décoratifs */}
        <div className="pointer-events-none absolute top-0 left-0 w-80 h-80 rounded-full bg-[#1d9e75]/10 blur-[100px] -translate-x-1/3 -translate-y-1/3" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-600/8 blur-[120px]" />

        {/* Contenu — flex column avec justify-between pour tout répartir */}
        <div className="relative z-10 flex flex-col h-full px-10 xl:px-14 py-8 xl:py-10">

          {/* ── HEADER LOGO ── */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 xl:w-12 xl:h-12 bg-gradient-to-br from-[#1d9e75] to-[#138f67] rounded-lg flex items-center justify-center shadow-sm shadow-[#1d9e75]/25">
              <span className="text-white font-black text-lg xl:text-xl tracking-tighter">GP</span>
            </div>
            <div>
              <PageHeader title="DevProject" description="Plateforme de pilotage des projets" />
            </div>
          </div>

          {/* ── ZONE CENTRALE ── flex-1 pour occuper tout l'espace dispo */}
          <div className="flex-1 flex flex-col justify-center min-h-0 py-4">

            {/* Badge SSL */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full w-fit mb-4 xl:mb-5
              bg-[#1d9e75]/10 border border-[#1d9e75]/25">
              <Shield size={12} className="text-[#1d9e75]" />
              <span className="text-[#1d9e75] text-[10px] font-bold uppercase tracking-widest">Accès sécurisé SSL</span>
            </div>

            {/* Titre principal */}
            <h2 className="text-3xl xl:text-4xl font-black text-white mb-3 tracking-tight leading-[1.1]">
              Bienvenue sur<br />votre espace projet
            </h2>
            <p className="text-slate-400 text-sm xl:text-base leading-relaxed mb-5 xl:mb-6 max-w-md">
              Centralisez vos données et suivez l'exécution physique et financière en temps réel.
            </p>

            {/* Stats cards — compactes */}
            <div className="grid grid-cols-3 gap-3 mb-5 xl:mb-6">
              {[
                { value: '1 200+', label: 'Projets actifs',  accent: 'text-[#1d9e75]' },
                { value: '94 %',  label: "Taux d'exéc.",     accent: 'text-blue-400'   },
                { value: '3+',    label: 'Alertes',          accent: 'text-orange-400' },
              ].map(({ value, label, accent }) => (
                <div key={label}
                  className="glass-panel rounded-lg px-3 py-3 xl:px-4 xl:py-3.5 transition-all duration-300 hover:-translate-y-0.5">
                  <p className={`text-xl xl:text-xl font-black leading-none ${accent}`}>{value}</p>
                  <p className="text-[10px] xl:text-xs font-semibold text-slate-500 mt-1.5 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>

            {/* Features — compactes */}
            <ul className="space-y-1">
              {FEATURES.map(({ Icon, title, sub, color }) => (
                <li key={title}
                  className="group flex items-center gap-3 px-2 py-2 -mx-2 rounded-lg
                    cursor-default transition-all duration-200
                    hover:bg-white/[0.04] hover:translate-x-1
                    border-l-2 border-transparent hover:border-[#1d9e75]">
                  <div className={`w-9 h-9 xl:w-10 xl:h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-slate-200 font-semibold text-xs leading-tight">{title}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5 font-medium">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>

          </div>

          {/* ── FOOTER ── toujours en bas */}
          <div className="shrink-0 pt-4 border-t border-white/8 flex items-center justify-between">
            <p className="text-[10px] text-slate-600 font-medium">SIGP v2.1.0</p>
            <p className="text-[10px] text-slate-600 font-medium">© 2026 DevProject</p>
          </div>

        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          COLONNE DROITE — Formulaire de connexion
          Prend toute la largeur sur mobile/tablette
      ══════════════════════════════════════════════ */}
      <main className="flex-1 h-full overflow-hidden bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">

        {/* Glow doux */}
        <div className="pointer-events-none absolute top-0 right-0 w-80 h-80 bg-blue-100/40 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-[#1d9e75]/5 rounded-full blur-[60px]" />

        {/* Carte login — taille maximale adaptée à la hauteur dispo */}
        <div className={`
          relative z-10 w-full max-w-[400px] bg-white rounded-lg
          border border-slate-100/80 shadow-[0_8px_40px_rgba(0,0,0,0.06)]
          px-6 py-6 sm:px-8 sm:py-7
          ${isShaking ? 'animate-shake' : ''}
        `}>

          {/* Logo mobile (< lg) */}
          <div className="lg:hidden flex justify-center mb-5">
            <div className="w-11 h-11 bg-gradient-to-br from-[#1d9e75] to-[#138f67] rounded-lg flex items-center justify-center shadow-sm shadow-[#1d9e75]/30">
              <span className="text-white font-black text-lg">GP</span>
            </div>
          </div>

          {/* Titre */}
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-[#0a1628] tracking-tight mb-1">Connexion</h2>
            <p className="text-xs text-slate-500 font-medium">
              Accédez à votre espace sécurisé de gestion de projet.
            </p>
          </div>

          {/* ── FORMULAIRE ── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">

            {/* Email */}
            <div>
              <div className={`
                relative flex items-center rounded-lg bg-[#f8fafc]
                border transition-all duration-200
                focus-within:ring-2 focus-within:ring-[#1d9e75]/15 focus-within:border-[#1d9e75]
                ${errors.email ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}
              `}>
                <span className="pl-3.5 pr-2 flex items-center shrink-0">
                  <Mail size={15} className="text-slate-400" />
                </span>
                <input
                  {...emailRest}
                  ref={(e) => { hookFormEmailRef(e); (emailRef as React.MutableRefObject<HTMLInputElement | null>).current = e }}
                  type="email"
                  placeholder="nom@sigp.ci"
                  autoComplete="email"
                  className="flex-1 bg-transparent text-slate-900 text-sm font-medium py-3 pr-3 outline-none placeholder:text-slate-300"
                />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1 text-red-500 text-[11px] font-semibold mt-1">
                  <AlertCircle size={10} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <div className={`
                relative flex items-center rounded-lg bg-[#f8fafc]
                border transition-all duration-200
                focus-within:ring-2 focus-within:ring-[#1d9e75]/15 focus-within:border-[#1d9e75]
                ${errors.mot_de_passe ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}
              `}>
                <span className="pl-3.5 pr-2 flex items-center shrink-0">
                  <Lock size={15} className="text-slate-400" />
                </span>
                <input
                  {...register('mot_de_passe')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="flex-1 bg-transparent text-slate-900 text-sm font-medium py-3 outline-none placeholder:text-slate-300"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="px-3 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Strength bar */}
              {pwdValue.length > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1 flex-1">
                    {strength.bars.map((cls, i) => (
                      <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${cls}`} />
                    ))}
                  </div>
                  {strength.label && <span className="text-[10px] font-bold text-slate-400">{strength.label}</span>}
                </div>
              )}
              {errors.mot_de_passe && (
                <p className="flex items-center gap-1 text-red-500 text-[11px] font-semibold mt-1">
                  <AlertCircle size={10} /> {errors.mot_de_passe.message}
                </p>
              )}
            </div>

            {/* Rôle */}
            <div className={`
              relative flex items-center rounded-lg bg-[#f8fafc]
              border border-slate-200 hover:border-slate-300
              transition-all duration-200
              focus-within:ring-2 focus-within:ring-[#1d9e75]/15 focus-within:border-[#1d9e75]
            `}>
              <span className="pl-3.5 pr-2 flex items-center shrink-0">
                <User size={15} className="text-slate-400" />
              </span>
              <select {...register('role')}
                className="flex-1 bg-transparent text-slate-900 text-sm font-medium py-3 pr-8 outline-none appearance-none cursor-pointer">
                <option value="Administrateur">Administrateur système</option>
                <option value="Coordonnateur">Coordonnateur de projet</option>
                <option value="Responsable_PTBA">Responsable PTBA</option>
                <option value="Bailleur">Bailleur de fonds</option>
              </select>
              <span className="absolute right-3 text-slate-400 pointer-events-none">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>

            {/* Se souvenir + Mot de passe oublié */}
            <div className="flex items-center justify-between pt-0.5">
              <button type="button" onClick={() => setRememberMe(v => !v)} className="flex items-center gap-2 group">
                <div className={`w-4 h-4 rounded-[4px] border-2 flex items-center justify-center transition-all duration-200
                  ${rememberMe ? 'bg-[#1d9e75] border-[#1d9e75]' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                  {rememberMe && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-xs font-semibold text-slate-600 select-none">Se souvenir de moi</span>
              </button>
              <a href="#" className="text-xs font-bold text-[#1d9e75] hover:underline transition-colors">
                Mot de passe oublié ?
              </a>
            </div>

            {/* Erreur globale */}
            {errors.root && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <p className="text-red-700 text-xs font-semibold">{errors.root.message}</p>
              </div>
            )}

            {/* Bouton principal */}
            <button type="submit" disabled={isSubmitting}
              className="group relative w-full overflow-hidden flex justify-center items-center gap-2
                bg-[#0a1628] text-white font-bold rounded-lg text-sm px-4 py-2.5
                transition-all duration-200 hover:bg-[#0d1e36]
                hover:shadow-[0_0_20px_rgba(29,158,117,0.3)]
                active:scale-[0.98] shadow-[0_4px_15px_rgba(10,22,40,0.18)]
                disabled:opacity-70 disabled:cursor-not-allowed mt-1">
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.8s_ease-in-out_infinite]" />
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  Authentification…
                </>
              ) : 'Se connecter à mon espace'}
            </button>

          </form>

          {/* Séparateur */}
          <div className="my-4 relative flex items-center">
            <div className="flex-1 border-t border-slate-200" />
            <span className="mx-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Comptes utilisateurs</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Encarts vrais comptes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto sigp-scrollbar pr-1">
            {DEMO_USERS.map((user, idx) => (
              <button 
                key={idx}
                type="button" 
                onClick={() => fillCredentials(user.email, user.pwd)}
                className="w-full group relative overflow-hidden
                  bg-[#f8fafc] border border-slate-200 hover:border-[#1d9e75]/50
                  rounded-lg px-3 py-2 transition-all duration-300
                  flex flex-col text-left hover:bg-[#f0fdf8]
                  hover:shadow-[0_4px_10px_rgba(29,158,117,0.08)]"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[#1d9e75] text-[10px] font-bold uppercase tracking-wider">{user.label}</span>
                </div>
                <div className="flex flex-col">
                  <code className="text-slate-600 group-hover:text-[#1d9e75] text-[10px] font-bold font-mono truncate">{user.email}</code>
                </div>
              </button>
            ))}
          </div>

        </div>
      </main>

      <style>{`@keyframes shimmer { to { transform: translateX(200%); } }`}</style>
    </div>
  )
}
