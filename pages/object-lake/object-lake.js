import { Container, Row, Col, Breadcrumb, Card, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/router';
import { FaLayerGroup, FaDatabase, FaMedal, FaCog } from 'react-icons/fa';

import Header from '../../components/header';
import LeftNavigation from '../../components/leftnavigation';

export default function ObjectLake() {
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);
  const [objects, setObjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    objectCategory: '',
    objectName: '',
    connector: '',
    systemId: '',
    dataLayer: 'Bronze',
  });
  const router = useRouter();

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const response = await axios.get('/objects');
      if (Array.isArray(response.data)) {
        setObjects(response.data);
      } else {
        console.error('API response is not an array:', response.data);
        setObjects([]); // Set to an empty array if the response is invalid
      }
    } catch (error) {
      toast.error('Failed to fetch objects');
      setObjects([]); // Set to an empty array in case of an error
    }
  };

  const handleSubmit = async () => {
    console.log('Form submitted with data:', formData); // Debug log
    try {
      if (formData.id) {
        await axios.put('/objects', formData);
        toast.success('Object updated successfully');
      } else {
        await axios.post('/objects', formData);
        toast.success('Object added successfully');
      }
      setModalVisible(false);
      fetchObjects();
    } catch (error) {
      console.error('Error saving object:', error); // Debug log
      toast.error('Failed to save object');
    }
  };

  const handleEdit = (object) => {
    setFormData(object);
    setModalVisible(true);
  };

  const handleAdd = () => {
    console.log('Add Object button clicked'); // Debug log
    setFormData({
      objectCategory: '',
      objectName: '',
      connector: '',
      systemId: '',
      dataLayer: 'Bronze',
    });
    setModalVisible(true);
  };

  const toggleNavigation = () => {
    setIsNavigationVisible(!isNavigationVisible);
  };

  const handleRedirect = (layer) => {
    window.location.href = `/object-lake/objects?filter=${layer}`;
  };

  const handleFileUploadRedirect = () => {
    window.location.href = '/upload-file';
  };

  return (
    <>
      <ToastContainer />
      <Container fluid>
        <Header toggleNavigation={toggleNavigation} />
        <Row>
          <Col md={2} className="bg-light">
            <LeftNavigation />
          </Col>
          <Col md={10}>
            <Row className="my-4">
              <Col>
                <h1 className="text-center text-success">Object Lake</h1>
                <Button variant="success" onClick={() => router.push('/upload-file')} style={{ backgroundColor: 'var(--primary-color)', borderColor: 'var(--secondary-color)' }}>Go to Upload File</Button>
              </Col>
            </Row>
            <Breadcrumb>
              <Breadcrumb.Item active>Object Lake</Breadcrumb.Item>
            </Breadcrumb>
            <Row>
              <Col md={4}>
                <Card onClick={() => handleRedirect('Bronze')} style={{ cursor: 'pointer', border: '2px solid #cd7f32', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>
                  <Card.Body>
                    <Card.Title><FaMedal /> Bronze</Card.Title>
                    <Card.Text>Data Layer: Bronze</Card.Text>
                    <Card.Text><FaDatabase /> Number of Objects: {objects.filter(obj => obj.dataLayer === 'Bronze').length}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card onClick={() => handleRedirect('Silver')} style={{ cursor: 'pointer', border: '2px solid #c0c0c0', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>
                  <Card.Body>
                    <Card.Title><FaMedal /> Silver</Card.Title>
                    <Card.Text>Data Layer: Silver</Card.Text>
                    <Card.Text><FaDatabase /> Number of Objects: {objects.filter(obj => obj.dataLayer === 'Silver').length}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card onClick={() => handleRedirect('Gold')} style={{ cursor: 'pointer', border: '2px solid #ffd700', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>
                  <Card.Body>
                    <Card.Title><FaMedal /> Gold</Card.Title>
                    <Card.Text>Data Layer: Gold</Card.Text>
                    <Card.Text><FaDatabase /> Number of Objects: {objects.filter(obj => obj.dataLayer === 'Gold').length}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row className="mt-4">
              <Col md={4}>
                <Card onClick={() => handleRedirect('Configuration')} style={{ cursor: 'pointer', border: '2px solid var(--primary-color)', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>
                  <Card.Body>
                    <Card.Title><FaCog /> Configuration</Card.Title>
                    <Card.Text>Manage system configurations and settings.</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card onClick={() => handleRedirect('Systems')} style={{ cursor: 'pointer', border: '2px solid var(--secondary-color)', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>
                  <Card.Body>
                    <Card.Title><FaDatabase /> Systems</Card.Title>
                    <Card.Text>View and manage system data.</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row className="mt-4">
              <Col>
                <button onClick={handleFileUploadRedirect}>Upload File</button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
}
