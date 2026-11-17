// base repository ========== repository talks to DB
//  -- parent class  --
//  -- -- fetch all records (paginated)
//  -- -- fetch one record by id
//  -- -- create a record
//  -- -- delete a record


//  all child classes inherits this class for common functions
//   CustomerRepository                     ProductRepository                  OrderRepository


// Requirement 1: The constructor takes tableName and stores it.
// parent class needs to know the table name 

import pool from "../db/db.js"

export class BaseRepository {
    constructor(tableName, updatableColumns = []) {
        if (new.target === BaseRepository) {
            throw new Error("stop! don't use it just extends it")
        }
        // How do we store a value inside an object in JavaScript
        // stores table name as an instance property

        this.tableName = tableName;
        this.updatedColumns = updatableColumns;
    }

    // ===== paginated getAll =====
    // limit  = how many rows per page
    // offset = how many rows to skip  (offset = (page - 1) * limit, calculated in the service)
    // returns { data, total } -- total is needed to calculate totalPages
    async findAll({ limit = 10, offset = 0 } = {}) {
        // -- query 1: the rows of this page (order by id so pages are stable)
        const dataSql = `select * from ${this.tableName} order by id limit $1 offset $2`

        // -- query 2: total number of rows in the table
        const countSql = `select count(*) from ${this.tableName}`

        // run both queries together
        const [dataResult, countResult] = await Promise.all([
            pool.query(dataSql, [limit, offset]),
            pool.query(countSql),
        ]);

        return {
            data: dataResult.rows,
            // count(*) comes back as a string from pg, so convert it
            total: Number(countResult.rows[0].count),
        }

    }

    // method to getAll
    async findById(id) {
        const sql = `select * from ${this.tableName} where id=$1`

        const result = await pool.query(sql, [id]);

        // return one record null if noo records
        return result.rows[0] ?? null

    }
    // can't create the general create function -- as its different for every fn
    // --- child class should over rides it 

    async create() {
        throw new Error("create() must be implemented by the child class");
    }


    // ========== patch
    async patch(id, data) {
        // keep only the allowed colums id and path are not allowed to update ======== They're excluded only if they aren't included in updatedColumns.
        const keys = Object.keys(data).filter((k) => this.updatedColumns.includes(k))


        console.log("Request data:", data);
        console.log("Allowed columns:", this.updatedColumns);
        console.log("Matched keys:", keys);

        if (keys.length === 0) {
            throw new Error("No valid fields provided for update");
        }

        // dynamic generated sql --
        const setClause = keys.map((key, i) => `${key}=$${i + 1}`).join(", ");

        const sql = `update ${this.tableName} set ${setClause} where id=$${keys.length + 1} returning *`;

        const values = [...keys.map((key) => data[key]), id];

        const result = await pool.query(sql, values);

        return result.rows[0] ?? null
    }

    // ===== generic delete =====
    // same for every table, so it lives in the parent
    // returns the deleted row, or null if the id didn't exist
    async delete(id) {
        const sql = `delete from ${this.tableName} where id=$1 returning *`

        const result = await pool.query(sql, [id]);

        return result.rows[0] ?? null
    }
}