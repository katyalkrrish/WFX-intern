const express = require("express");

const buyersRoutes = require("./routes/buyersRoutes");
const suppliersRoutes = require("./routes/suppliersRoutes");
const productsRoutes = require("./routes/productsRoutes");
const ordersRoutes = require("./routes/ordersRoutes");
const invoicesRoutes = require("./routes/invoicesRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");
const app = express();

app.use(express.json());

app.use("/buyers", buyersRoutes);
app.use("/suppliers", suppliersRoutes);
app.use("/products", productsRoutes);
app.use("/orders", ordersRoutes);
app.use("/invoices", invoicesRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/ai", aiRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});