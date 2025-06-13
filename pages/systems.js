import { Container, Row, Col, Card, Form, Button, Modal } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/header';
import LeftNavigation from '../components/leftnavigation';
import DataTable from 'react-data-table-component';
import { FaEdit } from 'react-icons/fa';

export default function Systems() {
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);
  const [formData, setFormData] = useState({
    systemCategory: '',
    systemName: '',
    hostname: '',
    port: '',
    sid: '',
    schema: '',
    username: '',
    password: '',
    url: '',
    connector: '',
  });
  const [systems, setSystems] = useState([]);
  const [editingSystem, setEditingSystem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const connectorOptions = ["Oracle", "SQL", "Postgres", "SAP HANA", "CSV", "SAP ECC", "REST API", "Soap API"];

  const toggleNavigation = () => {
    setIsNavigationVisible(!isNavigationVisible);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.systemCategory || !formData.systemName || !formData.hostname || !formData.port || !formData.sid || !formData.schema || !formData.username || !formData.password || !formData.url || !formData.connector) {
      toast.error('All fields are required.');
      return;
    }

    if (isNaN(parseInt(formData.port, 10))) {
      toast.error('Port must be a valid number.');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems`, {
        method: editingSystem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          port: parseInt(formData.port, 10),
        }),
      });

      if (response.ok) {
        toast.success(`System ${editingSystem ? 'updated' : 'added'} successfully!`);
        setEditingSystem(null);
        setFormData({
          systemCategory: '',
          systemName: '',
          hostname: '',
          port: '',
          sid: '',
          schema: '',
          username: '',
          password: '',
          url: '',
          connector: '',
        });
        fetchSystems();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || `Failed to ${editingSystem ? 'update' : 'add'} system.`);
      }
    } catch (error) {
      toast.error(`Error ${editingSystem ? 'updating' : 'adding'} system: ${error.message}`);
      console.error(`Error ${editingSystem ? 'updating' : 'adding'} system:`, error);
    }
  };

  const fetchSystems = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems`, {
        method: 'GET',
      });
      const data = await response.json();
      setSystems(data);
    } catch (error) {
      toast.error('Failed to fetch systems.');
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  const handleEdit = (system) => {
    setEditingSystem(system);
    setFormData(system);
    setShowModal(true);
  };

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSystem(null);
    setFormData({
      systemCategory: '',
      systemName: '',
      hostname: '',
      port: '',
      sid: '',
      schema: '',
      username: '',
      password: '',
      url: '',
      connector: '',
    });
  };

  const columns = [
    {
      name: 'System Category',
      selector: row => row.systemCategory,
      sortable: true,
    },
    {
      name: 'System Name',
      selector: row => row.systemName,
      sortable: true,
    },
    {
      name: 'Hostname',
      selector: row => row.hostname,
      sortable: true,
    },
    {
      name: 'Port',
      selector: row => row.port,
      sortable: true,
    },
    {
      name: 'SID',
      selector: row => row.sid,
      sortable: true,
    },
    {
      name: 'Schema',
      selector: row => row.schema,
      sortable: true,
    },
    {
      name: 'Username',
      selector: row => row.username,
      sortable: true,
    },
    {
      name: 'URL',
      selector: row => row.url,
      sortable: true,
    },
    {
      name: 'Connector',
      selector: row => row.connector,
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <Button variant="warning" onClick={() => handleEdit(row)}>
          <FaEdit /> Edit
        </Button>
      ),
    },
  ];

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

          <Container className="py-5">
            <Row>
              <Col>
                <Button variant="primary" onClick={handleShowModal} className="mb-3">
                  Add System
                </Button>
                <DataTable
                  columns={columns}
                  data={systems}
                  pagination
                  highlightOnHover
                />
              </Col>
            </Row>
          </Container>

          <Modal show={showModal} onHide={handleCloseModal}>
            <Modal.Header closeButton>
              <Modal.Title>{editingSystem ? 'Edit System' : 'Add System'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formSystemCategory">
                  <Form.Label>System Category</Form.Label>
                  <Form.Control
                    type="text"
                    name="systemCategory"
                    value={formData.systemCategory}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group controlId="formSystemName">
                  <Form.Label>System Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="systemName"
                    value={formData.systemName}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group controlId="formHostname">
                  <Form.Label>Hostname</Form.Label>
                  <Form.Control
                    type="text"
                    name="hostname"
                    value={formData.hostname}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group controlId="formPort">
                  <Form.Label>Port</Form.Label>
                  <Form.Control
                    type="text"
                    name="port"
                    value={formData.port}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group controlId="formSid">
                  <Form.Label>SID</Form.Label>
                  <Form.Control
                    type="text"
                    name="sid"
                    value={formData.sid}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group controlId="formSchema">
                  <Form.Label>Schema</Form.Label>
                  <Form.Control
                    type="text"
                    name="schema"
                    value={formData.schema}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group controlId="formUsername">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group controlId="formPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group controlId="formUrl">
                  <Form.Label>URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group controlId="formConnector">
                  <Form.Label>Connector</Form.Label>
                  <Form.Control
                    as="select"
                    name="connector"
                    value={formData.connector}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Connector</option>
                    {connectorOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-3">
                  {editingSystem ? 'Update' : 'Submit'}
                </Button>
              </Form>
            </Modal.Body>
          </Modal>

          <ToastContainer />
        </Col>
      </Row>
    </Container>
  );
}
