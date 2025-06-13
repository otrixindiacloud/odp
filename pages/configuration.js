import { Container, Row, Col, Card, Breadcrumb, ListGroup } from 'react-bootstrap';
import { useState } from 'react';
import Header from '../components/header';
import LeftNavigation from '../components/leftnavigation';
import Systems from './systems';

export default function Configuration() {
  const [isNavigationVisible, setNavigationVisible] = useState(true);

  const toggleNavigation = () => {
    setNavigationVisible(!isNavigationVisible);
  };

  return (
    <Container fluid>
      <Row>
        {isNavigationVisible && (
          <Col md={2} className="bg-light vh-100 p-0">
            <LeftNavigation />
          </Col>
        )}
        <Col md={isNavigationVisible ? 10 : 12} className="p-4">
          <Header toggleNavigation={toggleNavigation} />

          <Container>
            <Breadcrumb className="mb-4">
              <Breadcrumb.Item active>Configuration</Breadcrumb.Item>
            </Breadcrumb>
            <Row className="g-4 mb-4">
              <Col md={4}>
                <Card className="shadow-sm h-100">
                  <Card.Body className="d-flex align-items-center">
                    <span className="me-3" style={{ fontSize: '2rem', color: '#0d6efd' }}>
                      <i className="bi bi-gear-fill"></i>
                    </span>
                    <div>
                      <Card.Title>Configuration Item 1</Card.Title>
                      <Card.Text className="text-muted">Details about configuration item 1.</Card.Text>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="shadow-sm h-100">
                  <Card.Body className="d-flex align-items-center">
                    <span className="me-3" style={{ fontSize: '2rem', color: '#198754' }}>
                      <i className="bi bi-sliders"></i>
                    </span>
                    <div>
                      <Card.Title>Configuration Item 2</Card.Title>
                      <Card.Text className="text-muted">Details about configuration item 2.</Card.Text>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row className="g-4">
              <Col md={4}>
                <Card className="shadow-sm h-100" as="a" href="/systems" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                  <Card.Body className="d-flex align-items-center">
                    <span className="me-3" style={{ fontSize: '2rem', color: '#6610f2' }}>
                      <i className="bi bi-hdd-network"></i>
                    </span>
                    <div>
                      <Card.Title>Systems</Card.Title>
                      <Card.Text className="text-muted">Manage your systems configuration.</Card.Text>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="shadow-sm h-100" as="a" href="/spaces" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                  <Card.Body className="d-flex align-items-center">
                    <span className="me-3" style={{ fontSize: '2rem', color: '#fd7e14' }}>
                      <i className="bi bi-grid-3x3-gap-fill"></i>
                    </span>
                    <div>
                      <Card.Title>Spaces</Card.Title>
                      <Card.Text className="text-muted">Configure and organize your spaces.</Card.Text>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
