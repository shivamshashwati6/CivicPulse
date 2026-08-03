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
  ChevronRight,
  Mail,
  Phone,
  Building2,
  MessageSquare,
  Activity,
  Users,
  Check
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
      {/* 2. HERO SECTION                                               */}
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
                    Report Issue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-gray-700 border-gray-300 hover:bg-gray-50 px-8 py-3.5 rounded-xl font-medium">
                    Learn More
                  </Button>
                </a>
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
            <div className="lg:col-span-5 flex justify-center">
              <PhoneMockup />
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. STATISTICS SECTION                                         */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{stat.value}</h3>
                  <p className="text-xs text-emerald-600 font-medium">{stat.change}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. FEATURES PREVIEW                                           */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            Features Overview
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Intelligent Infrastructure Technology
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Built from the ground up for speed, transparency, and high municipal throughput.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all group space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{feat.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. HOW IT WORKS                                               */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="bg-gray-50/70 py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/60 text-blue-700 text-xs font-semibold">
              Simple Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              How CivicPulse AI Works
            </h2>
            <p className="text-gray-600 text-base">
              From photo capture to resolved public infrastructure in 4 transparent steps.
            </p>
          </div>

          {/* 4-Step Horizontal Process Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="relative bg-white rounded-2xl p-6 border border-gray-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      STEP {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. CONTACT SECTION                                            */}
      {/* ------------------------------------------------------------- */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            Get In Touch
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Contact Municipal Support & Engineering
          </h2>
          <p className="text-gray-600 text-base">
            Have questions about deploying CivicPulse AI in your district or evaluating our API?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 space-y-6 shadow-lg shadow-blue-600/20">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Hackathon & Municipal Inquiries</h3>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Our architecture is built for rapid integration with municipal GIS systems and open civic data APIs.
                </p>
              </div>

              <div className="space-y-4 text-xs font-medium pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <span>support@civicpulse.ai</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <span>+1 (800) 555-CIVIC</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span>City Center Municipal Hub, Suite 400</span>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-500/40 text-xs text-blue-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-300" />
                <span>24/7 SLA Response Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
            {contactSubmitted ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <Check className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Message Sent Successfully!</h3>
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  Thank you for reaching out. Our municipal engineering support team will respond shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Send us a Message</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">Your Name</label>
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
                    <label className="block text-xs font-semibold text-gray-700">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@citydomain.gov"
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
                  <label className="block text-xs font-semibold text-gray-700">Message</label>
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
