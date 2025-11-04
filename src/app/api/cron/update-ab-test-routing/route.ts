import { NextResponse } from 'next/server'

export async function GET() {
  // Получаем URL нашего же приложения
  const appUrl = 'https://yodha-test-ab.vercel.app';

  try {

    // Дергаем endpoint сохранения времени
    const saveResponse = await fetch(`${appUrl}/funnel/api/ab/save`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await saveResponse.json()

    console.log(`Cron update executed at: ${new Date().toISOString()}`)
    console.log('Save endpoint response:', result)

    return NextResponse.json({
      status: 'success',
      message: 'Cron job executed',
      cron_time: new Date().toISOString(),
      save_result: result
    })

  } catch (error: any) {
    console.error('Cron job failed:', {err: error.message, appUrl},)

    return NextResponse.json({
      status: 'error',
      message: 'Cron job failed',
      error: error.message,
      cron_time: new Date().toISOString()
    }, {
      status: 500
    })
  }
}