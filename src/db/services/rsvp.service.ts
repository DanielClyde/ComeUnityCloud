import {
  DeviceStats,
  RsvpDTO,
  Rsvp,
  RsvpNotificationPreferences,
} from 'comeunitymodels';
import { ObjectID } from 'bson';
import { ClientSession, Collection, Filter } from 'mongodb';
import { Db } from 'mongodb';
export class RsvpService {
  public static collectionName = 'rsvps';
  public db: Db;
  public collection: Collection<Rsvp>;

  constructor(db: Db, collection: Collection<Rsvp>) {
    this.db = db;
    this.collection = collection;
  }

  async createRsvp(info: RsvpDTO): Promise<{ success: boolean; rsvp?: Rsvp }> {
    info.createdAt = info.createdAt || new Date();
    info._id = info._id || new ObjectID().toHexString();
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

  findById(id: string): Promise<Rsvp | null> {
    return this.collection
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .then((rsvpDTO) => {
        return rsvpDTO ? new Rsvp(rsvpDTO) : null;
      });
  }

  async findAllForUser(userId: string): Promise<Rsvp[]> {
    const dtos = await this.collection
      .find({
        userId: userId,
        deletedAt: { $exists: false },
      })
      .toArray();
    return dtos ? dtos.map((dto) => new Rsvp(dto)) : [];
  }

  async findAllForEvent(eventId: string): Promise<Rsvp[]> {
    const dtos = await this.collection
      .find({
        eventId: eventId,
        deletedAt: { $exists: false },
      })
      .toArray();
    return dtos ? dtos.map((dto) => new Rsvp(dto)) : [];
  }

  async updateNotificationPreferencesOnRSVP(
    rsvpId: string,
    preferences: Partial<Omit<RsvpNotificationPreferences, keyof DeviceStats>>,
    session?: ClientSession
  ): Promise<{ success: boolean; rsvp?: Rsvp }> {
    const $set: any = {};
    if ('notifyOnAnnouncement' in preferences) {
      $set['preferences.notifyOnAnnouncement'] =
        preferences.notifyOnAnnouncement;
    }
    if ('notifyOnComment' in preferences) {
      $set['preferences.notifyOnComment'] = preferences.notifyOnComment;
    }
    if ('notifyOnUpdates' in preferences) {
      $set['preferences.notifyOnUpdates'] = preferences.notifyOnUpdates;
    }

    $set['updatedAt'] = new Date();
    const res = await this.collection.findOneAndUpdate(
      {
        _id: rsvpId,
        deletedAt: { $exists: false },
      },
      { $set },
      { returnDocument: 'after', session }
    );
    if (res.value) {
      return { success: true, rsvp: new Rsvp(res.value) };
    } else {
      throw { success: false };
    }
  }

  async findAllToNotifyForEvent(
    eventId: string,
    notification: 'update' | 'announcement' | 'comment'
  ): Promise<DeviceStats[]> {
    const filter: Filter<Rsvp> = {
      eventId: eventId,
      deletedAt: { $exists: false },
      'preferences.pushDeviceToken': { $exists: true },
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
    const docs = await this.collection
      .find(filter)
      .project({
        pushDeviceToken: '$preferences.pushDeviceToken',
        notificationEndpointArn: '$preferences.notificationEndpointArn',
        platform: '$preferences.platform',
      })
      .toArray();
    return docs || [];
  }

  async updateUserDeviceStatsOnRSVPs(
    userId: string,
    stats: DeviceStats,
    session?: ClientSession
  ): Promise<{ success: boolean; modifiedCount?: number }> {
    const res = await this.collection.updateMany(
      {
        userId: userId,
        deletedAt: { $exists: false },
        $or: [
          { 'preferences.pushDeviceToken': { $ne: stats.pushDeviceToken } },
          {
            'preferences.notificationEndpointArn': {
              $ne: stats.notificationEndpointArn,
            },
          },
          { 'preferences.platform': { $ne: stats.platform } },
        ],
      },
      {
        $set: {
          'preferences.pushDeviceToken': stats.pushDeviceToken,
          'preferences.notificationEndpointArn': stats.notificationEndpointArn,
          'preferences.platform': stats.platform,
          updatedAt: new Date(),
        },
      },
      { session }
    );
    if (res) {
      return { success: true, modifiedCount: res.modifiedCount };
    } else {
      throw { success: false };
    }
  }
}
