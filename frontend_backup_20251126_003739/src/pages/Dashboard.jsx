import React from "react";

export default function Dashboard(){
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Dashboard (MVP)</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="card">Total Sites<br/><strong>12</strong></div>
        <div className="card">Active Scans<br/><strong>3</strong></div>
        <div className="card">Open Findings<br/><strong>7</strong></div>
      </div>

      <section className="mt-6 card">
        <h3 className="font-semibold">Recent Scans</h3>
        <ul className="mt-2">
          <li>Scan A — 10m ago</li>
          <li>Scan B — 2h ago</li>
          <li>Scan C — yesterday</li>
        </ul>
      </section>
    </div>
  );
}
