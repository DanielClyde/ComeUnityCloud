import { S3Adapter } from './../../web/adapters/s3.adapter';
import { ObjectID } from 'bson';
import { Comment, EventDTO, Event } from 'comeunitymodels';
import { Collection } from 'mongodb';
import { Db } from 'mongodb';

export type EventUpdate = Partial<EventDTO>;

export class EventService {
  public static collectionName = 'events';
  public db: Db;
  public collection: Collection<Event>;

  constructor(db: Db, collection: Collection<Event>) {
    this.db = db;
    this.collection = collection;
  }

  async init() {
    await this.checkIndexes();
  }

  async createEvent(info: EventDTO, s3: S3Adapter): Promise<{ success: boolean, event?: Event }> {
    info.createdAt = info.createdAt || new Date();
    info._id = info._id || new ObjectID().toHexString();
    if (info.imgUrl?.startsWith('data:image')) {
      const s3Upload = await s3.putImage('udowneventimages', info._id, info.imgUrl);
      if (s3Upload.success) {
        info.imgUrl = 'https://s3-us-east-2.amazonaws.com/udowneventimages/' + info._id;
      }
    }
    try {
      await this.collection.insertOne(info);
      return {
        success: true,
        event: new Event(info),
      }
    } catch (e) {
      console.log(e);
      return { success: false };
    }
  }

  async findByCreator(userId: string): Promise<Event[]> {
    const docs = await this.collection.find({
      createdBy: userId,
      deletedAt: { $exists: false },
    }).toArray();

    return docs ? docs.map((d) => new Event(d)) : [];
  }

  async findByDistance(coordinates: [number, number], distanceInMeters: number): Promise<Event[]> {
    const docs = await this.collection.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates},
          maxDistance: distanceInMeters,
          distanceField: 'distanceInMeters',
          spherical: true,
        },
      },
    ]).toArray();
    return docs.map((d: any) => {
      const e = new Event(d);
      e.distanceInMeters = Math.floor(d.distanceInMeters);
      return e;
    });
  }

  findById(id: string): Promise<Event | null> {
    return this.collection.findOne({ _id: id, deletedAt: { $exists: false } }).then((eventDTO) => {
      return eventDTO ? new Event(eventDTO) : null;
    });
  }

  async updateById(id: string, update: EventUpdate): Promise<{ success: boolean, event?: Event }> {
    update.updatedAt = new Date();
    try {
      const res = await this.collection.findOneAndUpdate(
        {
          _id: id,
          deletedAt: { $exists: false },
        },
        {
          $set: update,
        },
        { returnDocument: 'after' }
      );
      if (res.value) {
        return { success: true, event: new Event(res.value) };
      } else {
        return { success: false };
      }
    } catch (e) {
      return { success: false };
    }
  }

  async postAnnouncementToEvent(id: string, announcement: Comment): Promise<{ success: boolean, event?: Event }> {
    announcement.createdAt = announcement.createdAt || new Date();
    announcement._id = announcement._id || new ObjectID().toHexString();
    try {
      const res = await this.collection.findOneAndUpdate(
        {
          _id: id,
          deletedAt: { $exists: false },
        },
        {
          $push: { 'announcements': announcement },
        },
        { returnDocument: 'after' },
      );
      if (res.value) {
        return { success: true, event: new Event(res.value) };
      } else {
        return { success: false };
      }
    } catch (e) {
      return { success: false };
    }
  }

  async postCommentToEvent(id: string, comment: Comment): Promise<{ success: boolean, event?: Event }> {
    comment.createdAt = comment.createdAt || new Date();
    comment._id = comment._id || new ObjectID().toHexString();
    try {
      const res = await this.collection.findOneAndUpdate(
        {
          _id: id,
          deletedAt: { $exists: false },
        },
        {
          $push: { 'comments': comment },
        },
        { returnDocument: 'after' },
      );
      if (res.value) {
        return { success: true, event: new Event(res.value) };
      } else {
        return { success: false };
      }
    } catch (e) {
      return { success: false };
    }
  }

  private async checkIndexes() {
    await this.collection.createIndex({'address.coords': '2dsphere'});
  }


}
