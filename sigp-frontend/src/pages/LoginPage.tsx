import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  Eye, EyeOff, AlertCircle, Mail, Lock, Shield,
  LayoutDashboard, DollarSign, AlertTriangle, FileText,
  User, Copy, CheckCircle2, Check
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const schema = z.object({
  email: z.string().email('Adresse email invalide').min(1, 'Email requis'),
  mot_de_passe: z.string().min(6, 'Minimum 6 caractères'),
  role: z.string().optional()
})
type FormData = z.infer<typeof schema>

// ─── Password strength helper ─────────────────────────────────────
function getStrength(pwd: string): { label: string; bars: string[] } {
  const len = pwd.length
  if (len === 0) return { label: '', bars: ['bg-slate-200', 'bg-slate-200', 'bg-slate-200'] }
  if (len < 5)   return { label: 'Faible',  bars: ['bg-red-400',    'bg-slate-200',    'bg-slate-200'] }
  if (len < 8)   return { label: 'Moyen',   bars: ['bg-orange-400', 'bg-orange-400',   'bg-slate-200'] }
  return           { label: 'Fort',    bars: ['bg-[#1d9e75]',  'bg-[#1d9e75]',    'bg-[#1d9e75]'] }
}

// ─── Feature list ─────────────────────────────────────────────────
const FEATURES = [
  { Icon: LayoutDashboard, title: 'Tableau de bord',    sub: 'Vue consolidée des performances',        color: 'text-blue-400   bg-blue-500/10   border-blue-500/20'   },
  { Icon: DollarSign,      title: 'Budget & PTBA',       sub: 'Planification et suivi financier',       color: 'text-[#1d9e75] bg-[#1d9e75]/10 border-[#1d9e75]/20' },
  { Icon: AlertTriangle,   title: 'Gestion des risques', sub: 'Matrice et plan d\'atténuation',          color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { Icon: FileText,        title: 'Rapports bailleurs',  sub: 'Génération automatique de documents',    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
] as const

// ─── Input wrapper component ──────────────────────────────────────
function InputWrapper({ children, hasError }: { children: React.ReactNode; hasError?: boolean }) {
  return (
    <div className={`
      relative flex items-center rounded-xl bg-[#f8fafc]
      border transition-all duration-200
      focus-within:ring-4 focus-within:ring-[#1d9e75]/15 focus-within:border-[#1d9e75]
      ${hasError ? 'border-red-400 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'}
    `}>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [copied, setCopied] = useState(false)
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

  const fillDemo = () => {
    setValue('email', 'admin@demo.com', { shouldValidate: true })
    setValue('mot_de_passe', 'demo1234', { shouldValidate: true })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex w-full font-sans bg-white antialiased selection:bg-[#1d9e75]/20">

      {/* ═══════════════════════════════════════════════════
          COLONNE GAUCHE — Présentation premium
      ═══════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex w-[55%] flex-col p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0d1e36 60%, #0f2540 100%)' }}>

        {/* Blobs animés */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-[#1d9e75]/10 blur-[120px] animate-pulse" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-[140px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-[#1d9e75]/5 blur-[80px]" />

        <div className="relative z-10 flex flex-col h-full">

          {/* Logo */}
          <header className="flex items-center gap-3.5 mb-14">
            <div className="w-13 h-13 w-[52px] h-[52px] bg-gradient-to-br from-[#1d9e75] to-[#138f67] rounded-2xl flex items-center justify-center shadow-xl shadow-[#1d9e75]/25 ring-1 ring-white/10">
              <span className="text-white font-black text-xl tracking-tighter">GP</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-tight">DevProject</h1>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Plateforme de pilotage des projets de développement</p>
            </div>
          </header>

          <div className="flex-1 flex flex-col justify-center">

            {/* Badge SSL */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full w-fit mb-7
              bg-[#1d9e75]/10 border border-[#1d9e75]/25 backdrop-blur-sm
              shadow-[0_0_20px_rgba(29,158,117,0.12)]">
              <Shield size={13} className="text-[#1d9e75]" />
              <span className="text-[#1d9e75] text-[10px] font-bold uppercase tracking-[0.15em]">Accès sécurisé SSL</span>
            </div>

            {/* Titre */}
            <h2 className="text-[2.6rem] xl:text-5xl font-black text-white mb-5 tracking-tight leading-[1.08]">
              Bienvenue sur<br />votre espace projet
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-12 max-w-lg">
              Centralisez vos données, suivez l'exécution physique et financière en temps réel et générez des rapports conformes aux standards internationaux.
            </p>

            {/* Stats cards (glassmorphism) */}
            <div className="grid grid-cols-3 gap-4 mb-12">
              {[
                { value: '1 200+', label: 'Projets actifs',   accent: 'text-[#1d9e75]', glow: 'hover:shadow-[#1d9e75]/15' },
                { value: '94 %',  label: "Taux d'exéc.",      accent: 'text-blue-400',   glow: 'hover:shadow-blue-400/15'  },
                { value: '3+',    label: 'Alertes actives',   accent: 'text-orange-400', glow: 'hover:shadow-orange-400/15'},
              ].map(({ value, label, accent, glow }) => (
                <div key={label}
                  className={`glass-panel rounded-2xl p-4 cursor-default transition-all duration-300
                    hover:-translate-y-1 hover:shadow-xl ${glow}`}>
                  <p className={`text-[1.7rem] font-black leading-none ${accent}`}>{value}</p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-2 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>

            {/* Features */}
            <ul className="space-y-1">
              {FEATURES.map(({ Icon, title, sub, color }) => (
                <li key={title}
                  className="group flex items-center gap-4 px-3 py-2.5 -mx-3 rounded-xl
                    cursor-default transition-all duration-200
                    hover:bg-white/[0.04] hover:translate-x-1.5
                    border-l-2 border-transparent hover:border-[#1d9e75]">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-110 ${color}`}>
                    <Icon size={19} />
                  </div>
                  <div>
                    <p className="text-slate-200 font-semibold text-[13px] leading-tight">{title}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5 font-medium">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>

          </div>

          {/* Footer */}
          <footer className="mt-auto pt-6 border-t border-white/8 flex items-center justify-between">
            <p className="text-[11px] text-slate-600 font-medium">SIGP v2.1.0</p>
            <p className="text-[11px] text-slate-600 font-medium">© 2026 DevProject. Tous droits réservés.</p>
          </footer>

        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════
          COLONNE DROITE — Formulaire de connexion
      ═══════════════════════════════════════════════════ */}
      <main className="w-full lg:w-[45%] bg-[#f8fafc] flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden">

        {/* Glow doux derrière la carte */}
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-[#1d9e75]/6 rounded-full blur-[70px]" />

        {/* Carte login */}
        <div className={`
          relative z-10 w-full max-w-[430px] bg-white rounded-[1.75rem]
          border border-slate-100/80 shadow-[0_8px_40px_rgba(0,0,0,0.06)]
          p-8 sm:p-10
          animate-in fade-in slide-in-from-bottom-6 duration-700
          ${isShaking ? 'animate-shake' : ''}
        `}>

          {/* Logo mobile only */}
          <div className="lg:hidden flex justify-center mb-7">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1d9e75] to-[#138f67] rounded-xl flex items-center justify-center shadow-lg shadow-[#1d9e75]/30">
              <span className="text-white font-black text-xl">GP</span>
            </div>
          </div>

          {/* Titre */}
          <div className="mb-8">
            <h2 className="text-[1.75rem] font-extrabold text-[#0a1628] tracking-tight mb-2">Connexion</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Accédez à votre espace sécurisé de gestion de projet.
            </p>
          </div>

          {/* ── FORMULAIRE ─────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Adresse email
              </label>
              <InputWrapper hasError={!!errors.email}>
                <span className="pl-4 pr-2 flex items-center shrink-0">
                  <Mail size={17} className={`transition-colors duration-200 ${errors.email ? 'text-red-400' : 'text-slate-400'}`} />
                </span>
                <input
                  {...emailRest}
                  ref={(e) => {
                    hookFormEmailRef(e)
                    // @ts-ignore
                    emailRef.current = e
                  }}
                  type="email"
                  placeholder="admin@demo.com"
                  autoComplete="email"
                  className="flex-1 bg-transparent text-slate-900 text-sm font-medium py-3.5 pr-4 outline-none placeholder:text-slate-300"
                />
              </InputWrapper>
              {errors.email && (
                <p className="flex items-center gap-1 text-red-500 text-[11px] font-semibold mt-1.5 animate-in slide-in-from-top-1 duration-200">
                  <AlertCircle size={11} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Mot de passe
              </label>
              <InputWrapper hasError={!!errors.mot_de_passe}>
                <span className="pl-4 pr-2 flex items-center shrink-0">
                  <Lock size={17} className={`transition-colors duration-200 ${errors.mot_de_passe ? 'text-red-400' : 'text-slate-400'}`} />
                </span>
                <input
                  {...register('mot_de_passe')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="flex-1 bg-transparent text-slate-900 text-sm font-medium py-3.5 outline-none placeholder:text-slate-300"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  onClick={() => setShowPassword(v => !v)}
                  className="px-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <div className={`transition-all duration-300 ${showPassword ? 'scale-110' : 'scale-100'}`}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </div>
                </button>
              </InputWrapper>

              {/* Barre de force */}
              {pwdValue.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {strength.bars.map((cls, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${cls}`} />
                    ))}
                  </div>
                  {strength.label && (
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{strength.label}</span>
                  )}
                </div>
              )}

              {errors.mot_de_passe && (
                <p className="flex items-center gap-1 text-red-500 text-[11px] font-semibold mt-1.5 animate-in slide-in-from-top-1 duration-200">
                  <AlertCircle size={11} /> {errors.mot_de_passe.message}
                </p>
              )}
            </div>

            {/* Rôle */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Rôle de démonstration
              </label>
              <InputWrapper>
                <span className="pl-4 pr-2 flex items-center shrink-0">
                  <User size={17} className="text-slate-400" />
                </span>
                <select
                  {...register('role')}
                  className="flex-1 bg-transparent text-slate-900 text-sm font-medium py-3.5 pr-10 outline-none appearance-none cursor-pointer"
                >
                  <option value="Administrateur">Administrateur système</option>
                  <option value="Coordonnateur">Coordonnateur de projet</option>
                  <option value="Responsable_PTBA">Responsable PTBA</option>
                  <option value="Bailleur">Bailleur de fonds</option>
                </select>
                <span className="absolute right-4 text-slate-400 pointer-events-none">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </InputWrapper>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-1 pb-2">
              <button
                type="button"
                onClick={() => setRememberMe(v => !v)}
                className="flex items-center gap-2.5 group"
              >
                <div className={`
                  w-5 h-5 rounded-[5px] border-2 flex items-center justify-center
                  transition-all duration-200
                  ${rememberMe
                    ? 'bg-[#1d9e75] border-[#1d9e75] shadow-sm shadow-[#1d9e75]/30'
                    : 'bg-white border-slate-300 group-hover:border-slate-400'
                  }
                `}>
                  {rememberMe && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors select-none">
                  Se souvenir de moi
                </span>
              </button>
              <a
                href="#"
                className="text-sm font-bold text-[#1d9e75] hover:text-[#148762] transition-colors
                  relative after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-full
                  after:bg-[#1d9e75] after:scale-x-0 after:origin-right after:transition-transform
                  hover:after:scale-x-100 hover:after:origin-left"
              >
                Mot de passe oublié ?
              </a>
            </div>

            {/* Erreur globale */}
            {errors.root && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-in zoom-in-95 duration-200">
                <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-semibold leading-snug">{errors.root.message}</p>
              </div>
            )}

            {/* Bouton principal */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                group relative w-full overflow-hidden flex justify-center items-center gap-2
                bg-[#0a1628] text-white font-bold rounded-xl text-[14.5px] px-5 py-[14px]
                transition-all duration-200
                hover:bg-[#0d1e36]
                hover:shadow-[0_0_24px_rgba(29,158,117,0.35)]
                active:scale-[0.98] shadow-[0_4px_20px_rgba(10,22,40,0.18)]
                disabled:opacity-70 disabled:cursor-not-allowed
                mt-2
              "
            >
              {/* Shimmer */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.8s_ease-in-out_infinite]" />
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-[2.5px] border-white/25 border-t-white rounded-full animate-spin" />
                  Authentification…
                </>
              ) : 'Se connecter à mon espace'}
            </button>

          </form>

          {/* Séparateur */}
          <div className="my-8 relative flex items-center">
            <div className="flex-1 border-t border-slate-200" />
            <span className="mx-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 bg-white px-2">
              Compte démo
            </span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Encart démo */}
          <button
            type="button"
            onClick={fillDemo}
            className="
              w-full group relative overflow-hidden
              bg-[#f0fdf8] border border-[#1d9e75]/25 hover:border-[#1d9e75]/50
              rounded-2xl px-5 py-4 transition-all duration-300
              flex items-center justify-between text-left
              hover:shadow-[0_4px_20px_rgba(29,158,117,0.12)]
            "
          >
            {/* Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#1d9e75]/8 rounded-full blur-2xl
              -translate-y-1/2 translate-x-1/3 group-hover:scale-125 transition-transform duration-500" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1d9e75] animate-pulse inline-block" />
                <span className="text-[#1d9e75] text-[13px] font-bold tracking-wide">Accès Démonstration</span>
              </div>
              <div className="flex items-center gap-3">
                <code className="text-[#1d9e75]/80 text-[12px] font-bold font-mono">admin@demo.com</code>
                <span className="w-1 h-1 rounded-full bg-[#1d9e75]/30 inline-block" />
                <code className="text-[#1d9e75]/80 text-[12px] font-bold font-mono">demo1234</code>
              </div>
            </div>

            <div className={`
              relative z-10 w-10 h-10 rounded-xl flex items-center justify-center
              border border-[#1d9e75]/25 shadow-sm
              transition-all duration-300
              group-hover:scale-110
              ${copied
                ? 'bg-[#1d9e75] border-[#1d9e75] text-white'
                : 'bg-white text-[#1d9e75] group-hover:bg-[#1d9e75] group-hover:text-white'
              }
            `}>
              {copied
                ? <CheckCircle2 size={18} className="animate-in zoom-in duration-200" />
                : <Copy size={17} />
              }
            </div>
          </button>

        </div>
      </main>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer { to { transform: translateX(200%); } }
      `}</style>
    </div>
  )
}
