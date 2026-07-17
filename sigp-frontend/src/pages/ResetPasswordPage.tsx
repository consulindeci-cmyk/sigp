import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Lock, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking]         = useState(true)
  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [saving, setSaving]             = useState(false)
  const [done, setDone]                 = useState(false)

  // Le client Supabase détecte automatiquement le jeton de récupération dans
  // l'URL (hash) au chargement et établit une session temporaire — on attend
  // juste qu'elle soit prête avant d'autoriser la saisie du nouveau mot de passe.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(!!data.session)
      setChecking(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true)
        setChecking(false)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Minimum 8 caractères.'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) { setError(updateError.message); return }

    setDone(true)
    setTimeout(() => navigate('/dashboard', { replace: true }), 1800)
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-[#f8fafc] px-6 relative font-sans antialiased">
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-[#1d9e75]/8 rounded-full blur-[80px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 bg-blue-100/30 rounded-full blur-[60px]" />

      <div className="relative z-10 w-full max-w-[400px] bg-white rounded-2xl border border-slate-100 shadow-[0_8px_48px_rgba(0,0,0,0.07)] px-6 py-6">

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-gradient-to-br from-[#1d9e75] to-[#138f67] rounded-xl flex items-center justify-center shadow-md shadow-[#1d9e75]/25 shrink-0">
            <span className="text-white font-black text-sm tracking-tight">GP</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-[#0a1628] tracking-tight">GPD ERP</p>
            <p className="text-[10px] text-slate-400 font-medium">Plateforme de pilotage des projets</p>
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-[#0a1628] tracking-tight leading-tight mb-1">
          Nouveau mot de passe
        </h1>

        {checking ? (
          <p className="text-[13px] text-slate-500 mt-3">Vérification du lien...</p>
        ) : !sessionReady ? (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-red-700 text-xs font-semibold">
              Ce lien de réinitialisation est invalide ou a expiré. Redemandez un nouveau lien depuis la page de connexion.
            </p>
          </div>
        ) : done ? (
          <div className="mt-3 flex items-center gap-2 bg-[#1d9e75]/10 border border-[#1d9e75]/25 rounded-xl px-3 py-2.5">
            <CheckCircle2 size={14} className="text-[#1d9e75] shrink-0" />
            <p className="text-[#0a1628] text-xs font-semibold">Mot de passe mis à jour. Redirection...</p>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-slate-500 mt-1 mb-4">
              Choisissez un nouveau mot de passe pour votre compte.
            </p>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nouveau mot de passe</label>
                <div className="flex items-center rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#1d9e75]/20 focus-within:border-[#1d9e75]">
                  <span className="pl-3 pr-2 flex items-center shrink-0">
                    <Lock size={14} className="text-slate-400" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmer le mot de passe</label>
                <div className="flex items-center rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#1d9e75]/20 focus-within:border-[#1d9e75]">
                  <span className="pl-3 pr-2 flex items-center shrink-0">
                    <Lock size={14} className="text-slate-400" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="flex-1 bg-transparent text-slate-900 text-sm py-2.5 pr-3 outline-none placeholder:text-slate-300"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle size={13} className="text-red-500 shrink-0" />
                  <p className="text-red-700 text-xs font-semibold">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center items-center gap-2 bg-[#1a56db] hover:bg-[#1649c4] text-white font-bold rounded-xl text-sm px-4 py-2.5 transition-all duration-200 active:scale-[0.98] shadow-[0_4px_16px_rgba(26,86,219,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : 'Enregistrer le mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
