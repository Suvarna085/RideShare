import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Ride from '@/models/Ride';

export async function POST(request) {
  try {
    const body = await request.json();
    const { source, destination, date, time, seats, notes, rider } = body;

    // Validate required fields
    if (!source || !destination || !date || !time || !rider) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect using Mongoose
    await connectToDatabase();

    const newRide = await Ride.create({
      source,
      destination,
      date,
      time,
      seats: parseInt(seats) || 1,
      notes,
      rider, // ObjectId
      status: 'Pending',
      availableSeats: parseInt(seats) || 1,
      isRequest: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Ride created successfully',
      rideId: newRide._id,
    });

  } catch (error) {
    console.error('Error in POST /api/rides/create:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create ride' },
      { status: 500 }
    );
  }
}
