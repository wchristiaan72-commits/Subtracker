import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Camera, ExternalLink, AlertCircle, DollarSign, Activity, Lock, Users, Zap, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CountUp from 'react-countup';
import confetti from 'canvas-confetti';

type Subscription = {
  id: number;
  service_name: string;
  monthly_cost: number;
  renewal_date: string;
  status: 'active' | 'canceled';
  cancel_url: string | null;
  user_email?: string;
};

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [serviceName, setServiceName] = useState('');
  const [monthlyCost, setMonthlyCost] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [cancelUrl, setCancelUrl] = useState('');

  // Feedback Loop State
  const [pendingCancelSub, setPendingCancelSub] = useState<Subscription | null>(null);
  const [successModalData, setSuccessModalData] = useState<{ serviceName: string, savedAmount: number } | null>(null);
  const [prevTotalSaved, setPrevTotalSaved] = useState(0);

  useEffect(() => {
    fetchSubs();

    const handleFocus = () => {
      const pending = localStorage.getItem('pending_cancel');
      if (pending) {
        setPendingCancelSub(JSON.parse(pending));
        localStorage.removeItem('pending_cancel');
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchSubs = async () => {
    const res = await fetch('/api/subscriptions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setSubs(data);
      
      // Initialize prevTotalSaved
      const currentMonth = new Date().getMonth();
      const remainingMonths = 12 - currentMonth;
      const initialSaved = data
        .filter((s: Subscription) => s.status === 'canceled')
        .reduce((acc: number, curr: Subscription) => acc + (curr.monthly_cost * remainingMonths), 0);
      setPrevTotalSaved(initialSaved);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        service_name: serviceName,
        monthly_cost: parseFloat(monthlyCost),
        renewal_date: renewalDate,
        cancel_url: cancelUrl
      })
    });

    const data = await res.json();
    if (res.status === 403 && data.error === 'Tier limit reached') {
      navigate('/pricing');
      return;
    }
    if (!res.ok) {
      setError(data.message || data.error);
      return;
    }

    setSubs([...subs, data]);
    setIsAdding(false);
    resetForm();
  };

  const handleCancel = async (id: number) => {
    const res = await fetch(`/api/subscriptions/${id}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setSubs(subs.map(s => s.id === id ? { ...s, status: 'canceled' } : s));
    }
  };

  const handleExternalCancelClick = (sub: Subscription) => {
    localStorage.setItem('pending_cancel', JSON.stringify(sub));
    window.open(sub.cancel_url!, '_blank');
  };

  const confirmCancellation = async () => {
    if (!pendingCancelSub) return;
    
    // Calculate savings for the remainder of the year
    const currentMonth = new Date().getMonth();
    const remainingMonths = 12 - currentMonth;
    const savedAmount = pendingCancelSub.monthly_cost * remainingMonths;

    // Update current total saved before it changes, so CountUp animates from it
    setPrevTotalSaved(totalSaved);

    // Mark as canceled in DB
    await handleCancel(pendingCancelSub.id);
    
    // Show success modal
    setSuccessModalData({
      serviceName: pendingCancelSub.service_name,
      savedAmount
    });
    setPendingCancelSub(null);
  };

  const handleCelebrate = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4f46e5', '#10b981', '#f59e0b']
    });
    setSuccessModalData(null);
  };

  const resetForm = () => {
    setServiceName('');
    setMonthlyCost('');
    setRenewalDate('');
    setCancelUrl('');
  };

  // Calculate Savings
  const currentMonth = new Date().getMonth();
  const remainingMonths = 12 - currentMonth;
  
  const totalSaved = subs
    .filter(s => s.status === 'canceled')
    .reduce((acc, curr) => acc + (curr.monthly_cost * remainingMonths), 0);

  const activeSubs = subs.filter(s => s.status === 'active');
  const monthlySpend = activeSubs.reduce((acc, curr) => acc + curr.monthly_cost, 0);

  // Tier Progress Logic
  const limit = user?.tier === 'free' ? 3 : user?.tier === 'basic' ? 10 : Infinity;
  const progressPercent = limit === Infinity ? 100 : Math.min((activeSubs.length / limit) * 100, 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-slate-900">SubTracker</span>
              <span className="ml-4 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                {user?.tier} Tier
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500">{user?.email}</span>
              <button onClick={logout} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden md:block">
          <nav className="space-y-8">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="/" className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-2 rounded-md">
                    <Activity className="mr-3 h-5 w-5" />
                    Dashboard
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                Premium Features
                <Zap className="ml-2 h-4 w-4 text-amber-500" />
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  {(user?.tier === 'premium' || user?.isAdmin === 1) ? (
                    <a href="/family" className="flex items-center text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-md">
                      <Users className="mr-3 h-5 w-5 text-slate-400" />
                      Family Sharing
                    </a>
                  ) : (
                    <div onClick={() => navigate('/pricing')} className="cursor-pointer flex items-center justify-between text-sm font-medium text-slate-400 px-3 py-2 rounded-md hover:bg-slate-50">
                      <div className="flex items-center">
                        <Users className="mr-3 h-5 w-5" />
                        Family Sharing
                      </div>
                      <Lock className="h-4 w-4" />
                    </div>
                  )}
                </li>
                <li>
                  {(user?.tier === 'premium' || user?.isAdmin === 1) ? (
                    <a href="/scan" className="flex items-center text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-md">
                      <Camera className="mr-3 h-5 w-5 text-slate-400" />
                      AI Receipt Scan
                    </a>
                  ) : (
                    <div onClick={() => navigate('/pricing')} className="cursor-pointer flex items-center justify-between text-sm font-medium text-slate-400 px-3 py-2 rounded-md hover:bg-slate-50">
                      <div className="flex items-center">
                        <Camera className="mr-3 h-5 w-5" />
                        AI Receipt Scan
                      </div>
                      <Lock className="h-4 w-4" />
                    </div>
                  )}
                </li>
              </ul>
            </div>

            {/* Tier Progress */}
            {limit !== Infinity && (
              <div className="mt-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-medium text-slate-900 mb-2">Tier Usage</h4>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-slate-200">
                    <div style={{ width: `${progressPercent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{activeSubs.length} used</span>
                    <span>{limit} max</span>
                  </div>
                </div>
                {activeSubs.length >= limit && (
                  <button onClick={() => navigate('/pricing')} className="mt-3 w-full text-xs font-medium text-indigo-600 hover:text-indigo-500 text-center">
                    Upgrade to add more
                  </button>
                )}
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 relative">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">Monthly Burn Rate</dt>
                      <dd className="text-2xl font-semibold text-slate-900">${monthlySpend.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">Active Subscriptions</dt>
                      <dd className="text-2xl font-semibold text-slate-900">{activeSubs.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 overflow-hidden shadow rounded-lg border border-emerald-100 relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-100/50 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
              <div className="p-5 relative z-10">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-emerald-800 truncate">Total Savings (This Year)</dt>
                      <dd className="text-2xl font-semibold text-emerald-600 flex items-center">
                        $
                        <CountUp 
                          start={prevTotalSaved} 
                          end={totalSaved} 
                          duration={2.5} 
                          decimals={2}
                          useEasing={true}
                        />
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-slate-900">Your Subscriptions</h3>
              <button
                onClick={() => {
                  if (activeSubs.length >= limit) {
                    navigate('/pricing');
                  } else {
                    setIsAdding(true);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add New
              </button>
            </div>

            {isAdding && (
              <div className="px-4 py-5 sm:p-6 bg-slate-50 border-b border-slate-200">
                <form onSubmit={handleAdd} className="space-y-4 max-w-2xl">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                  
                  {(user?.tier === 'premium' || user?.isAdmin === 1) && (
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => navigate('/scan')}
                        className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                      >
                        <Camera className="-ml-1 mr-2 h-5 w-5 text-slate-400" />
                        AI Receipt Scan
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Service Name</label>
                      <input
                        type="text"
                        required
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Monthly Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={monthlyCost}
                        onChange={(e) => setMonthlyCost(e.target.value)}
                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Renewal Date</label>
                      <input
                        type="date"
                        required
                        value={renewalDate}
                        onChange={(e) => setRenewalDate(e.target.value)}
                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Cancel URL (Optional)</label>
                      <input
                        type="url"
                        value={cancelUrl}
                        onChange={(e) => setCancelUrl(e.target.value)}
                        placeholder="https://..."
                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => { setIsAdding(false); resetForm(); setError(''); }}
                      className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Save Subscription
                    </button>
                  </div>
                </form>
              </div>
            )}

            <ul className="divide-y divide-slate-200">
              {subs.length === 0 && !isAdding && (
                <li className="px-4 py-8 text-center text-slate-500">
                  No subscriptions found. Add one to get started!
                </li>
              )}
              {subs.map((sub) => (
                <li key={sub.id} className={`px-4 py-4 sm:px-6 ${sub.status === 'canceled' ? 'bg-slate-50 opacity-75' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-indigo-600 truncate">{sub.service_name}</p>
                      <p className="text-sm text-slate-500">
                        ${sub.monthly_cost.toFixed(2)} / month • Renews {new Date(sub.renewal_date).toLocaleDateString()}
                      </p>
                      {sub.user_email && sub.user_email !== user?.email && (
                        <p className="text-xs text-slate-400 mt-1">Shared by: {sub.user_email}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      {sub.status === 'active' ? (
                        <>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                          {(user?.tier === 'pro' || user?.tier === 'premium' || user?.isAdmin === 1) && sub.cancel_url && (
                            <button
                              onClick={() => handleExternalCancelClick(sub)}
                              className="text-slate-400 hover:text-indigo-600"
                              title="Deep-link Cancel"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleCancel(sub.id)}
                            className="text-red-400 hover:text-red-600"
                            title="Mark as Canceled"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                          Canceled
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>

      {/* Confirmation Modal (Did you cancel?) */}
      {pendingCancelSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Did you cancel {pendingCancelSub.service_name}?</h3>
              <p className="text-slate-500 mb-6">
                We noticed you visited the cancellation page. Were you able to successfully cancel your subscription?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setPendingCancelSub(null)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Not yet
                </button>
                <button
                  onClick={confirmCancellation}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Yes, I canceled it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success & Savings Modal */}
      {successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-emerald-500 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <CheckCircle2 className="h-16 w-16 text-white mx-auto mb-3 relative z-10" />
              <h3 className="text-2xl font-bold text-white relative z-10">Success!</h3>
              <p className="text-emerald-100 font-medium relative z-10">You just stopped the bleed.</p>
            </div>
            <div className="p-8 text-center">
              <p className="text-slate-600 text-lg mb-6">
                By canceling <span className="font-bold text-slate-900">{successModalData.serviceName}</span>, you've saved
              </p>
              <div className="text-5xl font-extrabold text-emerald-500 mb-6 tracking-tight">
                ${successModalData.savedAmount.toFixed(2)}
              </div>
              <p className="text-slate-500 text-sm mb-8">for the remainder of this year!</p>
              
              <button
                onClick={handleCelebrate}
                className="w-full py-3 px-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transform transition-all active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <Zap className="h-5 w-5 mr-2 text-amber-400" />
                Celebrate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
