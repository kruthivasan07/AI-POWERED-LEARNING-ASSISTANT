import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const nav = useNavigate();
  async function submit(e) {
    e.preventDefault();
    const res = await API.post('/auth/register', form);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    nav('/dashboard');
  }
  return (
    <div className="card">
      <h3>Create an account</h3>
      <form onSubmit={submit}>
        <div><input value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="username" required /></div>
        <div><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email" required /></div>
        <div><input value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="password" type="password" required /></div>
        <button className="button" type="submit">Create account</button>
      </form>
    </div>
  );
}