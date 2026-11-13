import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, resetPassword } from '@/services/supabase/auth';
import { Button } from '@/components/shared/Button';
import { Lock, Mail, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setResetSuccess(`Password reset link sent to ${email}. Please check your inbox.`);
    } catch (err: any) {
      setError(err.message || 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      {/* Brand card */}
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent text-white font-bold text-xl shadow-md mb-3">
            TF
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">TEAMFLOW</h2>
          <p className="text-xs text-secondary mt-1 font-medium">
            Design Lead Control Centre • Private System Access
          </p>
        </div>

        <div className="bg-white py-8 px-8 shadow-xl rounded-2xl border border-border">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {!isResetMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
                  Design Lead Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lead@designteam.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-primary uppercase">
                    Master Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setError(null);
                      setResetSuccess(null);
                    }}
                    className="text-xs text-accent hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Control Centre
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary uppercase mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lead@designteam.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                Send Recovery Link
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setError(null);
                    setResetSuccess(null);
                  }}
                  className="text-xs text-secondary hover:text-primary font-medium"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-[11px] text-secondary leading-relaxed">
              Exclusively operated by the Design Lead. Public sign-up is disabled. Team members are
              managed directly inside the application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

