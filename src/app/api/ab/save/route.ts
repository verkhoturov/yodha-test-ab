import { NextResponse } from 'next/server'
import { createClient } from 'redis'

export async function GET() {
  const client = createClient({
    url: process.env.REDIS_URL
  })

  try {
    await client.connect()

    const currentTime = new Date().toISOString()
    const timestamp = Date.now()
    
    // Сохраняем текущее время
    await client.set('last_saved_time', currentTime)

    await client.quit()

    return NextResponse.json({
      status: 'success',
      message: 'Time saved to Redis',
      saved_time: currentTime,
      timestamp: timestamp
    })

  } catch (error: any) {
    try {
      await client.quit()
    } catch {
      // ignore
    }

    return NextResponse.json({
      status: 'error',
      message: 'Failed to save time to Redis',
      error: error.message
    }, {
      status: 500
    })
  }
}