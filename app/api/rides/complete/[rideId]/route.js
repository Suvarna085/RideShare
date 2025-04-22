import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Ride from '@/models/Ride';

export async function POST(req, { params }) {
  // The URL parameter is named 'rideId', not 'id'
  const { rideId } = params;
  
  // Parse the request body to get the driverId
  const { driverId } = await req.json();

  if (!rideId || !driverId) {
    return NextResponse.json(
      { success: false, message: 'Ride ID and Driver ID are required' },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    // Find the ride by its ID
    const ride = await Ride.findById(rideId).populate('passengers');
    
    if (!ride) {
      return NextResponse.json(
        { success: false, message: 'Ride not found' },
        { status: 404 }
      );
    }

    // Ensure the logged-in user is the driver of the ride
    if (String(ride.driver) !== String(driverId)) {
      return NextResponse.json(
        { success: false, message: 'You are not authorized to complete this ride' },
        { status: 403 }
      );
    }

    // Check if the ride's passenger count equals the available seats
    if (ride.passengers.length !== ride.seats) {
      return NextResponse.json(
        { success: false, message: 'Cannot complete ride: Passenger count does not match available seats' },
        { status: 400 }
      );
    }

    // Update the ride status to "Completed"
    ride.status = 'Completed';
    await ride.save();

    return NextResponse.json({ success: true, message: 'Ride completed successfully' });

  } catch (error) {
    console.error('Error completing ride:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete ride' },
      { status: 500 }
    );
  }
}
