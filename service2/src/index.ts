import { Elysia } from "elysia"
import postgres from "postgres"
import * as z from "zod"


// __ Types __

const RequestBody = z.object({
  user_id: z.number(),
  product_id: z.number(),
});

type RequestBody = z.infer<typeof RequestBody>;


// __ Postgres client setup __

const sql = postgres(process.env.PG_URL ?? 'postgres://root:root@localhost:5432/test')
   

// __ Elysia server setup __

const server = new Elysia()
server.onStart(() => {
    console.log(`[${+new Date()}] Server started at http://localhost:3000 with route /products/buy`)
});
server.listen(3000)


// __ Graceful shutdown __

process.on('SIGINT', async () => {
    await server.stop()
    await sql.end()
    process.exit(0);
});


// __ Routes __

server.post("/products/buy", async ({ request }) => {
    const { user_id, product_id } = await request.json() as RequestBody
    
    RequestBody.parse({ user_id, product_id }) // validation

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

    await sql`UPDATE users SET balance = balance - ${product[0].price}, updated_at = NOW() WHERE id = ${user_id}`
    await sql`INSERT INTO purchases (user_id, product_id, created_at) VALUES (${user_id}, ${product_id}, NOW())`

    const after = await getUser(user_id)

    return after[0]
})


// __ Database queries __

async function getUser(id: number) {
    return await sql`SELECT id, name, balance FROM users WHERE id = ${id}`
}

async function getProduct(id: number) {
    return await sql`SELECT id, name, price FROM products WHERE id = ${id}`
}