import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Ride from '@/models/Ride';
import User from '@/models/User';

export async function GET(req, { params }) {  // Destructure params directly in the function parameter
  const Id = params.Id;  // Now params is guaranteed to be resolved
  console.log('Rider ID param:', Id);

  if (!Id) {
    return NextResponse.json(
      { success: false, message: 'Rider ID is required' },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    // Find rides where the user is the rider and populate the passengers and driver
    const rides = await Ride.find({ rider: Id })
      .populate('driver', 'name')  // Populate the driver's name
      .populate('passengers', 'name')  // Populate the passenger names
      .sort({ date: 1, time: 1 });

    return NextResponse.json({ success: true, rides });
  } catch (error) {
    console.error('Error fetching rider rides:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch rider rides' },
      { status: 500 }
    );
  }
}
