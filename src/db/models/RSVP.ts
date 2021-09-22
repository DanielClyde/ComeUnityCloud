import { DeviceStats } from './User';
import { ObjectID } from 'bson';
import { DBModel } from './DBModel';

export interface RsvpNotificationPreferences extends DeviceStats {
  notifyOnAnnouncement: boolean;
  notifyOnUpdates: boolean;
  notifyOnComment: boolean;
}

export interface RsvpDTO extends DBModel {
  eventId: ObjectID;
  userId: ObjectID;
  preferences: RsvpNotificationPreferences;
}

export class Rsvp implements RsvpDTO {
  public _id: ObjectID;
  public eventId: ObjectID;
  public userId: ObjectID;
  public preferences: RsvpNotificationPreferences;
  public createdAt: Date;
  public updatedAt?: Date;
  public deletedAt?: Date;

  constructor(info: RsvpDTO) {
    this._id = info._id || new ObjectID();
    this.eventId = info.eventId;
    this.userId = info.userId;
    this.preferences = info.preferences;
    this.createdAt = info.createdAt;
    this.updatedAt = info.updatedAt;
    this.deletedAt = info.deletedAt;
  }
}
