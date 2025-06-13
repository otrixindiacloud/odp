import { useState } from 'react';
import { Container, Row, Col, Card, Button, Table } from 'react-bootstrap';
import axios from 'axios';
import Dropzone from 'react-dropzone';
import { useRouter } from 'next/router';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/header';
import LeftNavigation from '../components/leftnavigation';

export default function UploadFile() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const router = useRouter();

  const handleFileDrop = (acceptedFiles) => {
    setSelectedFile(acceptedFiles[0]);
    previewFile(acceptedFiles[0]);
  };

  const previewFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const response = await axios.post(`${apiUrl}/objects/preview-file`, formData);
      setPreviewData(response.data.previewData);
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('File preview failed:', error);
      if (error.response) {
        toast.error(`File preview failed: ${error.response.status} ${error.response.data.detail || ''}`);
      } else {
        toast.error('File preview failed');
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const response = await axios.post(`${apiUrl}/objects/upload-file`, formData);
      const objectId = response.data.objectId; // Assuming the backend returns the object ID
      toast.success('File uploaded successfully');
      router.push(`object-detail?id=${objectId}`); // Redirect to object detail page with the object ID
    } catch (error) {
      console.error('File upload failed:', error);
      toast.error('File upload failed');
    }
  };

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
              <Dropzone onDrop={handleFileDrop} multiple={false}>
                {({ getRootProps, getInputProps }) => (
                  <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    <p>Drag and drop a file here, or click to select a file</p>
                  </div>
                )}
              </Dropzone>
              {previewData.length > 0 && (
                <Card className="mt-4">
                  <Card.Body>
                    <Card.Title>File Preview</Card.Title>
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          {previewData[0].map((header, index) => (
                            <th key={index}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(1).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}
              {suggestions.length > 0 && (
                <Card className="mt-4">
                  <Card.Body>
                    <Card.Title>Suggestions</Card.Title>
                    <ul>
                      {suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              )}
              <Button className="mt-4" onClick={handleFileUpload} disabled={!selectedFile}>
                Upload File
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
      <ToastContainer />
    </Container>
  );
}
