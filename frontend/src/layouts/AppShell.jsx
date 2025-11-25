import React from "react";
import TopBar from "../components/TopBar";
import LeftNav from "../components/LeftNav";
import RightDrawer from "../components/RightDrawer";


export default function AppShell({ children }){
  return (
    <div className="app-shell flex">
      <LeftNav />
      <div className="flex-1 min-h-screen">
        <TopBar />
        <main className="p-4">{children}</main>
      </div>
      <RightDrawer />
    </div>
  );
}
