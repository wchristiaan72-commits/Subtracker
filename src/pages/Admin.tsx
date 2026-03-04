import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, DollarSign, Activity, Trash2, Edit2, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [familyGroups, setFamilyGroups] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'financial' | 'users' | 'family'>('financial');

  useEffect(() => {
    if (user && user.isAdmin !== 1) {
      navigate('/');
      return;
    }

    fetchData();
  }, [user, token, navigate]);

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    
    const statsRes = await fetch('/api/admin/stats', { headers });
    if (statsRes.ok) setStats(await statsRes.json());

    const usersRes = await fetch('/api/admin/users', { headers });
    if (usersRes.ok) setUsers(await usersRes.json());

    const familyRes = await fetch('/api/admin/family-groups', { headers });
    if (familyRes.ok) setFamilyGroups(await familyRes.json());
  };

  const handleUpdateTier = async (userId: number, newTier: string) => {
    if (!window.confirm(`Are you sure you want to change this user's tier to ${newTier}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/tier`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tier: newTier })
      });
      
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to update tier');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('WARNING: This will permanently delete the user, all their subscriptions, and unlink any family members. This action is irreversible. Are you sure?')) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    }
  };

  if (!stats) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading command center...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <nav className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-indigo-500" />
              <span className="ml-2 text-xl font-bold text-white tracking-tight">Command Center</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveTab('financial')} 
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'financial' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                Financial Overview
              </button>
              <button 
                onClick={() => setActiveTab('users')} 
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                User Management
              </button>
              <button 
                onClick={() => setActiveTab('family')} 
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'family' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                Premium Oversight
              </button>
              <div className="h-6 w-px bg-slate-700 mx-2"></div>
              <button onClick={() => navigate('/')} className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
                Exit to App
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {activeTab === 'financial' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">Financial Overview</h2>
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-slate-800 overflow-hidden shadow-lg rounded-xl border border-slate-700">
                <div className="p-5 flex items-center">
                  <DollarSign className="h-8 w-8 text-emerald-400" />
                  <div className="ml-5">
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Gross Revenue</p>
                    <p className="text-3xl font-bold text-white">${stats.grossRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800 overflow-hidden shadow-lg rounded-xl border border-slate-700">
                <div className="p-5 flex items-center">
                  <Activity className="h-8 w-8 text-indigo-400" />
                  <div className="ml-5">
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Net Profit</p>
                    <p className="text-3xl font-bold text-white">${stats.netProfit.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 overflow-hidden shadow-lg rounded-xl border border-slate-700">
                <div className="p-5 flex items-center">
                  <DollarSign className="h-8 w-8 text-rose-400" />
                  <div className="ml-5">
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Stripe Fees</p>
                    <p className="text-3xl font-bold text-white">${stats.stripeFees.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 mt-1">{stats.transactionCount} transactions</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 overflow-hidden shadow-lg rounded-xl border border-slate-700">
                <div className="p-5 flex items-center">
                  <Users className="h-8 w-8 text-blue-400" />
                  <div className="ml-5">
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Users</p>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 shadow-lg rounded-xl border border-slate-700 overflow-hidden mt-8">
              <div className="px-6 py-5 border-b border-slate-700">
                <h3 className="text-lg font-medium text-white">Tier Breakdown</h3>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Free</p>
                  <p className="text-2xl font-bold text-white">{stats.usersByTier.free || 0}</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Basic ($40)</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.usersByTier.basic || 0}</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Pro ($80)</p>
                  <p className="text-2xl font-bold text-indigo-400">{stats.usersByTier.pro || 0}</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Premium ($130)</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.usersByTier.premium || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
            
            <div className="bg-slate-800 shadow-lg rounded-xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tier</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                              {u.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{u.email}</div>
                              <div className="text-xs text-slate-400">{u.is_admin ? 'Administrator' : 'Standard User'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={u.tier}
                            onChange={(e) => handleUpdateTier(u.id, e.target.value)}
                            className={`text-xs font-semibold rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                              u.tier === 'premium' ? 'bg-purple-500/20 text-purple-300' :
                              u.tier === 'pro' ? 'bg-indigo-500/20 text-indigo-300' :
                              u.tier === 'basic' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-slate-700 text-slate-300'
                            }`}
                          >
                            <option value="free" className="bg-slate-800 text-slate-200">Free</option>
                            <option value="basic" className="bg-slate-800 text-slate-200">Basic</option>
                            <option value="pro" className="bg-slate-800 text-slate-200">Pro</option>
                            <option value="premium" className="bg-slate-800 text-slate-200">Premium</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.is_admin === 1}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-rose-400 hover:bg-rose-400/10 focus:outline-none ${u.is_admin === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'family' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">Premium Family Groups</h2>
            
            {familyGroups.length === 0 ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
                <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Family Groups Found</h3>
                <p className="text-slate-400">There are currently no Premium users with linked child accounts.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {familyGroups.map((group) => (
                  <div key={group.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                    <div className="px-6 py-5 border-b border-slate-700 bg-slate-900/30 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                          <Shield className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-white">{group.email}</h3>
                          <p className="text-sm text-purple-400">Premium Parent</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                        {group.children.length} Linked
                      </span>
                    </div>
                    
                    <div className="p-6">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Linked Child Accounts</h4>
                      
                      {group.children.length > 0 ? (
                        <ul className="space-y-3">
                          {group.children.map((child: any) => (
                            <li key={child.id} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                              <div className="flex items-center">
                                <LinkIcon className="h-4 w-4 text-slate-500 mr-3" />
                                <span className="text-sm font-medium text-slate-300">{child.email}</span>
                              </div>
                              <span className="text-xs text-slate-500">
                                Joined {new Date(child.created_at).toLocaleDateString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No child accounts linked yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
