// app/api/rides/requests/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Ride from '@/models/Ride';

export async function GET() {
  try {
    await connectToDatabase();

    // Find rides that have a rider but no driver (these are ride requests)
    const rides = await Ride.find({ 
      rider: { $exists: true, $ne: null },
      driver: { $exists: false }
    })
    .populate('rider', 'name email')
    .sort({ date: 1, time: 1 });

    return NextResponse.json({ success: true, rides });
  } catch (error) {
    console.error('Error fetching ride requests:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ride requests' },
      { status: 500 }
    );
  }
}