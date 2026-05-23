import { useState, useEffect } from 'react';
import { getCompanies, getDocTypes, getCompanyDocs, addCompanyDoc, updateDoc } from '../api';
import { SkeletonList } from '../components/Skeleton';

const STATUS_OPTIONS = ['pending', 'prepared', 'submitted'];
const STATUS_COLORS = { pending: '#94a3b8', prepared: '#f59e0b', submitted: '#22c55e' };
const STATUS_ICONS = { pending: '⏳', prepared: '📋', submitted: '✅' };

export default function Documents() {
  const [companies, setCompanies] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    Promise.all([getCompanies(), getDocTypes()])
      .then(([c, d]) => { setCompanies(c.data); setDocTypes(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const selectCompany = async (company) => {
    setSelectedCompany(company);
    setDocsLoading(true);
    const res = await getCompanyDocs(company.id);
    setDocs(res.data);
    setDocsLoading(false);
  };

  const initDocs = async () => {
    for (const dt of docTypes) {
      const exists = docs.find((d) => d.doc_type_id === dt.id);
      if (!exists) await addCompanyDoc(selectedCompany.id, { doc_type_id: dt.id });
    }
    const res = await getCompanyDocs(selectedCompany.id);
    setDocs(res.data);
  };

  const handleStatusChange = async (doc, status) => {
    const submitted_at = status === 'submitted' ? new Date().toISOString().slice(0, 10) : null;
    await updateDoc(doc.id, { status, submitted_at, notes: doc.notes });
    setDocs(docs.map((d) => d.id === doc.id ? { ...d, status, submitted_at } : d));
  };

  const handleNotes = async (doc, notes) => {
    await updateDoc(doc.id, { status: doc.status, submitted_at: doc.submitted_at, notes });
    setDocs(docs.map((d) => d.id === doc.id ? { ...d, notes } : d));
  };

  if (loading) return (
    <div className="page">
      <div className="page-header"><div className="skeleton" style={{height:'24px',width:'130px',borderRadius:'6px'}} /></div>
      <div className="docs-layout"><SkeletonList rows={2} /><SkeletonList rows={4} /></div>
    </div>
  );

  const submitted = docs.filter((d) => d.status === 'submitted').length;
  const total = docs.length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <p className="page-subtitle">Track required OJT documents per company</p>
        </div>
      </div>

      <div className="docs-layout">
        <div className="company-panel">
          <h3>Select Company</h3>
          {companies.length === 0 ? (
            <p className="empty-text">Add companies first</p>
          ) : (
            <div className="company-panel-list">
              {companies.map((c) => (
                <button
                  key={c.id}
                  className={`company-panel-item ${selectedCompany?.id === c.id ? 'active' : ''}`}
                  onClick={() => selectCompany(c)}
                >
                  <span className="cpanel-name">{c.name}</span>
                  <span className="cpanel-status">{c.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="docs-panel">
          {!selectedCompany ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>Select a company</h3>
              <p>Choose a company from the list to manage its documents</p>
            </div>
          ) : docsLoading ? (
            <div className="page-loading">Loading documents...</div>
          ) : (
            <>
              <div className="docs-panel-header">
                <div>
                  <h2>{selectedCompany.name}</h2>
                  {total > 0 && (
                    <p className="docs-progress">{submitted}/{total} documents submitted</p>
                  )}
                </div>
                {docs.length === 0 && (
                  <button className="btn-primary" onClick={initDocs}>Initialize Checklist</button>
                )}
              </div>

              {docs.length === 0 ? (
                <p className="empty-text">Click "Initialize Checklist" to set up all required documents for this company.</p>
              ) : (
                <div className="docs-list">
                  {docs.map((doc) => (
                    <div key={doc.id} className="doc-item">
                      <div className="doc-icon" style={{ color: STATUS_COLORS[doc.status] }}>
                        {STATUS_ICONS[doc.status]}
                      </div>
                      <div className="doc-body">
                        <div className="doc-name">{doc.doc_name}</div>
                        {doc.doc_description && <div className="doc-desc">{doc.doc_description}</div>}
                        <input
                          className="doc-notes-input"
                          placeholder="Notes (optional)"
                          defaultValue={doc.notes || ''}
                          onBlur={(e) => { if (e.target.value !== (doc.notes || '')) handleNotes(doc, e.target.value); }}
                        />
                      </div>
                      <div className="doc-status-btns">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            className={`status-pill ${doc.status === s ? 'active' : ''}`}
                            style={doc.status === s ? { background: STATUS_COLORS[s], color: '#fff' } : {}}
                            onClick={() => handleStatusChange(doc, s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
