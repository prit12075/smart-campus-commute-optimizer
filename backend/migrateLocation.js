require('dotenv').config();
const mongoose = require('mongoose');
const Ride = require('./models/Ride');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  const rides = await Ride.find({});
  let updated = 0;
  for (let ride of rides) {
    if (ride.pickup && ride.pickup.lng && ride.pickup.lat) {
      ride.location = {
        type: 'Point',
        coordinates: [ride.pickup.lng, ride.pickup.lat],
      };
      await ride.save({ validateBeforeSave: false }); // Avoid triggering other validations
      updated++;
    }
  }
  console.log(`Migrated ${updated} rides to use 2dsphere location index.`);
  process.exit(0);
}
migrate();
