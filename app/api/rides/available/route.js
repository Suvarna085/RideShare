// app/api/rides/available/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Ride from '@/models/Ride';
import User from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    
    const currentDate = new Date();
    
    const rides = await Ride.find({
      availableSeats: { $gt: 0 },
      date: { $gte: currentDate },
      status: { $ne: 'Cancelled' }
    })
    .populate('driver', 'name') 
    .populate('passengers', 'name') 
    .sort({ date: 1, time: 1 });
    
    return NextResponse.json({
      success: true,
      rides
    });
  } catch (error) {
    console.error('Error fetching available rides:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch available rides' },
      { status: 500 }
    );
  }
}
