import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import LeftNavigation from '../components/leftnavigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function UserDetails() {
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`${apiUrl}/user-details`);
        const data = await response.json();
        setUserDetails(data);
        setFormData({ email: data.email, password: '' });
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, []);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${apiUrl}/update-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUserDetails(updatedUser);
        setIsEditing(false);
      } else {
        console.error('Error updating user details');
      }
    } catch (error) {
      console.error('Error saving user details:', error);
    }
  };

  const toggleNavigation = () => {
    setIsNavigationVisible(!isNavigationVisible);
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

          <Container className="py-5">
            <Row>
              <Col md={{ span: 6, offset: 3 }}>
                <Card>
                  <Card.Body>
                    <Card.Title>User Details</Card.Title>
                    {userDetails && !isEditing ? (
                      <>
                        <Card.Text>Email: {userDetails.email}</Card.Text>
                        <Button variant="primary" onClick={handleEditToggle}>Edit</Button>
                      </>
                    ) : (
                      <Form>
                        <Form.Group controlId="formEmail">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
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
                        <Button variant="success" onClick={handleSave} className="mt-3">Save</Button>
                        <Button variant="secondary" onClick={handleEditToggle} className="mt-3">Cancel</Button>
                      </Form>
                    )}
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
