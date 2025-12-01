import { Elysia } from "elysia"
import postgres from "postgres"


// __ Types __

interface RequestBody {
    user_id: number
    product_id: number
}


// __ Postgres client setup __

const pg = postgres({
    host: process.env.PG_URL ?? 'localhost',
    port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
    database: 'test',
    username: 'root',
    password: 'root'
})
   

// __ Elysia server setup __

const server = new Elysia()
server.onStart(() => {
    console.log(`[${+new Date()}] Server started at http://localhost:3000 with route /products/buy`)
});
server.listen(3000)


// __ Routes __

server.post("/products/buy", async ({ request }) => {
    const { user_id, product_id } = await request.json() as RequestBody

    const user = await getUser(user_id)
    if (!user.length) {
        return { error: 'User not found' }
    }

    const product = await getProduct(product_id)
    if (!product.length) {
        return { error: 'Product not found' }
    }

    if (user[0].balance < product[0].price) {
        return { error: 'Insufficient balance' }
    }

    await pg`UPDATE users SET balance = balance - ${product[0].price}, updated_at = NOW() WHERE id = ${user_id}`
    await pg`INSERT INTO purchases (user_id, product_id, created_at) VALUES (${user_id}, ${product_id}, NOW())`

    const after = await getUser(user_id)

    return after[0]
})


// __ Database queries __

async function getUser(id: number) {
    return await pg`SELECT id, name, balance FROM users WHERE id = ${id}`
}

async function getProduct(id: number) {
    return await pg`SELECT id, name, price FROM products WHERE id = ${id}`
}