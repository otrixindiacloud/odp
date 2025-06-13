import { Container, Row, Col, Card, Breadcrumb } from 'react-bootstrap';
import { useState } from 'react';
import Header from '../components/header';
import LeftNavigation from '../components/leftnavigation';

export default function Reports() {
  const [isNavigationVisible, setNavigationVisible] = useState(true);

  const toggleNavigation = () => {
    setNavigationVisible(!isNavigationVisible);
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
              <Breadcrumb.Item active>Reports</Breadcrumb.Item>
            </Breadcrumb>
            <Row>
              <Col md={4} className="mb-4">
                <Card>
                  <Card.Body>
                    <Card.Title>Report Item 1</Card.Title>
                    <Card.Text>Details about report item 1.</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} className="mb-4">
                <Card>
                  <Card.Body>
                    <Card.Title>Report Item 2</Card.Title>
                    <Card.Text>Details about report item 2.</Card.Text>
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
