import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Breadcrumb, Spinner } from 'react-bootstrap';
import Header from '../../components/header';
import LeftNavigation from '../../components/leftnavigation';
import ReactFlow, {
  MiniMap, Controls, Background, addEdge, useNodesState, useEdgesState, Handle, Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import chroma from 'chroma-js';
import dynamic from 'next/dynamic';

const ObjectRelationsTable = dynamic(() => import('./object-relations'), { ssr: false });

export default function Modeling() {
  const [objects, setObjects] = useState([]);
  const [attributes, setAttributes] = useState({});
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [attrEdgeSelection, setAttrEdgeSelection] = useState([]);
  const [pendingAttrEdges, setPendingAttrEdges] = useState([]);
  const [persistedAttrEdges, setPersistedAttrEdges] = useState([]);
  const [objectRelations, setObjectRelations] = useState([]);

  useEffect(() => {
    async function fetchObjectsAndAttributes() {
      setLoading(true);
      let objs = [];
      let attrMap = {};
      try {
        const objRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/objects/list`);
        objs = objRes.data || [];
        setObjects(objs);
        attrMap = {};
        await Promise.all(
          objs.map(async (obj) => {
            const attrRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/objects/object-attributes/${obj.id}`);
            attrMap[obj.id] = attrRes.data || [];
          })
        );
        setAttributes(attrMap);
      } catch (err) {
        setLoading(false);
        return;
      }
      try {
        const relRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/objects/object-relations/all`);
        const rels = relRes.data || [];
        const validEdges = [];
        let invalidCount = 0;
        rels.forEach(r => {
          if (r.source_attribute_id && r.target_attribute_id) {
            const sourceAttrs = attrMap[r.object_id] || [];
            const targetAttrs = attrMap[r.related_object_id] || [];
            const sourceAttr = sourceAttrs.find(a => a.id === r.source_attribute_id);
            const targetAttr = targetAttrs.find(a => a.id === r.target_attribute_id);
            if (sourceAttr && targetAttr) {
              validEdges.push({
                source: `${r.object_id}:${sourceAttr.id}`,
                target: `${r.related_object_id}:${targetAttr.id}`
              });
            } else {
              invalidCount++;
            }
          }
        });
        setPersistedAttrEdges(validEdges);
      } catch (err) {}
      setLoading(false);
    }
    fetchObjectsAndAttributes();
  }, []);

  useEffect(() => {
    async function fetchObjectRelations() {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/objects/object-relations/all`);
        setObjectRelations(res.data || []);
      } catch (err) {}
    }
    fetchObjectRelations();
  }, []);

  const nodeColors = objects.reduce((acc, obj, idx) => {
    acc[obj.id] = chroma.scale('Set2').mode('lch')(idx / Math.max(objects.length - 1, 1)).hex();
    return acc;
  }, {});

  useEffect(() => {
    if (!objects.length) return;
    setNodes(
      objects.map((obj, idx) => ({
        id: String(obj.id),
        type: 'default',
        position: { x: 100 + idx * 220, y: 100 },
        data: {
          label: (
            <div>
              <div
                style={{ cursor: 'move', fontWeight: 600, marginBottom: 2, userSelect: 'none', color: nodeColors[obj.id] }}
                onMouseDown={e => {
                  e.stopPropagation();
                  const nodeElem = e.currentTarget.closest('.react-flow__node');
                  if (nodeElem) {}
                }}
              >
                {obj.objectName}
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
                {(attributes[obj.id] || []).map(attr => {
                  const attrId = `${obj.id}:${attr.id}`;
                  return (
                    <li
                      key={attrId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: attrEdgeSelection.includes(attrId) ? '#e0e7ff' : undefined,
                        borderRadius: 4,
                        padding: '0 4px',
                        marginBottom: 2,
                        minHeight: 28,
                        position: 'relative',
                        color: nodeColors[obj.id]
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        handleAttributeClick(attrId);
                      }}
                      title={'Drag to connect from this attribute'}
                    >
                      <Handle
                        type="source"
                        position={Position.Left}
                        id={attrId}
                        style={{ left: -18, top: '50%', transform: 'translateY(-50%)', background: nodeColors[obj.id], border: '2px solid #fff', width: 14, height: 14 }}
                        title="Drag from here to connect from this attribute"
                      />
                      {attr.attribute_name}
                      <Handle
                        type="target"
                        position={Position.Right}
                        id={attrId}
                        style={{ right: -18, top: '50%', transform: 'translateY(-50%)', background: nodeColors[obj.id], border: '2px solid #fff', width: 14, height: 14 }}
                        title="Drag to here to connect to this attribute"
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )
        },
        style: { width: 220, minWidth: 180, minHeight: 60, border: `2px solid ${nodeColors[obj.id]}` },
        draggable: true,
        resizable: true
      }))
    );
  }, [objects, attributes, setNodes, attrEdgeSelection]);

  const attrEdges = [
    ...persistedAttrEdges.map((e, i) => {
      const sourceObjId = e.source.split(':')[0];
      const targetObjId = e.target.split(':')[0];
      const color1 = nodeColors[sourceObjId] || '#6366f1';
      const color2 = nodeColors[targetObjId] || '#6366f1';
      const gradientId = `edge-gradient-persisted-${i}`;
      return {
        id: `persisted-attr-${e.source}-${e.target}-${i}`,
        source: e.source,
        target: e.target,
        data: { type: 'attribute', gradientId, color1, color2 },
        style: { stroke: `url(#${gradientId})`, strokeWidth: 2 },
        animated: false,
        markerEnd: 'arrowclosed'
      };
    }),
    ...pendingAttrEdges.map((e, i) => {
      const sourceObjId = e.source.split(':')[0];
      const targetObjId = e.target.split(':')[0];
      const color1 = nodeColors[sourceObjId] || '#6366f1';
      const color2 = nodeColors[targetObjId] || '#6366f1';
      const gradientId = `edge-gradient-${i}`;
      return {
        id: `attr-${e.source}-${e.target}-${i}`,
        source: e.source,
        target: e.target,
        data: { type: 'attribute', gradientId, color1, color2 },
        style: { stroke: `url(#${gradientId})`, strokeWidth: 2 },
        animated: true,
        markerEnd: 'arrowclosed'
      };
    })
  ];
  const allEdges = [
    ...edges.filter(e => !(e.data && e.data.type === 'attribute')),
    ...attrEdges
  ];

  const handleAttributeClick = (attrId) => {
    if (attrEdgeSelection.includes(attrId)) return;
    const newSelection = [...attrEdgeSelection, attrId];
    setAttrEdgeSelection(newSelection);
    if (newSelection.length === 2) {
      const [source, target] = newSelection;
      if (source !== target && !pendingAttrEdges.some(e => e.source === source && e.target === target) && !persistedAttrEdges.some(e => e.source === source && e.target === target)) {
        setPendingAttrEdges(edges => [
          ...edges,
          { source, target }
        ]);
      }
      setTimeout(() => setAttrEdgeSelection([]), 200);
    }
  };

  const onConnect = useCallback(async (params) => {
    const source = params.sourceHandle || params.source;
    const target = params.targetHandle || params.target;
    if (!source || !target || !source.includes(':') || !target.includes(':')) {
      return;
    }
    setEdges((eds) => addEdge({ ...params, source, target, label: '' }, eds));
    const [sourceObjId, sourceAttr] = source.split(':');
    const [targetObjId, targetAttr] = target.split(':');
    const sourceAttrObj = (attributes[sourceObjId] || []).find(a => a.attribute_name === sourceAttr || String(a.id) === sourceAttr);
    const targetAttrObj = (attributes[targetObjId] || []).find(a => a.attribute_name === targetAttr || String(a.id) === targetAttr);
    if (sourceAttrObj && targetAttrObj) {
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/objects/object-relations/add`, {
          object_id: Number(sourceObjId),
          related_object_id: Number(targetObjId),
          source_attribute_id: sourceAttrObj.id,
          target_attribute_id: targetAttrObj.id,
          relation_type: 'attribute-connection',
          status: 'active'
        });
        setPersistedAttrEdges(prev => [...prev, { source, target }]);
        setPendingAttrEdges(edges => edges.filter(e => !(e.source === source && e.target === target)));
      } catch (err) {}
    }
  }, [attributes, setEdges, setPersistedAttrEdges, setPendingAttrEdges]);

  const onEdgeClick = () => {};

  return (
    <Container fluid>
      <Row>
        <Col md={2} className="bg-light vh-100">
          <LeftNavigation />
        </Col>
        <Col md={10} style={{ height: '100vh', overflow: 'hidden' }}>
          <Header />
          <Container fluid>
            <Breadcrumb>
              <Breadcrumb.Item active>Modeling</Breadcrumb.Item>
            </Breadcrumb>
            <div style={{ marginBottom: 24 }}>
              <h5>Object Relations</h5>
              <ObjectRelationsTable />
            </div>
            <div style={{ height: '80vh', background: '#f8fafc', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
              {!loading && (
                <svg style={{ height: 0, width: 0, position: 'absolute' }}>
                  {attrEdges.map(e => (
                    <React.Fragment key={e.data.gradientId}>
                      <linearGradient id={e.data.gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={e.data.color1} />
                        <stop offset="100%" stopColor={e.data.color2} />
                      </linearGradient>
                      <marker id={`arrowclosed-${e.data.gradientId}`} markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                        <path d="M2,2 L10,6 L2,10 L6,6 L2,2" fill={e.data.color2} />
                      </marker>
                    </React.Fragment>
                  ))}
                </svg>
              )}
              {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><Spinner animation="border" /> Loading ER Diagram...</div>
              ) : (
                <ReactFlow
                  nodes={nodes}
                  edges={allEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  fitView
                  style={{ width: '100%', height: '100%' }}
                >
                  <MiniMap />
                  <Controls />
                  <Background gap={16} />
                </ReactFlow>
              )}
            </div>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}

