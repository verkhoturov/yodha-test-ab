import { NextResponse } from 'next/server'
import { createClient } from 'redis'

export async function GET() {
  const client = createClient({
    url: process.env.REDIS_URL
  })

  try {
    await client.connect()

    // Получаем последнее сохраненное время и историю
    const lastTime = await client.get('last_saved_time');

    await client.quit()

    return NextResponse.json({
      status: 'success',
      last_saved_time: lastTime,
      current_time: new Date().toISOString(),
    })

  } catch (error: any) {
    try {
      await client.quit()
    } catch {
      // ignore
    }

    return NextResponse.json({
      status: 'error',
      message: 'Failed to get time from Redis',
      error: error.message
    }, {
      status: 500
    })
  }
}