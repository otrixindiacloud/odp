import { Container, Row, Col, Card, Breadcrumb, ListGroup, Tabs, Tab } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Header from '../../components/header';
import LeftNavigation from '../../components/leftnavigation';
import TransformationPreviewData from './transformation-step-preview';

export default function Transformation() {
  const [isNavigationVisible, setNavigationVisible] = useState(true);
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);

  useEffect(() => {
    fetchObjects();
  }, []);

  const [previewPage, setPreviewPage] = useState(1);
  const [previewHasMore, setPreviewHasMore] = useState(false);

  useEffect(() => {
    if (selectedObject) {
      setPreviewPage(1);
    }
  }, [selectedObject]);

  // useEffect(() => {
  //   if (selectedObject) {
  //     const fetchPreviewData = async () => {
  //       try {
  //         const offset = (previewPage - 1) * 50;
  //         const response = await axios.get(
  //           `${process.env.NEXT_PUBLIC_API_URL}/objects/preview-data/${selectedObject.id}`,
  //           { params: { offset, limit: 50 } }
  //         );
  //         setSelectedObject((prev) => ({
  //           ...prev,
  //           previewData: previewPage === 1
  //             ? response.data.previewData
  //             : [...(prev.previewData || []), ...response.data.previewData]
  //         }));
  //         setPreviewHasMore(response.data.previewData.length > 0);
  //       } catch (err) {
  //         console.error('Failed to fetch preview data:', err);
  //       }
  //     };
  //     fetchPreviewData();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedObject?.id, previewPage]);

  const handleLoadMore = () => {
    setPreviewPage((prev) => prev + 1);
  };

  const fetchObjects = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/objects/list`);
      setObjects(response.data);
    } catch (err) {
      console.error('Failed to fetch objects:', err);
    }
  };

  const handleObjectSelection = (object) => {
    setSelectedObject(object);
  };

  const toggleNavigation = () => {
    setNavigationVisible(!isNavigationVisible);
  };

  const handleFirstRowToHeader = async () => {
    if (selectedObject) {
      try {
        // Add transformation step to the backend
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/first-row-to-header/${selectedObject.id}`
        );

        // Fetch updated transformation steps
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/${selectedObject.id}`
        );
        setTransformationSteps(response.data);

        // Update preview data
        const previewResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/objects/preview-data/${selectedObject.id}`,
          { params: { offset: 1, limit: 50 } } // Skip the first row
        );
        setSelectedObject((prev) => ({
          ...prev,
          previewData: previewResponse.data.previewData
        }));
      } catch (err) {
        console.error('Failed to apply transformation step:', err);
      }
    }
  };

  const [transformationSteps, setTransformationSteps] = useState([]); // Initialize state for transformation steps

  const handleRemoveStep = async (stepId) => {
    if (selectedObject) {
      try {
        // Remove transformation step from the backend
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/delete/${stepId}`
        );

        // Fetch updated transformation steps
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/transformations/steps/${selectedObject.id}`
        );
        setTransformationSteps(response.data);

        // Show success message
        toast.success('Transformation step removed successfully!');
      } catch (err) {
        console.error('Failed to remove transformation step:', err);
      }
    }
  };

  return (
    <Container fluid>
      <Row>
        {isNavigationVisible && (
          <Col md={2} className="bg-light vh-100">
            <LeftNavigation />
          </Col>
        )}
        <Col md={isNavigationVisible ? 10 : 12}>
          <Header toggleNavigation={toggleNavigation} />

          <Container>
            <Breadcrumb>
              <Breadcrumb.Item active>Transformation</Breadcrumb.Item>
            </Breadcrumb>

            <Row>
              <Col md={2} className="border-end">
                <h4>Objects</h4>
                <ListGroup>
                  {objects.map((object) => (
                    <ListGroup.Item
                      key={object.id}
                      onClick={() => handleObjectSelection(object)}
                      active={selectedObject?.id === object.id}
                    >
                      {object.objectName}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Col>
              <Col md={10} className="border-end">  
                {selectedObject && (
                  <TransformationPreviewData
                    selectedObject={selectedObject}
                    setSelectedObject={setSelectedObject}
                  />
                )}
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
