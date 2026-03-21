const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
app.use(express.json());

const PORT = 3001;

const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// { id, username, passwordHash, role }
const users = [];
// { id, name, price }
const products = [];

const refreshTokens = new Set();

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            role: user.role
        },
        ACCESS_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN,
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            role: user.role
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPIRES_IN,
        }
    );
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            error: "Missing or invalid Authorization header",
        });
    }

    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
}

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Forbidden",
            });
        }
        next();
    };
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: The user was successfully created
 *       400:
 *         description: Bad request
 */
app.post("/api/auth/register", async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).json({
            error: "username and password are required",
        });
    }
    const exists = users.some((u) => u.username === username);
    if (exists) {
        return res.status(409).json({
            error: "username already exists",
        });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
        id: String(users.length + 1),
        username,
        passwordHash,
        role: role || "user"
    };
    users.push(user);
    res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role
    });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: The user was successfully logged in
 *       400:
 *         description: Bad request
 */
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({
            error: "username and password are required",
        });
    }
    const user = users.find((u) => u.username === username);
    if (!user) {
        return res.status(401).json({
            error: "Invalid credentials",
        });
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({
            error: "Invalid credentials",
        });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);
    res.json({
        accessToken,
        refreshToken,
    });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh the access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: The access token was successfully refreshed
 *       400:
 *         description: Bad request
 */
app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({
            error: "refreshToken is required",
        });
    }
    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({
            error: "Invalid refresh token",
        });
    }
    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find((u) => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({
                error: "User not found",
            });
        }
        refreshTokens.delete(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);
        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired refresh token",
        });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The current user
 *       401:
 *         description: Unauthorized
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
    res.json({
        user: req.user
    });
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.get("/api/users", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    res.json(users.map(u => ({ id: u.id, username: u.username, role: u.role })));
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
app.get("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({
            error: "User not found"
        });
    }
    res.json({ id: user.id, username: user.username, role: user.role });
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user by id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: The user was successfully updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({
            error: "User not found"
        });
    }
    const { username, password, role } = req.body;
    if (username) {
        const exists = users.some((u) => u.username === username && u.id !== req.params.id);
        if (exists) {
            return res.status(409).json({
                error: "username already exists",
            });
        }
        user.username = username;
    }
    if (password) {
        user.passwordHash = await bcrypt.hash(password, 10);
    }
    if (role) {
        user.role = role;
    }
    res.json({
        id: user.id,
        username: user.username,
        role: user.role
    });
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user by id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: The user was successfully deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
        return res.status(404).json({
            error: "User not found"
        });
    }
    users.splice(userIndex, 1);
    res.status(204).send();
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: The product was successfully created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.post("/api/products", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
    const { name, price } = req.body;
    if (!name || !price) {
        return res.status(400).json({
            error: "name and price are required",
        });
    }
    const product = {
        id: String(products.length + 1),
        name,
        price
    };
    products.push(product);
    res.status(201).json(product);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: A list of products
 */
app.get("/api/products", (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The product
 *       404:
 *         description: Not found
 */
app.get("/api/products/:id", (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({
            error: "Product not found"
        });
    }
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product by id
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: The product was successfully updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({
            error: "Product not found"
        });
    }
    const { name, price } = req.body;
    if (name) {
        product.name = name;
    }
    if (price) {
        product.price = price;
    }
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product by id
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: The product was successfully deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin", "seller"]), (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    if (productIndex === -1) {
        return res.status(404).json({
            error: "Product not found"
        });
    }
    products.splice(productIndex, 1);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
