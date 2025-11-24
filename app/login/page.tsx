import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Inspra AI
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Knowledge Base Assistant
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
