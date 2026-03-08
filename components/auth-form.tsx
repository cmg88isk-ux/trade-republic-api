'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Lock, Phone, CheckCircle } from 'lucide-react';

export function AuthForm() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingSession, setExistingSession] = useState<{ phone: string; lastUsed: string } | null>(null);
  const [showExistingSession, setShowExistingSession] = useState(false);

  // Load existing session on mount
  useEffect(() => {
    loadExistingSession();
  }, []);

  const loadExistingSession = async () => {
    try {
      // Get stored session from localStorage
      const stored = localStorage.getItem('tradeSession');
      if (stored) {
        const session = JSON.parse(stored);
        setPhoneNumber(session.phoneNumber);
        setExistingSession({
          phone: session.phoneNumber,
          lastUsed: new Date(session.timestamp).toLocaleDateString(),
        });
      }

      // Also check backend for persistent session
      const params = new URLSearchParams({ phone: phoneNumber });
      const response = await fetch(`/api/auth/session?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.session) {
          setShowExistingSession(true);
        }
      }
    } catch (error) {
      console.error('[AuthForm] Failed to load session:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!phoneNumber || !pin) {
        setError('Please enter both phone number and PIN');
        return;
      }

      // Create new session
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          sessionId: `session_${Date.now()}`,
          accessToken: `token_${Math.random().toString(36).substr(2, 9)}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Session creation failed');
      }

      // Store session locally
      localStorage.setItem('tradeSession', JSON.stringify({
        phoneNumber,
        timestamp: new Date().toISOString(),
      }));

      router.push('/dashboard');
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSession = async () => {
    if (!existingSession?.phone) return;
    
    setIsLoading(true);
    try {
      // Verify session is still valid
      const params = new URLSearchParams({ phone: existingSession.phone });
      const response = await fetch(`/api/auth/session?${params}`);
      
      if (response.ok) {
        router.push('/dashboard');
      } else {
        setError('Session expired. Please log in again.');
        setExistingSession(null);
        localStorage.removeItem('tradeSession');
      }
    } catch (error) {
      setError('Failed to resume session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md">
        <div className="p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">TradeFlow</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="+49 123 456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">PIN</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {existingSession && (
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Session Found</p>
                  <p className="text-xs text-muted-foreground">
                    {existingSession.phone} • Last used {existingSession.lastUsed}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleResumeSession}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Resume Session
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Or enter different credentials below
              </p>
            </div>
          )}

          {!existingSession && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                Sessions are saved locally to prevent repeated SMS requests
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
