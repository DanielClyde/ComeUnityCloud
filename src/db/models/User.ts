import { DBModel } from './DBModel';
import { ObjectID } from 'bson';

export enum Range {
  FIVE = 5,
  TEN = 10,
  TWENTY_FIVE = 25,
  FIFTY = 50,
  HUNDRED = 100,
}

export interface DeviceStats {
  deviceToken?: string;
  notificationEnpointArn?: string;
  platform?: 'android' | 'ios';
}

export interface UserPreferences {
  distanceRange?: Range;
  distanceUnits?: 'mi' | 'km';
};

export interface UserDTO extends DBModel {
  firstname: string;
  lastname: string;
  deviceStats: DeviceStats;
  preferences: UserPreferences;
}

export class User implements DBModel {
  public _id: ObjectID;
  public firstname: string;
  public lastname: string;
  public deviceStats: DeviceStats;
  public preferences: UserPreferences;
  public createdAt: Date;
  public updatedAt?: Date;
  public deletedAt?: Date;

  constructor(info: UserDTO) {
    this._id = info._id || new ObjectID();
    this.firstname = info.firstname;
    this.lastname = info.lastname;
    this.deviceStats = info.deviceStats;
    this.preferences = info.preferences;
    this.createdAt = info.createdAt;
    this.updatedAt = info.updatedAt;
    this.deletedAt = info.deletedAt;
  }
}
