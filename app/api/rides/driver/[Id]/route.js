import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Ride from '@/models/Ride';

export async function GET(req, { params }) {
  const { Id } = params;

  if (!Id) {
    return NextResponse.json(
      { success: false, message: 'Driver ID is required' },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    // Fetch the rides where the user is the driver, populating both the driver and passenger details
    const rides = await Ride.find({ driver: Id })
      .populate('driver', 'name email')  // Populating driver details
      .populate('rider', 'name email')  // Add this only if `rider` is a separate field
      .populate('passengers', 'name email')  // Populating rider (passenger) details
      .sort({ date: 1, time: 1 });

    return NextResponse.json({ success: true, rides });
  } catch (error) {
    console.error('Error fetching driver rides:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch driver rides' },
      { status: 500 }
    );
  }
}
