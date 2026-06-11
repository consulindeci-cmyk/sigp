import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Navigate } from 'react-router-dom'
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const schema = z.object({
  email: z.string().email('Email invalide'),
  mot_de_passe: z.string().min(6, 'Mot de passe requis'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.mot_de_passe)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('root', { message: 'Email ou mot de passe incorrect' })
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sigp-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sigp-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sigp-blue rounded-2xl mb-4 shadow-lg shadow-sigp-blue/20">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SIGP</h1>
          <p className="text-sigp-muted text-sm mt-1">
            Système d'Information de Gestion<br />de Projets de Développement
          </p>
        </div>

        {/* Card */}
        <div className="bg-navy-800 border border-navy-500 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-base font-semibold text-sigp-text mb-5">Connexion</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs text-sigp-muted mb-1.5">Adresse email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sigp-muted" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="admin@sigp.ci"
                  className="sigp-input pl-9"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-sigp-red text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-sigp-muted mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sigp-muted" />
                <input
                  {...register('mot_de_passe')}
                  type="password"
                  placeholder="••••••••"
                  className="sigp-input pl-9"
                  autoComplete="current-password"
                />
              </div>
              {errors.mot_de_passe && (
                <p className="text-sigp-red text-xs mt-1">{errors.mot_de_passe.message}</p>
              )}
            </div>

            {/* Root error */}
            {errors.root && (
              <div className="flex items-center gap-2 bg-sigp-red/10 border border-sigp-red/30 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="text-sigp-red shrink-0" />
                <p className="text-sigp-red text-xs">{errors.root.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-2xs text-sigp-muted/50 mt-6">
          SIGP v1.0 · Système institutionnel sécurisé
        </p>
      </div>
    </div>
  )
}
