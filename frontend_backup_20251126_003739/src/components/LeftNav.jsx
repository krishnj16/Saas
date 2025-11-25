import React from "react";
import { NavLink } from "react-router-dom";

export default function LeftNav(){
  const NavItem = ({to,label}) => (
    <NavLink to={to} className="block px-4 py-3 hover:bg-gray-50 rounded">
      {label}
    </NavLink>
  );

  return (
    <aside className="w-64 p-3 border-r bg-white min-h-screen">
      <div className="mb-4 font-bold">Menu</div>
      <NavItem to="/" label="Dashboard" />
      <NavItem to="/sites" label="Sites" />
      <NavItem to="/scans" label="Scans" />
      <NavItem to="/findings" label="Findings" />
      <NavItem to="/auth" label="Auth" />
    </aside>
  );
}
