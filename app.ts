import { faker } from '@faker-js/faker';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.DB_URI);

const client = new MongoClient(process.env.DB_URI as string)
client.connect().then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error(err);
});
const db = client.db();
const customers = db.collection('customers');

setInterval(async () => {
  const customer = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    address: {
      line1: faker.location.streetAddress(),
      line2: faker.location.secondaryAddress(),
      postcode: faker.location.zipCode(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
    },
    createdAt: new Date(),
  };
  await customers.insertOne(customer);
  console.log(await customers.countDocuments());
}, 200);
