import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from 'redis'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const client = createClient({
    url: process.env.REDIS_URL,
    socket: {
      connectTimeout: 8000,
      timeout: 8000
    }
  })

  try {
    const startTime = Date.now()
    await client.connect()
    const connectTime = Date.now() - startTime

    // Получаем различную информацию о Redis
    const [pingResult, dbSize, info, memoryInfo] = await Promise.all([
      client.ping(),
      client.dbSize(),
      client.info('server'),
      client.info('memory')
    ])

    const operationTime = Date.now() - startTime - connectTime

    await client.quit()

    // Парсим информацию
    const redisVersion = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown'
    const usedMemory = memoryInfo.match(/used_memory:([^\r\n]+)/)?.[1] || 'unknown'
    const connectedClients = info.match(/connected_clients:([^\r\n]+)/)?.[1] || 'unknown'

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connection: {
        host: process.env.REDIS_URL?.split('@')[1]?.split(':')[0] || 'unknown',
        connectTime: `${connectTime}ms`,
        totalOperationTime: `${operationTime}ms`
      },
      metrics: {
        ping: pingResult,
        database_size: dbSize,
        redis_version: redisVersion,
        used_memory: usedMemory,
        connected_clients: parseInt(connectedClients)
      },
      environment: process.env.NODE_ENV
    })

  } catch (error) {
    try {
      await client.quit()
    } catch {
      // Ignore quit errors
    }

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error,
      redis_url: process.env.NODE_ENV === 'development' ? 
        process.env.REDIS_URL?.replace(/:[^:@]+@/, ':****@') : 'hidden'
    })
  }
}