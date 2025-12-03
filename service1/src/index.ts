import { Elysia } from 'elysia';
import { createClient } from 'redis';


// __ Types __

interface APISkinResponce {
  market_hash_name: string
  min_price: number | null,
  created_at: number,
}

interface SkinPrice {
  name: string
  min_price_tradable: number | null
  min_price_not_tradable: number | null
  created_at: number
}


// __ Redis client setup __

const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' })
redis.on('error', error => console.log(`[${+new Date()}] Redis Client Error`, error))
redis.connect().then(() => {
  console.log(`[${+new Date()}] Redis client connected`)
})


// __ Elysia server setup __

const server = new Elysia()

server.onStart(() => {
  console.log(`[${+new Date()}] Server started at http://localhost:3000 with route /skins`)
})

server.listen(3000)


// __ Graceful shutdown __

process.on('SIGINT', async () => {
    await server.stop()
    await redis.close()
    process.exit(0);
});


// __ Routes __

server.get('/skins', async () => {
  const data = await redis.get('skins_prices')

  if (data) {
    return JSON.parse(data) as SkinPrice[]
  } else {
    return []
  }
})


// __ Periodic fetch and store in Redis __

setInterval(() => {
  Load()
  console.log(`[${+new Date()}] fetch skins`)
}, process.env.INTERVAL_FETCH ? parseInt(process.env.INTERVAL_FETCH) : 300000) // 5 minutes

function Load() {
  Promise.all([skinsAPI(true), skinsAPI(false)])
    .then(async ([_tradables, _notTradables]) => {
      if (_tradables.ok && _notTradables.ok) {
        const tradables = await _tradables.json() as [APISkinResponce]
        const notTradables = await _notTradables.json() as [APISkinResponce]

        // Find & Merge 
        const merged = tradables.map(tradable => {
          const notTradable = notTradables.find(
            notTradable => tradable.market_hash_name === notTradable.market_hash_name && 
            tradable.created_at === notTradable.created_at
          )
          
          if (notTradable) {
            return {
              name: tradable.market_hash_name,
              min_price_tradable: tradable.min_price,
              min_price_not_tradable: notTradable.min_price,
              created_at: tradable.created_at
            } as SkinPrice
          }
        })

        await redis.set('skins_prices', JSON.stringify(merged)) // store in Redis
        
        console.log(`[${+new Date()}] fetched ${merged.length} items`)
      } else if (!_tradables.ok) {
        console.error(`[${+new Date()}] call API: ${_tradables.statusText} ${_tradables.status}`)
      } else if (!_notTradables.ok) {
        console.error(`[${+new Date()}] call API: ${_notTradables.statusText} ${_notTradables.status}`)
      }
    })
}

Load()


// __ Helper functions __

function skinsAPI(tradable: boolean): Promise<Response> {
  return fetch(`https://api.skinport.com/v1/items?tradable=${tradable}`, {
    method: 'GET',
    headers: {
      'Accept-Encoding': 'br'
    }
  })
}