// components/LaptopButton.js
import React from "react";
import { useNavigate } from "react-router-dom";

export function LaptopButton({ laptop }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/laptop-details", { state: { laptop } });
  };

  return <button onClick={handleClick}>View Laptop Details</button>;
}

export default LaptopButton;
