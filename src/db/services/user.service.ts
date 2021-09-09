import { ObjectID } from 'bson';
import { User, UserDTO } from './../models/User';
import { Collection, Db } from "mongodb";

export class UserService {
  public static collectionName = 'users';
  public db: Db;
  public collection: Collection<User>;

  constructor(db: Db, collection: Collection<User>) {
    this.db = db;
    this.collection = collection;
  }

  async createUser(info: UserDTO): Promise<{ success: boolean, user?: User }> {
    try {
      await this.collection.insertOne(info);
      return {
        success: true,
        user: new User(info),
      };
    } catch (e) {
      return { success: false }
    }
  }

  findById(id: ObjectID): Promise<User | null> {
    return this.collection.findOne({ _id: id, deletedAt: { $exists: false } })
  }

  async updateById(id: ObjectID, update: Omit<UserDTO, '_id' | 'createdAt'>): Promise<{ success: boolean, user?: User }> {
    try {
      const res = await this.collection.findOneAndUpdate(
        {
          _id: id,
          deletedAt: { $exists: false },
        }, {
        $set: update
      });
      if (res.value) {
        return { success: true, user: new User(res.value) }
      } else {
        return { success: false };
      }
    } catch (e) {
      return { success: false };
    }
  }
}
