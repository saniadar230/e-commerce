import { Client } from "pg"
import pg from "pg"


pg.types.setTypeParser(1082, (value) => value)

// object containing the DB configuration
const client = new Client({
  host: "localhost",
  port: 5433,
  database: "postgres",
  user: "postgres",
  password: "qwerty"
})


client.connect()
  .then(() => {
    console.log("Database connected")
  })
  .catch((error) => {
    console.log("error connecting DB", error.message)
  })


export default client;