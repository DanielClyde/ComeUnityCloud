import { ObjectID } from 'bson';
import { Document as MongoDocument } from 'mongodb';

export interface DBModel extends MongoDocument {
  _id: ObjectID;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
