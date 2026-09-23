import React from 'react';

export default function EmptyState({ icon = 'fa-inbox', text = 'لا توجد بيانات' }) {
  return (
    <div className="empty-state">
      <i className={`fa-solid ${icon}`}></i>
      {text}
    </div>
  );
}
