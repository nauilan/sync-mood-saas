import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sync-mood',
    runtime: 'next-api',
  })
}