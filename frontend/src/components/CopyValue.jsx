import React, { useState } from 'react';

export default function CopyValue({ value, label }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mb-3">
            <label className="small text-muted text-uppercase fw-bold">{label}</label>
            <div className="d-flex align-items-center justify-content-between">
                <div className="fw-bold fs-6 text-break me-2">{value}</div>
                <button
                    className="btn btn-link text-decoration-none p-0 text-muted"
                    onClick={handleCopy}
                    title="Copy to clipboard"
                    style={{ minWidth: '24px' }}
                >
                    <i className={`bi ${copied ? 'bi-check-lg text-success' : 'bi-copy'}`}></i>
                </button>
            </div>
        </div>
    );
}
