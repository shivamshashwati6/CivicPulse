import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  BrainCircuit,
  Send,
  BarChart3,
  Layers,
  ShieldCheck,
  ArrowRight,
  Mail,
  Phone,
  Building2,
  Activity,
  Users,
  PlusCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PhoneMockup } from './PhoneMockup';

export function LandingPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email && contactForm.message) {
      setContactSubmitted(true);
      setTimeout(() => {
        setContactSubmitted(false);
        setContactForm({ name: '', email: '', subject: '', message: '' });
      }, 4000);
    }
  };

  const stats = [
    { label: 'Issues Reported', value: '25,400+', icon: Activity, change: '+12% this month' },
    { label: 'Issues Resolved', value: '94.8%', icon: CheckCircle2, change: '24hr avg SLA' },
    { label: 'Active Citizens', value: '120,000+', icon: Users, change: 'Across 14 cities' },
    { label: 'Departments Connected', value: '45+', icon: Building2, change: 'Public works & sanitation' },
  ];

  const features = [
    {
      icon: BrainCircuit,
      title: 'AI Image Triage',
      description: 'Google Gemini AI vision models classify issue categories and rate urgency scores instantly from photo uploads.',
    },
    {
      icon: Send,
      title: 'Automated Department Routing',
      description: 'Smart ticket payloads are instantly dispatched to the appropriate municipal engineering or sanitation team.',
    },
    {
      icon: MapPin,
      title: 'Precise Geolocation Tagging',
      description: 'Automated GPS metadata extraction maps exact coordinates for OpenStreetMap GIS visualization.',
    },
    {
      icon: Clock,
      title: 'Real-Time Status Tracking',
      description: 'Transparent lifecycle tracking keeps citizens notified from initial report upload to final verified fix.',
    },
    {
      icon: Layers,
      title: 'Duplicate Issue Merging',
      description: 'AI pattern recognition detects and merges duplicate community reports, preventing municipal inbox congestion.',
    },
    {
      icon: BarChart3,
      title: 'Municipal Analytics & Heatmaps',
      description: 'Executive dashboards provide local authorities with SLA performance metrics and infrastructure heatmaps.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Capture',
      icon: Camera,
      description: 'Citizens snap a clear photo of the civic problem on any smartphone.',
    },
    {
      step: '02',
      title: 'AI Analysis',
      icon: Sparkles,
      description: 'Gemini AI evaluates the image, determines severity, and tags GPS coordinates.',
    },
    {
      step: '03',
      title: 'Smart Routing',
      icon: Send,
      description: 'The ticket payload is automatically dispatched to the responsible municipal department.',
    },
    {
      step: '04',
      title: 'Resolution',
      icon: CheckCircle2,
      description: 'Field crews complete repairs and upload verified resolution proof for citizens.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      
      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION                                                  */}
      {/* ------------------------------------------------------------- */}
      <section id="home" className="relative pt-12 lg:pt-20 pb-8 overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column Text Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Next-Gen Civic Technology Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.15]">
                Report Smarter. <br />
                <span className="text-blue-600">Fix Faster.</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                AI-powered civic issue reporting platform that helps citizens report public problems and enables authorities to resolve them efficiently.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/report" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all">
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Report Issue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                <Link to="/admin/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-slate-800 border-slate-300 hover:bg-slate-100 px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 mr-2 text-blue-600" />
                    Admin Portal Login
                  </Button>
                </Link>
              </div>

              {/* Trust Badge Bar */}
              <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Google Gemini Vision AI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Supabase Backend</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>OpenStreetMap GIS Ready</span>
                </div>
              </div>
            </div>

            {/* Right Column Phone Mockup */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* STATS STRIP                                                   */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-2 border-b sm:border-b-0 sm:border-r border-slate-800 last:border-0 pb-6 sm:pb-0 pr-0 sm:pr-6">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                <stat.icon className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
              <p className="text-xs font-medium text-emerald-400">{stat.change}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FEATURES SECTION                                              */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Engineered for High-Impact Municipal Efficiency
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            From automated AI triage to OpenStreetMap GIS map visualization, CivicPulse AI streamlines the complete lifecycle of municipal maintenance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="p-8 bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-all hover:-translate-y-1 space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-normal">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* HOW IT WORKS SECTION                                          */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Simple 4-Step Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            How CivicPulse AI Resolves Infrastructure Issues
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative p-6 bg-gray-50 rounded-2xl border border-gray-200/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-blue-600">{step.step}</span>
                <div className="w-10 h-10 rounded-xl bg-white text-blue-600 shadow-2xs flex items-center justify-center">
                  <step.icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CONTACT SECTION                                               */}
      {/* ------------------------------------------------------------- */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          
          {/* Left Column: Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 text-blue-300 text-xs font-semibold border border-blue-700/50">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Municipal Relations</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Deploy CivicPulse AI in Your Municipality
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Interested in deploying CivicPulse AI for your city or public works department? Contact our team for institutional onboarding.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Institutional Email</p>
                  <p className="text-sm font-semibold text-white">support@civicpulse.ai</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Emergency & Support</p>
                  <p className="text-sm font-semibold text-white">+1 (800) 555-CIVIC</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Headquarters</p>
                  <p className="text-sm font-semibold text-white">100 Innovation Way, Suite 400</p>
                </div>
              </div>
            </div>

            {/* Quick Link to Admin Login */}
            <div className="pt-4 border-t border-slate-800">
              <Link to="/admin/login" className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline">
                <ShieldCheck className="w-4 h-4" />
                Municipal Authority Portal Sign In →
              </Link>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white text-gray-900 rounded-2xl p-6 sm:p-8">
            {contactSubmitted ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Message Received!</h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  Thank you for reaching out. Our municipal onboarding team will contact you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Send an Inquiry</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">Official Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@city.gov"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Subject</label>
                  <input
                    type="text"
                    placeholder="Municipal Deployment / General Inquiry"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Message *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us about your city, department, or inquiry..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <Button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md shadow-blue-600/20">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            )}
          </div>

        </div>
      </section>

    </div>
  );
}
