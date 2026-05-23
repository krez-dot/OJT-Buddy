import { useState, useEffect } from 'react';
import { getCompanies, getDocTypes, getCompanyDocs, addCompanyDoc, updateDoc } from '../api';
import { SkeletonList } from '../components/Skeleton';

const STATUS_OPTIONS = ['pending', 'prepared', 'submitted'];
const STATUS_COLORS  = { pending: '#94a3b8', prepared: '#f59e0b', submitted: '#22c55e' };
const STATUS_ICONS   = { pending: '⏳', prepared: '📋', submitted: '✅' };
const COMPANY_STATUS_COLORS = { wishlist: '#94a3b8', applied: '#3b82f6', interview: '#f59e0b', accepted: '#22c55e', rejected: '#ef4444' };

export default function Documents() {
  const [companies, setCompanies]       = useState([]);
  const [docTypes, setDocTypes]         = useState([]);
  const [selectedCompany, setSelected]  = useState(null);
  const [docs, setDocs]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [docsLoading, setDocsLoading]   = useState(false);
  const [companyDocCounts, setCounts]   = useState({});

  useEffect(() => {
    Promise.all([getCompanies(), getDocTypes()])
      .then(([c, d]) => { setCompanies(c.data); setDocTypes(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const selectCompany = async (company) => {
    setSelected(company);
    setDocsLoading(true);
    const res = await getCompanyDocs(company.id);
    setDocs(res.data);
    setCounts((p) => ({ ...p, [company.id]: res.data }));
    setDocsLoading(false);
  };

  const initDocs = async () => {
    for (const dt of docTypes) {
      const exists = docs.find((d) => d.doc_type_id === dt.id);
      if (!exists) await addCompanyDoc(selectedCompany.id, { doc_type_id: dt.id });
    }
    const res = await getCompanyDocs(selectedCompany.id);
    setDocs(res.data);
    setCounts((p) => ({ ...p, [selectedCompany.id]: res.data }));
  };

  const handleStatusChange = async (doc, status) => {
    const submitted_at = status === 'submitted' ? new Date().toISOString().slice(0, 10) : null;
    await updateDoc(doc.id, { status, submitted_at, notes: doc.notes });
    const updated = docs.map((d) => d.id === doc.id ? { ...d, status, submitted_at } : d);
    setDocs(updated);
    setCounts((p) => ({ ...p, [selectedCompany.id]: updated }));
  };

  const handleNotes = async (doc, notes) => {
    await updateDoc(doc.id, { status: doc.status, submitted_at: doc.submitted_at, notes });
    setDocs(docs.map((d) => d.id === doc.id ? { ...d, notes } : d));
  };

  if (loading) return (
    <div className="page">
      <div className="page-header"><div className="skeleton" style={{height:'24px',width:'130px',borderRadius:'6px'}} /></div>
      <div className="docs-layout"><SkeletonList rows={3} /><SkeletonList rows={5} /></div>
    </div>
  );

  const submitted = docs.filter((d) => d.status === 'submitted').length;
  const prepared  = docs.filter((d) => d.status === 'prepared').length;
  const total     = docs.length;
  const allDone   = total > 0 && submitted === total;
  const pct       = total ? Math.round((submitted / total) * 100) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <p className="page-subtitle">Track required OJT documents per company</p>
        </div>
      </div>

      <div className="docs-layout">
        {/* Company panel */}
        <div className="company-panel">
          <h3>Companies</h3>
          {companies.length === 0 ? (
            <p className="empty-text">Add companies first</p>
          ) : (
            <div className="company-panel-list">
              {companies.map((c) => {
                const cdocs = companyDocCounts[c.id] || [];
                const csub  = cdocs.filter((d) => d.status === 'submitted').length;
                const ctot  = cdocs.length;
                return (
                  <button
                    key={c.id}
                    className={`company-panel-item ${selectedCompany?.id === c.id ? 'active' : ''}`}
                    onClick={() => selectCompany(c)}
                  >
                    <div className="cpanel-top">
                      <span className="cpanel-name">{c.name}</span>
                      <span className="cpanel-badge" style={{ background: COMPANY_STATUS_COLORS[c.status] + '22', color: COMPANY_STATUS_COLORS[c.status] }}>
                        {c.status}
                      </span>
                    </div>
                    {ctot > 0 && (
                      <div className="cpanel-mini-progress">
                        <div className="cpanel-mini-bar">
                          <div className="cpanel-mini-fill" style={{ width: `${(csub / ctot) * 100}%` }} />
                        </div>
                        <span className="cpanel-mini-label">{csub}/{ctot}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Docs panel */}
        <div className="docs-panel">
          {!selectedCompany ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>Select a company</h3>
              <p>Choose a company from the list to manage its documents</p>
            </div>
          ) : docsLoading ? (
            <SkeletonList rows={4} />
          ) : (
            <>
              <div className="docs-panel-header">
                <div>
                  <h2>{selectedCompany.name}</h2>
                  {total > 0 && (
                    <div className="docs-progress-wrap">
                      <div className="docs-progress-bar">
                        <div className="docs-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="docs-progress-text">{submitted}/{total} submitted · {prepared} prepared</span>
                    </div>
                  )}
                </div>
                {docs.length === 0 && (
                  <button className="btn-primary" onClick={initDocs}>Initialize Checklist</button>
                )}
              </div>

              {allDone && (
                <div className="docs-all-done">
                  ✅ All documents submitted for {selectedCompany.name}!
                </div>
              )}

              {docs.length === 0 ? (
                <p className="empty-text" style={{ marginTop: 12 }}>Click "Initialize Checklist" to set up all required documents.</p>
              ) : (
                <div className="docs-list">
                  {docs.map((doc) => (
                    <div key={doc.id} className={`doc-item doc-item--${doc.status}`}>
                      <div className="doc-status-indicator" style={{ background: STATUS_COLORS[doc.status] }} />
                      <div className="doc-icon">{STATUS_ICONS[doc.status]}</div>
                      <div className="doc-body">
                        <div className="doc-name">{doc.doc_name}</div>
                        {doc.doc_description && <div className="doc-desc">{doc.doc_description}</div>}
                        {doc.submitted_at && (
                          <div className="doc-submitted-date">
                            Submitted {new Date(doc.submitted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                        <input
                          className="doc-notes-input"
                          placeholder="Add notes..."
                          defaultValue={doc.notes || ''}
                          onBlur={(e) => { if (e.target.value !== (doc.notes || '')) handleNotes(doc, e.target.value); }}
                        />
                      </div>
                      <div className="doc-status-btns">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            className={`status-pill ${doc.status === s ? 'active' : ''}`}
                            style={doc.status === s ? { background: STATUS_COLORS[s], color: '#fff', borderColor: STATUS_COLORS[s] } : {}}
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
