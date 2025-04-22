// app/api/rides/leave/[rideId]/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Ride from '@/models/Ride';
import mongoose from 'mongoose';

export async function POST(request, context) {
  const params = await context.params;
  const { rideId } = params;
  console.log("Received rideId:", rideId);
  
  
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
    
    const objectUserId = new mongoose.Types.ObjectId(userId);
    
    // Check if user is a passenger in the ride
    const isPassenger = ride.passengers.some(
      passenger => passenger.toString() === objectUserId.toString()
    );
    
    if (!isPassenger) {
      return NextResponse.json(
        { success: false, message: 'You are not a passenger in this ride' },
        { status: 400 }
      );
    }

    // Remove the user from the passengers array
    const result = await Ride.updateOne(
      { _id: new mongoose.Types.ObjectId(rideId) },
      {
        $pull: { passengers: objectUserId },
        $inc: { availableSeats: 1 } // Increase available seats by 1
      }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to leave ride' },
        { status: 400 }
      );
    }

    // Add entry to ride history
    await Ride.updateOne(
      { _id: new mongoose.Types.ObjectId(rideId) },
      { 
        $push: { rideHistory: { userId: objectUserId, action: 'left', timestamp: new Date() } }
      }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Successfully left the ride'
    });
    
  } catch (error) {
    console.error('Error leaving ride:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to leave ride' },
      { status: 500 }
    );
  }
}