import React from 'react';

export default function Policies(){
  const policies = [
    {id: 1, name: 'CSP Policy', status: 'active'},
    {id: 2, name: 'Password Policy', status: 'draft'}
  ];
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Policies</h2>
      <div className="card">
        <table className="w-full">
          <thead>
            <tr><th>Name</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {policies.map(p=>(
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.status}</td>
                <td><button onClick={()=>console.log('edit',p.id)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
