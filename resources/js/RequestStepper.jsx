import React from 'react';
import { Clock, CheckCircle2, PackageCheck, Handshake, XCircle } from 'lucide-react';

const STEPS = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'ready', label: 'Ready for Pickup', icon: PackageCheck },
  { key: 'released', label: 'Released', icon: Handshake },
];

export default function RequestStepper({ currentStatus, declinedReason }) {
  if (currentStatus === 'declined') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
        <XCircle className="w-6 h-6 flex-shrink-0 text-red-600" />
        <div>
          <p className="font-semibold">Request Declined</p>
          <p className="text-sm">{declinedReason || 'No reason provided by custodian.'}</p>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-500 -z-0"
          style={{ width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center bg-white px-2 z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-400 border border-gray-300'
                } ${isCurrent ? 'ring-4 ring-indigo-100 scale-110' : ''}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  isDone ? 'text-indigo-900 font-semibold' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}