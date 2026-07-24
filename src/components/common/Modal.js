import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = '400px',
  hideCloseButton = false
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', backdropFilter: 'blur(3px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      <div style={{
        background: 'var(--bg-card, #ffffff)', 
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: '16px', 
        width: '100%', 
        maxWidth, 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}>
        {title && (
          <div style={{
            padding: '18px 24px', 
            borderBottom: '1px solid var(--border, #e5e7eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary, #111827)' }}>
              {title}
            </h3>
            {!hideCloseButton && (
              <button 
                onClick={onClose} 
                style={{
                  background: 'transparent', border: 'none', 
                  color: 'var(--text-muted, #6b7280)', cursor: 'pointer',
                  padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '6px'
                }}
              >
                <FiX size={20} />
              </button>
            )}
          </div>
        )}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
