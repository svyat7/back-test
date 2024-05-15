import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const client = new MongoClient(process.env.DB_URI as string);
client.connect().then(() => {
    console.log('Connected to MongoDB');
    }).catch((err) => {
    console.error(err);
});
const db = client.db();
const customers = db.collection('customers');
const customersAnonymised = db.collection('customers_anonymised');

const anonymise = (data: any) => {
  const anonymisedData = { ...data };
  anonymisedData.firstName = crypto.randomBytes(4).toString('hex');
  anonymisedData.lastName = crypto.randomBytes(4).toString('hex');
  anonymisedData.email = `${crypto.randomBytes(4).toString('hex')}@${data.email.split('@')[1]}`;
  anonymisedData.address.line1 = crypto.randomBytes(4).toString('hex');
  anonymisedData.address.line2 = crypto.randomBytes(4).toString('hex');
  anonymisedData.address.postcode = crypto.randomBytes(4).toString('hex');
  return anonymisedData;
};

const changeStream = customers.watch();
changeStream.on('change', async (change) => {
  if (change.operationType === 'insert') {
    const anonymisedData = anonymise(change.fullDocument);
    console.log(anonymisedData);
    await customersAnonymised.insertOne(anonymisedData);
  }
});