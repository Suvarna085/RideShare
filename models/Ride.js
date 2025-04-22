import mongoose from 'mongoose';

const { Schema } = mongoose;

const RideSchema = new Schema({
  source: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  seats: {
    type: Number,
    default: 1,
  },
  notes: {
    type: String,
    default: '',
  },
  rider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  passengers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  availableSeats: {
    type: Number,
    default: 0,
  },
  isRequest: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the model only if it doesn't exist (prevents mongoose overwrite error)
export default mongoose.models.Ride || mongoose.model('Ride', RideSchema);