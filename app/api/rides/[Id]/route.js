import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { Id } = params;
    
    // Validate ride ID
    if (!Id || !ObjectId.isValid(Id)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid ride ID' 
      }, { status: 400 });
    }
    
    // Connect to database
    const { db } = await connect();
    
    // Find the ride with populated references
    const ride = await db.collection('rides').aggregate([
      { $match: { _id: new ObjectId(id) } },
      { $lookup: {
          from: 'users',
          localField: 'driver',
          foreignField: '_id',
          as: 'driverDetails'
        }
      },
      { $lookup: {
          from: 'users',
          localField: 'rider',
          foreignField: '_id',
          as: 'riderDetails'
        }
      },
      { $lookup: {
          from: 'users',
          localField: 'passengers',
          foreignField: '_id',
          as: 'passengerDetails'
        }
      },
      { $project: {
          _id: 1,
          source: 1,
          destination: 1,
          date: 1,
          time: 1,
          availableSeats: 1,
          status: 1,
          notes: 1,
          driver: 1,
          rider: 1,
          passengers: 1,
          driverDetails: { 
            _id: 1, 
            name: 1, 
            email: 1, 
            phone: 1, 
            profileImage: 1
          },
          riderDetails: { 
            _id: 1, 
            name: 1, 
            email: 1, 
            phone: 1, 
            profileImage: 1  
          },
          passengerDetails: { 
            _id: 1, 
            name: 1, 
            email: 1, 
            phone: 1, 
            profileImage: 1
          }
        }
      }
    ]).toArray();
    
    if (!ride || ride.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Ride not found' 
      }, { status: 404 });
    }
    
    // Format the data for easier consumption by the frontend
    const formattedRide = {
      ...ride[0],
      driver: ride[0].driverDetails?.length > 0 ? ride[0].driverDetails[0] : null,
      rider: ride[0].riderDetails?.length > 0 ? ride[0].riderDetails[0] : null,
      passengers: ride[0].passengerDetails || []
    };
    
    // Remove the lookup arrays
    delete formattedRide.driverDetails;
    delete formattedRide.riderDetails;
    delete formattedRide.passengerDetails;
    
    return NextResponse.json({ 
      success: true, 
      ride: formattedRide 
    });
    
  } catch (error) {
    console.error('Error fetching ride details:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}