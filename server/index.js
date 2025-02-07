//dependencies//imports
const express = require("express");
const pg = require("pg");
//express app
const app = express();
//db client
const client = new pg.Client(
  process.env.DATABASE_URL ||
    "postgres://postgres:juniper23@localhost/acme_hr_directory"
);

app.use(express.json());

//Routes

//get all employees
app.get("/api/employees", async(req, res, next) => {
    try {
        const SQL =`
        SELECT * FROM employees
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch(ex) {
        next(ex);
    }
})

//get all departments
app.get("/api/departments", async(req, res, next) => {
    try {
        const SQL =`
        SELECT * FROM departments
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch(ex) {
        next(ex);
    }
})

//create new employee
app.post("/api/employees", async(req, res, next) => {
    try {
        const SQL = `INSERT INTO employees(name, department_id) VALUES ($1, (SELECT id from departments WHERE name=$2)) RETURNING *`;
        const response = await client.query(SQL, [
            req.body.name,
            req.body.department_id
        ])
            res.send(response.rows[0])
    } catch(ex) {
        next(ex)
    }
})

//remove employee from db
app.delete("/api/employees/:id", async (req, res, next) => {
    try {
      const SQL = `
      DELETE from employees
      WHERE id=$1;
      `;
      const response = await client.query(SQL, [req.params.id]);
      res.sendStatus(204);
    } catch (ex) {
      next(ex);
    }
  });
//update an employee
app.put("/api/employees/:id", async (req, res, next) => {
    try {
      const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at=now()
        WHERE id = $3 RETURNING *;
        `;
      const { name, department_id } = req.body;
      console.log(req.params)
      const { id } = req.params;
      const response = await client.query(SQL, [name, department_id, id]);
      res.send(response.rows[0]);
    } catch (error) {
      next(error);
    }
  });

//error handling route
app.use((error, req, res, next) => {
    res.status(res.status || 500).send({ error : error});
})

const init = async () => {
  await client.connect();
  const SQL = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS departments;
        CREATE TABLE departments (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50)
        );
        CREATE TABLE employees (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            department_id INTEGER REFERENCES departments(id) NOT NULL
        );

        INSERT INTO departments(name) VALUES('accounting'), ('creative'), ('it'), ('hr');
        INSERT INTO employees(name, department_id) VALUES('Donna',(SELECT id from departments WHERE name='accounting')), 
        ('Tracey', (SELECT id from departments WHERE name='creative')),
        ('Alistair', (SELECT id from departments WHERE name='it')),
        ('Henry Russell', (SELECT id from departments WHERE name='hr'));
        `
        await client.query(SQL);
        app.listen(3000, () => console.log('listening on port 3000')) 
};

init();
