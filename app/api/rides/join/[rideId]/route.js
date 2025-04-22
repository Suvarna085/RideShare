import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Ride from '@/models/Ride';
import mongoose from 'mongoose';

export async function POST(request, context) {
  const { rideId } = await context.params;

  if (!rideId || !mongoose.Types.ObjectId.isValid(rideId)) {
    return NextResponse.json(
      { success: false, message: 'Invalid or missing Ride ID' },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const { userId } = body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { success: false, message: 'Invalid or missing User ID' },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return NextResponse.json(
        { success: false, message: 'Ride not found' },
        { status: 404 }
      );
    }

    if (ride.availableSeats <= 0) {
      return NextResponse.json(
        { success: false, message: 'No available seats' },
        { status: 400 }
      );
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

    if (!ride.passengers) {
      ride.passengers = [];
    }

    if (ride.passengers.some(passenger => passenger.equals(objectUserId))) {
      return NextResponse.json(
        { success: false, message: 'User already joined this ride' },
        { status: 400 }
      );
    }

    ride.passengers.push(objectUserId);
    ride.availableSeats -= 1;
    ride.updatedAt = new Date();
    
    await ride.save();

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the ride',
    });

  } catch (error) {
    console.error('Error joining ride:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to join ride' },
      { status: 500 }
    );
  }
}
