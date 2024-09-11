const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const { z } = require("zod");
require("dotenv").config(); // 환경 변수를 불러오기 위한 설정

const app = express();
const port = 6969;

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL 연결 설정
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // 환경 변수 사용
  ssl: {
    rejectUnauthorized: false, // SSL 사용 시 필요한 옵션
  },
});

// 기본 요청 핸들러 (모의 테스트용)
const handleRequest = (req, res) => {
  const { code, desc, msg, status } = req.query;
  const responseBody = req.body;

  res.status(status ? parseInt(status) : 200).json({
    code: code || "20000001",
    desc: desc || "Default description",
    msg: msg || "Default message",
    result: responseBody,
  });
};

app.post("/mock", handleRequest);
app.get("/mock", handleRequest);

// --------------- 유저 관련 CRUD ---------------

// 모든 유저 데이터 가져오기
app.get("/next/users", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Error fetching users");
  } finally {
    client.release();
  }
});

// 유저 생성
app.post("/next/users", async (req, res) => {
  const { name, email, password } = req.body;
  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3)`,
      [name, email, hashedPassword]
    );
    res.status(201).send("User created");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Error creating user");
  } finally {
    client.release();
  }
});

// 유저 업데이트
app.put("/next/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query(
      `UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4`,
      [name, email, hashedPassword, id]
    );
    res.send("User updated");
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Error updating user");
  } finally {
    client.release();
  }
});

// 유저 삭제
app.delete("/next/users/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM users WHERE id = $1`, [id]);
    res.send("User deleted");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Error deleting user");
  } finally {
    client.release();
  }
});

// --------------- 인보이스 관련 CRUD ---------------

const ITEMS_PER_PAGE = 6;

// 유틸리티 함수: 통화 포맷팅
const formatCurrency = (amount) => {
  return `$${(amount / 100).toFixed(2)}`;
};

// 인보이스 및 고객 데이터 가져오기
app.get("/next/revenue", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM revenue");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    res.status(500).send("Error fetching revenue data");
  }
});

app.get("/next/latest-invoices", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`);

    const latestInvoices = result.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    res.json(latestInvoices);
  } catch (error) {
    console.error("Error fetching latest invoices:", error);
    res.status(500).send("Error fetching latest invoices");
  }
});

app.get("/next/invoice-card-data", async (req, res) => {
  try {
    const invoiceCountPromise = pool.query("SELECT COUNT(*) FROM invoices");
    const customerCountPromise = pool.query("SELECT COUNT(*) FROM customers");
    const invoiceStatusPromise = pool.query(`
      SELECT
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
      FROM invoices`);

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count);
    const numberOfCustomers = Number(data[1].rows[0].count);
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid);
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending);

    res.json({
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    });
  } catch (error) {
    console.error("Error fetching card data:", error);
    res.status(500).send("Error fetching card data");
  }
});

app.get("/next/customers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM customers ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).send("Error fetching customers");
  }
});

app.get("/next/filtered-invoices", async (req, res) => {
  const { query, page = 1 } = req.query;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  try {
    const result = await pool.query(
      `
      SELECT invoices.id, invoices.amount, invoices.date, invoices.status, customers.name, customers.email, customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE customers.name ILIKE $1 OR customers.email ILIKE $1 OR invoices.amount::text ILIKE $1 OR invoices.date::text ILIKE $1 OR invoices.status ILIKE $1
      ORDER BY invoices.date DESC
      LIMIT $2 OFFSET $3`,
      [`%${query}%`, ITEMS_PER_PAGE, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching filtered invoices:", error);
    res.status(500).send("Error fetching filtered invoices");
  }
});

// zod를 사용한 인보이스 스키마
const CreateInvoiceSchema = z.object({
  customerId: z.string().nonempty("Customer ID is required."),
  amount: z.number().positive("Amount must be greater than zero."),
  status: z.enum(["pending", "paid"], "Invalid invoice status."),
});

// 인보이스 생성
app.post("/invoices", async (req, res) => {
  const validation = CreateInvoiceSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      errors: validation.error.flatten().fieldErrors,
      message: "Validation Failed.",
    });
  }

  const { customerId, amount, status } = validation.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    const client = await pool.connect();
    await client.query(
      `INSERT INTO invoices (customer_id, amount, status, date)
       VALUES ($1, $2, $3, $4)`,
      [customerId, amountInCents, status, date]
    );
    client.release();
    res.status(201).json({ message: "Invoice Created" });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res
      .status(500)
      .json({ message: "Database Error: Failed to Create Invoice." });
  }
});

// 인보이스 업데이트
app.put("/invoices/:id", async (req, res) => {
  const { id } = req.params;
  const validation = CreateInvoiceSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      errors: validation.error.flatten().fieldErrors,
      message: "Validation Failed.",
    });
  }

  const { customerId, amount, status } = validation.data;
  const amountInCents = amount * 100;

  try {
    const client = await pool.connect();
    await client.query(
      `UPDATE invoices SET customer_id = $1, amount = $2, status = $3 WHERE id = $4`,
      [customerId, amountInCents, status, id]
    );
    client.release();
    res.json({ message: "Invoice Updated" });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res
      .status(500)
      .json({ message: "Database Error: Failed to Update Invoice." });
  }
});

// 인보이스 삭제
app.delete("/invoices/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const client = await pool.connect();
    await client.query(`DELETE FROM invoices WHERE id = $1`, [id]);
    client.release();
    res.json({ message: "Invoice Deleted" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res
      .status(500)
      .json({ message: "Database Error: Failed to Delete Invoice." });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
