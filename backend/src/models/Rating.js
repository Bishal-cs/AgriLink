import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    raterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rateeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Prevent duplicate ratings — one rating per rater per order
ratingSchema.index({ orderId: 1, raterId: 1 }, { unique: true });
ratingSchema.index({ rateeId: 1 });

export default mongoose.model('Rating', ratingSchema);
