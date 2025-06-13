import { Container, Form, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Login() {
  const router = useRouter();

  const handleLogin = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      alert('Login successful! Redirecting to home page...');
      router.push('/home');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <Container className="py-5">
      <h2 className="text-center mb-4">Login</h2>
      <Form onSubmit={handleLogin}>
        <Form.Group controlId="formBasicEmail" className="mb-3">
          <Form.Label>Email address</Form.Label>
          <Form.Control type="email" name="email" placeholder="Enter email" required />
        </Form.Group>

        <Form.Group controlId="formBasicPassword" className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" name="password" placeholder="Password" required />
        </Form.Group>

        <Button variant="primary" type="submit">
          Login
        </Button>
      </Form>
    </Container>
  );
}
