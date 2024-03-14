import dotenv from 'dotenv';
import sql from "mssql";
import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
 });
 

// Configure SQL Server connection
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
  },
};


// Function to read a person from the database
async function read(id) {
  let pool;
  try {
    pool = await sql.connect(config);
    const request = pool.request();
    const result = await request
      .input('id', sql.Int, id)
      .query(`SELECT * FROM Products WHERE ProductId = @id`);
    return result.recordset[0];
  } catch (error) {
    console.error('Error reading from the database:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Function to add a product to the database
async function addProduct(product) {
  let pool;
  try {
    pool = await sql.connect(config);
    const countResult = await pool.request().query(`SELECT COUNT(*) AS count FROM Products`);
    const request = pool.request();
    const count = countResult.recordset[0].count;
    const newId = count + 1;
    
    const result = await request
      .input('id', sql.Int, newId)
      .input('name', sql.NVarChar, product.name)
      .input('price', sql.Decimal, product.price)
      .query(`INSERT INTO Products VALUES (@id, @name, @price)`);
    return result.rowsAffected[0] === 1;
  } catch (error) {
    console.error('Error adding product to the database:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

/* // Usage example
(async () => {
  try {
    const person = await read(1);
    console.log('Person:', person);

    const newProductAdded = await addProduct({id: 6, name: 'New Product', price: 10.99 });
    console.log('New product added:', newProductAdded);
  } catch (error) {
    console.error('Error:', error);
  }
})(); */

// API endpoint to read a product
app.get('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const product = await readProduct(id);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    const result = await request.query(`SELECT * FROM Products`);

    res.setHeader('Content-Type', 'application/json');

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching products from the database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to add a product
app.post('/api/products', async (req, res) => {
  try {
    const { name, price } = req.body;
    const newProductAdded = await addProduct({ name, price });
    res.json({ success: newProductAdded });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});