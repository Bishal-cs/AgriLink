import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import CropListing from './models/CropListing.js';
import Offer from './models/Offer.js';
import Order from './models/Order.js';
import StorageFacility from './models/StorageFacility.js';
import Booking from './models/Booking.js';
import Rating from './models/Rating.js';
import Notification from './models/Notification.js';

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...\n');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    CropListing.deleteMany({}),
    Offer.deleteMany({}),
    Order.deleteMany({}),
    StorageFacility.deleteMany({}),
    Booking.deleteMany({}),
    Rating.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑️  Cleared all collections');

  // --- Users ---
  const users = await User.create([
    {
      name: 'Rajesh Patel',
      email: 'farmer1@agrilink.com',
      phone: '9876543210',
      role: 'farmer',
      passwordHash: 'password123',
      isVerified: true,
      location: { type: 'Point', coordinates: [72.8777, 19.076] }, // Mumbai
      address: 'Nashik Road, Maharashtra',
    },
    {
      name: 'Sunita Devi',
      email: 'farmer2@agrilink.com',
      phone: '9876543211',
      role: 'farmer',
      passwordHash: 'password123',
      isVerified: true,
      location: { type: 'Point', coordinates: [77.209, 28.6139] }, // Delhi
      address: 'Sonipat, Haryana',
    },
    {
      name: 'Arjun Reddy',
      email: 'farmer3@agrilink.com',
      phone: '9876543212',
      role: 'farmer',
      passwordHash: 'password123',
      isVerified: false,
      location: { type: 'Point', coordinates: [78.4867, 17.385] }, // Hyderabad
      address: 'Warangal, Telangana',
    },
    {
      name: 'Vikram Singh',
      email: 'farmer4@agrilink.com',
      phone: '9876543213',
      role: 'farmer',
      passwordHash: 'password123',
      isVerified: true,
      location: { type: 'Point', coordinates: [75.7873, 26.9124] }, // Jaipur
      address: 'Alwar, Rajasthan',
    },
    {
      name: 'Meena Kumari',
      email: 'farmer5@agrilink.com',
      phone: '9876543214',
      role: 'farmer',
      passwordHash: 'password123',
      isVerified: true,
      location: { type: 'Point', coordinates: [80.9462, 26.8467] }, // Lucknow
      address: 'Barabanki, UP',
    },
    {
      name: 'Amit Agarwal',
      email: 'distributor1@agrilink.com',
      phone: '9876543220',
      role: 'distributor',
      passwordHash: 'password123',
      isVerified: true,
      location: { type: 'Point', coordinates: [72.8777, 19.076] },
      address: 'Vashi APMC, Navi Mumbai',
    },
    {
      name: 'Priya Sharma',
      email: 'distributor2@agrilink.com',
      phone: '9876543221',
      role: 'distributor',
      passwordHash: 'password123',
      isVerified: true,
      location: { type: 'Point', coordinates: [77.209, 28.6139] },
      address: 'Azadpur Mandi, Delhi',
    },
    {
      name: 'Ravi Kumar',
      email: 'distributor3@agrilink.com',
      phone: '9876543222',
      role: 'distributor',
      passwordHash: 'password123',
      isVerified: false,
      location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // Bangalore
      address: 'KR Market, Bangalore',
    },
    {
      name: 'Cold Store Solutions',
      email: 'storage1@agrilink.com',
      phone: '9876543230',
      role: 'storage_owner',
      passwordHash: 'password123',
      isVerified: true,
      location: { type: 'Point', coordinates: [72.9, 19.1] },
      address: 'Bhiwandi, Maharashtra',
    },
    {
      name: 'FreshKeep Storage',
      email: 'storage2@agrilink.com',
      phone: '9876543231',
      role: 'storage_owner',
      passwordHash: 'password123',
      isVerified: true,
      location: { type: 'Point', coordinates: [77.3, 28.7] },
      address: 'Kundli, Haryana',
    },
    {
      name: 'Admin AgriLink',
      email: 'admin@agrilink.com',
      phone: '9876543200',
      role: 'admin',
      passwordHash: 'admin123',
      isVerified: true,
      location: { type: 'Point', coordinates: [77.209, 28.6139] },
      address: 'AgriLink HQ, Delhi',
    },
  ]);

  console.log(`✅ Created ${users.length} users`);

  const farmers = users.filter((u) => u.role === 'farmer');
  const distributors = users.filter((u) => u.role === 'distributor');
  const storageOwners = users.filter((u) => u.role === 'storage_owner');

  // --- Crop Listings ---
  const listings = await CropListing.create([
    {
      farmerId: farmers[0]._id,
      cropType: 'Tomato',
      quantity: 500,
      unit: 'kg',
      expectedPrice: 25,
      harvestDate: new Date('2026-06-01'),
      urgency: 'high',
      status: 'active',
      location: farmers[0].location,
      description: 'Fresh organic tomatoes from Nashik farm. Bright red, firm texture. Ready for immediate pickup.',
    },
    {
      farmerId: farmers[0]._id,
      cropType: 'Onion',
      quantity: 2000,
      unit: 'kg',
      expectedPrice: 18,
      harvestDate: new Date('2026-05-28'),
      urgency: 'critical',
      status: 'active',
      location: farmers[0].location,
      description: 'Premium quality red onions. Large size, high shelf life. Need to sell urgently before monsoon.',
    },
    {
      farmerId: farmers[1]._id,
      cropType: 'Wheat',
      quantity: 50,
      unit: 'quintal',
      expectedPrice: 2200,
      harvestDate: new Date('2026-04-15'),
      urgency: 'medium',
      status: 'active',
      location: farmers[1].location,
      description: 'High-quality Sharbati wheat from Haryana. Clean grain, low moisture content.',
    },
    {
      farmerId: farmers[1]._id,
      cropType: 'Rice (Basmati)',
      quantity: 30,
      unit: 'quintal',
      expectedPrice: 3500,
      harvestDate: new Date('2026-05-20'),
      urgency: 'low',
      status: 'active',
      location: farmers[1].location,
      description: 'Aged Basmati rice, 1121 variety. Excellent aroma and grain length.',
    },
    {
      farmerId: farmers[2]._id,
      cropType: 'Cotton',
      quantity: 100,
      unit: 'quintal',
      expectedPrice: 6000,
      harvestDate: new Date('2026-05-25'),
      urgency: 'medium',
      status: 'active',
      location: farmers[2].location,
      description: 'Good quality cotton from Telangana. Long staple, suitable for textile mills.',
    },
    {
      farmerId: farmers[2]._id,
      cropType: 'Chilli (Red)',
      quantity: 800,
      unit: 'kg',
      expectedPrice: 120,
      harvestDate: new Date('2026-06-05'),
      urgency: 'high',
      status: 'active',
      location: farmers[2].location,
      description: 'Guntur chillies, high heat index. Sun-dried, ready for packing.',
    },
    {
      farmerId: farmers[3]._id,
      cropType: 'Mustard',
      quantity: 40,
      unit: 'quintal',
      expectedPrice: 5200,
      harvestDate: new Date('2026-03-10'),
      urgency: 'low',
      status: 'active',
      location: farmers[3].location,
      description: 'Premium mustard seeds from Rajasthan. High oil content, clean and sorted.',
    },
    {
      farmerId: farmers[3]._id,
      cropType: 'Potato',
      quantity: 3000,
      unit: 'kg',
      expectedPrice: 12,
      harvestDate: new Date('2026-05-30'),
      urgency: 'critical',
      status: 'active',
      location: farmers[3].location,
      description: 'Fresh potatoes, Kufri Jyoti variety. Need cold storage urgently.',
    },
    {
      farmerId: farmers[4]._id,
      cropType: 'Sugarcane',
      quantity: 200,
      unit: 'ton',
      expectedPrice: 350,
      harvestDate: new Date('2026-06-10'),
      urgency: 'medium',
      status: 'active',
      location: farmers[4].location,
      description: 'CO-0238 variety sugarcane. Good sucrose content, ready for crushing.',
    },
    {
      farmerId: farmers[4]._id,
      cropType: 'Mango (Dasheri)',
      quantity: 1500,
      unit: 'kg',
      expectedPrice: 60,
      harvestDate: new Date('2026-06-15'),
      urgency: 'high',
      status: 'active',
      location: farmers[4].location,
      description: 'Dasheri mangoes from Lucknow. Sweet, aromatic, perfect ripeness. Perishable — needs quick sale.',
    },
    {
      farmerId: farmers[0]._id,
      cropType: 'Grapes',
      quantity: 1000,
      unit: 'kg',
      expectedPrice: 45,
      harvestDate: new Date('2026-03-01'),
      urgency: 'low',
      status: 'sold',
      location: farmers[0].location,
      description: 'Thompson seedless grapes. Export quality.',
    },
    {
      farmerId: farmers[1]._id,
      cropType: 'Carrot',
      quantity: 600,
      unit: 'kg',
      expectedPrice: 20,
      harvestDate: new Date('2026-04-20'),
      urgency: 'medium',
      status: 'active',
      location: farmers[1].location,
      description: 'Fresh orange carrots, washed and graded. Suitable for retail.',
    },
  ]);

  console.log(`✅ Created ${listings.length} crop listings`);

  // --- Storage Facilities ---
  const facilities = await StorageFacility.create([
    {
      ownerId: storageOwners[0]._id,
      name: 'Cold Store Solutions — Unit A',
      totalCapacity: 500,
      usedCapacity: 120,
      pricePerTon: 50,
      location: storageOwners[0].location,
      address: 'Plot 45, MIDC Bhiwandi, Maharashtra',
      isAvailable: true,
      features: ['Temperature Controlled', 'Humidity Controlled', '24/7 Security', 'Loading Dock'],
      description: 'Modern cold storage facility with automated temperature control. Suitable for fruits, vegetables, and dairy products.',
    },
    {
      ownerId: storageOwners[0]._id,
      name: 'Cold Store Solutions — Unit B',
      totalCapacity: 300,
      usedCapacity: 280,
      pricePerTon: 45,
      location: { type: 'Point', coordinates: [72.85, 19.05] },
      address: 'Warehouse Complex, Panvel, Maharashtra',
      isAvailable: false,
      features: ['Temperature Controlled', 'Forklift Access'],
      description: 'Smaller unit primarily for onion and potato storage. Currently near capacity.',
    },
    {
      ownerId: storageOwners[1]._id,
      name: 'FreshKeep Cold Storage',
      totalCapacity: 1000,
      usedCapacity: 350,
      pricePerTon: 40,
      location: storageOwners[1].location,
      address: 'NH-1, Kundli Industrial Area, Haryana',
      isAvailable: true,
      features: ['Temperature Controlled', 'Humidity Controlled', 'Multi-Chamber', '24/7 Security', 'Weighbridge'],
      description: 'Large-scale multi-chamber cold storage on national highway. Easy truck access. Separate chambers for different produce types.',
    },
    {
      ownerId: storageOwners[1]._id,
      name: 'FreshKeep Dry Storage',
      totalCapacity: 2000,
      usedCapacity: 800,
      pricePerTon: 25,
      location: { type: 'Point', coordinates: [77.35, 28.75] },
      address: 'Grain Market, Sonipat, Haryana',
      isAvailable: true,
      features: ['Ventilated', 'Pest Control', 'Weighbridge', 'Loading Ramp'],
      description: 'Large dry storage warehouse for grains and pulses. Fumigation services available.',
    },
  ]);

  console.log(`✅ Created ${facilities.length} storage facilities`);

  // --- Offers ---
  const offers = await Offer.create([
    {
      listingId: listings[0]._id, // Tomato
      distributorId: distributors[0]._id,
      offeredPrice: 22,
      quantity: 500,
      pickupDate: new Date('2026-06-03'),
      status: 'pending',
      notes: 'Can pick up the entire lot. Our trucks are ready.',
    },
    {
      listingId: listings[0]._id, // Tomato
      distributorId: distributors[1]._id,
      offeredPrice: 24,
      quantity: 300,
      pickupDate: new Date('2026-06-02'),
      status: 'pending',
      notes: 'Need 300kg for Delhi market. Will pay premium for quality.',
    },
    {
      listingId: listings[1]._id, // Onion
      distributorId: distributors[0]._id,
      offeredPrice: 16,
      quantity: 2000,
      pickupDate: new Date('2026-05-30'),
      status: 'pending',
      notes: 'Bulk purchase for export. Need the entire lot.',
    },
    {
      listingId: listings[2]._id, // Wheat
      distributorId: distributors[1]._id,
      offeredPrice: 2100,
      quantity: 50,
      pickupDate: new Date('2026-06-05'),
      status: 'accepted',
      notes: 'Premium wheat for flour mills in North India.',
    },
    {
      listingId: listings[10]._id, // Grapes (sold)
      distributorId: distributors[0]._id,
      offeredPrice: 42,
      quantity: 1000,
      pickupDate: new Date('2026-03-05'),
      status: 'accepted',
      notes: 'Export quality grapes.',
    },
  ]);

  console.log(`✅ Created ${offers.length} offers`);

  // --- Orders ---
  const orders = await Order.create([
    {
      listingId: listings[2]._id, // Wheat
      farmerId: farmers[1]._id,
      distributorId: distributors[1]._id,
      offerId: offers[3]._id,
      totalAmount: 2100 * 50,
      status: 'pickup_scheduled',
      timeline: [
        { status: 'confirmed', timestamp: new Date('2026-05-20'), note: 'Order confirmed' },
        { status: 'pickup_scheduled', timestamp: new Date('2026-05-22'), note: 'Pickup scheduled for June 5' },
      ],
    },
    {
      listingId: listings[10]._id, // Grapes (completed)
      farmerId: farmers[0]._id,
      distributorId: distributors[0]._id,
      offerId: offers[4]._id,
      totalAmount: 42 * 1000,
      status: 'completed',
      timeline: [
        { status: 'confirmed', timestamp: new Date('2026-03-02'), note: 'Order confirmed' },
        { status: 'pickup_scheduled', timestamp: new Date('2026-03-03'), note: 'Pickup scheduled' },
        { status: 'in_transit', timestamp: new Date('2026-03-05'), note: 'In transit to Vashi APMC' },
        { status: 'delivered', timestamp: new Date('2026-03-05'), note: 'Delivered at Vashi APMC' },
        { status: 'completed', timestamp: new Date('2026-03-06'), note: 'Order completed. Payment received.' },
      ],
    },
  ]);

  console.log(`✅ Created ${orders.length} orders`);

  // --- Bookings ---
  const bookings = await Booking.create([
    {
      facilityId: facilities[0]._id,
      bookerId: farmers[3]._id, // Potato farmer needs cold storage
      quantity: 3,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-15'),
      status: 'pending',
      totalCost: 15 * 3 * 50,
    },
    {
      facilityId: facilities[2]._id,
      bookerId: farmers[4]._id, // Mango farmer
      quantity: 1.5,
      startDate: new Date('2026-06-16'),
      endDate: new Date('2026-06-30'),
      status: 'confirmed',
      totalCost: 15 * 1.5 * 40,
    },
  ]);

  console.log(`✅ Created ${bookings.length} bookings`);

  // --- Ratings ---
  const ratings = await Rating.create([
    {
      orderId: orders[1]._id,
      raterId: farmers[0]._id,
      rateeId: distributors[0]._id,
      score: 5,
      review: 'Excellent buyer. Paid on time and handled produce with care.',
    },
    {
      orderId: orders[1]._id,
      raterId: distributors[0]._id,
      rateeId: farmers[0]._id,
      score: 4,
      review: 'Good quality grapes. Slightly delayed harvest but overall satisfied.',
    },
  ]);

  console.log(`✅ Created ${ratings.length} ratings`);

  // --- Notifications ---
  await Notification.create([
    {
      userId: farmers[0]._id,
      type: 'offer',
      message: 'You have a new offer from Amit Agarwal on your Tomato listing',
      relatedId: offers[0]._id,
    },
    {
      userId: farmers[0]._id,
      type: 'offer',
      message: 'You have a new offer from Priya Sharma on your Tomato listing',
      relatedId: offers[1]._id,
    },
    {
      userId: farmers[0]._id,
      type: 'offer',
      message: 'You have a new offer from Amit Agarwal on your Onion listing',
      relatedId: offers[2]._id,
    },
    {
      userId: farmers[3]._id,
      type: 'booking',
      message: 'Your cold storage booking request has been submitted',
      relatedId: bookings[0]._id,
    },
    {
      userId: farmers[4]._id,
      type: 'booking',
      message: 'Storage booking confirmed at FreshKeep Cold Storage',
      isRead: true,
      relatedId: bookings[1]._id,
    },
    {
      userId: distributors[0]._id,
      type: 'order',
      message: 'Order completed. Please leave a review!',
      isRead: true,
      relatedId: orders[1]._id,
    },
  ]);

  console.log(`✅ Created 6 notifications`);

  console.log('\n🎉 Seed complete! Login credentials:');
  console.log('─────────────────────────────────────');
  console.log('Farmers:');
  console.log('  farmer1@agrilink.com / password123  (Rajesh Patel)');
  console.log('  farmer2@agrilink.com / password123  (Sunita Devi)');
  console.log('  farmer3@agrilink.com / password123  (Arjun Reddy)');
  console.log('  farmer4@agrilink.com / password123  (Vikram Singh)');
  console.log('  farmer5@agrilink.com / password123  (Meena Kumari)');
  console.log('Distributors:');
  console.log('  distributor1@agrilink.com / password123  (Amit Agarwal)');
  console.log('  distributor2@agrilink.com / password123  (Priya Sharma)');
  console.log('  distributor3@agrilink.com / password123  (Ravi Kumar)');
  console.log('Storage Owners:');
  console.log('  storage1@agrilink.com / password123  (Cold Store Solutions)');
  console.log('  storage2@agrilink.com / password123  (FreshKeep Storage)');
  console.log('Admin:');
  console.log('  admin@agrilink.com / admin123');
  console.log('─────────────────────────────────────\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
