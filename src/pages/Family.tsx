import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Trash2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Family() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.tier !== 'premium' && user.isAdmin !== 1) {
      navigate('/');
      return;
    }
    fetchMembers();
  }, [user, token, navigate]);

  const fetchMembers = async () => {
    const res = await fetch('/api/family', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setMembers(await res.json());
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/family/link', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setEmail('');
      fetchMembers();
    }
  };

  const handleRemove = async (id: number) => {
    const res = await fetch(`/api/family/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchMembers();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-slate-900">Family Sharing</span>
            </div>
            <div className="flex items-center">
              <button onClick={() => navigate('/')} className="text-sm font-medium text-slate-500 hover:text-slate-900">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-slate-900">Manage Family Members</h3>
            <p className="mt-1 text-sm text-slate-500">
              Premium tier allows you to link up to 3 sub-accounts. They will be able to see your subscriptions.
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleLink} className="flex space-x-4 mb-8">
              <div className="flex-1">
                <input
                  type="email"
                  required
                  placeholder="Enter family member's email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <UserPlus className="-ml-1 mr-2 h-5 w-5" />
                Link Account
              </button>
            </form>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <h4 className="text-sm font-medium text-slate-900 mb-4">Linked Accounts ({members.length}/3)</h4>
            <ul className="divide-y divide-slate-200 border-t border-slate-200">
              {members.length === 0 && (
                <li className="py-4 text-sm text-slate-500 text-center">No family members linked yet.</li>
              )}
              {members.map((member) => (
                <li key={member.id} className="py-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {member.email[0].toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-slate-900">{member.email}</p>
                      <p className="text-xs text-slate-500 capitalize">{member.tier} Tier</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
