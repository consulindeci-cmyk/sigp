import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Mail, Lock, Check, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabaseClient'

const schema = z.object({
  email: z.string().email('Email invalide').min(1, 'Requis'),
  password: z.string().min(6, 'Minimum 6 caractères'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isShaking, setIsShaking]       = useState(false)
  const [rememberMe, setRememberMe]     = useState(true)
  const emailRef = useRef<HTMLInputElement>(null)

  const [forgotMode, setForgotMode]       = useState(false)
  const [forgotEmail, setForgotEmail]     = useState('')
  const [forgotSending, setForgotSending] = useState(false)
  const [forgotSent, setForgotSent]       = useState(false)
  const [forgotError, setForgotError]     = useState('')

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => { emailRef.current?.focus() }, [])

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      // Ne jamais préciser si c'est l'email ou le mot de passe qui est faux
      // (bonne pratique de sécurité, message générique conservé) — en
      // revanche on distingue les cas où un message plus utile n'est pas
      // une fuite d'information (réseau, profil introuvable/désactivé).
      const message = err instanceof Error ? err.message : ''
      let feedback = 'Identifiants incorrects ou accès refusé.'
      if (err instanceof TypeError || /fetch|network/i.test(message)) {
        feedback = 'Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.'
      } else if (/profil utilisateur introuvable/i.test(message)) {
        feedback = 'Compte introuvable ou désactivé. Contactez votre administrateur.'
      }
      setError('root', { message: feedback })
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    if (!forgotEmail.trim()) { setForgotError('Adresse email requise.'); return }
    setForgotSending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setForgotSending(false)
    if (error) { setForgotError(error.message); return }
    setForgotSent(true)
  }

  const backToLogin = () => {
    setForgotMode(false)
    setForgotSent(false)
    setForgotError('')
    setForgotEmail('')
  }

  const { ref: hookFormEmailRef, ...emailRest } = register('email')

  return (
    <div className="h-screen w-screen overflow-hidden flex font-sans antialiased">

      {/* ── Formulaire centré ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-[#F4F8F6] px-6">

        <div className={`relative z-10 w-full max-w-[400px] bg-white rounded-2xl border border-border shadow-[0_8px_48px_rgba(0,0,0,0.07)] px-6 py-5 ${isShaking ? 'animate-shake' : ''}`}>

          {/* Branding */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center shadow-md shadow-accent/25 shrink-0">
              <span className="text-white font-black text-sm tracking-tight">GP</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-[#0F172A] tracking-tight">GPD ERP</p>
              <p className="text-[10px] text-[#0F172A] font-medium">Plateforme de pilotage des projets</p>
            </div>
          </div>

          {forgotMode ? (
            <div key="forgot-panel">
              {/* Badge + Titre — mode récupération */}
              <div className="mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/25 mb-2">
                  Récupération de compte
                </span>
                <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
                  Mot de passe oublié
                </h1>
                <p className="text-[11px] text-[#0F172A] mt-1">
                  Saisissez votre adresse email pour recevoir un lien de réinitialisation.
                </p>
              </div>

              {forgotSent ? (
                <div role="alert" className="flex items-center gap-2 bg-success/10 border border-success/25 rounded-xl px-3 py-2.5">
                  <CheckCircle2 size={14} className="text-success shrink-0" />
                  <p className="text-[#0F172A] text-xs font-semibold">
                    Si un compte existe pour {forgotEmail}, un email de réinitialisation vient d'être envoyé.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} noValidate className="space-y-3">
                  <div>
                    <label htmlFor="forgot-email" className="block text-xs font-semibold text-[#0F172A] mb-1">Adresse email</label>
                    <div className="flex items-center rounded-xl bg-white border border-border hover:border-[#0F172A]/30 transition-all duration-200 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent">
                      <span className="pl-3 pr-2 flex items-center shrink-0">
                        <Mail size={14} className="text-[#0F172A]/50" />
                      </span>
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="nom@sigp.ci"
                        autoComplete="email"
                        disabled={forgotSending}
                        aria-invalid={forgotError ? 'true' : 'false'}
                        aria-describedby={forgotError ? 'forgot-error' : undefined}
                        className="flex-1 bg-transparent text-[#0F172A] text-sm py-2.5 pr-3 outline-none placeholder:text-[#0F172A]/40 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {forgotError && (
                    <div id="forgot-error" role="alert" className="flex items-center gap-2 bg-destructive/10 border border-destructive/25 rounded-xl px-3 py-2">
                      <AlertCircle size={13} className="text-destructive shrink-0" />
                      <p className="text-destructive text-xs font-semibold">{forgotError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotSending}
                    className="
                      w-full flex justify-center items-center gap-2
                      bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-sm px-4 py-2.5
                      transition-all duration-200 active:scale-[0.98]
                      shadow-[0_4px_16px_hsl(var(--primary)/0.3)]
                      disabled:opacity-70 disabled:cursor-not-allowed
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                    "
                  >
                    {forgotSending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Envoi...
                      </>
                    ) : 'Envoyer le lien de réinitialisation'}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={backToLogin}
                disabled={forgotSending}
                className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#0F172A] hover:text-accent transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                <ArrowLeft size={12} /> Retour à la connexion
              </button>
            </div>
          ) : (
          <div key="login-panel">
          {/* Badge + Titre */}
          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/25 mb-2">
              Accès sécurisé
            </span>
            <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
              Connexion à votre espace projet
            </h1>
            <p className="text-[11px] text-[#0F172A] mt-1">
              Tableau de bord · PTBA · Budget · Risques · PPM · Rapports bailleurs
            </p>
          </div>

          {/* ── Formulaire ── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-[#0F172A] mb-1">Adresse email</label>
              <div className={`
                flex items-center rounded-xl bg-white border transition-all duration-200
                focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent
                ${errors.email ? 'border-destructive' : 'border-border hover:border-[#0F172A]/30'}
              `}>
                <span className="pl-3 pr-2 flex items-center shrink-0">
                  <Mail size={14} className="text-[#0F172A]/50" />
                </span>
                <input
                  {...emailRest}
                  ref={(e) => {
                    hookFormEmailRef(e)
                    ;(emailRef as { current: HTMLInputElement | null }).current = e
                  }}
                  id="login-email"
                  type="email"
                  placeholder="nom@sigp.ci"
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  className="flex-1 bg-transparent text-[#0F172A] text-sm py-2.5 pr-3 outline-none placeholder:text-[#0F172A]/40 disabled:opacity-60"
                />
              </div>
              {errors.email && (
                <p id="login-email-error" role="alert" className="flex items-center gap-1 text-destructive text-[11px] font-semibold mt-0.5">
                  <AlertCircle size={10} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-xs font-semibold text-[#0F172A]">Mot de passe</label>
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  disabled={isSubmitting}
                  className="text-[11px] font-bold text-accent hover:underline transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className={`
                flex items-center rounded-xl bg-white border transition-all duration-200
                focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent
                ${errors.password ? 'border-destructive' : 'border-border hover:border-[#0F172A]/30'}
              `}>
                <span className="pl-3 pr-2 flex items-center shrink-0">
                  <Lock size={14} className="text-[#0F172A]/50" />
                </span>
                <input
                  {...register('password')}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  className="flex-1 bg-transparent text-[#0F172A] text-sm py-2.5 outline-none placeholder:text-[#0F172A]/40 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                  className="px-3 text-xs font-semibold text-[#0F172A]/60 hover:text-[#0F172A] transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showPassword ? 'Masquer' : 'Voir'}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" role="alert" className="flex items-center gap-1 text-destructive text-[11px] font-semibold mt-0.5">
                  <AlertCircle size={10} /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Se souvenir de moi */}
            <button
              type="button"
              onClick={() => setRememberMe((v) => !v)}
              disabled={isSubmitting}
              role="checkbox"
              aria-checked={rememberMe}
              className="flex items-center gap-2 group disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              <div className={`
                w-4 h-4 rounded-[4px] border-2 flex items-center justify-center transition-all duration-200
                ${rememberMe ? 'bg-accent border-accent' : 'bg-white border-border group-hover:border-muted-foreground/60'}
              `}>
                {rememberMe && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              <span className="text-xs font-semibold text-[#0F172A] select-none">Se souvenir de moi</span>
            </button>

            {/* Erreur globale */}
            {errors.root && (
              <div role="alert" className="flex items-center gap-2 bg-destructive/10 border border-destructive/25 rounded-xl px-3 py-2">
                <AlertCircle size={13} className="text-destructive shrink-0" />
                <p className="text-destructive text-xs font-semibold">{errors.root.message}</p>
              </div>
            )}

            {/* Bouton principal */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full flex justify-center items-center gap-2
                bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-sm px-4 py-2.5
                transition-all duration-200 active:scale-[0.98]
                shadow-[0_4px_16px_hsl(var(--primary)/0.3)]
                disabled:opacity-70 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
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
          </div>
          )}

          {/* Assistance — pas d'inscription publique, création réservée à l'admin */}
          <p className="mt-4 text-center text-[11px] text-[#0F172A]">
            Pas encore de compte ? Contactez l'administrateur de votre organisation pour obtenir vos accès.
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
