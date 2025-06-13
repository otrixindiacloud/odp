import { Container, Button, Table, Navbar, Nav, Row, Col, Card, ListGroup } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Configuration from './configuration';
import ObjectLake from './object-lake/object-lake';
import Transformation from './transformations/transformation';
import DataFlows from './data-flows/data-flows';
import Reports from './reports';
import Administration from './administration';
import Header from '../components/header';
import LeftNavigation from '../components/leftnavigation';
// If your actual file is named 'header.js' (all lowercase), change the import to:
// import Header from '../components/header';
// Do the same for LeftNavigation if needed.

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function UserHome() {
  const [userDetails, setUserDetails] = useState(null);
  const [error, setError] = useState('');
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userResponse = await fetch(`${apiUrl}/user-details`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.detail || 'Failed to fetch user details');
        }

        const userData = await userResponse.json();
        setUserDetails(userData);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchUserDetails();
  }, []);

  const toggleNavigation = () => {
    setIsNavigationVisible(!isNavigationVisible);
  };

  const renderPageContent = () => {
    switch (router.pathname) {
      case '/configuration':
        return <Configuration />;
      case '/object-lake':
        return <ObjectLake />;
      case '/transformation':
        return <Transformation />;
      case '/data-flows':
        return <DataFlows />;
      case '/reports':
        return <Reports />;
      case '/administration':
        return <Administration />;
      default:
        return <h1>Welcome to the Home Page</h1>;
    }
  };

  return (
    <Container fluid>
      <Row>
        <Col md={isNavigationVisible ? 2 : 0} className={isNavigationVisible ? "bg-light vh-100" : "d-none"}>
          <LeftNavigation />
        </Col>
        <Col md={isNavigationVisible ? 10 : 12}>
          <Header toggleNavigation={toggleNavigation} />

          <Container>
            <h1>{router.pathname.replace('/', '').replace('-', ' ').toUpperCase()}</h1>
            <div>{renderPageContent()}</div>
          </Container>

          <section className="text-center py-5 bg-light">
            <Container>
              <h1 className="display-4">Welcome, {userDetails?.email || 'User'}</h1>
              <p className="lead">Manage your account and explore our features.</p>
            </Container>
          </section>

          <section id="features" className="py-5">
            <Container>
              <h2 className="text-center mb-4">Our Features</h2>
              <Row>
                <Col md={3} className="mb-4">
                  <Card className="text-center">
                    <Card.Body>
                      <Card.Title>📊 Interactive Dashboards</Card.Title>
                      <Card.Text>Visualize your data with customizable dashboards.</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-4">
                  <Card className="text-center">
                    <Card.Body>
                      <Card.Title>📈 Predictive Analytics</Card.Title>
                      <Card.Text>Leverage AI to forecast trends and outcomes.</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-4">
                  <Card className="text-center">
                    <Card.Body>
                      <Card.Title>🔍 Data Visualization</Card.Title>
                      <Card.Text>Transform complex data into easy-to-understand visuals.</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-4">
                  <Card className="text-center">
                    <Card.Body>
                      <Card.Title>⚡️ Real-Time Processing</Card.Title>
                      <Card.Text>Analyze data as it streams in for instant insights.</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          </section>

          <section id="about" className="py-5 bg-light">
            <Container>
              <h2 className="text-center mb-4">About Us</h2>
              <p className="text-center">
                At Otrix Data & Analytics, we specialize in transforming raw data into
                meaningful insights that drive business success. Our tools are designed
                to empower organizations with the ability to make data-driven decisions
                effortlessly.
              </p>
            </Container>
          </section>

          <section id="contact" className="py-5">
            <Container>
              <h2 className="text-center mb-4">Contact Us</h2>
              <p className="text-center">Have questions? Reach out to us at <a href="mailto:contact@otrixanalytics.com">contact@otrixanalytics.com</a>.</p>
            </Container>
          </section>

          <footer className="text-center py-3 bg-dark text-light">
            <Container>
              <span>© {new Date().getFullYear()} Otrix Data & Analytics</span>
            </Container>
          </footer>
        </Col>
      </Row>
    </Container>
  );
}
