import mongoose from 'mongoose';

const cropListingSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.1, 'Quantity must be positive'],
    },
    unit: {
      type: String,
      enum: ['kg', 'ton', 'quintal'],
      default: 'kg',
    },
    expectedPrice: {
      type: Number,
      required: [true, 'Expected price is required'],
      min: [0, 'Price must be positive'],
    },
    harvestDate: {
      type: Date,
      required: [true, 'Harvest date is required'],
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'expired', 'cancelled'],
      default: 'active',
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
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

cropListingSchema.index({ location: '2dsphere' });
cropListingSchema.index({ status: 1, cropType: 1 });
cropListingSchema.index({ farmerId: 1 });

export default mongoose.model('CropListing', cropListingSchema);
