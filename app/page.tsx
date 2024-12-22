"use client";
import dynamic from 'next/dynamic';
import { LaptopButton } from "@/components/LaptopButton"; // Adjusted the import path
import { LaptopDetails } from "@/components/LaptopDetails";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Home } from 'lucide-react';

export default function Page() {
  const laptop = { /* define your laptop object here */ };
  // Dynamically import the component to ensure it only runs on the client
  const TechreviveWithAdmin = dynamic(() => import('@/components/techrevive-with-admin').then(mod => mod.default), { ssr: false });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
  

  return (
    <>
      <TechreviveWithAdmin />
      {typeof window !== "undefined" && (
        <Router>
          <h1></h1>
          <LaptopButton laptop={LaptopDetails} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/laptop-details" element={<LaptopDetails />} />
          </Routes>
        </Router>
      )}
    </>
  );
};
