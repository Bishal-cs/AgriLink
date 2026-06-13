import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema(
  {
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cropType: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'ton', 'quintal'],
      default: 'kg',
    },
    offeredPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    serviceRadius: {
      type: Number, // in kilometers
      default: 50,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['active', 'fulfilled', 'expired', 'cancelled'],
      default: 'active',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

requirementSchema.index({ location: '2dsphere' });
requirementSchema.index({ distributorId: 1 });
requirementSchema.index({ status: 1 });

export default mongoose.model('Requirement', requirementSchema);
