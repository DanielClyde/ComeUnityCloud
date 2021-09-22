import { Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { Event } from './models/Event';
import { Rsvp } from './models/RSVP';
import { User } from './models/User';
import { EventService } from './services/event.service';
import { RsvpService } from './services/rsvp.service';
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
    users: new UserService(db, db.collection<User>(UserService.collectionName)),
    events: new EventService(db, db.collection<Event>(EventService.collectionName)),
    rsvps: new RsvpService(db, db.collection<Rsvp>(RsvpService.collectionName)),
  }
}
export interface DB {
  client: MongoClient;
  db: Db;
  users: UserService;
  events: EventService,
  rsvps: RsvpService,
}
