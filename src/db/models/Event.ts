import { ObjectID } from 'bson';
import { Address } from './Address';
import { DBModel } from './DBModel';

export interface Comment extends DBModel {
  postedBy: {
    _id: ObjectID;
    firstname: string;
    lastname: string;
    email: string;
  };
  body: string;
}

export interface EventDTO extends DBModel {
  title: string;
  imgUrl: string;
  description: string;
  address: Address;
  announcements: Comment[];
  comments: Comment[];
  interestTags: string[];
}

export class Event implements EventDTO {
  public _id: ObjectID;
  public title: string;
  public imgUrl: string;
  public description: string;
  public address: Address;
  public announcements: Comment[];
  public comments: Comment[];
  public interestTags: string[];
  public createdAt: Date;
  public updatedAt?: Date;
  public deletedAt?: Date;

  constructor(info: EventDTO) {
    this._id = info._id || new ObjectID();
    this.title = info.title;
    this.imgUrl = info.imgUrl;
    this.description = info.description;
    this.address = new Address(info.address);
    this.announcements = info.announcements || [];
    this.comments = info.comments || [];
    this.interestTags = info.interestTags || [];
    this.createdAt = info.createdAt;
    this.updatedAt = info.updatedAt;
    this.deletedAt = info.deletedAt;
  }
}
