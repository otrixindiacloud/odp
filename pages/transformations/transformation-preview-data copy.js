import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function TransformationPreviewData({ selectedObject, setSelectedObject, handleFirstRowToHeader }) {
  const [previewPage, setPreviewPage] = useState(1);
  const [previewHasMore, setPreviewHasMore] = useState(false);
  const gridRef = useRef(null);
  const [columnDefs, setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);

  // State for transformation steps
  const [transformationSteps, setTransformationSteps] = useState([]);

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
          const newColDefs = headers.map((header, index) => ({
            headerName: String(header),
            field: `col_${index}`,
            filter: true,
            sortable: true,
            resizable: true,
          }));
          setColumnDefs(newColDefs);

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

  const handleLoadMore = () => {
    setPreviewPage((prev) => prev + 1);
  };

  const onFilterChanged = useCallback(async () => {
    if (gridRef.current && gridRef.current.api && selectedObject) {
      const filterModel = gridRef.current.api.getFilterModel();
      console.log("AG Grid Filter Model:", filterModel);

      for (const colId in filterModel) {
        const columnFilter = filterModel[colId];
        const columnDef = gridRef.current.api.getColumnDef(colId);
        const columnName = columnDef ? columnDef.headerName : colId;

        let filterDescription = '';
        if (columnFilter.filterType === 'text' || columnFilter.filterType === 'number') {
          filterDescription = `${columnFilter.type} '${columnFilter.filter}'`;
          if (columnFilter.filterTo) {
            filterDescription += ` and '${columnFilter.filterTo}'`;
          }
        } else if (columnFilter.filterType === 'set') {
          filterDescription = `IN (${columnFilter.values.join(', ')})`;
        } else {
          filterDescription = JSON.stringify(columnFilter);
        }
        
        try {
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/filter/${selectedObject.id}`,
            {
              column: columnName,
              value: filterDescription,
            }
          );
          await refreshTransformationSteps(); // Refresh after adding filter step
        } catch (err) {
          console.error(`Failed to add filter step for column ${columnName}:`, err);
        }
      }
    }
  }, [selectedObject, refreshTransformationSteps]);

  // Add this callback for sorting
  const onSortChanged = useCallback(async () => {
    if (gridRef.current && gridRef.current.api && selectedObject) {
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/add-step/${selectedObject.id}`
        );
        toast.success('Sort step added!');
        await refreshTransformationSteps(); // Refresh after adding sort step
      } catch (err) {
        console.error('Failed to add sort step:', err);
        toast.error('Failed to add sort step');
      }
    }
  }, [selectedObject, refreshTransformationSteps]);

  useEffect(() => {
    console.log("Selected Object:", selectedObject);
    console.log("Column Definitions:", columnDefs);
    console.log("Row Data:", rowData);
  }, [selectedObject, columnDefs, rowData]);

  if (!selectedObject) {
    return <p>Select an object to see its preview and apply transformations.</p>;
  }

  // AG Grid default column definition with filter enabled
  const defaultColDef = {
    flex: 1,
    minWidth: 150,
    filter: true, // Enable filtering for all columns
    sortable: true,
    resizable: true,
  };

  return (
    <div>
      <ToastContainer />
      <div className="d-flex" style={{ gap: 24 }}>
        <div style={{ flex: 1 }}>
          <div className="mb-3">
            <Button onClick={handleFirstRowToHeader} variant="info" className="me-2">
              First Row Promote to Header
            </Button>
          </div>
          <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              columnDefs={columnDefs}
              rowData={rowData}
              defaultColDef={defaultColDef}
              onGridReady={(params) => {
                console.log("AG Grid is ready:", params);
                toast.success("AG Grid initialized successfully!");
              }}
              onFilterChanged={onFilterChanged}
              onSortChanged={onSortChanged}
            />
          </div>
          {previewHasMore && (
            <Button onClick={handleLoadMore} variant="outline-primary" className="mt-3">
              Load More Data
            </Button>
          )}
        </div>
        <div style={{ width: 350, minWidth: 250 }}>
          <h5>Transformation Steps</h5>
          {transformationSteps.length === 0 ? (
            <div className="text-muted">No transformation steps yet.</div>
          ) : (
            <ul className="list-group">
              {transformationSteps.map((step) => (
                <li className="list-group-item d-flex justify-content-between align-items-center" key={step.id || step.stepId}>
                  <div>
                    <strong>{step.step_name || step.stepName}</strong>
                    {step.step_description || step.stepDescription ? (
                      <>: {step.step_description || step.stepDescription}</>
                    ) : null}
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await axios.delete(
                          `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/remove-step/${step.id || step.stepId}`
                        );
                        toast.success('Step removed!');
                        await refreshTransformationSteps();
                      } catch (err) {
                        toast.error('Failed to remove step');
                      }
                    }}
                    className="btn btn-link p-0 ms-2"
                    title="Remove step"
                    style={{ color: '#dc3545' }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
