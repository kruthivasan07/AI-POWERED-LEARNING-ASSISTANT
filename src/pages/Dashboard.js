import React, { useEffect, useState } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    API.get('/documents').then(r => setDocs(r.data.docs));
  }, []);
  return (
    <div>
      <h2>Dashboard</h2>
      <div style={{display:'flex', gap:12}}>
        <div className="card">Total Documents<br/><strong>{docs.length}</strong></div>
        <div className="card">Total Flashcards<br/><strong>—</strong></div>
        <div className="card">Total Quizzes<br/><strong>—</strong></div>
      </div>

      <div className="card">
        <h4>Recent Activity</h4>
        {docs.slice(0,5).map(d => (
          <div key={d._id} style={{display:'flex', justifyContent:'space-between', padding:'6px 0'}}>
            <div>{d.title}</div>
            <div><Link to={`/documents/${d._id}`}>View</Link></div>
          </div>
        ))}
      </div>
    </div>
  );
}