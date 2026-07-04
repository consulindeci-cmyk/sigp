import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Mail, Lock, Check } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const schema = z.object({
  email: z.string().email('Email invalide').min(1, 'Requis'),
  mot_de_passe: z.string().min(6, 'Minimum 6 caractères'),
})
type FormData = z.infer<typeof schema>

const DEMO_USERS = [
  { label: 'Super Admin',  email: 'admin@sigp.ci',           pwd: 'Admin@2026'   },
  { label: 'Coordonnateur', email: 'coord@sigp.ci',          pwd: 'Coord@2026'   },
  { label: 'Financier',    email: 'finance@sigp.ci',         pwd: 'Finance@2026' },
  { label: 'Bailleur',     email: 'bailleur@banquemonde.org', pwd: 'Bailleur@2026' },
  { label: 'Auditeur',     email: 'audit@sigp.ci',           pwd: 'Audit@2026'   },
]

export default function LoginPage() {
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isShaking, setIsShaking]       = useState(false)
  const [rememberMe, setRememberMe]     = useState(true)
  const emailRef = useRef<HTMLInputElement>(null)

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
    setError, setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', mot_de_passe: '' },
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

  const fillCredentials = (email: string, pwd: string) => {
    setValue('email', email, { shouldValidate: true })
    setValue('mot_de_passe', pwd, { shouldValidate: true })
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex font-sans antialiased">

      {/* ── LEFT — Formulaire ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc] px-6 relative overflow-hidden">

        {/* Glow décoratif */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-[#1d9e75]/8 rounded-full blur-[80px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 bg-blue-100/30 rounded-full blur-[60px]" />

        <div className={`relative z-10 w-full max-w-[400px] bg-white rounded-2xl border border-slate-100 shadow-[0_8px_48px_rgba(0,0,0,0.07)] px-6 py-5 ${isShaking ? 'animate-shake' : ''}`}>

          {/* Branding */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-[#1d9e75] to-[#138f67] rounded-xl flex items-center justify-center shadow-md shadow-[#1d9e75]/25 shrink-0">
              <span className="text-white font-black text-sm tracking-tight">GP</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-[#0a1628] tracking-tight">GPD ERP</p>
              <p className="text-[10px] text-slate-400 font-medium">Plateforme de pilotage des projets</p>
            </div>
          </div>

          {/* Badge + Titre */}
          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#1d9e75] bg-[#1d9e75]/10 border border-[#1d9e75]/25 mb-2">
              Accès sécurisé
            </span>
            <h1 className="text-xl font-extrabold text-[#0a1628] tracking-tight leading-tight">
              Connexion à votre espace projet
            </h1>
            <p className="text-[11px] text-slate-500 mt-1">
              Tableau de bord · PTBA · Budget · Risques · PPM · Rapports bailleurs
            </p>
          </div>

          {/* ── Formulaire ── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse email</label>
              <div className={`
                flex items-center rounded-xl bg-white border transition-all duration-200
                focus-within:ring-2 focus-within:ring-[#1d9e75]/20 focus-within:border-[#1d9e75]
                ${errors.email ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}
              `}>
                <span className="pl-3 pr-2 flex items-center shrink-0">
                  <Mail size={14} className="text-slate-400" />
                </span>
                <input
                  {...emailRest}
                  ref={(e) => {
                    hookFormEmailRef(e)
                    ;(emailRef as { current: HTMLInputElement | null }).current = e
                  }}
                  type="email"
                  placeholder="nom@sigp.ci"
                  autoComplete="email"
                  className="flex-1 bg-transparent text-slate-900 text-sm py-2.5 pr-3 outline-none placeholder:text-slate-300"
                />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1 text-red-500 text-[11px] font-semibold mt-0.5">
                  <AlertCircle size={10} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Mot de passe</label>
                <a href="#" className="text-[11px] font-bold text-[#1d9e75] hover:underline transition-colors">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className={`
                flex items-center rounded-xl bg-white border transition-all duration-200
                focus-within:ring-2 focus-within:ring-[#1d9e75]/20 focus-within:border-[#1d9e75]
                ${errors.mot_de_passe ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}
              `}>
                <span className="pl-3 pr-2 flex items-center shrink-0">
                  <Lock size={14} className="text-slate-400" />
                </span>
                <input
                  {...register('mot_de_passe')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="flex-1 bg-transparent text-slate-900 text-sm py-2.5 outline-none placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="px-3 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showPassword ? 'Masquer' : 'Voir'}
                </button>
              </div>
              {errors.mot_de_passe && (
                <p className="flex items-center gap-1 text-red-500 text-[11px] font-semibold mt-0.5">
                  <AlertCircle size={10} /> {errors.mot_de_passe.message}
                </p>
              )}
            </div>

            {/* Se souvenir de moi */}
            <button
              type="button"
              onClick={() => setRememberMe((v) => !v)}
              className="flex items-center gap-2 group"
            >
              <div className={`
                w-4 h-4 rounded-[4px] border-2 flex items-center justify-center transition-all duration-200
                ${rememberMe ? 'bg-[#1d9e75] border-[#1d9e75]' : 'bg-white border-slate-300 group-hover:border-slate-400'}
              `}>
                {rememberMe && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              <span className="text-xs font-semibold text-slate-600 select-none">Se souvenir de moi</span>
            </button>

            {/* Erreur globale */}
            {errors.root && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <AlertCircle size={13} className="text-red-500 shrink-0" />
                <p className="text-red-700 text-xs font-semibold">{errors.root.message}</p>
              </div>
            )}

            {/* Bouton principal */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full flex justify-center items-center gap-2
                bg-[#1a56db] hover:bg-[#1649c4] text-white font-bold rounded-xl text-sm px-4 py-2.5
                transition-all duration-200 active:scale-[0.98]
                shadow-[0_4px_16px_rgba(26,86,219,0.3)]
                disabled:opacity-70 disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authentification…
                </>
              ) : 'Se connecter'}
            </button>
          </form>

          {/* Comptes de démonstration */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">
              Comptes utilisateurs
            </p>
            <div className="grid grid-cols-3 gap-1">
              {DEMO_USERS.map((user, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => fillCredentials(user.email, user.pwd)}
                  className="
                    text-left px-2 py-1.5 rounded-lg border border-slate-200 bg-white
                    hover:border-[#1d9e75]/40 hover:bg-[#f0fdf8]
                    transition-all duration-200 group
                  "
                >
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#1d9e75] truncate">
                    {user.label}
                  </p>
                  <p className="text-[9px] font-mono text-slate-400 group-hover:text-[#1d9e75] truncate">
                    {user.email.split('@')[0]}
                  </p>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── RIGHT — Illustration ──────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative bg-[#0d1f38] overflow-hidden items-center justify-center">

        {/* Blobs décoratifs */}
        <div className="absolute top-12 right-16 w-56 h-56 rounded-full bg-[#1d9e75]/25 blur-[70px]" />
        <div className="absolute bottom-16 left-12 w-44 h-44 rounded-full bg-amber-400/12 blur-[60px]" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/10 blur-[90px]" />

        {/* Maquette UI */}
        <div className="relative z-10 w-[380px] select-none">

          {/* Badge flottant haut-droit */}
          <div className="absolute -top-3 -right-3 bg-[#1d9e75] text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg shadow-[#1d9e75]/40 tracking-wider uppercase z-20">
            SIGP v2.0
          </div>

          {/* Fenêtre navigateur */}
          <div className="bg-[#162032] rounded-2xl border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.55)] overflow-hidden">

            {/* Barre titre navigateur */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8 bg-[#0f1825]">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1d9e75]/70" />
              <div className="flex-1 mx-3 h-4 bg-white/8 rounded-full" />
            </div>

            {/* Layout app */}
            <div className="flex" style={{ height: 220 }}>

              {/* Sidebar simulée */}
              <div className="w-12 bg-[#0b1520] border-r border-white/8 py-3 px-1.5 flex flex-col gap-1.5">
                <div className="h-5 w-5 rounded-md bg-[#1d9e75]/50 mx-auto mb-2" />
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-5 rounded-md ${i === 1 ? 'bg-[#1d9e75]/35 border border-[#1d9e75]/30' : 'bg-white/6'}`}
                  />
                ))}
              </div>

              {/* Contenu simulé */}
              <div className="flex-1 p-3 space-y-2.5">

                {/* KPI cards */}
                <div className="flex gap-2">
                  <div className="h-14 flex-1 rounded-xl bg-[#1d9e75]/15 border border-[#1d9e75]/25 p-2">
                    <div className="h-1.5 w-10 bg-[#1d9e75]/50 rounded-full mb-1.5" />
                    <div className="h-3 w-14 bg-[#1d9e75]/40 rounded" />
                  </div>
                  <div className="h-14 flex-1 rounded-xl bg-white/5 border border-white/8 p-2">
                    <div className="h-1.5 w-8 bg-white/20 rounded-full mb-1.5" />
                    <div className="h-3 w-10 bg-white/15 rounded" />
                  </div>
                  <div className="h-14 flex-1 rounded-xl bg-white/5 border border-white/8 p-2">
                    <div className="h-1.5 w-9 bg-white/20 rounded-full mb-1.5" />
                    <div className="h-3 w-12 bg-white/15 rounded" />
                  </div>
                </div>

                {/* Table simulée */}
                <div className="rounded-xl bg-white/5 border border-white/8 overflow-hidden">
                  <div className="flex gap-2 px-3 py-1.5 border-b border-white/8">
                    {[40, 25, 20, 15].map((w, i) => (
                      <div key={i} className="h-1.5 rounded-full bg-white/15" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex gap-2 px-3 py-2 border-b border-white/5 last:border-0">
                      {[40, 25, 20, 15].map((w, i) => (
                        <div key={i} className={`h-1.5 rounded-full ${row === 0 && i === 0 ? 'bg-[#1d9e75]/50' : 'bg-white/8'}`} style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Bottom row */}
                <div className="flex gap-2">
                  <div className="h-8 flex-1 rounded-lg bg-white/5 border border-white/8" />
                  <div className="h-8 w-20 rounded-lg bg-[#1d9e75]/20 border border-[#1d9e75]/30" />
                </div>
              </div>
            </div>
          </div>

          {/* Petite carte flottante bas-gauche */}
          <div className="absolute -bottom-4 -left-6 bg-[#1a2a40] border border-white/12 rounded-xl px-4 py-2.5 shadow-xl shadow-black/40 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#1d9e75] flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Budget global</p>
              <p className="text-xs font-extrabold text-white">248,7 M FCFA</p>
            </div>
          </div>
        </div>

        {/* Baseline bas */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-white/25 text-[10px] font-medium tracking-widest uppercase">
            Système Intégré de Gestion de Projets
          </p>
        </div>

      </div>

      <style>{`
        @keyframes shimmer { to { transform: translateX(200%); } }
        .animate-shake {
          animation: shake 0.45s cubic-bezier(.36,.07,.19,.97);
        }
        @keyframes shake {
          10%, 90%  { transform: translateX(-2px); }
          20%, 80%  { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60%  { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
