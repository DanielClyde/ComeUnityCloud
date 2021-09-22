import { UserDTO, DeviceStats, User } from './../../db/models/User';
import { ObjectID } from 'bson';
import { DB } from './../../db/db';
import { Application, Request, Response } from "express";
import { UserUpdate } from '../../db/services/user.service';

export class UserRouter {
  private db: DB;

  public route(app: Application) {
    app.get('/api/user/:id', this.findUserById.bind(this));
    app.post('/api/user', this.createNewUser.bind(this));
    app.put('/api/user/:id/device-token', this.updateUserEndpointToken.bind(this));
    app.put('/api/user/:id', this.updateUser.bind(this));
  }

  constructor(db: DB) {
    this.db = db;
  }

  public async findUserById(req: Request, res: Response) {
    if (!req.params.id) {
      res.sendStatus(400);
      return;
    }
    const user = await this.db.users.findById(ObjectID.createFromHexString(req.params.id));
    if (user) {
      res.send(user);
    } else {
      res.sendStatus(404);
    }
  }

  public async createNewUser(req: Request, res: Response) {
    const userDTO: UserDTO = {
      ...req.body,
    }
    const response = await this.db.users.createUser(userDTO);
    if (response.success) {
      res.send(response.user);
    } else {
      res.sendStatus(500);
    }
  }

  public async updateUser(req: Request, res: Response) {
    if (!req.params.id) {
      res.sendStatus(400);
      return;
    }
    const update: UserUpdate = {
      ...req.body,
    }
    try {
      const response = await this.db.users.updateById(ObjectID.createFromHexString(req.params.id), update);
      if (response.success) {
        res.send(response.user);
      } else {
        res.sendStatus(500);
      }
    } catch (e) {
      res.sendStatus(500);
    }
  }

  public async updateUserEndpointToken(req: Request, res: Response) {
    if (!req.params.id) {
      res.sendStatus(400);
      return;
    }
    const deviceToken = req.body.deviceToken;
    const platform = req.body.platform;
    if (deviceToken && platform) {
      const stats: DeviceStats = {
        deviceToken,
        platform,
        notificationEndpointArn: '',  // TODO: GET THIS FROM AWS SNS HERE
      }
      const session = this.db.client.startSession();
      let user: User | undefined;
      try {
        session.withTransaction(async () => {
          const userUpdatedResponse = await this.db.users.updateUserDeviceStats(ObjectID.createFromHexString(req.params.id), stats, session);
          user = userUpdatedResponse.user;
          await this.db.rsvps.updateUserDeviceStatsOnRSVPs(ObjectID.createFromHexString(req.params.id), stats, session);
        });
        res.send(user);
      } catch (e) {
        await session.abortTransaction();
        res.sendStatus(500);
      } finally {
        await session.endSession();
      }
    } else {
      res.sendStatus(400);
    }
  }
}
