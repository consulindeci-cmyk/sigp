import React from 'react';
import { WidgetState } from '../../types/dashboard';

interface WidgetWrapperProps {
  title: string;
  state?: WidgetState;
  errorMsg?: string;
  children: React.ReactNode;
  height?: string;
  gridColumn?: string;
}

export default function WidgetWrapper({ 
  title, 
  state = 'success', 
  errorMsg, 
  children, 
  height = '100%',
  gridColumn
}: WidgetWrapperProps) {
  return (
    <div className="panel" style={{ height, gridColumn, padding: '16px', background: 'var(--canvas)', borderRadius: '6px', border: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <h4 style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--navy-900)' }}>{title}</h4>
      
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {state === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas)', zIndex: 10 }}>
            <span style={{ fontSize: '12px', color: 'var(--slate)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10"/></svg>
              Chargement...
            </span>
          </div>
        )}
        
        {state === 'empty' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas)', zIndex: 10 }}>
            <span style={{ fontSize: '12px', color: 'var(--slate-light)' }}>Aucune donnée disponible.</span>
          </div>
        )}
        
        {state === 'error' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--red-bg)', borderRadius: '4px', zIndex: 10 }}>
            <span style={{ fontSize: '12px', color: 'var(--red)', textAlign: 'center', padding: '10px' }}>
              ⚠️ {errorMsg || 'Impossible de charger les données.'}
            </span>
          </div>
        )}

        {(state === 'success' || state === 'loading') && children}
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
