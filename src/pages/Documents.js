import React, { useState, useEffect } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  useEffect(() => { load(); }, []);
  async function load() {
    const r = await API.get('/documents');
    setDocs(r.data.docs);
  }
  async function upload(e) {
    e.preventDefault();
    if (!file) return alert('Select a file');
    const fd = new FormData();
    fd.append('file', file);
    await API.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' }});
    setFile(null);
    load();
  }
  return (
    <div>
      <h3>Documents</h3>
      <div className="card">
        <form onSubmit={upload}>
          <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} />
          <button className="button" type="submit">Upload</button>
        </form>
      </div>

      {docs.map(d => (
        <div className="card" key={d._id}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <div>
              <div><strong>{d.title}</strong></div>
              <div style={{fontSize:12, color:'#666'}}>{(d.size/1024).toFixed(1)} KB • {new Date(d.createdAt).toLocaleString()}</div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <Link to={`/documents/${d._id}`} className="button">Open</Link>
              <a href={`http://localhost:5173/uploads/${d.filename}`} target="_blank" rel="noreferrer">Download</a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}