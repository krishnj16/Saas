import React from "react";
import { useNavigate } from "react-router-dom";

export default function Auth(){
  const nav = useNavigate();
  function login(e){
    e.preventDefault();
    localStorage.setItem('mock_token','abc123');
    nav('/');
  }
  return (
    <div className="max-w-md mx-auto mt-20 card">
      <h2 className="text-lg font-semibold mb-4">Login</h2>
      <form onSubmit={login}>
        <input className="w-full mb-2 p-2 border" placeholder="email" />
        <input className="w-full mb-2 p-2 border" placeholder="password" />
        <button className="px-4 py-2 border rounded">Login</button>
      </form>
    </div>
  );
}
