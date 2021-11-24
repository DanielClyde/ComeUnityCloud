import { Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { User, Event, Rsvp } from 'comeunitymodels';
import { EventService } from './services/event.service';
import { RsvpService } from './services/rsvp.service';
import { UserService } from './services/user.service';

const MONGO_LOCAL_URI = 'mongodb://localhost:27017/?readPreference=primary&ssl=false';
const LOCAL_DB_NAME = 'cloud';

export async function CreateDB(): Promise<DB> {
  console.log('Connecting to DB...', process.env.MONGO_URI || MONGO_LOCAL_URI);
  const client = await MongoClient.connect(process.env.MONGO_URI || MONGO_LOCAL_URI);
  const db = client.db(process.env.DB_NAME || LOCAL_DB_NAME);
  const events = new EventService(db, db.collection<Event>(EventService.collectionName));
  await events.init();
  return {
    client,
    db,
    users: new UserService(db, db.collection<User>(UserService.collectionName)),
    events,
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
