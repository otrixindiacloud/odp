import { Container, Form, Button } from 'react-bootstrap';
import { useState } from 'react';
import { useRouter } from 'next/router';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Register() {
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleRegister = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      setMessage('Registration successful! Redirecting to home page...');
      setTimeout(() => {
        router.push('/home');
      }, 2000);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <Container className="py-5">
      <h2 className="text-center mb-4">Register</h2>
      {message && <p className="text-center text-danger">{message}</p>}
      <Form onSubmit={handleRegister}>
        <Form.Group controlId="formBasicEmail" className="mb-3">
          <Form.Label>Email address</Form.Label>
          <Form.Control type="email" name="email" placeholder="Enter email" required />
        </Form.Group>

        <Form.Group controlId="formBasicPassword" className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" name="password" placeholder="Password" required />
        </Form.Group>

        <Button variant="primary" type="submit">
          Register
        </Button>
      </Form>
    </Container>
  );
}
