import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button, Card, CardContent, CardHeader, CardTitle } from '../components/ui'
import { UserForm } from '../components/forms/UserForm'
import { formatFullName } from '../lib/utils'
import { useToast } from '../lib/hooks/useToast'
import type { Profile } from '../types'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Partial<Profile> | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const toast = useToast()

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    try {
      setLoading(true)

      const { data: user } = await supabase.auth.getUser()
      
      if (!user) {
        navigate('/auth')
        return
      }

      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user?.id)
        .single()

      if (error) {
        console.warn(error)
      }

      if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(formData: Partial<Profile>) {
    try {
      setLoading(true)

      const { data: user } = await supabase.auth.getUser()
      
      if (!user) {
        navigate('/auth')
        return
      }

      const updates = {
        id: user.user?.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        title: formData.title,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        toast.error('Error updating profile')
        console.error(error)
      } else {
        toast.success('Profile updated successfully')
        getProfile()
      }
    } catch (error) {
      toast.error('Error updating profile')
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = () => {
    setIsFormOpen(true)
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {profile ? `Profile: ${formatFullName(profile)}` : 'Profile'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">User Information</h3>
                <Button onClick={openEditForm}>
                  Edit Profile
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p>{formatFullName(profile)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{profile.email}</p>
                </div>
                {profile.title && (
                  <div>
                    <p className="text-sm text-gray-500">Title</p>
                    <p>{profile.title}</p>
                  </div>
                )}
              </div>
              
              {profile.bio && (
                <div>
                  <p className="text-sm text-gray-500">Bio</p>
                  <p>{profile.bio}</p>
                </div>
              )}
              
              {isFormOpen && (
                <UserForm
                  user={profile}
                  isOpen={isFormOpen}
                  onClose={() => setIsFormOpen(false)}
                  onSubmit={updateProfile}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-4">Loading profile...</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 