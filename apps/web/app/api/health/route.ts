import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sync-mood',
    runtime: 'next-api',
  })
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'x-sync-mood-health': 'ok',
    },
  })
}