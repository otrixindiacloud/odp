import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Navbar, Nav, Button, Row, Col, Card } from 'react-bootstrap';
import { useEffect, useState } from 'react'
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Home() {
  const [apiMessage, setApiMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter();

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://stunning-space-memory-779p66wwgr53w4g-8000.app.github.dev'
    fetch(`${apiUrl}/api/hello`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`HTTP ${res.status}: ${text}`)
        }
        return res.json()
      })
      .then((data) => {
        setApiMessage(data.message)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Fetch error:', err)
        setError('Could not connect to FastAPI backend. ' + err.message + ` (${apiUrl}/api/hello)`)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/validate-session`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          router.push('/home');
        }
      } catch (error) {
        // Do nothing, stay on index page
      }
    };

    validateSession();
  }, []);

  useEffect(() => {
    router.push('/home');
  }, [router]);

  return (
    <Container fluid>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Navbar.Brand href="#">Otrix Data & Analytics</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link href="#features">Features</Nav.Link>
            <Nav.Link href="#about">About</Nav.Link>
            <Nav.Link href="#contact">Contact</Nav.Link>
            <Nav.Link as={Link} href="/login">Login</Nav.Link>
            <Nav.Link as={Link} href="/register">Register</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      <section className="text-center py-5 bg-light">
        <Container>
          <h1 className="display-4">Empower Your Business with Otrix</h1>
          <p className="lead">Transform your data into actionable insights with advanced analytics tools.</p>
          <div>
            <Button variant="primary" className="me-2">Get Started</Button>
            <Button variant="secondary">Learn More</Button>
          </div>
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
    </Container>
  );
}
