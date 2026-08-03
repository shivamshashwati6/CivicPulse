import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, LogIn, Lock, Mail, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Auth logic will be integrated with Supabase
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-2">
            <Activity className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign In to CivicPulse</CardTitle>
          <p className="text-sm text-slate-500">
            Access your civic reporting dashboard and track active issues.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="citizen@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                Remember me
              </label>
              <a href="#forgot" className="text-blue-600 font-medium hover:underline">
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white">
              <LogIn className="w-4 h-4 ml-0 mr-2" />
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4 space-y-2">
            <p>
              Don't have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                Create Account
              </Link>
            </p>
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs pt-2">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Secured with Supabase Authentication</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
