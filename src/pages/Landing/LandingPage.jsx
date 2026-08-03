import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, BrainCircuit, MapPin, CheckCircle2, ShieldCheck, ArrowRight, Activity, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export function LandingPage() {
  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 text-white p-8 sm:p-12 lg:p-16 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30">
            <BrainCircuit className="w-3.5 h-3.5 text-blue-400" />
            AI-Driven Civic Infrastructure Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Report Civic Issues. <br />
            <span className="text-blue-300">Powered by AI Intelligence.</span>
          </h1>
          <p className="text-lg text-blue-100/90 max-w-2xl leading-relaxed">
            Upload images of public infrastructure problems—potholes, garbage, broken streetlights, or water leaks. Our AI vision automatically classifies, assesses severity, and routes reports to municipal authorities.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link to="/report">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-semibold shadow-lg shadow-blue-950/40 border-0">
                Report an Issue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/track">
              <Button size="lg" variant="outline" className="border-blue-300/40 text-white hover:bg-blue-800/50">
                Track Live Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-0 pointer-events-none" />
      </section>

      {/* Feature Highlights Grid */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">How CivicPulse AI Works</h2>
          <p className="text-slate-600 text-sm">
            Streamlined workflow from image capture to municipal resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-blue-300 transition-all hover:shadow-md">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Camera className="w-6 h-6" />
              </div>
              <CardTitle>1. Photo Capture</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Citizens snap a photo of any public issue. Geo-location coordinates and timestamp are captured seamlessly.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-blue-300 transition-all hover:shadow-md">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <CardTitle>2. AI Automated Triage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Google Gemini API analyzes the image to classify category, estimate severity level, and detect duplicate reports.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-blue-300 transition-all hover:shadow-md">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <CardTitle>3. Municipal Action</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Reports are dispatched to municipal admin dashboards. Citizens can track status updates transparently in real time.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Action CTA */}
      <section className="bg-blue-50 border border-blue-200 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold text-slate-900">Spotted a civic problem in your area?</h3>
          <p className="text-sm text-slate-600">
            Submit a photo report in under 60 seconds to notify local authorities.
          </p>
        </div>
        <Link to="/report">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5">
            Submit New Report
          </Button>
        </Link>
      </section>
    </div>
  );
}
