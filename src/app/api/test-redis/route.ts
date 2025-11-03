import { NextResponse } from 'next/server'
import { createClient } from 'redis'

export async function GET() {
  const client = createClient({
    url: process.env.REDIS_URL
  })

  try {
    await client.connect()

    // 1. Получаем базовую информацию о БД
    const [dbSize, serverInfo] = await Promise.all([
      client.dbSize(),
      client.info('server')
    ])

    // 2. Проверяем запись и чтение данных
    const testData = {
      check: 'persistence',
      time: new Date().toISOString(),
      id: Math.random().toString(36).substring(7)
    }

    const testKey = `quick_check_${Date.now()}`
    
    // Записываем
    await client.setEx(testKey, 60, JSON.stringify(testData))
    
    // Читаем
    const result = await client.get(testKey)
    const parsedResult = result ? JSON.parse(result) : null
    
    // Проверяем
    const dataPersisted = parsedResult && parsedResult.id === testData.id

    await client.quit()

    return NextResponse.json({
      status: dataPersisted ? 'ok' : 'error',
      database: {
        size: dbSize,
        version: serverInfo.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown'
      },
      persistence: {
        working: dataPersisted,
        test: dataPersisted ? 'passed' : 'failed'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    try {
      await client.quit()
    } catch {
      // ignore
    }

    return NextResponse.json({
      status: 'error',
      message: 'Redis check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500
    })
  }
}