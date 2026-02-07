import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const nav = useNavigate();
  async function submit(e) {
    e.preventDefault();
    const res = await API.post('/auth/login', form);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    nav('/dashboard');
  }
  return (
    <div className="card">
      <h3>Sign in</h3>
      <form onSubmit={submit}>
        <div><input value={form.emailOrUsername} onChange={e => setForm({...form, emailOrUsername: e.target.value})} placeholder="email or username" required /></div>
        <div><input value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="password" type="password" required /></div>
        <button className="button" type="submit">Sign in</button>
      </form>
    </div>
  );
}