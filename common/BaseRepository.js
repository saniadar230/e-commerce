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
    constructor(tableName) {
        if (new.target === BaseRepository) {
            throw new Error("stop! don't use it just extends it")
        }

        // How do we store a value inside an object in JavaScript
        // stores table name as an instance property

        this.tableName = tableName
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

    // ===== generic delete =====
    // same for every table, so it lives in the parent
    // returns the deleted row, or null if the id didn't exist
    async delete(id) {
        const sql = `delete from ${this.tableName} where id=$1 returning *`

        const result = await pool.query(sql, [id]);

        return result.rows[0] ?? null
    }
}