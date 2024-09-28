import { NextResponse } from 'next/server';
import { createRoom } from '../api';

export async function POST() {
    const roomId = createRoom();
    return NextResponse.json({ roomId });
}
