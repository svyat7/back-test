import { faker } from "@faker-js/faker";
import { Collection, Db, MongoClient } from "mongodb";

import dotenv from "dotenv";
import { Customer } from "./interfaces";
dotenv.config();

const client: MongoClient = new MongoClient(process.env.DB_URI as string);
client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error(err);
  });
const db: Db = client.db();
const customers: Collection<Customer> = db.collection("customers");

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
  } as Customer;
  await customers.insertOne(customer);
}, 200);
