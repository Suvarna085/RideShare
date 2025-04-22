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
    
    // Check if user is authorized to cancel the ride (rider or driver)
    if (!ride.rider.equals(objectUserId) && 
        (!ride.driver || !ride.driver.equals(objectUserId))) {
      return NextResponse.json(
        { success: false, message: 'Only the ride creator or driver can cancel this ride' },
        { status: 403 }
      );
    }
    
    // Use Mongoose to update the ride status
    const result = await Ride.updateOne(
      { _id: new mongoose.Types.ObjectId(rideId) },
      {
        $set: {
          status: 'Cancelled',
          cancelledBy: objectUserId,
          cancelledAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to cancel ride' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Ride cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling ride:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to cancel ride' },
      { status: 500 }
    );
  }
}
