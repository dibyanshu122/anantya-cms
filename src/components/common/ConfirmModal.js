import React from 'react';
import Modal from './Modal';
import { FiAlertTriangle } from 'react-icons/fi';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {isDanger && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#EF4444', 
              padding: '10px', 
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiAlertTriangle size={24} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #4b5563)', lineHeight: '1.5' }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px', background: 'var(--bg-base, #f3f4f6)',
              border: '1px solid var(--border, #e5e7eb)', borderRadius: '8px',
              color: 'var(--text-primary, #374151)', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: '8px 16px', 
              background: isDanger ? '#EF4444' : '#018E9E',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
