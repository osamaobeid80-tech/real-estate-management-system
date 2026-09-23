import React from 'react';
import { unitStatusClass, paymentStatusClass } from '../utils/helpers';

export function UnitStatusBadge({ status }) {
  return <span className={`status-badge dot ${unitStatusClass(status)}`}>{status}</span>;
}

export function PaymentStatusBadge({ status }) {
  return <span className={`status-badge ${paymentStatusClass(status)}`}>{status}</span>;
}
