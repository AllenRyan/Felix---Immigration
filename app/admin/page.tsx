'use client'

import { UserManagementTable } from '@/components/admin/UserManagementTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminPage() {
  const { user, profile, isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      console.log('Admin page - User:', user?.email)
      console.log('Admin page - Profile:', profile)
      console.log('Admin page - Is Admin:', isAdmin)

      if (!user) {
        console.log('No user, redirecting to login')
        router.push('/login')
        return
      }

      if (!isAdmin) {
        console.log('User is not admin, redirecting to home')
        router.push('/')
        return
      }
    }
  }, [user, profile, isAdmin, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage users and permissions
          </p>
        </div>

        {/* User Management */}
        <UserManagementTable />
      </div>
    </div>
  )
}
