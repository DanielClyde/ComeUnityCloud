import { Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { User } from './models/User';
import { UserService } from './services/user.service';

const MONGO_URI = 'mongodb+srv://comeUnityUser:kF8HwWgWgfFXupD.rXgd3e3v@cluster0.qabeq.mongodb.net/cloud?retryWrites=true&w=majority';
const DB_NAME = 'cloud';

export async function CreateDB(): Promise<DB> {
  console.log('Connecting to DB...');
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);
  return {
    client,
    db,
    users: new UserService(db, db.collection<User>(UserService.collectionName))
  }
}
export interface DB {
  client: MongoClient;
  db: Db;
  users: UserService;
}
