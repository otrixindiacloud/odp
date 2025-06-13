import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Helper to detect column types and unique values for filter UI
function detectColumnTypesAndUniques(headers, rows) {
  // Helper to check if a value is a valid date
  function isDate(val) {
    if (typeof val !== 'string') return false;
    // Accepts YYYY-MM-DD, YYYY/MM/DD, or ISO
    return !isNaN(Date.parse(val));
  }
  return headers.map((_, colIdx) => {
    const colVals = rows.map(row => row[colIdx]).filter(v => v !== undefined && v !== null && v !== '');
    let type = 'string';
    let numCount = 0, dateCount = 0;
    for (let v of colVals) {
      if (!isNaN(Number(v)) && v !== '') numCount++;
      else if (isDate(v)) dateCount++;
    }
    if (numCount === colVals.length && colVals.length > 0) type = 'number';
    else if (dateCount === colVals.length && colVals.length > 0) type = 'date';
    // Unique values (up to 100 for performance)
    const uniqueSet = new Set();
    for (let v of colVals) {
      if (uniqueSet.size >= 100) break;
      uniqueSet.add(v);
    }
    return {
      type,
      uniqueVals: Array.from(uniqueSet),
    };
  });
}

// Excel-like filter popover component
function ExcelFilterPopover({
  show, anchorRect, column, colMeta, onClose, onApply, currentFilter
}) {
  const [filterType, setFilterType] = useState(currentFilter?.type || 'equals');
  const [filterValue, setFilterValue] = useState(currentFilter?.value || '');
  const [filterValue2, setFilterValue2] = useState(currentFilter?.value2 || '');
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show, onClose]);

  if (!show || !anchorRect) return null;

  // Filter type options based on column type
  let type = colMeta?.type || 'string';
  let filterTypeOptions = [];
  if (type === 'number' || type === 'date') {
    filterTypeOptions = [
      { value: 'equals', label: 'Equals' },
      { value: 'between', label: 'Between' },
      { value: 'greater', label: 'Greater Than' },
      { value: 'less', label: 'Less Than' },
    ];
  } else {
    filterTypeOptions = [
      { value: 'equals', label: 'Equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'multi', label: 'Multi-Value' },
    ];
  }
  // Unique values for select/multi
  const uniqueVals = colMeta?.uniqueVals || [];

  // Popover position (inline, anchored to icon, inside table container)
  let containerRect = { top: 0, left: 0 };
  if (anchorRect && typeof document !== 'undefined') {
    // Find the closest .tabulator container to anchor the popover correctly
    let tabulatorContainer = null;
    let el = document.elementFromPoint(anchorRect.left + 1, anchorRect.top + 1);
    while (el && el !== document.body) {
      if (el.classList && el.classList.contains('tabulator')) {
        tabulatorContainer = el;
        break;
      }
      el = el.parentElement;
    }
    if (tabulatorContainer) {
      containerRect = tabulatorContainer.getBoundingClientRect();
    }
  }
  const style = {
    position: 'absolute',
    top: anchorRect.top - containerRect.top + anchorRect.height + 2,
    left: anchorRect.left - containerRect.left,
    zIndex: 9999,
    minWidth: 220,
    background: '#fff',
    border: '1px solid #e0e7eb',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    padding: 16,
  };

  return (
    <div ref={popoverRef} style={style}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>{column.title}</div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 13 }}>Filter Type:</label>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ width: '100%', marginTop: 4, marginBottom: 8 }}
        >
          {filterTypeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {/* Filter value input */}
      {filterType === 'between' ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type={type === 'date' ? 'date' : 'number'}
            value={filterValue}
            onChange={e => setFilterValue(e.target.value)}
            style={{ flex: 1 }}
            placeholder="From"
          />
          <input
            type={type === 'date' ? 'date' : 'number'}
            value={filterValue2}
            onChange={e => setFilterValue2(e.target.value)}
            style={{ flex: 1 }}
            placeholder="To"
          />
        </div>
      ) : filterType === 'multi' ? (
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13 }}>Values (comma separated):</label>
          <input
            type="text"
            value={filterValue}
            onChange={e => setFilterValue(e.target.value)}
            style={{ width: '100%' }}
            placeholder="A,B,C"
          />
        </div>
      ) : uniqueVals.length > 0 && uniqueVals.length <= 20 ? (
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13 }}>Value:</label>
          <select
            value={filterValue}
            onChange={e => setFilterValue(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">(Any)</option>
            {uniqueVals.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      ) : (
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13 }}>Value:</label>
          <input
            type={type === 'number' ? 'number' : (type === 'date' ? 'date' : 'text')}
            value={filterValue}
            onChange={e => setFilterValue(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button size="sm" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button size="sm" variant="primary" onClick={() => {
          onApply({ type: filterType, value: filterValue, value2: filterValue2 });
        }}>Apply</Button>
      </div>
    </div>
  );
}

export default function TransformationPreviewData({ selectedObject, setSelectedObject, handleFirstRowToHeader }) {
  const [previewPage, setPreviewPage] = useState(1);
  const [previewHasMore, setPreviewHasMore] = useState(false);
  const [columnDefs, setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);

  // State for transformation steps
  const [transformationSteps, setTransformationSteps] = useState([]);

  // State for applied filters and sorters
  const [appliedFilters, setAppliedFilters] = useState([]);
  const [appliedSorters, setAppliedSorters] = useState([]);

  // State for filter popover
  const [filterPopover, setFilterPopover] = useState({ show: false, column: null, anchorRect: null, colMeta: null });
  const [columnFilterState, setColumnFilterState] = useState({}); // { col_field: {type, value, value2} }
  const popoverRef = useRef();

  useEffect(() => {
    if (selectedObject && selectedObject.id) {
      setPreviewPage(1);
      fetchPreviewData(1, true);
    } else {
      setColumnDefs([]);
      setRowData([]);
    }
  }, [selectedObject?.id]);

  useEffect(() => {
    if (selectedObject && selectedObject.id && previewPage > 1) {
      fetchPreviewData(previewPage, false);
    }
  }, [previewPage]);

  // Helper to refresh transformation steps
  const refreshTransformationSteps = useCallback(async () => {
    if (selectedObject && selectedObject.id) {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/${selectedObject.id}`);
        setTransformationSteps(response.data || []);
      } catch (err) {
        setTransformationSteps([]);
      }
    } else {
      setTransformationSteps([]);
    }
  }, [selectedObject]);

  // Fetch transformation steps for the selected object
  useEffect(() => {
    refreshTransformationSteps();
  }, [selectedObject, refreshTransformationSteps]);

  const fetchPreviewData = async (page, resetData = false) => {
    if (!selectedObject || !selectedObject.id) return;
    try {
      const offset = (page - 1) * 50;
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/objects/preview-data/${selectedObject.id}`,
        { params: { offset, limit: 50 } }
      );
      const fetchedPreviewData = response.data.previewData || [];
      if (resetData || page === 1) {
        if (fetchedPreviewData.length > 0) {
          const headers = fetchedPreviewData[0];
          const previewRows = fetchedPreviewData.slice(1);
          const colMeta = detectColumnTypesAndUniques(headers, previewRows);
          // AG Grid columnDefs
          const newColDefs = headers.map((header, index) => ({
            headerName: String(header),
            field: `col_${index}`,
            filter: true,
            sortable: true,
            resizable: true,
          }));
          setColumnDefs(newColDefs);
          // Row data
          const newRowData = fetchedPreviewData.slice(1).map((row) => {
            const rowObj = {};
            headers.forEach((_, index) => {
              rowObj[`col_${index}`] = row[index] !== undefined ? String(row[index]) : '';
            });
            return rowObj;
          });
          setRowData(newRowData);
        } else {
          setColumnDefs([]);
          setRowData([]);
        }
      } else {
        if (fetchedPreviewData.length > 0 && columnDefs.length > 0) {
          const dataToProcess = selectedObject.promotedHeader || page > 1 ? fetchedPreviewData : fetchedPreviewData.slice(1);
          const additionalRowData = dataToProcess.map((row) => {
            const rowObj = {};
            columnDefs.forEach((colDef, index) => {
              rowObj[colDef.field] = row[index] !== undefined ? String(row[index]) : '';
            });
            return rowObj;
          });
          setRowData(prevRowData => [...prevRowData, ...additionalRowData]);
        }
      }
      setPreviewHasMore(fetchedPreviewData.length > 0 && (fetchedPreviewData.length - (resetData && fetchedPreviewData.length > 0 ? 1: 0)) >= 50);
    } catch (err) {
      console.error('Failed to fetch preview data:', err);
      if (resetData) {
        setColumnDefs([]);
        setRowData([]);
      }
    }
  };

  // Add this function to support Load More Data button
  const handleLoadMore = () => {
    setPreviewPage((prev) => prev + 1);
  };

  // Helper to open filter popover
  const openFilterPopover = (col, colMeta, event) => {
    const rect = event.target.getBoundingClientRect();
    setFilterPopover({ show: true, column: col, anchorRect: rect, colMeta });
  };
  // Helper to close filter popover
  const closeFilterPopover = () => setFilterPopover({ show: false, column: null, anchorRect: null, colMeta: null });

  // Apply filter from popover
  const applyExcelFilter = async ({ type, value, value2 }) => {
    if (!filterPopover.column) return;
    const colField = filterPopover.column.field;
    setColumnFilterState(prev => ({ ...prev, [colField]: { type, value, value2 } }));
    // Log transformation step for this filter
    if (selectedObject && selectedObject.id) {
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/add-step/${selectedObject.id}`,
          {
            transformationStep: {
              step_name: 'Filter Data',
              step_description: `Filter Column: ${colField} (${type}) Value: ${value}${type === 'between' ? ' to ' + value2 : ''}`,
              column: colField,
              value: String(value),
              value2: value2 !== undefined ? String(value2) : undefined,
              filter_type: type
            }
          }
        );
        await refreshTransformationSteps();
      } catch (err) {
        console.error('Failed to log filter step:', err);
      }
    }
    closeFilterPopover();
  };

  if (!selectedObject) {
    return <p>Select an object to see its preview and apply transformations.</p>;
  }

  return (
    <div>
      <ToastContainer />
      <div className="d-flex" style={{ gap: 24 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div className="mb-3">
            <Button onClick={handleFirstRowToHeader} variant="info" className="me-2">
              First Row Promote to Header
            </Button>
          </div>
          <div style={{ height: '500px', width: '100%', overflow: 'auto', position: 'relative' }}>
            {/* Show applied filters and sorters above the table */}
            <div className="mb-2">
              {appliedFilters.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Filters:</strong>
                  {appliedFilters.map((f, idx) => (
                    <span key={idx} style={{ marginLeft: 8, marginRight: 8, background: '#f1f3f6', borderRadius: 4, padding: '2px 8px', fontSize: 13 }}>
                      {f.field} = <b>{f.value}</b>
                    </span>
                  ))}
                </div>
              )}
              {appliedSorters.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Sort:</strong>
                  {appliedSorters.map((s, idx) => (
                    <span key={idx} style={{ marginLeft: 8, marginRight: 8, background: '#f1f3f6', borderRadius: 4, padding: '2px 8px', fontSize: 13 }}>
                      {s.field} <b>{s.dir === 'asc' ? '↑' : '↓'}</b>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Bootstrap Table or other table implementation here */}
            {/* Excel-like filter popover */}
            <ExcelFilterPopover
              show={filterPopover.show}
              anchorRect={filterPopover.anchorRect}
              column={filterPopover.column}
              colMeta={filterPopover.colMeta}
              onClose={closeFilterPopover}
              onApply={applyExcelFilter}
              currentFilter={columnFilterState[filterPopover.column?.field]}
            />
          </div>
          <style jsx global>{`
            .custom-tabulator-table .tabulator {
              border-radius: 8px;
              font-family: var(--font-family, 'Inter', Arial, sans-serif);
              font-size: 1rem;
              background: var(--background, #fff);
              color: var(--text-color, #222);
              box-shadow: 0 2px 8px rgba(0,0,0,0.04);
              border: 1px solid #e0e7eb;
              overflow: auto;
            }
            .custom-tabulator-table .tabulator .tabulator-header {
              background: var(--primary-color, #2563eb) !important;
              color: #fff !important;
              font-weight: 500;
              font-size: 0.875rem;
              padding: 12px 16px;
              border-bottom: 1px solid #e0e7eb;
            }
            .custom-tabulator-table .tabulator .tabulator-header .tabulator-col-content {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .custom-tabulator-table .tabulator .tabulator-header .tabulator-col-content .tab-filter-icon {
              color: #fff !important;
              opacity: 1 !important;
              font-size: 18px;
              display: flex;
              align-items: center;
              transition: color 0.2s, opacity 0.2s;
            }
            .custom-tabulator-table .tabulator .tabulator-header .tabulator-col-content .tab-filter-icon:hover {
              color: #ffd600 !important;
              opacity: 1 !important;
            }
            .custom-tabulator-table .tabulator .tabulator-row {
              transition: background 0.2s;
            }
            .custom-tabulator-table .tabulator .tabulator-row:hover {
              background: #f9fafb;
            }
            .custom-tabulator-table .tabulator .tabulator-cell {
              padding: 10px 16px;
              border-bottom: 1px solid #e0e7eb;
              font-size: 0.875rem;
              color: var(--text-color, #222);
            }
            .custom-tabulator-table .tabulator .tabulator-footer {
              background: var(--primary-color, #2563eb) !important;
              color: #fff !important;
              font-weight: 500;
              font-size: 0.875rem;
              padding: 12px 16px;
              border-top: 1px solid #e0e7eb;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
