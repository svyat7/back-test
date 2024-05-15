import { ChangeStreamDocument, Collection, Db, MongoClient } from "mongodb";
import crypto from "crypto";
import dotenv from "dotenv";
import { Customer } from "./interfaces";
dotenv.config();

const BATCH_SIZE = 1000;
const BATCH_TIME = 1000;

let batchIfNotSaved: Customer[] = [];
let batch: Customer[] = [];
let batchTimer: NodeJS.Timeout | null = null;

const client = new MongoClient(process.env.DB_URI as string);
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
const customersAnonymised: Collection<Customer> = db.collection(
  "customers_anonymised",
);
const metadata: Collection<any> = db.collection("metadata");
let resumeToken;
const metadataDoc = metadata
  .findOne({ _id: "resumeToken" })
  .then((doc) => {
    if (doc) {
      resumeToken = doc.value;
    }
  })
  .catch((err) => {
    console.error(err);
  });

const anonymise = (data: Customer) => {
  const anonymisedData = { ...data };
  anonymisedData.firstName = crypto.randomBytes(4).toString("hex");
  anonymisedData.lastName = crypto.randomBytes(4).toString("hex");
  anonymisedData.email = `${crypto.randomBytes(4).toString("hex")}@${data.email.split("@")[1]}`;
  anonymisedData.address.line1 = crypto.randomBytes(4).toString("hex");
  anonymisedData.address.line2 = crypto.randomBytes(4).toString("hex");
  anonymisedData.address.postcode = crypto.randomBytes(4).toString("hex");
  return anonymisedData;
};

const processBatch = async () => {
  if (batch.length > 0) {
    const anonymisedBatch = batch.map(anonymise);
    await customersAnonymised.insertMany(anonymisedBatch);
    batch = [];
  }
  batchTimer = null;
};

const changeStream = customers.watch([], { resumeAfter: resumeToken });
changeStream.on("change", async (change: ChangeStreamDocument<Customer>) => {
  if (change.operationType === "insert") {
    if (!resumeToken) {
      const customersStart = customers.find();
      for await (const doc of customersStart) {
        batchIfNotSaved.push(doc);
      }

      if (batchIfNotSaved.length > 0) {
        const anonymisedBatch = batchIfNotSaved.map(anonymise);
        await customersAnonymised.insertMany(anonymisedBatch);
        batchIfNotSaved = [];
      }
    }

    batch.push(change.fullDocument);
    if (batch.length >= BATCH_SIZE) {
      if (batchTimer) {
        clearTimeout(batchTimer);
        batchTimer = null;
      }
      await processBatch();
    } else if (!batchTimer) {
      batchTimer = setTimeout(processBatch, BATCH_TIME);
    }
  }
  resumeToken = change._id;
  await metadata.updateOne(
    { _id: "resumeToken" },
    { $set: { value: resumeToken } },
    { upsert: true },
  );
});

const reindex = async () => {
  customersAnonymised.deleteMany({});

  const cursor = customers.find();
  for await (const doc of cursor) {
    await customersAnonymised.insertOne(anonymise(doc));
  }
};

if (process.argv.includes("--full-reindex")) {
  reindex()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
