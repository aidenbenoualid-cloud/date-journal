'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCoupleCode } from '../../hooks/useCoupleCode';

export default function SetupPage() {
  const [code, setCode] = useState('');
  const { saveCoupleCode } = useCoupleCode();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4) return;
    saveCoupleCode(code);
    router.push('/map');
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">💕</div>
          <h1 className="text-4xl font-extrabold text-brown-dark">Our Food Journal</h1>
          <p className="text-brown-mid mt-3 text-sm leading-relaxed">
            Create a couple code — both of you enter the same one to share your journal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-brown-mid uppercase tracking-wider mb-2">
              Your Couple Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. AIDEN&EMMA"
              maxLength={20}
              autoCapitalize="characters"
              autoCorrect="off"
              className="w-full text-2xl font-bold text-center text-brown-dark border-b-2 border-primary bg-transparent py-2 outline-none placeholder:text-brown-light tracking-widest"
            />
            <p className="text-xs text-brown-light mt-2 text-center">
              Share this exact code with your partner — both of you must enter it.
            </p>
          </div>

          <button
            type="submit"
            disabled={code.trim().length < 4}
            className="w-full bg-primary text-white font-bold text-lg py-4 rounded-xl shadow-md hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Our Journal →
          </button>
        </form>
      </div>
    </div>
  );
}
