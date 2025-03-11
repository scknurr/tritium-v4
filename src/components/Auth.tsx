import React, { useState } from 'react';
import { Card, TextInput, Button, Alert } from 'flowbite-react';
import { supabase } from '../lib/supabase';
import { Mail, Lock } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const createProfile = async (userId: string, email: string, metadata?: { full_name?: string }) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email,
          full_name: metadata?.full_name
        }]);

      if (error) {
        console.error('Error creating profile:', error);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const createSignupAuditLog = async (userId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          event_type: 'INSERT',
          description: `${email} joined the platform`,
          entity_type: 'profiles',
          entity_id: userId,
          user_id: userId
        }]);

      if (error) {
        console.error('Error creating signup audit log:', error);
      }
    } catch (error) {
      console.error('Error creating signup audit log:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: email.split('@')[0] // Use email username as initial full name
            }
          }
        });
        if (error) throw error;
        
        // Create profile and audit log for new signup
        if (data.user) {
          await createProfile(data.user.id, email, data.user.user_metadata);
          await createSignupAuditLog(data.user.id, email);
        }
        
        setError('Check your email for the confirmation link.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;

        // Check if profile exists, create if it doesn't
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();

          if (!profile) {
            await createProfile(data.user.id, email, data.user.user_metadata);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>
        <form className="flex flex-col gap-4" onSubmit={handleAuth}>
          <div>
            <TextInput
              icon={Mail}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <TextInput
              icon={Lock}
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <Alert color={error.includes('Check your email') ? 'success' : 'failure'}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </Button>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-blue-600 hover:underline dark:text-blue-500"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
}