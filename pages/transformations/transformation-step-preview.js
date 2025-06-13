import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import { ReactTabulator } from 'react-tabulator';
import 'react-tabulator/lib/styles.css';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { toast } from 'react-toastify';

export default function TransformationPreviewData({ selectedObject, setSelectedObject, handleFirstRowToHeader }) {
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [transformationSteps, setTransformationSteps] = useState([]);
  const [chatText, setChatText] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const chatInputRef = useRef();
  const stepsListRef = useRef();

  useEffect(() => {
    const init = async () => {
      if (selectedObject && selectedObject.id) {
        // Always fetch steps fresh for the selected object
        const stepsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/${selectedObject.id}`
        );
        let steps = (stepsRes.data || []).slice().sort((a, b) => {
          if (a.id && b.id) return a.id - b.id;
          return 0;
        });
        // If no steps exist, add a default "Show all rows" step
        if (steps.length === 0) {
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/add-step/${selectedObject.id}`,
            {
              step_name: 'Show all rows',
              step_description: 'Show all rows',
            }
          );
          // Refetch steps after adding
          const stepsRes2 = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/${selectedObject.id}`
          );
          steps = (stepsRes2.data || []).slice().sort((a, b) => {
            if (a.id && b.id) return a.id - b.id;
            return 0;
          });
        }
        setTransformationSteps(steps);
        // Find the 'Show all rows' step
        const showAllRowsStep = (steps || []).find(s => s.step_name === 'Show all rows' || s.step_description === 'Show all rows');
        if (showAllRowsStep && showAllRowsStep.id) {
          await fetchPreviewDataWithStepId(showAllRowsStep.id);
        } else {
          fetchPreviewData();
        }
      } else {
        setColumns([]);
        setData([]);
        setTransformationSteps([]);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObject?.id]);

  const fetchPreviewData = async (stepDescription = "Show all rows") => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/preview/${selectedObject.id}`,
        {
          step_description: stepDescription,
          file_path: selectedObject.file_path || ""
        }
      );
      const fetchedPreviewData = response.data.previewData || response.data.rows || [];
      const headers = response.data.columns || (fetchedPreviewData.length > 0 ? fetchedPreviewData[0] : []);
      const previewRows = response.data.rows
        ? response.data.rows.map((row, idx) => {
            const rowObj = {};
            headers.forEach((col, i) => { rowObj[col] = row[i]; });
            rowObj.id = idx;
            return rowObj;
          })
        : (fetchedPreviewData.length > 1 ? fetchedPreviewData.slice(1).map((row, idx) => {
            const rowObj = {};
            headers.forEach((col, i) => { rowObj[col] = row[i]; });
            rowObj.id = idx;
            return rowObj;
          }) : []);
      setColumns(headers.map(col => ({ title: col, field: col, headerSort: true, resizable: true })));
      setData(previewRows);
      if (response.data.message) {
        // Show the backend response message in a toast
        if (typeof window !== 'undefined') {
          const { toast } = await import('react-toastify');
          toast.info(response.data.message, { autoClose: 5000 });
        }
      }
      // Refresh transformation steps immediately after preview
      fetchTransformationSteps();
    } catch (err) {
      setColumns([]);
      setData([]);
    }
  };

  const fetchTransformationSteps = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/${selectedObject.id}`
      );
      // Sort steps by id (or created/added time if available), ascending so latest is last
      const steps = (response.data || []).slice().sort((a, b) => {
        if (a.id && b.id) return a.id - b.id;
        // fallback: keep original order
        return 0;
      });
      setTransformationSteps(steps);
    } catch (err) {
      setTransformationSteps([]);
    }
  };

  // Add a transformation step, then preview it, then refresh steps and data
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    try {
      // 1. Add the step first and get the new stepId
      const addStepRes = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/add-step/${selectedObject.id}`,
        {
          step_name: 'Custom Step',
          step_description: chatText.trim(),
        }
      );
      const stepId = addStepRes.data.stepId;
      // 2. Refresh transformation steps immediately
      await fetchTransformationSteps();
      // 3. Call new preview API with the stepId
      await fetchPreviewDataWithStepId(stepId);
      setChatText('');
      if (chatInputRef.current) chatInputRef.current.focus();
    } catch (err) {
      // Optionally show a toast
    }
  };

  // New: fetch preview data by stepId
  const fetchPreviewDataWithStepId = async (stepId) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/transformations/preview/steps/${stepId}`,
        {
          file_path: "delta-lake/bronze/upload/2025-06-09/customers-10000.csv"
        }
      );
      const fetchedPreviewData = response.data.previewData || response.data.rows || [];
      const headers = response.data.columns || (fetchedPreviewData.length > 0 ? fetchedPreviewData[0] : []);
      const previewRows = response.data.rows
        ? response.data.rows.map((row, idx) => {
            const rowObj = {};
            headers.forEach((col, i) => { rowObj[col] = row[i]; });
            rowObj.id = idx;
            return rowObj;
          })
        : (fetchedPreviewData.length > 1 ? fetchedPreviewData.slice(1).map((row, idx) => {
            const rowObj = {};
            headers.forEach((col, i) => { rowObj[col] = row[i]; });
            rowObj.id = idx;
            return rowObj;
          }) : []);
      setColumns(headers.map(col => ({ title: col, field: col, headerSort: true, resizable: true })));
      setData(previewRows);
      if (response.data.message) {
        if (typeof window !== 'undefined') {
          const { toast } = await import('react-toastify');
          toast.info(response.data.message, { autoClose: 5000 });
        }
      }
      fetchTransformationSteps();
    } catch (err) {
      setColumns([]);
      setData([]);
    }
  };

  const handleRemoveStep = async (stepId) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/delete/${stepId}`);
      fetchTransformationSteps();
    } catch (err) {
      // Optionally show a toast
    }
  };

  // Handler for clicking a step card to preview that step
  const handleStepCardClick = async (stepId) => {
    await fetchPreviewDataWithStepId(stepId);
  };

  const handlePublishToSilver = async () => {
    if (!selectedObject || !selectedObject.id) return;
    setIsPublishing(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/transformations/publish-to-silver/${selectedObject.id}`
      );
      if (res.data && (res.data.success || res.data.status === 'success')) {
        toast.success(res.data.message || 'Published to Silver Layer!', { autoClose: 5000 });
      } else {
        toast.error(res.data.message || 'Failed to publish to Silver Layer', { autoClose: 5000 });
      }
    } catch (err) {
      toast.error('Failed to publish to Silver Layer', { autoClose: 5000 });
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    if (stepsListRef.current) {
      stepsListRef.current.scrollTop = stepsListRef.current.scrollHeight;
    }
  }, [transformationSteps]);

  if (!selectedObject) {
    return <p>Select an object to see its preview and apply transformations.</p>;
  }

  return (
    <div style={{ height: '85vh', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Center Pane: Data Preview */}
      <div style={{ height: '60%', minHeight: 0, display: 'flex', flexDirection: 'column', background: '#fff', width: '100%', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', width: '100%', minWidth: 0, padding: '0 16px 16px 16px' }}>
          <ReactTabulator
            columns={columns}
            data={data}
            layout="fitDataFill"
            options={{ movableColumns: true, resizableColumns: true }}
            height="100%"
            style={{ width: '100%' }}
          />
        </div>
      </div>
      {/* Right Pane: Steps & Chat (now below the table) */}
      <div style={{ height: '40%', minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 320, background: '#f8f9fa', borderTop: '1px solid #e0e0e0', width: '100%', overflow: 'hidden' }}>
        {/* Fixed header for steps */}
        <div style={{ position: 'sticky', top: 0, background: '#fafbfc', zIndex: 2, padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{padding:10}}>Steps</strong>
          <button
            onClick={handlePublishToSilver}
            disabled={isPublishing}
            className="btn btn-primary"
            style={{
              marginRight: 12,
              marginLeft: 8,
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: isPublishing ? 0.7 : 1,
              cursor: isPublishing ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
            }}
            title="Publish all steps to Silver Layer as Parquet"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#fff" style={{marginRight: 4}}><path d="M4 4h12v2H4V4zm0 4h12v2H4V8zm0 4h8v2H4v-2z"/></svg>
            {isPublishing ? 'Publishing...' : 'Publish to Silver Layer'}
          </button>
        </div>
        {/* Scrollable steps list */}
        <div ref={stepsListRef} style={{ flex: '1 1 auto', overflowY: 'auto', padding: '16px 8px', maxHeight: 'calc(40vh - 120px)' }}>
          {transformationSteps.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: 16 }}>No steps</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {transformationSteps.map((step, idx) => {
                let borderColor = '#6366f1'; // blue for Open
                let badgeBg = '#6366f1';
                let badgeText = 'Open';
                if (step.status === 'Failed') {
                  borderColor = '#dc2626'; // red
                  badgeBg = '#dc2626';
                  badgeText = 'Failed';
                } else if (step.status === 'Success') {
                  borderColor = '#22c55e'; // green
                  badgeBg = '#22c55e';
                  badgeText = 'Success';
                } else if (step.status === 'Open' || !step.status) {
                  borderColor = '#6366f1'; // blue
                  badgeBg = '#6366f1';
                  badgeText = 'Open';
                }
                return (
                  <div
                    key={step.id || idx}
                    className="transformation-step-card"
                    onClick={() => handleStepCardClick(step.id)}
                    style={{
                      cursor: 'pointer',
                      background: '#fff',
                      border: `1.5px solid #d1d5db`,
                      borderLeft: `5px solid ${borderColor}`,
                      borderRadius: 8,
                      padding: '10px 14px',
                      boxShadow: '0 2px 8px rgba(60,60,60,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      fontSize: 14,
                      minHeight: 38,
                      width: '100%',
                      wordBreak: 'break-word',
                      gap: 8,
                      marginRight: 0,
                      transition: 'box-shadow 0.15s, border-color 0.15s',
                      position: 'relative',
                    }}
                  >
                    {/* First row: Description & Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '80%', minWidth: 0 }}>
                        <span style={{ color: borderColor, fontSize: 18, marginTop: 2, flexShrink: 0 }}>
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V6h2v4z"/></svg>
                        </span>
                        <span style={{ fontWeight: 500, wordBreak: 'break-word', minWidth: 0 }}>{step.step_description}</span>
                      </div>
                      <span style={{
                        background: badgeBg,
                        color: '#fff',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '2px 10px',
                        minWidth: 54,
                        textAlign: 'center',
                        letterSpacing: 0.2,
                        boxShadow: '0 1px 4px rgba(30,30,30,0.08)',
                        alignSelf: 'flex-start',
                        marginLeft: 8,
                        marginRight: 0,
                        flexShrink: 0,
                        alignSelf:'flex-end'
                      }}>{badgeText}</span>
                    </div>
                    {/* Second row: Command & Remove */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 2 }}>
                      {/* Command takes 90%, remove icon right */}
                      <div style={{ width: '90%', color: '#6b7280', display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
                        {step.step_command && (
                          <pre style={{
                            background: '#f3f4f6',
                            color: '#222',
                            fontSize: 12,
                            borderRadius: 4,
                            padding: '6px 10px',
                            margin: 0,
                            width: '100%',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontFamily: 'monospace',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 2px rgba(30,30,30,0.04)',
                            minWidth: 0
                          }}>{step.step_command}</pre>
                        )}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger ms-2"
                        style={{
                          marginLeft: 8,
                          marginTop: 0,
                          padding: '2px 8px',
                          fontSize: 18,
                          lineHeight: 1,
                          alignSelf: 'flex-start',
                          background: '#fef2f2',
                          borderColor: '#fca5a5',
                          color: '#dc2626',
                          borderRadius: 6,
                          transition: 'background 0.15s, border-color 0.15s',
                          flexShrink: 0,
                          marginRight: 0
                        }}
                        onClick={e => { e.stopPropagation(); handleRemoveStep(step.id); }}
                        title="Remove step"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M6 6l8 8M6 14L14 6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Sticky Chat Box */}
        <form onSubmit={handleChatSubmit} style={{
          position: 'sticky',
          bottom: 0,
          background: '#1e1e1e', // VS Code dark background
          borderTop: '1px solid #333',
          padding: 12,
          zIndex: 10,
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 -2px 8px rgba(30,30,30,0.08)',
        }}>
          <div style={{ color: '#b3b3b3', fontWeight: 500, fontSize: 13, marginBottom: 6, letterSpacing: 0.1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="#4fd1c5" style={{marginRight: 4}}><circle cx="10" cy="10" r="10" fill="#222"/><path d="M10 4a6 6 0 100 12A6 6 0 0010 4zm1 8.5H9v-1h2v1zm0-2.5H9V7h2v3z" fill="#4fd1c5"/></svg>
            Ask a transformation (step description):
          </div>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              ref={chatInputRef}
              type="text"
              className="form-control"
              placeholder="Describe a transformation step..."
              value={chatText}
              onChange={e => setChatText(e.target.value)}
              style={{
                width: '100%',
                minWidth: 0,
                background: '#23272e',
                color: '#e0e0e0',
                border: '1px solid #333',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 15,
                boxShadow: 'none',
                outline: 'none',
                transition: 'border 0.2s',
              }}
            />
            <button
              className="btn btn-primary"
              type="submit"
              style={{
                background: 'linear-gradient(90deg, #4fd1c5 0%, #3182ce 100%)',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                borderRadius: 6,
                padding: '8px 14px',
                fontSize: 15,
                boxShadow: '0 2px 8px rgba(30,30,30,0.10)',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 0,
              }}
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="#fff" style={{marginRight: 0}}><path d="M2 10l15-6-6 15-2-7-7-2z"/></svg>
            </button>
          </div>
        </form>
      </div>
      {/* Responsive styles for transformation-step-card */}
      <style jsx global>{`
        .transformation-step-card {
          transition: box-shadow 0.15s, border-color 0.15s;
          width: 100% !important;
          box-sizing: border-box;
          word-break: break-word;
          white-space: pre-line;
          align-items: flex-start;
          margin-bottom: 2px;
        }
        .transformation-step-card:hover {
          box-shadow: 0 4px 16px rgba(60,60,60,0.10);
          border-color: #6366f1;
        }
        @media (max-width: 600px) {
          .transformation-step-card {
            font-size: 12px !important;
            padding: 4px 4px !important;
            min-height: 28px !important;
          }
        }
      `}</style>
    </div>
  );
}
