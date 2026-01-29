import React from "react";
import { useParams } from "react-router-dom";

export default function FindingDetail(){
  const { id } = useParams();
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Finding {id}</h2>
      <div className="card">
        <p><strong>Description:</strong> Example vulnerability details.</p>
        <p><strong>Remediation:</strong> Update dependency X.</p>
        <button onClick={()=>console.log('mark resolved')}>Mark as resolved</button>
      </div>
    </div>
  );
}
