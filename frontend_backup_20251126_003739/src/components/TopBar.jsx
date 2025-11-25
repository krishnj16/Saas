import React from "react";

export default function TopBar(){
  return (
    <header className="h-14 flex items-center justify-between px-4 shadow-sm bg-white">
      <div className="flex items-center gap-3">
        <button className="p-2 rounded hover:bg-gray-100">☰</button>
        <h1 className="text-lg font-semibold">SaaS Scanner</h1>
      </div>
      <div className="flex items-center gap-4">
        <input placeholder="Search..." className="border rounded p-1 px-2" />
        <div className="px-2">User</div>
      </div>
    </header>
  );
}
