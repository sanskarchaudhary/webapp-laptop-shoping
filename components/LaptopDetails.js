// components/LaptopDetails.js
import React from "react";
import { useLocation } from "react-router-dom";

export function LaptopDetails() {
  const location = useLocation();
  const { laptop } = location.state || {};

  if (!laptop) {
    return <div>No laptop data available.</div>;
  }

  const suggestions = getSuggestions(laptop.price);

  return (
    <div>
      <h1>{laptop.name}</h1>
      <p>Price: ${laptop.price}</p>
      <h2>Suggestions</h2>
      <ul>
        {suggestions.map((suggestion, index) => (
          <li key={index}>
            {suggestion.name} - ${suggestion.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getSuggestions(price) {
  // Mock data for suggestions
  const laptops = [
    { name: "Laptop A", price: 500 },
    { name: "Laptop B", price: 700 },
    { name: "Laptop C", price: 1000 },
  ];

  // Suggest laptops within a $200 range of the given price
  return laptops.filter((laptop) => Math.abs(laptop.price - price) <= 200);
}

export default LaptopDetails;
