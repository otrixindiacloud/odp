import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Table, Button } from 'react-bootstrap';
import Header from '../components/Header';
import LeftNavigation from '../components/leftnavigation';

export default function SpacesPage() {
  const [spaces, setSpaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserSpaces();
    fetchUsers();
  }, []);

  const fetchUserSpaces = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/configurations/spaces/list`);
      setSpaces(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user spaces.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/list`);
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users.');
    }
  };

  const updateSpace = async (spaceId, updatedName) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/configurations/spaces/${spaceId}`, {
        name: updatedName,
      });
      fetchUserSpaces(); // Refresh spaces after update
    } catch (err) {
      console.error(err);
      setError('Failed to update space.');
    }
  };

  const addSpace = async ({ name, description, owner }) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/configurations/add-space`, {
        name,
        description,
        owner,
      });
      fetchUserSpaces(); // Refresh spaces after addition
    } catch (err) {
      console.error(err);
      setError('Failed to add space.');
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading spaces...</p>
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
              <h1 className="text-center text-primary">My Spaces</h1>
              <Card className="shadow-sm">
                <Card.Body>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Space Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spaces.map((space, index) => (
                        <tr key={index}>
                          <td>{space.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mt-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Body>
                  <h2>Add New Space</h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const newName = formData.get('name');
                      const description = formData.get('description');
                      const owner = formData.get('owner');
                      if (newName && owner) {
                        addSpace({ name: newName, description, owner });
                      }
                    }}
                  >
                    <div className="mb-3">
                      <label htmlFor="spaceName" className="form-label">
                        Space Name
                      </label>
                      <input
                        type="text"
                        id="spaceName"
                        name="name"
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="spaceDescription" className="form-label">
                        Description
                      </label>
                      <textarea
                        id="spaceDescription"
                        name="description"
                        className="form-control"
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="spaceOwner" className="form-label">
                        Owner
                      </label>
                      <select
                        id="spaceOwner"
                        name="owner"
                        className="form-control"
                        required
                      >
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Add Space
                    </button>
                  </form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}
