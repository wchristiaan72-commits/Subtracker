import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';

export default function Pricing() {
  const navigate = useNavigate();

  const tiers = [
    {
      name: 'Basic',
      price: '$40',
      period: '/year',
      features: ['Up to 10 subscriptions', 'Email renewal alerts', 'Basic dashboard'],
      buttonText: 'Upgrade to Basic',
    },
    {
      name: 'Pro',
      price: '$80',
      period: '/year',
      features: ['Unlimited subscriptions', 'One-Click Cancellations', 'Advanced analytics'],
      buttonText: 'Upgrade to Pro',
      highlighted: true,
    },
    {
      name: 'Premium',
      price: '$130',
      period: '/year',
      features: ['Everything in Pro', 'Family Sharing (3 accounts)', 'AI Receipt Scanning'],
      buttonText: 'Upgrade to Premium',
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <button 
        onClick={() => navigate('/')}
        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-8"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Pricing</h2>
        <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Upgrade to add more subscriptions
        </p>
        <p className="mt-4 text-xl text-slate-500">
          You've reached the limit for your current tier. Choose a plan below to unlock more slots and premium features.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div 
            key={tier.name} 
            className={`rounded-2xl shadow-xl overflow-hidden ${tier.highlighted ? 'border-2 border-indigo-500 relative' : 'border border-slate-200 bg-white'}`}
          >
            {tier.highlighted && (
              <div className="absolute top-0 inset-x-0 h-2 bg-indigo-500" />
            )}
            <div className="p-8">
              <h3 className="text-2xl font-semibold text-slate-900">{tier.name}</h3>
              <p className="mt-4 flex items-baseline text-5xl font-extrabold text-slate-900">
                {tier.price}
                <span className="ml-1 text-xl font-medium text-slate-500">{tier.period}</span>
              </p>
              <ul className="mt-8 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-slate-700">{feature}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <button
                  className={`w-full block text-center rounded-lg px-6 py-4 text-sm font-semibold leading-4 ${
                    tier.highlighted 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  {tier.buttonText}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
