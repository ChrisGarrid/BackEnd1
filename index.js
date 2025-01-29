// Import required modules
const express = require('express');
const fs = require('fs');
const path = require('path');

// Initialize Express app and routers
const app = express();
const productsRouter = express.Router();
const cartsRouter = express.Router();

// Middleware
app.use(express.json());
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// File paths
const productsFile = path.join(__dirname, 'productos.json');
const cartsFile = path.join(__dirname, 'carrito.json');

// Utility functions
const readFile = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

const writeFile = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// PRODUCTS ROUTES

// GET / - List all products
productsRouter.get('/', (req, res) => {
    const products = readFile(productsFile);
    const limit = parseInt(req.query.limit);
    if (limit && !isNaN(limit)) {
        return res.json(products.slice(0, limit));
    }
    res.json(products);
});

// GET /:pid - Get product by ID
productsRouter.get('/:pid', (req, res) => {
    const products = readFile(productsFile);
    const product = products.find(p => p.id === req.params.pid);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
});

// POST / - Add a new product
productsRouter.post('/', (req, res) => {
    const { title, description, code, price, stock, category, thumbnails } = req.body;
    if (!title || !description || !code || !price || !stock || !category) {
        return res.status(400).json({ error: 'All fields except thumbnails are required' });
    }

    const products = readFile(productsFile);
    const newProduct = {
        id: `${Date.now()}`,
        title,
        description,
        code,
        price,
        status: true,
        stock,
        category,
        thumbnails: thumbnails || []
    };

    products.push(newProduct);
    writeFile(productsFile, products);
    res.status(201).json(newProduct);
});

// PUT /:pid - Update a product by ID
productsRouter.put('/:pid', (req, res) => {
    const products = readFile(productsFile);
    const productIndex = products.findIndex(p => p.id === req.params.pid);
    if (productIndex === -1) return res.status(404).json({ error: 'Product not found' });

    const updates = req.body;
    delete updates.id; // Prevent updating the ID

    products[productIndex] = { ...products[productIndex], ...updates };
    writeFile(productsFile, products);
    res.json(products[productIndex]);
});

// DELETE /:pid - Delete a product by ID
productsRouter.delete('/:pid', (req, res) => {
    const products = readFile(productsFile);
    const newProducts = products.filter(p => p.id !== req.params.pid);
    if (products.length === newProducts.length) return res.status(404).json({ error: 'Product not found' });

    writeFile(productsFile, newProducts);
    res.status(204).send();
});

// CARTS ROUTES

// POST / - Create a new cart
cartsRouter.post('/', (req, res) => {
    const carts = readFile(cartsFile);
    const newCart = {
        id: `${Date.now()}`,
        products: []
    };

    carts.push(newCart);
    writeFile(cartsFile, carts);
    res.status(201).json(newCart);
});

// GET /:cid - Get cart by ID
cartsRouter.get('/:cid', (req, res) => {
    const carts = readFile(cartsFile);
    const cart = carts.find(c => c.id === req.params.cid);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json(cart);
});

// POST /:cid/product/:pid - Add product to cart
cartsRouter.post('/:cid/product/:pid', (req, res) => {
    const carts = readFile(cartsFile); // Leer carritos
    const products = readFile(productsFile); // Leer productos
    console.log('Carts:', carts); // Ver carritos cargados
    console.log('Products:', products); // Ver productos cargados

    const cart = carts.find(c => c.id === req.params.cid); // Buscar el carrito por ID
    console.log('Cart ID:', req.params.cid, 'Found Cart:', cart); // Log del carrito buscado
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const product = products.find(p => p.id === req.params.pid); // Buscar el producto por ID
    console.log('Product ID:', req.params.pid, 'Found Product:', product); // Log del producto buscado
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const productInCart = cart.products.find(p => p.product === req.params.pid); // Buscar el producto en el carrito
    if (productInCart) {
        productInCart.quantity += 1; // Incrementar la cantidad si ya existe
    } else {
        cart.products.push({ product: req.params.pid, quantity: 1 }); // Agregar el producto si no existe
    }

    writeFile(cartsFile, carts); // Guardar cambios
    res.status(200).json(cart); // Devolver el carrito actualizado
});

// Root route
app.get('/', (req, res) => {
    res.send('¡Bienvenido al servidor de productos y carritos! Usa /api/products o /api/carts.');
});

// Start the server
app.listen(8080, () => {
    console.log('Server is running on http://localhost:8080');
});
