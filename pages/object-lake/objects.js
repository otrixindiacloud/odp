import { Container, Row, Col, Card, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { FaTable, FaThLarge, FaList, FaDatabase, FaLink, FaLayerGroup, FaFilter, FaUpload, FaSearch, FaSort, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import Header from '../../components/header';
import LeftNavigation from '../../components/leftnavigation';
import DataTable from 'react-data-table-component';

export default function ObjectsPage() {
  const [objects, setObjects] = useState([]);
  const [filter, setFilter] = useState('All');
  const [viewMode, setViewMode] = useState('Table');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/objects/list`);
      if (Array.isArray(response.data)) {
        setObjects(response.data);
      } else {
        console.error('API response is not an array:', response.data);
        setObjects([]); // Set to an empty array if the response is invalid
      }
    } catch (error) {
      console.error('Failed to fetch objects:', error);
      setObjects([]); // Set to an empty array in case of an error
    }
  };

  const renderSearchAndFilters = () => (
    <Row className="mb-4">
      <Col md={6}>
        <InputGroup>
          <InputGroup.Text>
            <FaSearch />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Search objects..."
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </Col>
      <Col md={6} className="text-end">
        <Button variant="outline-dark" onClick={() => setViewMode('Table')} active={viewMode === 'Table'}>
          <FaTable /> Table
        </Button>
        <Button variant="outline-dark" onClick={() => setViewMode('Card')} active={viewMode === 'Card'}>
          <FaThLarge /> Card
        </Button>
        <Button variant="outline-dark" onClick={() => setViewMode('List')} active={viewMode === 'List'}>
          <FaList /> List
        </Button>
      </Col>
    </Row>
  );

  const filteredObjects = objects.filter(obj => {
    const matchesSearch = obj.objectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || obj.dataLayer === filter;
    return matchesSearch && matchesFilter;
  });

  const handleUploadRedirect = () => {
    router.push('/upload-file');
  };

  const renderTableView = () => (
    <DataTable
      title={<><FaDatabase /> Objects</>}
      columns={[
        { name: <><FaSort /> ID</>, selector: row => row.id, sortable: true },
        { name: <><FaSort /> Name</>, selector: row => row.objectName, sortable: true },
        { name: <><FaSort /> Category</>, selector: row => row.objectCategory, sortable: true },
        { name: <><FaSort /> Connector</>, selector: row => row.connector, sortable: true },
        { name: <><FaSort /> System ID</>, selector: row => row.systemId, sortable: true },
        { name: <><FaSort /> Data Layer</>, selector: row => row.dataLayer, sortable: true },
        {
          name: 'Actions',
          cell: row => (
            <Button variant="info" onClick={() => router.push(`/object-detail?id=${row.id}`)}>View</Button>
          ),
        },
      ]}
      data={filteredObjects}
      pagination
      highlightOnHover
      striped
    />
  );

  const renderCardView = () => (
    <Row>
      {filteredObjects.map((object) => (
        <Col md={4} key={object.id} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="text-primary">{object.objectName}</Card.Title>
              <Card.Text>
                <FaDatabase /> <strong>Category:</strong> {object.objectCategory}<br />
                <FaLink /> <strong>Connector:</strong> {object.connector}<br />
                <FaLayerGroup /> <strong>System ID:</strong> {object.systemId}<br />
                <FaLayerGroup /> <strong>Data Layer:</strong> {object.dataLayer}
              </Card.Text>
              <Badge bg="info" className="mt-2">{object.dataLayer}</Badge>
              <Button variant="info" onClick={() => router.push(`/object-detail?id=${object.id}`)} className="mt-3">View</Button>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderListView = () => (
    <ul className="list-group">
      {filteredObjects.map((object) => (
        <li key={object.id} className="list-group-item d-flex justify-content-between align-items-center">
          <span>
            <FaDatabase /> <strong>{object.objectName}</strong> - {object.objectCategory} ({object.dataLayer})
          </span>
          <Badge bg="secondary">{object.dataLayer}</Badge>
          <Button variant="info" onClick={() => router.push(`/object-detail?id=${object.id}`)} className="ms-3">View</Button>
        </li>
      ))}
    </ul>
  );

  return (
    <Container fluid>
      <Header toggleNavigation={() => {}} />
      <Row>
        <Col md={2} className="bg-light">
          <LeftNavigation />
        </Col>
        <Col md={10}>
          <Row className="my-4">
            <Col>
              <h1 className="text-center text-success">Objects</h1>
              <Button variant="primary" onClick={() => setFilter('Bronze')}><FaFilter /> Bronze</Button>
              <Button variant="secondary" onClick={() => setFilter('Silver')}><FaFilter /> Silver</Button>
              <Button variant="warning" onClick={() => setFilter('Gold')}><FaFilter /> Gold</Button>
              <Button variant="info" onClick={() => setFilter('All')}><FaFilter /> All</Button>
              <Button variant="success" onClick={handleUploadRedirect}><FaUpload /> Upload File</Button>
            </Col>
          </Row>
          {renderSearchAndFilters()}
          {viewMode === 'Table' && renderTableView()}
          {viewMode === 'Card' && renderCardView()}
          {viewMode === 'List' && renderListView()}
        </Col>
      </Row>
    </Container>
  );
}
