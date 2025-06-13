import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Table, Form, Button } from 'react-bootstrap';
import Header from '../../components/header';
import LeftNavigation from '../../components/leftnavigation';

export default function ObjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [objectDetail, setObjectDetail] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [relations, setRelations] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState({});

  useEffect(() => {
    if (id) {
      fetchObjectDetail(id);
      fetchObjectAttributes(id);
      fetchObjectRelations(id);
    }
  }, [id]);

  const fetchObjectDetail = async (objectId) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/objects/object-detail/${objectId}`);
      setObjectDetail(response.data);
    } catch (err) {
      setError('Failed to fetch object details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchObjectAttributes = async (objectId) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/objects/object-attributes/${objectId}`);
      setAttributes(response.data);
    } catch (err) {
      console.error('Failed to fetch object attributes:', err);
    }
  };

  const fetchObjectRelations = async (objectId) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/objects/object-relations/${objectId}`);
      setRelations(response.data);
    } catch (err) {
      console.error('Failed to fetch object relations:', err);
    }
  };

  const fetchPreviewData = async (objectId) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/objects/preview-data/${objectId}`);
      setPreviewData(response.data.previewData);
    } catch (err) {
      console.error('Failed to fetch preview data:', err);
    }
  };

  useEffect(() => {
    if (objectDetail) {
      fetchPreviewData(id);
    }
  }, [objectDetail]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedDetails({
      objectName: objectDetail.objectName,
      objectCategory: objectDetail.objectCategory,
      connector: objectDetail.connector,
      systemId: objectDetail.systemId,
      dataLayer: objectDetail.dataLayer,
    });
  };

  const handleSaveClick = async () => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/objects/object-detail/${id}`, editedDetails);
      setObjectDetail(editedDetails);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save object details:', err);
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleTransformRedirect = () => {
    router.push('/transformation');
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading object details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center mt-5">
        <p className="text-danger">{error}</p>
      </Container>
    );
  }

  if (!objectDetail) {
    return (
      <Container className="text-center mt-5">
        <p className="text-danger">Object details not found.</p>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Header toggleNavigation={() => {}} />
      <Row>
        <Col md={2} className="bg-light">
          <LeftNavigation />
        </Col>
        <Col md={10}>
          <Row className="mt-4">
            <Col>
              <h1 className="text-center text-primary">Object Details</h1>
              <Card className="shadow-sm">
                <Card.Body>
                  {isEditing ? (
                    <Form>
                      <Form.Group>
                        <Form.Label>Object Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={editedDetails.objectName}
                          onChange={(e) => setEditedDetails({ ...editedDetails, objectName: e.target.value })}
                        />
                      </Form.Group>
                      <Form.Group>
                        <Form.Label>Object Category</Form.Label>
                        <Form.Control
                          type="text"
                          value={editedDetails.objectCategory}
                          onChange={(e) => setEditedDetails({ ...editedDetails, objectCategory: e.target.value })}
                        />
                      </Form.Group>
                      <Form.Group>
                        <Form.Label>Connector</Form.Label>
                        <Form.Control
                          type="text"
                          value={editedDetails.connector}
                          onChange={(e) => setEditedDetails({ ...editedDetails, connector: e.target.value })}
                        />
                      </Form.Group>
                      <Form.Group>
                        <Form.Label>System ID</Form.Label>
                        <Form.Control
                          type="text"
                          value={editedDetails.systemId}
                          onChange={(e) => setEditedDetails({ ...editedDetails, systemId: e.target.value })}
                        />
                      </Form.Group>
                      <Form.Group>
                        <Form.Label>Data Layer</Form.Label>
                        <Form.Select
                            value={editedDetails.dataLayer}
                            onChange={(e) => setEditedDetails({ ...editedDetails, dataLayer: e.target.value })}
                        >
                            <option value="Bronze">Bronze</option>
                            <option value="Silver">Silver</option>
                            <option value="Gold">Gold</option>
                        </Form.Select>
                      </Form.Group>
                      <Button variant="success" onClick={handleSaveClick} className="mt-3">Save</Button>
                      <Button variant="secondary" onClick={handleCancelClick} className="mt-3">Cancel</Button>
                    </Form>
                  ) : (
                    <>
                      <Card.Title>{objectDetail.objectName}</Card.Title>
                      <Card.Text>
                        <strong>Category:</strong> {objectDetail.objectCategory}<br />
                        <strong>Connector:</strong> {objectDetail.connector}<br />
                        <strong>System ID:</strong> {objectDetail.systemId}<br />
                        <strong>Data Layer:</strong> {objectDetail.dataLayer}<br />
                      </Card.Text>
                      <Button variant="primary" onClick={handleEditClick}>Edit</Button>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          {previewData.length > 0 && (
            <Row className="mt-4">
              <Col>
                <h2 className="text-center text-info">File Preview</h2>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      {previewData[0].map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(1, 11).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
          )}
          <Row className="mt-4">
            <Col>
              <h2 className="text-center text-success">Object Attributes</h2>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Attribute Name</th>
                    <th>Attribute Value</th>
                  </tr>
                </thead>
                <tbody>
                  {attributes.map(attr => (
                    <tr key={attr.id}>
                      <td>{attr.attribute_name}</td>
                      <td>{attr.attribute_value}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
          <Row className="mt-4">
            <Col>
              <h2 className="text-center text-warning">Object Relations</h2>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Related Object ID</th>
                    <th>Relation Type</th>
                  </tr>
                </thead>
                <tbody>
                  {relations.map(rel => (
                    <tr key={rel.id}>
                      <td>{rel.related_object_id}</td>
                      <td>{rel.relation_type}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
          <Row className="mt-4">
            <Col className="text-center">
              <Button variant="primary" onClick={handleTransformRedirect}>
                Transform
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}