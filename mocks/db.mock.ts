import { Rsvp } from '../src/db/models/RSVP';
import { User } from '../src/db/models/User';
import { DB } from '../src/db/db';
import { MongoClient, Db } from 'mongodb';
import { UserService } from '../src/db/services/user.service';
import { RsvpService } from '../src/db/services/rsvp.service';
import { EventService } from '../src/db/services/event.service';
import { Event } from '../src/db/models/Event';

export class MockDB {
  private static db: DB | null;

  static async GetDB(): Promise<DB> {
    if (MockDB.db) {
      return MockDB.db;
    } else {
      MockDB.db = await MockDB.CreateMockDB();
      return MockDB.db;
    }
  }

  static async ClearDB(): Promise<void> {
    if (MockDB.db) {
      const promises: Promise<any>[] = [];
      const collections = await MockDB.db.db.collections();
      collections.forEach((c) => {
        promises.push(c.deleteMany({}));
      });
      await Promise.all(promises);
    } else {
      return Promise.resolve();
    }
  }

  static async DestroyDB(): Promise<void> {
    if (MockDB.db) {
      await MockDB.db.db.dropDatabase();
      await MockDB.db.client.close();
      MockDB.db = null;
    }
  }

  private static async CreateMockDB(): Promise<DB> {
    const client = await MongoClient.connect('mongodb://localhost:27017/?readPreference=primary&ssl=false');
    const db = client.db(`ComeUnityTest-${new Date().getTime()}`);
    return {
      client,
      db,
      users: new UserService(db, db.collection<User>(UserService.collectionName)),
      events: new EventService(db, db.collection<Event>(EventService.collectionName)),
      rsvps: new RsvpService(db, db.collection<Rsvp>(RsvpService.collectionName)),
    };
  }

}
