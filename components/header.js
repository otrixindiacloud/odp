import { Navbar, Container, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { FaBars } from 'react-icons/fa';
import Image from 'next/image';
import logo from '../media/logo.png';
import avatar from '../media/avatar.png';

export default function Header({ toggleNavigation }) {
  const router = useRouter();

  const handleLogout = () => {
    // Clear session and redirect to login
    document.cookie = 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  const redirectToUserDetails = () => {
    router.push('/user-details');
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm">
      <Container>
        <Button variant="link" onClick={toggleNavigation} className="me-3">
          <FaBars size={24} />
        </Button>
        <Navbar.Brand href="/">
          <Image src={logo} alt="Application Logo" width={50} height={50} className="me-2" />
          Otrix Data Platform
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse className="justify-content-end">
          <Button variant="link" onClick={redirectToUserDetails} className="me-3">
            <Image src={avatar} alt="User Avatar" width="40" height="40" style={{ borderRadius: '50%' }} />
          </Button>
          <Button variant="outline-danger" onClick={handleLogout}>Logout</Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
