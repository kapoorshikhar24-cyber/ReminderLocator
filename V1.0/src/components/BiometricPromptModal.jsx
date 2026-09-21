import React, { useState } from 'react';
import { 
  Fingerprint, 
  ScanFace, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BiometricPromptModal() {
  const { 
    pendingBiometricPrompt, 
    dismissBiometricPrompt, 
    registerBiometricsForUser, 
    biometricType 
  } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!pendingBiometricPrompt) return null;

  const isFaceType = biometricType.toLowerCase().includes('face');
  const IconComponent = isFaceType ? ScanFace : Fingerprint;

  const handleEnable = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      await registerBiometricsForUser(
        pendingBiometricPrompt.userId,
        pendingBiometricPrompt.displayName
      );
      setIsSuccess(true);
      setTimeout(() => {
        dismissBiometricPrompt();
      }, 1400);
    } catch (err) {
      console.warn('Biometric setup error:', err);
      setErrorMsg(err.message || 'Could not complete biometric registration. You can still log in with your password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div 
        className="modal-content biometric-prompt-modal"
        style={{
          maxWidth: '440px',
          width: '92%',
          textAlign: 'center',
          padding: '28px 24px',
          position: 'relative',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
          background: 'var(--bg-modal, #1e293b)',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        }}
      >
        {/* Close Button */}
        <button
          className="btn-icon"
          style={{ position: 'absolute', top: '16px', right: '16px' }}
          onClick={dismissBiometricPrompt}
          disabled={isLoading}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Biometric Animated Icon Badge */}
        <div 
          className="biometric-icon-badge"
          style={{
            width: '84px',
            height: '84px',
            margin: '0 auto 18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isSuccess 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))'
              : 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.25))',
            border: isSuccess 
              ? '2px solid rgba(16, 185, 129, 0.5)' 
              : '2px solid rgba(168, 85, 247, 0.45)',
            boxShadow: isSuccess
              ? '0 0 25px rgba(16, 185, 129, 0.35)'
              : '0 0 30px rgba(168, 85, 247, 0.35)',
            color: isSuccess ? '#10b981' : '#c084fc',
            transition: 'all 0.3s ease'
          }}
        >
          {isSuccess ? (
            <CheckCircle2 size={44} className="scale-up-anim" />
          ) : (
            <IconComponent size={44} className={isLoading ? 'pulse-anim' : ''} />
          )}
        </div>

        {/* Modal Header */}
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
          {isSuccess ? 'Biometrics Enabled!' : `Enable ${biometricType}?`}
        </h3>

        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>
          {isSuccess ? (
            'You can now unlock your GeoRemind notes and reminders with one touch.'
          ) : (
            <>
              Log in instantly without typing your password. Use{' '}
              <strong style={{ color: '#c084fc' }}>{biometricType}</strong> on this device for fast and secure access.
            </>
          )}
        </p>

        {/* Security Assurance Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '12px 14px',
            textAlign: 'left',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            marginBottom: '20px',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}
        >
          <ShieldCheck size={20} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              Zero Biometric Data Stored
            </div>
            <span>
              Your biometric data stays locked in your device operating system. GeoRemind only receives a secure verification token.
            </span>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              textAlign: 'left'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        {!isSuccess && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={handleEnable}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: 700,
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <>
                  <IconComponent size={18} className="spin-slow" />
                  <span>Verify with Device...</span>
                </>
              ) : (
                <>
                  <IconComponent size={18} />
                  <span>Enable {biometricType}</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={dismissBiometricPrompt}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '0.9rem',
                color: 'var(--text-muted)'
              }}
            >
              Maybe Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
