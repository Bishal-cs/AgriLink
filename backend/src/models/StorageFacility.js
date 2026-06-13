import mongoose from 'mongoose';

const storageFacilitySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [0.1, 'Capacity must be positive'],
    },
    usedCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    pricePerTon: {
      type: Number,
      required: [true, 'Price per ton is required'],
      min: [0, 'Price must be positive'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    address: {
      type: String,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    features: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

storageFacilitySchema.index({ location: '2dsphere' });
storageFacilitySchema.index({ ownerId: 1 });

export default mongoose.model('StorageFacility', storageFacilitySchema);
