import { readFile } from "node:fs/promises"
import sqlite3 from "sqlite3"

const db = new sqlite3.Database('../db/cosmere_archive.db');

const createString = (await readFile(`../db/truncate.sql`)).toString()

db.exec(createString, (error) => {
    console.log(error)
})