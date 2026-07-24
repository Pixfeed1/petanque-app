'use client'

import { useRouter } from 'next/navigation'
import { useLoginForm, AuthTab } from '@/hooks/auth'
import { Boule, Email, Lock, User, Building, Eye, EyeOff, Loader, Check, Google, Apple, ArrowLeft } from '@/components/Icons'

// Icones
const Icons = {
  boule: <Boule className="w-8 h-8" />,
  email: <Email />,
  lock: <Lock />,
  user: <User />,
  building: <Building />,
  eye: <Eye />,
  eyeOff: <EyeOff />,
  loader: <Loader />,
  check: <Check />,
  google: <Google />,
  apple: <Apple />,
  arrowLeft: <ArrowLeft />
}

/**
 * Page de connexion/inscription
 * - Login avec email/password
 * - Inscription avec organisation
 * - Mot de passe oublie
 * - OAuth Google/Apple
 */
export default function LoginPage() {
  const router = useRouter()
  const form = useLoginForm()

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-amber-50">
      {/* Motif d'arriere-plan anime */}
      <AnimatedBackground />

      {/* Contenu principal */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center items-center px-4 py-12">
        {/* Logo et titre */}
        <LogoHeader
          mounted={form.mounted}
          activeTab={form.activeTab}
          onLogoClick={() => router.push('/')}
        />

        {/* Carte de connexion */}
        <div className={`w-full max-w-md transition-all duration-700 delay-100 ${form.mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${form.successAnimation ? 'scale-105' : ''}`}>
          <div className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border ${form.successAnimation ? 'border-green-400 shadow-green-200' : 'border-gray-100'} transition-all duration-300`}>

            {/* Bouton retour pour forgot password */}
            {form.activeTab === 'forgot' && (
              <button
                onClick={() => form.setActiveTab('login')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
              >
                {Icons.arrowLeft}
                <span className="ml-2">Retour a la connexion</span>
              </button>
            )}

            {/* Onglets */}
            {form.activeTab !== 'forgot' && (
              <TabSelector
                activeTab={form.activeTab}
                onTabChange={form.setActiveTab}
              />
            )}

            {/* Messages */}
            {form.error && <ErrorMessage message={form.error} />}
            {form.success && <SuccessMessage message={form.success} />}

            {/* Formulaires */}
            {form.activeTab === 'login' && (
              <LoginForm form={form} />
            )}

            {form.activeTab === 'signup' && (
              <SignupForm form={form} />
            )}

            {form.activeTab === 'forgot' && (
              <ForgotPasswordForm form={form} />
            )}

            {/* OAuth */}
            {form.activeTab !== 'forgot' && (
              <SocialLoginButtons onSocialLogin={form.handleSocialLogin} />
            )}

            {/* Liens de navigation */}
            {form.activeTab === 'login' && (
              <p className="mt-8 text-center text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <button
                  onClick={() => form.setActiveTab('signup')}
                  className="font-medium text-green-600 hover:text-green-700 transition-colors underline-offset-2 hover:underline"
                >
                  Creer un compte gratuitement
                </button>
              </p>
            )}

            {form.activeTab === 'signup' && (
              <p className="mt-8 text-center text-sm text-gray-600">
                Deja un compte ?{' '}
                <button
                  onClick={() => form.setActiveTab('login')}
                  className="font-medium text-green-600 hover:text-green-700 transition-colors underline-offset-2 hover:underline"
                >
                  Se connecter
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-12 text-center text-sm text-gray-500 transition-all duration-700 delay-200 ${form.mounted ? 'opacity-100' : 'opacity-0'}`}>
          <p>© 2025 Petanque Pro - Fait avec ❤️ par <a href="https://pixfeed.net" rel="follow" className="text-green-600 hover:text-green-700 transition-colors">Pixfeed</a> pour les passionnes</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-shake { animation: shake 0.5s ease-out; }
      `}</style>
    </div>
  )
}

// ============================================================================
// Composants internes
// ============================================================================

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
    </div>
  )
}

interface LogoHeaderProps {
  mounted: boolean
  activeTab: AuthTab
  onLogoClick: () => void
}

function LogoHeader({ mounted, activeTab, onLogoClick }: LogoHeaderProps) {
  const subtitle = {
    login: 'Gerez vos tournois comme un champion',
    signup: 'Creez votre compte gratuitement',
    forgot: 'Reinitialisez votre mot de passe'
  }

  return (
    <div className={`text-center mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      <div onClick={onLogoClick} className="inline-block cursor-pointer group mb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="group-hover:scale-110 transition-transform duration-200">
            {Icons.boule}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Petanque Pro</h1>
      </div>
      <p className="text-gray-600">{subtitle[activeTab]}</p>
    </div>
  )
}

interface TabSelectorProps {
  activeTab: AuthTab
  onTabChange: (tab: AuthTab) => void
}

function TabSelector({ activeTab, onTabChange }: TabSelectorProps) {
  return (
    <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onTabChange('login')}
        className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
          activeTab === 'login'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Connexion
      </button>
      <button
        onClick={() => onTabChange('signup')}
        className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
          activeTab === 'signup'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Inscription
      </button>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-sm animate-shake">
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <span>{message}</span>
    </div>
  )
}

function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700 text-sm">
      {Icons.check}
      <span>{message}</span>
    </div>
  )
}

interface FormProps {
  form: ReturnType<typeof useLoginForm>
}

function LoginForm({ form }: FormProps) {
  return (
    <div className="space-y-5">
      <EmailInput
        value={form.email}
        onChange={form.setEmail}
        onKeyPress={form.handleKeyPress}
        isValid={form.isEmailValid}
        autoFocus
      />

      <PasswordInput
        label="Mot de passe"
        value={form.password}
        onChange={form.setPassword}
        onKeyPress={form.handleKeyPress}
        showPassword={form.showPassword}
        onToggleShow={() => form.setShowPassword(!form.showPassword)}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            checked={form.rememberMe}
            onChange={(e) => form.setRememberMe(e.target.checked)}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
          />
          <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
            Se souvenir de moi
          </span>
        </label>
        <button
          onClick={() => form.setActiveTab('forgot')}
          className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
        >
          Mot de passe oublie ?
        </button>
      </div>

      <SubmitButton
        onClick={form.handleLogin}
        disabled={form.loading || !form.email || !form.password}
        loading={form.loading}
        success={form.successAnimation}
        loadingText="Connexion en cours..."
        successText="Connexion reussie !"
        defaultText="Se connecter"
      />
    </div>
  )
}

function SignupForm({ form }: FormProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {Icons.user}
          </div>
          <input
            type="text"
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            onKeyPress={form.handleKeyPress}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            placeholder="Jean Dupont"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nom du club / Organisation</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {Icons.building}
          </div>
          <input
            type="text"
            value={form.organizationName}
            onChange={(e) => form.setOrganizationName(e.target.value)}
            onKeyPress={form.handleKeyPress}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            placeholder="Club de Petanque de Marseille"
          />
        </div>
      </div>

      <EmailInput
        value={form.email}
        onChange={form.setEmail}
        onKeyPress={form.handleKeyPress}
        isValid={form.isEmailValid}
      />

      <PasswordInput
        label="Mot de passe"
        value={form.password}
        onChange={form.setPassword}
        onKeyPress={form.handleKeyPress}
        showPassword={form.showPassword}
        onToggleShow={() => form.setShowPassword(!form.showPassword)}
        placeholder="Minimum 6 caracteres"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {Icons.lock}
          </div>
          <input
            type={form.showConfirmPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(e) => form.setConfirmPassword(e.target.value)}
            onKeyPress={form.handleKeyPress}
            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
              form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Confirmez votre mot de passe"
          />
          <button
            type="button"
            onClick={() => form.setShowConfirmPassword(!form.showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {form.showConfirmPassword ? Icons.eyeOff : Icons.eye}
          </button>
        </div>
        {form.confirmPassword && form.password !== form.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">Les mots de passe ne correspondent pas</p>
        )}
      </div>

      <div>
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={form.acceptTerms}
            onChange={(e) => form.setAcceptTerms(e.target.checked)}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer mt-1"
          />
          <span className="ml-2 text-sm text-gray-600">
            J'accepte les <a href="/legal/terms" className="text-green-600 hover:text-green-700">conditions d'utilisation</a> et la <a href="/legal/privacy" className="text-green-600 hover:text-green-700">politique de confidentialite</a>
          </span>
        </label>
      </div>

      <SubmitButton
        onClick={form.handleSignup}
        disabled={form.loading || !form.name || !form.email || !form.password || !form.confirmPassword || !form.organizationName || !form.acceptTerms}
        loading={form.loading}
        loadingText="Creation du compte..."
        defaultText="Creer mon compte"
      />
    </div>
  )
}

function ForgotPasswordForm({ form }: FormProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Mot de passe oublie ?</h2>
        <p className="text-sm text-gray-600 mb-6">
          Entrez votre adresse email et nous vous enverrons un lien pour reinitialiser votre mot de passe.
        </p>
      </div>

      <EmailInput
        value={form.email}
        onChange={form.setEmail}
        onKeyPress={form.handleKeyPress}
        isValid={form.isEmailValid}
        autoFocus
      />

      <SubmitButton
        onClick={form.handleForgotPassword}
        disabled={form.loading || !form.email}
        loading={form.loading}
        loadingText="Envoi en cours..."
        defaultText="Envoyer le lien de reinitialisation"
      />
    </div>
  )
}

interface EmailInputProps {
  value: string
  onChange: (value: string) => void
  onKeyPress: (e: React.KeyboardEvent) => void
  isValid: boolean
  autoFocus?: boolean
}

function EmailInput({ value, onChange, onKeyPress, isValid, autoFocus }: EmailInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {Icons.email}
        </div>
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
            value && !isValid ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="vous@exemple.fr"
          autoFocus={autoFocus}
        />
        {value && isValid && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-500 animate-fadeIn">
            {Icons.check}
          </div>
        )}
      </div>
    </div>
  )
}

interface PasswordInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  onKeyPress: (e: React.KeyboardEvent) => void
  showPassword: boolean
  onToggleShow: () => void
  placeholder?: string
}

function PasswordInput({ label, value, onChange, onKeyPress, showPassword, onToggleShow, placeholder = '••••••••' }: PasswordInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {Icons.lock}
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPassword ? Icons.eyeOff : Icons.eye}
        </button>
      </div>
    </div>
  )
}

interface SubmitButtonProps {
  onClick: () => void
  disabled: boolean
  loading: boolean
  success?: boolean
  loadingText: string
  successText?: string
  defaultText: string
}

function SubmitButton({ onClick, disabled, loading, success, loadingText, successText, defaultText }: SubmitButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 px-4 rounded-lg font-medium transition-all transform ${
        disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : success
            ? 'bg-green-600 text-white scale-105 shadow-lg'
            : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
      }`}
    >
      <span className="flex items-center justify-center space-x-2">
        {loading ? (
          <>
            {Icons.loader}
            <span>{loadingText}</span>
          </>
        ) : success && successText ? (
          <>
            {Icons.check}
            <span>{successText}</span>
          </>
        ) : (
          <span>{defaultText}</span>
        )}
      </span>
    </button>
  )
}

interface SocialLoginButtonsProps {
  onSocialLogin: (provider: 'google' | 'apple') => void
}

function SocialLoginButtons({ onSocialLogin }: SocialLoginButtonsProps) {
  return (
    <>
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">ou continuer avec</span>
        </div>
      </div>

      {/* Apple temporairement masqué : nécessite un compte Apple Developer (99 €/an)
          + les identifiants (Services ID, Team ID, Key ID, clé .p8). Réactiver le bouton
          et repasser en grid-cols-2 une fois « Sign in with Apple » configuré. */}
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => onSocialLogin('google')}
          className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md"
        >
          {Icons.google}
          <span className="ml-2 text-sm font-medium text-gray-700">Google</span>
        </button>
      </div>
    </>
  )
}
