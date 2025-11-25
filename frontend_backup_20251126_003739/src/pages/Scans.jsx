import React from "react";

export default function Scans(){
  const scans = [{id:1,name:"Scan A",status:"running"},{id:2,name:"Scan B",status:"completed"}];
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Scans</h2>
      <div className="card">
        <ul>
          {scans.map(s=>(
            <li key={s.id} className="py-2 border-b">{s.name} — {s.status} <button onClick={()=>console.log('open',s.id)}>Open</button></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
