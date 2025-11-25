import React from "react";
import { Link } from "react-router-dom";

export default function Findings(){
  const findings = [{id:1,severity:"high",title:"XSS in header"},{id:2,severity:"medium",title:"Info leak"}];
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Findings</h2>
      <div className="card">
        <table className="w-full">
          <thead><tr><th>Severity</th><th>Title</th><th>Actions</th></tr></thead>
          <tbody>
            {findings.map(f=>(
              <tr key={f.id}><td>{f.severity}</td><td>{f.title}</td><td><Link to={`/findings/${f.id}`}>View</Link></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
