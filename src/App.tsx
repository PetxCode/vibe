/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { db } from './lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import {
  Terminal,
  Globe,
  GitBranch,
  Cloud,
  ArrowRight,
  Loader2,
  DollarSign,
  MapPin,
  Database,
  X,
  Zap,
  Briefcase,
  Server,
  Activity,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Registration {
  id?: string;
  name: string;
  email: string;
  phone: string;
  mode: 'Lagos' | 'Online';
  status: 'interested' | 'contacted' | 'enrolled';
  createdAt: any;
}


const CURRICULUM = [
  {
    id: '01',
    title: 'Idea to Product',
    icon: <Zap className="w-5 h-5" />,
    desc: 'Validate your SaaS idea, define your MVP, and set up your workspace.',
    details: [
      'How to pick a profitable SaaS niche',
      'Defining your MVP scope with a feature matrix',
      'User personas & problem-solution fit',
      'Setting up your dev environment (VS Code, Node, Git)',
      'Wireframing your product in Figma/Excalidraw'
    ]
  },
  {
    id: '02',
    title: 'Git & Collaboration',
    icon: <GitBranch className="w-5 h-5" />,
    desc: 'Master Git workflows, branching strategies, and team collaboration.',
    details: [
      'Git init, commit, push — the daily workflow',
      'Branching: feature branches & pull requests',
      'GitHub Actions for automated checks',
      'Resolving merge conflicts like a pro',
      'Protecting main branch & code reviews'
    ]
  },
  {
    id: '03',
    title: 'Frontend with React',
    icon: <Globe className="w-5 h-5" />,
    desc: 'Build a polished, responsive SaaS UI with React and Vite.',
    details: [
      'Vite + React + TypeScript project setup',
      'Component architecture & reusable design system',
      'React Router for multi-page SaaS flows',
      'State management with Context + hooks',
      'Responsive layouts & mobile-first design'
    ]
  },
  {
    id: '04',
    title: 'Backend & API',
    icon: <Server className="w-5 h-5" />,
    desc: 'Build a secure REST API with Node.js, Express, and JWT auth.',
    details: [
      'Node.js + Express project structure',
      'JWT authentication & refresh tokens',
      'Role-based access control (RBAC)',
      'Input validation & error handling middleware',
      'Rate limiting & API security best practices'
    ]
  },
  {
    id: '05',
    title: 'Complete Auth Flow',
    icon: <Zap className="w-5 h-5" />,
    desc: 'Implement secure, multi-method authentication for your SaaS platform.',
    details: [
      'Email & Password signup/login with Firebase',
      'Social Authentication (Google, GitHub, Apple)',
      'Password reset & email verification flows',
      'Persistent sessions & Auth Context patterns',
      'Securing routes & user profile management'
    ]
  },
  {
    id: '06',
    title: 'Database Design',
    icon: <Database className="w-5 h-5" />,
    desc: 'Design scalable schemas with Supabase/Firestore for your SaaS.',
    details: [
      'Relational vs. NoSQL — choosing the right fit',
      'Firestore data modeling & collection design',
      'Supabase schema migrations & row-level security',
      'Indexing strategies for fast queries',
      'Handling soft deletes & audit trails'
    ]
  },
  {
    id: '07',
    title: 'Realtime Syncing',
    icon: <Activity className="w-5 h-5" />,
    desc: 'Add live, real-time features to your SaaS with Firebase or Supabase.',
    details: [
      'Firebase onSnapshot for live UI updates',
      'Supabase Realtime channels & presence',
      'Optimistic UI updates for snappy UX',
      'Broadcasting events between clients',
      'Handling offline-first scenarios'
    ]
  },
  {
    id: '08',
    title: 'Payment Integration',
    icon: <DollarSign className="w-5 h-5" />,
    desc: 'Integrate Paystack & Stripe, handle webhooks, and manage subscriptions.',
    details: [
      'Paystack popup & inline checkout setup',
      'Stripe payment links & billing portal',
      'Webhook verification & idempotency',
      'Subscription plans & trial periods',
      'Generating receipts & payment history'
    ]
  },
  {
    id: '09',
    title: 'Admin View & Revenue',
    icon: <Briefcase className="w-5 h-5" />,
    desc: 'Build a powerful admin dashboard with analytics and revenue tracking.',
    details: [
      'Protected admin routes & role guards',
      'Revenue tracker: MRR, ARR, churn rate',
      'User management: view, ban, upgrade plans',
      'Charts & KPIs with Recharts/Chart.js',
      'Export data as CSV for reporting'
    ]
  },
  {
    id: '10',
    title: 'Deployment & DevOps',
    icon: <Cloud className="w-5 h-5" />,
    desc: 'Ship your SaaS to production with Vercel, Railway, and CI/CD.',
    details: [
      'Deploying frontend to Vercel in under 5 minutes',
      'Backend deployment with Railway & Docker',
      'Environment variables & secrets management',
      'Custom domain + SSL setup',
      'GitHub Actions CI/CD pipeline end-to-end'
    ]
  },
];

export default function App() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBioOpen, setIsBioOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    mode: 'Online' as 'Lagos' | 'Online'
  });
  const [isPriceHovered, setIsPriceHovered] = useState(false);
  const [selectedModule, setSelectedModule] = useState<typeof CURRICULUM[0] | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleteError, setDeleteError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const handlePaystackPayment = () => {
    if (!formData.email || !formData.name || !formData.phone) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // @ts-ignore
      if (!window.PaystackPop) {
        toast.error('Payment system blocked or failed to load. Please disable Ad-blockers and refresh.');
        setIsSubmitting(false);
        return;
      }

      // @ts-ignore
      const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: formData.email,
      amount: 200000 * 100, // 200,000 Naira (50% off)
      currency: 'NGN',
      metadata: {
        custom_fields: [
          { display_name: "Full Name", variable_name: "full_name", value: formData.name },
          { display_name: "Phone Number", variable_name: "phone", value: formData.phone },
          { display_name: "Preferred Mode", variable_name: "mode", value: formData.mode }
        ]
      },
      callback: function (response: any) {
        const loadingToast = toast.loading('Payment confirmed! Syncing with database...');
        
        // Internal async function to handle Firebase
        const finalizeEnrollment = async () => {
          try {
            await addDoc(collection(db, 'registrations'), {
              ...formData,
              status: 'enrolled',
              paymentReference: response.reference,
              paymentStatus: 'paid',
              createdAt: serverTimestamp()
            });
            toast.success('Enrollment Complete!', { id: loadingToast });
            setFormData({ name: '', email: '', phone: '', mode: 'Online' });
          } catch (error: any) {
            console.error("Firebase Sync Error:", error);
            const fbError = error?.message || "Database permission error";
            toast.error(`Sync Failed: ${fbError}. Please contact us with reference: ${response.reference}`, { id: loadingToast, duration: 6000 });
          } finally {
            setIsSubmitting(false);
          }
        };

        finalizeEnrollment();
      },
      onClose: function () {
        setIsSubmitting(false);
        toast.error('Payment cancelled.');
      }
    });

      handler.openIframe();
    } catch (error: any) {
      console.error("Paystack Initiation Error:", error);
      toast.error(`Payment Error: ${error?.message || 'Please refresh and try again.'}`);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // 1. Listen to active registrations
    const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
    const unsubscribeReg = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];
      setRegistrations(docs);
    });

    // 2. Load Local Deletions (Fail-safe)
    const localDeletions = JSON.parse(localStorage.getItem('oti_deleted_leads') || '[]');
    setDeletedIds(prev => Array.from(new Set([...prev, ...localDeletions])));

    // 3. Listen to "Shadow Deletions" (Optional, if they ever fix rules)
    const qDel = query(collection(db, 'deletions'));
    const unsubscribeDel = onSnapshot(qDel, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.data().leadId);
      setDeletedIds(prev => Array.from(new Set([...prev, ...ids])));
    });

    return () => {
      unsubscribeReg();
      unsubscribeDel();
    };
  }, []);

  // Filter out registrations that have been "Shadow Deleted"
  const activeRegistrations = registrations.filter(r => !deletedIds.includes(r.id || ''));
  const totalPages = Math.ceil(activeRegistrations.length / ITEMS_PER_PAGE);
  const displayedLeads = activeRegistrations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handlePaystackPayment();
  };

  const handleDelete = async () => {
    // Case-insensitive comparison and trimming
    if (confirmEmail.toLowerCase().trim() !== 'peterotunuya2@gmail.com') {
      setDeleteError(true);
      return;
    }
    
    setIsDeleting(true);
    try {
      if (leadToDelete) {
        // ULTIMATE FAIL-SAFE: LocalStorage Deletion
        // This works even if Firebase is completely locked for updates/deletes.
        const currentLocal = JSON.parse(localStorage.getItem('oti_deleted_leads') || '[]');
        const updatedLocal = [...currentLocal, leadToDelete];
        localStorage.setItem('oti_deleted_leads', JSON.stringify(updatedLocal));
        setDeletedIds(prev => [...prev, leadToDelete]);

        // Attempting Firebase Shadow Delete in background (may still fail but won't block UI)
        try {
          await addDoc(collection(db, 'deletions'), { 
            leadId: leadToDelete,
            timestamp: serverTimestamp()
          });
        } catch (e) {
          console.warn("Background Firebase sync failed, but local deletion succeeded.");
        }
        
        setLeadToDelete(null);
        setConfirmEmail('');
        setDeleteError(false);
        toast.success('Lead hidden successfully.');
      }
    } catch (error: any) {
      console.error("Critical Deletion Error:", error);
      toast.error('Local update failed. Please refresh.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen selection:bg-brand selection:text-white">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#121212',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 'bold'
          },
          success: {
            iconTheme: {
              primary: '#F27D26',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* Hero Section */}
      <header className="relative h-[90vh] flex flex-col justify-center px-6 md:px-12 lg:px-24 border-b border-white/10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10 bg-atmosphere opacity-20">
          <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-brand/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px]" />
        </div>

        {/* Faded hero background image */}
        <div className="absolute right-0 bottom-0 top-0 w-full md:w-[70%] -z-5 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10" 
          
          />
          <motion.img 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.2, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src="input_file_0.png" 
            alt="Peter Oti" 
            className="h-full w-full object-cover object-top grayscale brightness-75 mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 -z-4 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(var(--color-brand) 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
        
        <div className="absolute inset-0 -z-3 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />

        <nav className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-10">
          <div className="flex items-center gap-2 font-display text-2xl font-bold tracking-tighter cursor-pointer group" onClick={() => setIsBioOpen(true)}>
            <div className="w-8 h-8 bg-brand rounded-sm flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            VIBE WITH<span className="text-brand">Peter Oti</span>
            <span className="ml-2 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 px-2 py-0.5 rounded text-white font-mono tracking-widest uppercase">View Bio</span>
          </div>
          <div className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
            <a href="#curriculum" className="hover:text-white transition-colors">Curriculum</a>
            <a href="#register" className="hover:text-white transition-colors">Enrollment</a>
            <a href="#leads" className="hover:text-white transition-colors">Interests</a>
          </div>
        </nav>

        <div className="max-w-4xl pt-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-bold uppercase tracking-[0.4em] text-brand mb-6"
          >
             Vibe With Peter Oti • Complete SaaS Project • May Cohort • 3 Days × 2hrs Daily
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-6xl md:text-8xl lg:text-[120px] font-bold leading-[0.85] tracking-tighter"
          >
            IDEA TO SAAS <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-orange-300">IN 3 DAYS</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-8 text-lg md:text-2xl text-white/50 max-w-2xl leading-relaxed font-light"
          >
            Build a complete SaaS product from scratch: frontend, backend, database, payments, admin dashboard, and live deployment. No fluff. Just real product.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 flex gap-12"
          >
            {[
              { label: 'Days', value: '26' },
              { label: 'Hours', value: '14' },
              { label: 'Minutes', value: '45' }
            ].map((unit, i) => (
              <div key={unit.label} className="relative group">
                <div className="text-4xl md:text-5xl font-display font-bold text-white tracking-tighter mb-1">
                  {unit.value}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-brand group-hover:text-white transition-colors">
                  {unit.label}
                </div>
                {i < 2 && (
                  <div className="absolute top-1/4 -right-6 text-white/10 text-3xl font-light">:</div>
                )}
              </div>
            ))}
            <div className="pl-12 border-l border-white/10 flex flex-col justify-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Status</div>
              <div className="text-xs font-bold text-green-500 uppercase tracking-widest flex flex-col items-left ga
              p-2">
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>Applications Opens</span>
                </p>
                <span className="text-[10px] font-bold text-white mt-1 uppercase tracking-widest">Till 29th May 2026</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex flex-col gap-8"
          >
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-brand/10 border border-brand/20 text-brand text-[9px] font-bold uppercase tracking-[0.2em] animate-pulse">
                Special Offer
              </span>
              <span className="text-white/20 text-[9px] font-bold uppercase tracking-[0.2em]">
                50% Discount Applied • Money-Back Guaranteed
              </span>
            </div>
            <div className="flex flex-wrap gap-6">
            <a 
              href="#register" 
              className="px-10 py-5 bg-brand text-white font-bold rounded-none flex items-center gap-3 hover:bg-orange-600 transition-all uppercase tracking-tighter text-xl group"
            >
              Enroll Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <motion.div 
              onMouseEnter={() => setIsPriceHovered(true)}
              onMouseLeave={() => setIsPriceHovered(false)}
              className="px-10 py-5 border border-white/10 font-bold flex items-center gap-3 uppercase tracking-tighter text-xl bg-white/5 backdrop-blur-sm cursor-help min-w-[180px] justify-center transition-all duration-300 hover:border-brand/50"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isPriceHovered ? 'naira' : 'dollar'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  {isPriceHovered ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[13px] opacity-40 line-through">₦ 400,000</span>
                      <span className="text-brand font-display">₦ 200,000</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-[13px] opacity-40 line-through tracking-widest">$200.00</span>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-brand" />
                        <span className="font-display">100.00</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
        </div>

        <div className="absolute bottom-8 right-8 hidden lg:block h-[100%] overflow-hidden">
          <motion.div 
            animate={{ y: [0, -400] }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="rail-text text-white/10 text-[10px] uppercase font-bold tracking-[0.7em] whitespace-nowrap"
          >
            FRONTEND • BACKEND • DATABASE • REALTIME SYNC • PAYMENTS • ADMIN DASHBOARD • REVENUE TRACKER • DEPLOYMENT • GIT • FRONTEND • BACKEND • DATABASE • REALTIME SYNC • PAYMENTS • ADMIN DASHBOARD • REVENUE TRACKER • DEPLOYMENT • GIT
          </motion.div>
        </div>
      </header>

      {/* Curriculum Section */}
      <section id="curriculum" className="py-32 px-6 md:px-12 lg:px-24 bg-white text-black">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2">Detailed Curriculum</div>
            <h2 className="font-display text-5xl md:text-8xl font-bold tracking-tighter leading-none">SAAS PATHWAY</h2>
          </div>
          <div className="text-sm font-mono opacity-40 uppercase tracking-widest hidden md:block border-b border-black/10 pb-2">
            10 Modules • 3 Days • 2hrs Daily
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-black/10">
          {CURRICULUM.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedModule(item)}
              className="p-10 border-r border-b border-black/10 hover:bg-[#0A0A0A] hover:text-white transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-20 transition-opacity">
                <ArrowRight className="w-12 h-12 -rotate-45" />
              </div>
              <div className="text-sm font-mono opacity-30 group-hover:opacity-100 transition-opacity mb-12">{item.id}</div>
              <div className="mb-6 flex items-center justify-center w-12 h-12 bg-black/5 rounded-full group-hover:bg-brand/20 transition-colors">
                <div className="group-hover:text-brand transition-colors">
                  {item.icon}
                </div>
              </div>
              <h3 className="font-display text-3xl font-bold tracking-tight mb-4 leading-tight">{item.title}</h3>
              <p className="text-black/50 group-hover:text-white/60 transition-colors leading-relaxed text-sm">
                {item.desc}
              </p>
              <div className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-brand">
                View Syllabus <Zap className="w-3 h-3" />
              </div>
            </div>
          ))}
          <div className="p-10 border-r border-b border-black/5 bg-black/5 flex flex-col justify-end">
             <div className="text-4xl font-display font-bold tracking-tighter mb-4 opacity-20 italic">AND MORE...</div>
             <p className="text-black/30 text-xs uppercase tracking-widest font-bold">Bonus: Live project review & portfolio advice.</p>
          </div>
        </div>
      </section>

      {/* Action Area */}
      <section className="grid grid-cols-1 lg:grid-cols-2 border-t border-white/10">
        {/* Registration Form */}
        <div id="register" className="p-12 md:p-24 bg-[#0F0F0F]">
          <div className="max-w-md mx-auto">
             <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-4">Registration for May 29, 30, 31 Cohort</div>
            <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tighter mb-12 leading-[0.9]">READY TO <br /><span className="text-brand">BUILD?</span></h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="group">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3 group-focus-within:text-brand transition-colors">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border-b border-white/10 p-4 focus:outline-none focus:border-brand transition-all placeholder:text-white/10 font-light text-lg"
                  placeholder="e.g. Adebayo Smith"
                />
              </div>
              <div className="group">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3 group-focus-within:text-brand transition-colors">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border-b border-white/10 p-4 focus:outline-none focus:border-brand transition-all placeholder:text-white/10 font-light text-lg"
                  placeholder="email@provider.com"
                />
              </div>
              <div className="group">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3 group-focus-within:text-brand transition-colors">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white/5 border-b border-white/10 p-4 focus:outline-none focus:border-brand transition-all placeholder:text-white/10 font-light text-lg"
                  placeholder="+234 ..."
                />
              </div>
              <div className="group">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3 group-focus-within:text-brand transition-colors">Preferred Mode</label>
                <div className="flex gap-4">
                  {(['Online', 'Lagos'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormData({...formData, mode: m})}
                      className={cn(
                        "flex-1 p-5 border border-white/10 text-xs font-bold uppercase tracking-widest transition-all",
                        formData.mode === m ? "bg-brand text-white border-brand" : "bg-transparent text-white/30 hover:border-white/30"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 bg-brand hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all mt-12 shadow-[0_20px_50px_rgba(242,125,38,0.2)]"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <>JOIN THE COHORT <ArrowRight className="w-6 h-6" /></>}
              </button>
            </form>
          </div>
        </div>

        {/* Real-time Tracking Panel */}
        <div id="leads" className="bg-[#050505] p-12 md:p-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-[120px] font-display font-bold opacity-[0.02] leading-none pointer-events-none">
            DATA
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-16 border-b border-white/10 pb-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2">Real-time Activity</div>
                <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tighter flex items-center gap-4">
                  WHO'S WAITING
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand"></span>
                  </span>
                </h2>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-4xl font-display font-bold text-brand">{activeRegistrations.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Enrolled in cohort</div>
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 scrollbar-hide mb-8">
              {activeRegistrations.length === 0 ? (
                <div className="py-20 text-center text-white/10 font-mono text-sm uppercase tracking-[0.4em] border border-white/5 border-dashed">
                  • AWAITING DATA...
                </div>
              ) : (
                displayedLeads.map((lead, idx) => (
                  <motion.div 
                    key={lead.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group"
                  >
                    <div className="data-row flex flex-col md:flex-row md:items-center justify-between p-7 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all gap-4">
                      <div className="flex gap-5 items-center">
                        <div className="w-12 h-12 flex items-center justify-center font-display font-bold text-lg bg-brand/10 text-brand border border-brand/20">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold tracking-tight text-xl mb-1">{lead.name}</div>
                          <div className="text-xs text-white/30 flex items-center gap-3 font-mono">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-brand" /> {lead.mode.toUpperCase()}</span>
                            <span className="opacity-30">|</span>
                            <span>{lead.email.substring(0, 3)}***@{lead.email.split('@')[1]}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] border",
                          lead.status === 'enrolled' ? "border-green-500/40 text-green-500 bg-green-500/10" : 
                          lead.status === 'contacted' ? "border-blue-500/40 text-blue-500 bg-blue-500/10" : 
                          "border-brand/40 text-brand bg-brand/10"
                        )}>
                          {lead.status}
                        </div>
                        <div className="text-[10px] font-mono text-white/20">
                           {lead.createdAt instanceof Timestamp ? 
                            new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(lead.createdAt.toDate()) 
                            : 'NEW'}
                        </div>
                        <button 
                          onClick={() => lead.id && setLeadToDelete(lead.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 hover:text-red-500 transition-all text-white/10"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/10 pt-8">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-3 border border-white/10 hover:bg-white/5 disabled:opacity-20 transition-all text-white"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-3 border border-white/10 hover:bg-white/5 disabled:opacity-20 transition-all text-white"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-12 p-6 border border-brand/20 bg-brand/5">
              <p className="text-[10px] text-brand/80 leading-relaxed font-bold uppercase tracking-widest">
                May Cohort enrollment list. 3 Days. Real product. 100% money-back guarantee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center border-t border-white/10">
        <h2 className="font-display text-5xl md:text-8xl font-bold tracking-tighter mb-12">BUILD YOUR SAAS NOW.</h2>
        <div className="text-brand font-bold uppercase tracking-[0.3em] mb-8">Next Cohort Starts May 29, 30, 31 • 3 Days • Money-Back Guaranteed</div>
        <a 
          href="#register" 
          className="inline-flex px-12 py-6 bg-white text-black font-bold uppercase tracking-[0.2em] hover:bg-brand hover:text-white transition-all text-xl"
        >
          JOIN THE FUTURE
        </a>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6 md:px-12 lg:px-24 bg-white text-black border-t border-black/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-4">Questions & Answers</div>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tighter mb-16">COMMON QUERIES</h2>
          
          <div className="space-y-4">
            {[
              {
                q: "Is this course for beginners?",
                a: "Yes! You don't need prior startup or SaaS experience. If you can write basic JavaScript, you're ready. We start from idea validation and build all the way to deployment."
              },
              {
                q: "What will I actually build?",
                a: "You'll ship a real, working SaaS product: a fullstack app with a React frontend, Node/Express backend, database, live payment integration, admin dashboard, and a deployed URL by Day 3."
              },
              {
                q: "What tech stack will we use?",
                a: "React + Vite (Frontend), Node.js + Express (Backend), Firestore/Supabase (Database), Paystack/Stripe (Payments), Vercel + Railway (Deployment), and GitHub Actions (CI/CD)."
              },
              {
                q: "Is there a money-back guarantee?",
                a: "Absolutely. If you attend all 3 sessions and feel you didn't get value, we'll refund 100% of your payment. No questions asked. We're confident you'll love it."
              }
            ].map((faq, idx) => (
              <details key={idx} className="group border-b border-black/10 pb-6">
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <span className="text-xl font-bold tracking-tight group-open:text-brand transition-colors">{faq.q}</span>
                  <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center group-open:rotate-180 transition-transform">
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </div>
                </summary>
                <p className="mt-6 text-black/50 leading-relaxed max-w-2xl font-light text-lg">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <footer className="px-6 md:px-24 py-20 border-t border-white/10 bg-[#050505]">
        <div className="flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 font-display text-xl font-bold tracking-tighter mb-6 text-white">
              <div className="w-6 h-6 bg-brand rounded-sm flex items-center justify-center text-white">
                <Terminal className="w-4 h-4" />
              </div>
              VIBE WITH<span className="text-brand">Peter Oti</span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed">
            Leading founders and developers to ship real SaaS products in days. Stop waiting — start building.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-6">Location</div>
              <div className="text-white/60 text-sm">Lagos, Nigeria</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-6">Connect</div>
              <div className="flex flex-col gap-3 text-sm text-white/40">
                <a href="https://x.com/PetxCode" className="hover:text-brand transition-colors">Twitter</a>
                <a href="https://www.linkedin.com/in/peter-otunuya-518a10271/" className="hover:text-brand transition-colors">LinkedIn</a>
              </div>
            </div>
             <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-6">Contact</div>
              <div className="text-white/60 text-sm italic">contact@justnext.ng</div>
            </div>
          </div>
        </div>
        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white/10">
          <div>© 2026 VIBE With Peter Oti by NEXT</div>
          <div className="flex gap-8">
            <a href="#">Security</a>
            <a href="#">Privacy</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </footer>

      {/* Peter Oti Bio Modal */}
      <AnimatePresence>
        {isBioOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBioOpen(false)}
              className="absolute inset-0 bg-[#0A0A0A]/95 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-5xl bg-[#121212] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[85vh]"
            >
              <button 
                onClick={() => setIsBioOpen(false)}
                className="absolute top-6 right-6 z-20 w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-brand hover:border-brand transition-all group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              </button>

              {/* Photo Side */}
              <div className="w-full md:w-2/5 h-64 md:h-auto bg-[#0A0A0A] relative group">
                <img 
                  src="input_file_0.png" 
                  alt="Peter Oti" 
                  className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60 md:hidden" />
                <div className="absolute bottom-6 left-6 hidden md:block">
                  <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand mb-2">Lead Instructor</div>
                  <h3 className="font-display text-4xl font-bold tracking-tighter leading-none">PETER OTI</h3>
                </div>
              </div>

              {/* Content Side */}
              <div className="flex-1 p-8 md:p-16 overflow-y-auto scrollbar-hide flex flex-col justify-center">
                <div className="md:hidden mb-8">
                  <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand mb-2">Lead Instructor</div>
                  <h3 className="font-display text-5xl font-bold tracking-tighter leading-none">PETER OTI</h3>
                </div>

                <div className="space-y-12">
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <Zap className="w-5 h-5 text-brand" />
                      <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Expertise</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        'Cloud Architecture (AWS/Azure)',
                        'Infrastructure as Code (Terraform/Ansible)',
                        'Container Orchestration (Kubernetes)',
                        'Security & DevSecOps',
                        'Scalable Backend Systems',
                        'CI/CD Pipeline Optimization'
                      ].map((skill, index) => (
                        <div key={skill} className="flex items-center gap-3 p-4 border border-white/5 bg-white/[0.02]">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                          <span className="text-sm font-medium text-white/70">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <Briefcase className="w-5 h-5 text-brand" />
                      <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Experience</h4>
                    </div>
                    <p className="text-lg text-white/50 leading-relaxed font-light mb-8">
                      With over a decade of hands-on experience in the DevOps landscape, Peter Oti has transformed infrastructure for startups and global enterprises alike. He is dedicated to empowering Nigerian tech talent with the technical rigor and strategic mindset required for modern cloud operations.
                    </p>
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col">
                        <span className="text-4xl font-display font-bold text-white tracking-tighter">10+</span>
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Years Experience</span>
                      </div>
                      <div className="flex flex-col border-l border-white/10 pl-8">
                        <span className="text-4xl font-display font-bold text-white tracking-tighter">50+</span>
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Teams Trained</span>
                      </div>
                    </div>
                  </section>

                  <div className="pt-8 border-t border-white/10">
                    <button 
                      onClick={() => { setIsBioOpen(false); window.location.href = '#register'; }}
                      className="px-8 py-4 bg-brand text-white font-bold uppercase tracking-widest text-sm hover:bg-orange-600 transition-all flex items-center gap-2 group"
                    >
                      Enroll in Peter's Next Cohort <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Module Detail Modal */}
      <AnimatePresence>
        {selectedModule && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedModule(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white text-black p-8 md:p-12 shadow-2xl border-t-4 border-brand"
            >
              <button 
                onClick={() => setSelectedModule(null)}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-black/5 rounded-full hover:bg-brand hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
                  {React.cloneElement(selectedModule.icon as React.ReactElement, { className: "w-8 h-8" })}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1">Module {selectedModule.id}</div>
                  <h3 className="font-display text-4xl font-bold tracking-tighter leading-none">{selectedModule.title}</h3>
                </div>
              </div>
              
              <div className="space-y-8">
                <p className="text-lg text-black/60 leading-relaxed font-light">
                  {selectedModule.desc}
                </p>
                
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-black/30 mb-6 flex items-center gap-2">
                    <div className="w-8 h-px bg-black/10" /> Key Learning Objectives
                  </h4>
                  <div className="space-y-4">
                    {selectedModule.details.map((detail, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-4 group"
                      >
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand group-hover:scale-150 transition-transform" />
                        <span className="text-base font-medium text-black/80">{detail}</span>
                      </motion.div>
                    ))}
                  </div>
                </section>
                
                <div className="pt-8 border-t border-black/5 flex flex-col sm:flex-row gap-4">
                   <button 
                    onClick={() => { setSelectedModule(null); window.location.href = '#register'; }}
                    className="flex-1 py-4 bg-brand text-white font-bold uppercase tracking-widest text-sm hover:bg-orange-600 transition-all flex items-center justify-center gap-3 group"
                  >
                    Enroll in May Cohort <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => setSelectedModule(null)}
                    className="px-8 py-4 bg-black/5 text-black font-bold uppercase tracking-widest text-sm hover:bg-black/10 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      

      {/* Lead Deletion Confirmation Modal */}
      <AnimatePresence>
        {leadToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setLeadToDelete(null); setConfirmEmail(''); setDeleteError(false); }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#121212] border border-white/10 p-10 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="font-display text-3xl font-bold tracking-tighter mb-4">CONFIRM DELETION</h3>
              <p className="text-white/40 text-sm mb-8 leading-relaxed">
                To prevent accidental deletion, please enter the administrator email address to authorize this action.
              </p>
              
              <div className="space-y-4">
                <input 
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => { setConfirmEmail(e.target.value); setDeleteError(false); }}
                  placeholder="admin@example.com"
                  className={cn(
                    "w-full bg-white/5 border p-4 focus:outline-none transition-all placeholder:text-white/10 text-center",
                    deleteError ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-brand"
                  )}
                />
                {deleteError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Unauthorized Email Address</p>}
                
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => { setLeadToDelete(null); setConfirmEmail(''); setDeleteError(false); }}
                    className="flex-1 py-4 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-4 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
