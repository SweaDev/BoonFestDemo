import React, { useState } from 'react';
import { X, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleAuthPayload } from '../lib/googleAuth';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSuccess: (payload: GoogleAuthPayload) => Promise<boolean>;
  title?: string;
  actionText?: string;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onGoogleSuccess,
  title = 'Continue with Google',
  actionText = 'Sign in with Google',
}) => {
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [preferredUsername, setPreferredUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setErrorMessage('Please enter your Google account email.');
      return;
    }
    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid Google email address (e.g. user@gmail.com).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Derive a pseudo Google ID from email
      const syntheticGoogleId = `goog_${btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
      const derivedName = googleName.trim() || cleanEmail.split('@')[0];

      const success = await onGoogleSuccess({
        email: cleanEmail,
        name: derivedName,
        googleId: syntheticGoogleId,
        desiredUsername: preferredUsername.trim() || undefined,
      });

      if (success) {
        onClose();
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0c0d10]/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-[#22242a] bg-[#131418] shadow-[0_24px_64px_rgba(0,0,0,0.85)] p-5 text-[#f0f2f5] space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#22242a] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ffffff] flex items-center justify-center p-1.5 shadow">
              {/* Google G Logo */}
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#f0f2f5]">{title}</h3>
              <p className="text-[11px] text-[#8a8f98]">Connect with your Google Identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1a1c22] border border-[#22242a] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#8a8f98] leading-relaxed">
          Authenticate directly with your Google account. Your email will be linked to your BoonFest profile for seamless, passwordless login.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
              Google Account Email <span className="text-[#ff3b5c]">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8a8f98] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="name@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] focus:outline-none focus:border-[#4285F4]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
              Display Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Mercer"
              value={googleName}
              onChange={(e) => setGoogleName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] focus:outline-none focus:border-[#4285F4]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
              Desired Username Handle (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave blank to auto-generate from email"
              value={preferredUsername}
              onChange={(e) => setPreferredUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#4285F4]"
            />
            <p className="text-[10px] text-[#8a8f98] mt-1">
              Note: Restricted names like <code className="text-[#ff3b5c]">dev</code>, <code className="text-[#ff3b5c]">admin</code>, <code className="text-[#ff3b5c]">demo</code>, <code className="text-[#ff3b5c]">boonfest</code> are reserved.
            </p>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-[#ff3b5c]/15 border border-[#ff3b5c]/30 text-[#ff3b5c] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-[#1a1c22] border border-[#22242a] text-xs font-semibold text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !googleEmail.trim()}
              className="px-5 py-2 rounded-lg bg-[#4285F4] hover:bg-[#3367D6] text-[#ffffff] text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{actionText}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
