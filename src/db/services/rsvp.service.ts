import { DeviceStats } from './../models/User';
import { ObjectID } from 'bson';
import { RsvpDTO, RsvpNotificationPreferences } from './../models/RSVP';
import { ClientSession, Collection, Filter, MatchKeysAndValues } from 'mongodb';
import { Db } from 'mongodb';
import { Rsvp } from '../models/RSVP';
export class RsvpService {
  public static collectionName = 'rsvps';
  public db: Db;
  public collection: Collection<Rsvp>;

  constructor(db: Db, collection: Collection<Rsvp>) {
    this.db = db;
    this.collection = collection;
  }

  async createRsvp(info: RsvpDTO): Promise<{ success: boolean, rsvp?: Rsvp }> {
    info.createdAt = info.createdAt || new Date();
    info._id = info._id || new ObjectID();
    try {
      await this.collection.insertOne(info);
      return {
        success: true,
        rsvp: new Rsvp(info),
      };
    } catch (e) {
      return { success: false };
    }
  }

  findById(id: ObjectID): Promise<Rsvp | null> {
    return this.collection.findOne({ _id: id, deletedAt: { $exists: false } }).then((rsvpDTO) => {
      return rsvpDTO ? new Rsvp(rsvpDTO) : null;
    });
  }

  async findAllForUser(userId: ObjectID): Promise<Rsvp[]> {
    const dtos = await this.collection.find({
      userId: userId,
      deletedAt: { $exists: false },
    }).toArray();
    return dtos ? dtos.map((dto) => new Rsvp(dto)) : [];
  }

  async findAllForEvent(eventId: ObjectID): Promise<Rsvp[]> {
    const dtos = await this.collection.find({
      eventId: eventId,
      deletedAt: { $exists: false },
    }).toArray();
    return dtos ? dtos.map((dto) => new Rsvp(dto)) : [];
  }

  async findAllToNotifyForEvent(eventId: ObjectID, notification: 'update' | 'announcement' | 'comment'): Promise<DeviceStats[]> {
    const filter: Filter<Rsvp> = {
      eventId: eventId,
      deletedAt: { $exists: false },
      'preferences.deviceToken': { $exists: true },
      'preferences.platform': { $exists: true },
      'preferences.notificationEndpointArn': { $exists: true },
    };
    if (notification === 'announcement') {
      filter['preferences.notifyOnAnnouncement'] = true;
    } else if (notification === 'comment') {
      filter['preferences.notifyOnComment'] = true;
    } else {
      filter['preferences.notifyOnUpdate'] = true;
    }
    const docs = await this.collection.find(filter).project({
      deviceToken: '$preferences.deviceToken',
      notificationEndpointArn: '$preferences.notificationEndpointArn',
      platform: '$preferences.platform',
    }).toArray();
    return docs || [];
  }

  async updateNotificationPreferencesForUser(userId: ObjectID, update: Partial<RsvpNotificationPreferences>): Promise<{ success: boolean, modifiedCount?: number }> {
    const preferenceUpdate: any = {};
    if (typeof update.notifyOnAnnouncement === 'boolean') {
      preferenceUpdate['preferences.notifyOnAnnouncement'] = update.notifyOnAnnouncement;
    }
    if (typeof update.notifyOnComment === 'boolean') {
      preferenceUpdate['preferences.notifyOnComment'] = update.notifyOnComment;
    }
    if (typeof update.notifyOnUpdates === 'boolean') {
      preferenceUpdate['preferences.notifyOnUpdate'] = update.notifyOnUpdates;
    }
    try {
      const res = await this.collection.updateMany(
        {
          userId: userId,
          deletedAt: { $exists: false },
        }, {
        $set: {
          'updatedAt': new Date(),
          'preferences': preferenceUpdate,
        },
      });
      if (res && res.acknowledged) {
        return { success: true, modifiedCount: res.modifiedCount };
      } else {
        return { success: false };
      }
    } catch (e) {
      return { success: false };
    }
  }

  async updateUserDeviceStatsOnRSVPs(userId: ObjectID, stats: DeviceStats, session?: ClientSession): Promise<{ success: boolean, modifiedCount?: number }> {
    const res = await this.collection.updateMany(
      {
        userId: userId,
        deletedAt: { $exists: false },
        $or: [
          { 'preferences.deviceToken': { $ne: stats.deviceToken } },
          { 'preferences.notificationEndpointArn': { $ne: stats.notificationEndpointArn } },
          { 'preferences.platform': { $ne: stats.platform } },
        ]
      },
      {
        $set: {
          'preferences.deviceToken': stats.deviceToken,
          'preferences.notificationEndpointArn': stats.notificationEndpointArn,
          'preferences.platform': stats.platform,
          updatedAt: new Date(),
        }
      },
      { session }
    );
    if (res && res.acknowledged) {
      return { success: true, modifiedCount: res.modifiedCount };
    } else {
      throw({ success: false });
    }
  }


}
