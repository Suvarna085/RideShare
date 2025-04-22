// app/api/rides/accept/[id]/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Ride from '@/models/Ride';

export async function POST(req, { params }) {
  const { Id } = params;
  
  if (!Id) {
    return NextResponse.json(
      { success: false, message: 'Ride ID is required' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { driverId } = body;

    if (!driverId) {
      return NextResponse.json(
        { success: false, message: 'Driver ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the ride and update it with the driver ID and change status to confirmed
    const updatedRide = await Ride.findByIdAndUpdate(
      Id,
      { 
        $set: { 
          driver: driverId,
          status: 'Confirmed' 
        } 
      },
      { new: true }
    ).populate('rider', 'name email');

    if (!updatedRide) {
      return NextResponse.json(
        { success: false, message: 'Ride not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Ride request accepted successfully',
      ride: updatedRide 
    });
  } catch (error) {
    console.error('Error accepting ride request:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to accept ride request' },
      { status: 500 }
    );
  }
}