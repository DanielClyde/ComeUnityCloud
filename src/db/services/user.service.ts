import { ObjectID } from 'bson';
import { User, UserDTO, DeviceStats } from './../models/User';
import { ClientSession, Collection, Db } from "mongodb";


export type UserUpdate = Partial<UserDTO>;

export class UserService {
  public static collectionName = 'users';
  public db: Db;
  public collection: Collection<User>;

  constructor(db: Db, collection: Collection<User>) {
    this.db = db;
    this.collection = collection;
  }

  async createUser(info: UserDTO): Promise<{ success: boolean, user?: User }> {
    info.createdAt = info.createdAt || new Date();
    info._id = info._id || new ObjectID();
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
    return this.collection.findOne({ _id: id, deletedAt: { $exists: false } }).then((u) => {
      return u ? new User(u) : null;
    });
  }

  async updateById(id: ObjectID, update: UserUpdate, session?: ClientSession): Promise<{ success: boolean, user?: User }> {
    update.updatedAt = new Date();
    const res = await this.collection.findOneAndUpdate(
      {
        _id: id,
        deletedAt: { $exists: false },
      },
      {
        $set: update
      },
      { session, returnDocument: 'after' });
    if (res.value) {
      return { success: true, user: new User(res.value) }
    } else {
      throw ({ success: false });
    }
  }

  async updateUserDeviceStats(id: ObjectID, stats: DeviceStats, session?: ClientSession): Promise<{ success: boolean, user?: User }> {
    const res = await this.collection.findOneAndUpdate(
      {
        _id: id,
        deletedAt: { $exists: false },
      },
      {
        $set: {
          updatedAt: new Date(),
          deviceStats: stats,
        },
      },
      { session, returnDocument: 'after' });
    if (res.value) {
      return { success: true, user: new User(res.value) }
    } else {
      throw ({ success: false });
    }
  }
}
