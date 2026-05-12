'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCoupleCode } from '../../hooks/useCoupleCode';

function randomCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase() +
         Math.random().toString(36).slice(2, 6).toUpperCase();
}

export default function SetupPage() {
  const { saveCoupleCode } = useCoupleCode();
  const router = useRouter();

  const [newCode] = useState(randomCode);
  const [joinCode, setJoinCode] = useState('');

  function enter(code: string) {
    saveCoupleCode(code.trim().toUpperCase());
    router.push('/map');
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center mb-2">
          <div className="text-7xl mb-4">💕</div>
          <h1 className="text-4xl font-extrabold text-brown-dark">Our Food Journal</h1>
          <p className="text-brown-mid mt-2 text-sm">A shared journal for every bite together.</p>
        </div>

        {/* Create new journal */}
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-brown-mid uppercase tracking-wider">Start a new journal</p>
            <p className="text-xs text-brown-light mt-1">Share this code with your partner so they can join.</p>
          </div>
          <div className="bg-cream rounded-xl px-4 py-3 text-center">
            <span className="text-3xl font-extrabold text-primary tracking-widest">{newCode}</span>
          </div>
          <button
            onClick={() => enter(newCode)}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Create with this code →
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-rose-100" />
          <span className="text-xs text-brown-light font-medium">or</span>
          <div className="flex-1 h-px bg-rose-100" />
        </div>

        {/* Join existing journal */}
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-brown-mid uppercase tracking-wider">Join a partner's journal</p>
            <p className="text-xs text-brown-light mt-1">Enter the code your partner already created.</p>
          </div>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter couple code…"
            maxLength={20}
            autoCapitalize="characters"
            autoCorrect="off"
            className="w-full text-xl font-bold text-center text-brown-dark border-2 border-rose-100 rounded-xl bg-transparent py-3 outline-none placeholder:text-brown-light tracking-widest focus:border-primary transition-colors"
          />
          <button
            onClick={() => enter(joinCode)}
            disabled={joinCode.trim().length < 4}
            className="w-full bg-white border-2 border-primary text-primary font-bold py-3.5 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Join journal →
          </button>
        </div>
      </div>
    </div>
  );
}
