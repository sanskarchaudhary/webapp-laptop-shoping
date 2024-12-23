export const data = [
  {
    id: 1,
    customerName: "John Doe",
    address: "123 Main St",
    items: [
      {
        id: 1,
        name: "Laptop 1",
        price: 500,
        quantity: 2
      },
      {
        id: 2,
        name: "Laptop 2",
        price: 800,
        quantity: 1
      }
    ],
    total: 1800,
    status: "pending",
    date: "2023-02-20"
  },
  {
    id: 2,
    customerName: "Sanskar Doe",
    address: "456 Elm St",
    items: [
      {
        id: 3,
        name: "Laptop 3",
        price: 1200,
        quantity: 1
      }
    ],
    total: 1200,
    status: "shipped",
    date: "2023-02-22"
  },
  {
    id: 3,
    customerName: "Bob Smith",
    address: "789 Oak St",
    items: [
      {
        id: 1,
        name: "Laptop 1",
        price: 500,
        quantity: 1
      },
      {
        id: 4,
        name: "Laptop 4",
        price: 1500,
        quantity: 1
      }
    ],
    total: 2000,
    status: "delivered",
    date: "2023-02-25"
  }
];
data.forEach((order) => {
  db.collection("orders").add(order);
});