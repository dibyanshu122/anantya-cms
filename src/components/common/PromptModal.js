import React, { useState, useEffect } from 'react';
import Modal from './Modal';

export default function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Enter Information',
  message = '',
  defaultValue = '',
  placeholder = 'Type here...',
  submitText = 'Save',
  cancelText = 'Cancel',
}) {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(inputValue);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {message && (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #4b5563)' }}>
            {message}
          </p>
        )}
        
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          style={{
            width: '100%', padding: '10px 14px', background: 'var(--bg-base, #ffffff)',
            border: '1px solid var(--border, #d1d5db)', borderRadius: '8px',
            color: 'var(--text-primary, #111827)', fontSize: '14px',
            boxSizing: 'border-box', outline: 'none'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button 
            type="button"
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
            type="submit"
            style={{
              padding: '8px 16px', background: '#018E9E',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}
