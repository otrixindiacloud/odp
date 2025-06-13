import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ObjectRelationsTable() {
  const [objectRelations, setObjectRelations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchObjectRelations() {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/objects/object-relations/all`);
        setObjectRelations(res.data || []);
      } catch (err) {
        setObjectRelations([]);
      }
      setLoading(false);
    }
    fetchObjectRelations();
  }, []);

  return (
    <div style={{ maxHeight: 200, overflowY: 'auto', background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 12 }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>Loading...</div>
      ) : (
        <table className="table table-sm table-bordered" style={{ fontSize: 13, marginBottom: 0 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Object ID</th>
              <th>Related Object ID</th>
              <th>Source Attribute ID</th>
              <th>Target Attribute ID</th>
              <th>Relation Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {objectRelations.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.object_id}</td>
                <td>{r.related_object_id}</td>
                <td>{r.source_attribute_id}</td>
                <td>{r.target_attribute_id}</td>
                <td>{r.relation_type}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
