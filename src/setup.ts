import { readFile } from "node:fs/promises"
import sqlite3 from "sqlite3"

const db = new sqlite3.Database('./cosmere_archive.db');

const createString = (await readFile(`./sql/tables.sql`)).toString()

db.exec(createString, (error) => {
    console.log(error)
})