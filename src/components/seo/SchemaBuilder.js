import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCode } from 'react-icons/fi';

export default function SchemaBuilder({ schemaType, initialSchema, onChange }) {
  const [schemaData, setSchemaData] = useState({});

  // Parse initial schema if exists
  useEffect(() => {
    if (initialSchema && typeof initialSchema === 'string') {
      try {
        const parsed = JSON.parse(initialSchema);
        setSchemaData(parsed);
      } catch (e) {
        console.error('Failed to parse initial schema JSON', e);
      }
    }
  }, [initialSchema]);

  // Push changes up whenever schemaData changes
  useEffect(() => {
    if (Object.keys(schemaData).length > 0) {
      const jsonString = JSON.stringify(schemaData, null, 2);
      onChange(jsonString);
    }
  }, [schemaData, onChange]);

  const updateField = (key, value) => {
    setSchemaData(prev => ({ ...prev, [key]: value }));
  };

  const handleFaqChange = (index, field, value) => {
    const newFaqs = [...(schemaData.mainEntity || [])];
    if (!newFaqs[index]) {
      newFaqs[index] = { "@type": "Question", name: "", acceptedAnswer: { "@type": "Answer", text: "" } };
    }
    
    if (field === 'question') {
      newFaqs[index].name = value;
    } else {
      newFaqs[index].acceptedAnswer.text = value;
    }
    
    setSchemaData(prev => ({ ...prev, "@context": "https://schema.org", "@type": "FAQPage", mainEntity: newFaqs }));
  };

  const addFaq = () => {
    const newFaqs = [...(schemaData.mainEntity || []), { "@type": "Question", name: "", acceptedAnswer: { "@type": "Answer", text: "" } }];
    setSchemaData(prev => ({ ...prev, "@context": "https://schema.org", "@type": "FAQPage", mainEntity: newFaqs }));
  };

  const removeFaq = (index) => {
    const newFaqs = [...(schemaData.mainEntity || [])];
    newFaqs.splice(index, 1);
    setSchemaData(prev => ({ ...prev, mainEntity: newFaqs }));
  };

  if (!schemaType || schemaType === 'None') {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Please select a Schema Type from the dropdown above to build a schema.</div>;
  }

  const renderFaqBuilder = () => {
    const faqs = schemaData.mainEntity || [];
    return (
      <div>
        <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>FAQ Items</div>
        {faqs.map((faq, index) => (
          <div key={index} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 12, background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>Question {index + 1}</strong>
              <button onClick={() => removeFaq(index)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}><FiTrash2 size={14} /></button>
            </div>
            <input
              placeholder="Question..."
              value={faq.name || ''}
              onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', marginBottom: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)' }}
            />
            <textarea
              placeholder="Answer..."
              value={faq.acceptedAnswer?.text || ''}
              onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', minHeight: 60 }}
            />
          </div>
        ))}
        <button onClick={addFaq} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(1,142,158,0.1)', color: '#018E9E', border: '1px dashed #018E9E', borderRadius: 6, cursor: 'pointer', fontSize: 13, width: '100%', justifyContent: 'center' }}>
          <FiPlus size={14} /> Add FAQ Item
        </button>
      </div>
    );
  };

  const renderArticleBuilder = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Headline" value={schemaData.headline || ''} onChange={e => updateField('headline', e.target.value)} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)' }} />
        <input placeholder="Author Name" value={schemaData.author?.name || ''} onChange={e => updateField('author', { "@type": "Person", name: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)' }} />
        <input type="date" placeholder="Date Published" value={schemaData.datePublished || ''} onChange={e => updateField('datePublished', e.target.value)} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)' }} />
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
      <h4 style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <FiCode color="#018E9E" /> Dynamic {schemaType} Builder
      </h4>
      
      {schemaType === 'FAQPage' ? renderFaqBuilder() : 
       schemaType === 'Article' || schemaType === 'BlogPosting' ? renderArticleBuilder() : 
       <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Visual builder for {schemaType} is coming soon. Please use raw JSON editor for now.</div>}
       
       <div style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Generated JSON-LD:</div>
          <pre style={{ background: '#111', padding: 12, borderRadius: 6, fontSize: 11, color: '#A5B4FC', overflowX: 'auto', margin: 0 }}>
            {JSON.stringify(schemaData, null, 2)}
          </pre>
       </div>
    </div>
  );
}
