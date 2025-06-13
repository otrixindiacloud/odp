import { ListGroup } from 'react-bootstrap';

export default function LeftNavigation() {
  return (
    <ListGroup variant="flush">
      <ListGroup.Item action href="/">Home</ListGroup.Item>
      <ListGroup.Item action href="/configuration">Configuration</ListGroup.Item>
      <ListGroup.Item action href="/object-lake/object-lake">Object Lake</ListGroup.Item>
      <ListGroup.Item action href="/transformations/transformation">Transformation</ListGroup.Item>
      <ListGroup.Item action href="/modelings/modeling">Modeling</ListGroup.Item>
      <ListGroup.Item action href="/data-flows/data-flows">Data Flows</ListGroup.Item>
      <ListGroup.Item action href="/reports">Reports</ListGroup.Item>
      <ListGroup.Item action href="/administration">Administration</ListGroup.Item>
    </ListGroup>
  );
}
