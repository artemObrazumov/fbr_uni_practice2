const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const fs = require('fs');

const app = express();
const port = 3000;

let products = [];
try {
  const data = fs.readFileSync('products.json', 'utf-8');
  products = JSON.parse(data);
} catch (err) {
  console.error("Error reading products.json, starting with empty array:", err);
}

const saveProducts = () => {
  try {
    fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
  } catch (err) {
    console.error("Error writing to products.json:", err);
  }
};

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});

function findProductOr404(id, res) {
  // The ID from the URL is a string, while the ID in the JSON can be a number or string.
  // Using == allows for loose comparison.
  const product = products.find(p => p.id == id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}

app.post("/api/products", (req, res) => {
  const { name, category, description, price, stock } = req.body;
  if (!name || !category || !description || price === undefined || stock === undefined) {
    return res.status(400).json({ error: "Missing required product fields" });
  }
  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock),
  };
  products.push(newProduct);
  saveProducts();
  res.status(201).json(newProduct);
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

app.patch("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  const { name, category, description, price, stock } = req.body;
  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  
  saveProducts();
  res.json(product);
});

app.delete("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const initialLength = products.length;
  products = products.filter((p) => p.id != id);

  if (products.length === initialLength) {
    return res.status(404).json({ error: "Product not found" });
  }

  saveProducts();
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
