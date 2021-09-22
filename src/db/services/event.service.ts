import { ObjectID } from 'bson';
import { Comment, EventDTO } from './../models/Event';
import { Collection } from 'mongodb';
import { Db } from 'mongodb';
import { Event } from '../models/Event';

export type EventUpdate = Partial<EventDTO>;

export class EventService {
  public static collectionName = 'events';
  public db: Db;
  public collection: Collection<Event>;

  constructor(db: Db, collection: Collection<Event>) {
    this.db = db;
    this.collection = collection;
  }

  async createEvent(info: EventDTO): Promise<{ success: boolean, event?: Event }> {
    info.createdAt = info.createdAt || new Date();
    info._id = info._id || new ObjectID();
    try {
      await this.collection.insertOne(info);
      return {
        success: true,
        event: new Event(info),
      }
    } catch (e) {
      return { success: false };
    }
  }

  findById(id: ObjectID): Promise<Event | null> {
    return this.collection.findOne({ _id: id, deletedAt: { $exists: false } }).then((eventDTO) => {
      return eventDTO ? new Event(eventDTO) : null;
    });
  }

  async updateById(id: ObjectID, update: EventUpdate): Promise<{ success: boolean, event?: Event }> {
    update.updatedAt = new Date();
    try {
      const res = await this.collection.findOneAndUpdate(
        {
          _id: id,
          deletedAt: { $exists: false },
        },
        {
          $set: update,
        }
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

  async postAnnouncementToEvent(id: ObjectID, announcement: Comment): Promise<{ success: boolean, event?: Event }> {
    announcement.createdAt = announcement.createdAt || new Date();
    announcement._id = announcement._id || new ObjectID();
    try {
      const res = await this.collection.findOneAndUpdate(
        {
          _id: id,
          deletedAt: { $exists: false },
        },
        {
          $push: { 'announcements': announcement },
        }
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

  async postCommentToEvent(id: ObjectID, comment: Comment): Promise<{ success: boolean, event?: Event }> {
    comment.createdAt = comment.createdAt || new Date();
    comment._id = comment._id || new ObjectID();
    try {
      const res = await this.collection.findOneAndUpdate(
        {
          _id: id,
          deletedAt: { $exists: false },
        },
        {
          $push: { 'comments': comment },
        }
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
}
