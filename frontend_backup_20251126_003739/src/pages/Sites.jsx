import React from "react";

export default function Sites(){
  const sites = Array.from({length:5}).map((_,i)=>({id:i+1,name:`site${i+1}.example`, status: "ok", last: "2025-11-19"}));
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Sites</h2>
      <div className="card">
        <button className="mb-4 px-3 py-1 border rounded" onClick={()=>console.log('Add Site')}>Add Site</button>
        <table className="w-full">
          <thead><tr><th>Name</th><th>Last scanned</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {sites.map(s=>(
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.last}</td>
                <td>{s.status}</td>
                <td><button onClick={()=>console.log('Scan',s.name)}>Scan</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
