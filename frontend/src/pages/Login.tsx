import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Alert, BrandLogo, BrandMark, Button, Input } from '../components/common';
import { BarChart3, Leaf, PlayCircle, ShieldCheck, Waves } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  usePageMeta({
    title: 'AgriCane Demo Login',
    description:
      'Sign in or open the read-only AgriCane portfolio demo for sugarcane field monitoring, IoT, weather, NDVI, drone, agronomy, and AI workflows.',
    path: '/login',
    robots: 'noindex, nofollow',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await login('viewer@agricane.com', 'admin123');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Demo login failed. Run the demo seeder first.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden rounded-lg border border-primary-100 bg-white p-8 shadow-sm lg:block">
            <div className="flex items-center gap-3">
              <BrandLogo markClassName="h-11 w-11" textClassName="text-xl font-bold text-gray-950" subtitle="Sugarcane intelligence platform" />
            </div>

            <div className="mt-10">
              <h1 className="max-w-xl text-4xl font-bold leading-tight text-gray-950">
                Monitor plantation health from field, sensor, weather, and satellite data.
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-gray-600">
                Portfolio-ready preview with real dashboard flows: fields, IoT readings, environmental monitoring, NDVI, drone logs, agronomy, and AI recommendations.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { label: 'Field Monitoring', icon: Leaf, value: '5 demo fields' },
                { label: 'IoT Stream', icon: Waves, value: '72h sensor data' },
                { label: 'Analytics', icon: BarChart3, value: 'NDVI + weather' },
                { label: 'Read-only Preview', icon: ShieldCheck, value: 'Viewer access' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <Icon className="text-primary-700" size={22} />
                    <p className="mt-3 text-sm font-semibold text-gray-950">{item.label}</p>
                    <p className="mt-1 text-sm text-gray-600">{item.value}</p>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-8"
              onClick={handleDemoLogin}
              disabled={isLoading}
              leftIcon={<PlayCircle size={18} />}
            >
              View demo dashboard
            </Button>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center lg:text-left">
            <BrandMark className="mx-auto mb-4 h-14 w-14 lg:mx-0" />
            <h2 className="text-3xl font-bold text-gray-950">Welcome back</h2>
            <p className="mt-2 text-gray-600">Sign in to manage or preview AgriCane data.</p>
          </div>

          {error && (
            <Alert type="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@agricane.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            <Button type="submit" fullWidth disabled={isLoading} isLoading={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={handleDemoLogin}
              disabled={isLoading}
              leftIcon={<PlayCircle size={18} />}
            >
              View Read-only Demo
            </Button>
          </div>

          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Preview credentials</p>
            <div className="mt-2 space-y-1">
              <p><strong>Viewer:</strong> viewer@agricane.com / admin123</p>
              <p className="text-xs text-gray-500">Viewer can inspect portfolio data but cannot create, update, generate, fetch, or delete records.</p>
            </div>
          </div>
          </section>
        </div>
      </div>
    </div>
  );
};
