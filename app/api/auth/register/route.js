import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    const {
      name,
      email,
      password,
      role,
      homeLocation,
      workLocation,
      vehicleDetails,
      licenseNumber,
    } = await request.json();

    console.log("📥 Incoming registration data:", {
      name,
      email,
      role,
      homeLocation,
      workLocation,
      vehicleDetails,
      licenseNumber,
    });

    // Connect to MongoDB
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      // Make sure role is lowercase to match schema
      role: role.toLowerCase(),
      homeLocation,
      workLocation,
      // Modify this condition to check for lowercase 'driver' or 'admin'
      ...(role.toLowerCase() === 'driver' || role.toLowerCase() === 'admin' ? { vehicleDetails, licenseNumber } : {}),
    });

    // Save user with error handling
    await user.save().catch(err => {
      console.error("❌ Error saving user:", err);
      throw new Error(`Validation failed: ${err.message}`);
    });

    console.log("✅ User registered successfully:", user._id);

    // Prepare response (excluding password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return NextResponse.json(
      { success: true, message: 'User registered successfully', user: userResponse },
      { status: 201 }
    );
  } catch (error) {
    console.error('🚨 Registration error:', error.message || error);
    return NextResponse.json(
      { success: false, message: 'Registration failed', error: error.message || error },
      { status: 500 }
    );
  }
}
