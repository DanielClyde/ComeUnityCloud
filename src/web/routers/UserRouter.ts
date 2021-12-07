import { AuthMiddleware } from './AuthMiddleware';
import { ObjectID } from 'bson';
import { SNSAdapter } from './../adapters/sns.adapter';
import { UserDTO, DeviceStats } from 'comeunitymodels';
import { DB } from './../../db/db';
import { Application, Request, Response } from 'express';
import { UserUpdate } from '../../db/services/user.service';
const passwordHash = require('password-hash');

export class UserRouter {
  private db: DB;
  private sns: SNSAdapter;

  public route(app: Application) {
    app.get('/api/user/:id',
      AuthMiddleware.authentication(this.db),
      this.findUserById.bind(this),
    );

    app.put('/api/user/:id/device-stats',
      AuthMiddleware.authentication(this.db),
      this.updateUserDeviceStats.bind(this),
    );
    app.put('/api/user/:id',
      AuthMiddleware.authentication(this.db),
      this.updateUser.bind(this),
    );

    app.post('/api/user', this.createNewUser.bind(this));
    app.post('/api/spamNotifications', this.spamNotifications.bind(this));
  }

  constructor(db: DB, sns: SNSAdapter) {
    this.db = db;
    this.sns = sns;
  }

  public async findUserById(req: Request, res: Response) {
    if (!req.params.id) {
      res.sendStatus(400);
      return;
    }
    const user = await this.db.users.findById(req.params.id);
    if (user) {
      res.send(user);
    } else {
      res.sendStatus(404);
    }
  }

  public async createNewUser(req: Request, res: Response) {
    if (this.isValidUserCreationBody(req)) {
      const userDTO: UserDTO = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email?.toLowerCase(),
        passwordHash: passwordHash.generate(req.body.password),
        interests: [],
        device: {},
        preferences: {},
        _id: new ObjectID().toHexString(),
        createdAt: new Date(),
      };
      const response = await this.db.users.createUser(userDTO);
      res.send(response);
    } else {
      res.send({ success: false });
    }
  }

  public async updateUser(req: Request, res: Response) {
    if (!req.params.id) {
      res.send({ success: false });
      return;
    }
    const update: UserUpdate = {
      ...req.body,
    }
    try {
      const response = await this.db.users.updateById(req.params.id, update);
      if (response.success) {
        res.send({ success: true, user: response.user });
      } else {
        res.send({ success: false });
      }
    } catch (e) {
      res.send({ success: false });
    }
  }

  public async updateUserDeviceStats(req: Request, res: Response) {
    if (!req.params.id || !req.body) {
      res.status(400).send({ success: false });
      return;
    }
    const originalUser = await this.db.users.findById(req.params.id);
    if (!originalUser) {
      res.status(400).send({ success: false });
      return;
    }
    const originalStats = originalUser?.device || {};
    const newStats: DeviceStats = {
      ...req.body,
    }
    if (originalStats?.pushDeviceToken === newStats.pushDeviceToken && originalStats.platform === newStats.platform && originalStats.notificationEndpointArn) {
      res.status(200).send({ user: originalUser, success: true });
      return;
    }
    const session = this.db.client.startSession();
    try {
      session.withTransaction(async () => {
        if (originalStats.notificationEndpointArn) {
          const deleteRes = await this.sns.deletePlatformEndpoint(originalStats.notificationEndpointArn);
          console.log('deleteRes', deleteRes);
        }
        if (newStats.platform && newStats.pushDeviceToken) {
          console.log('creating new notificationEndpoint', newStats);
          const createRes = await this.sns.createPlatformEndpoint(newStats.pushDeviceToken, originalUser._id, newStats.platform === 'ios');
          console.log('createResult', createRes);
          if (createRes.success && createRes.endpointArn) {
            newStats.notificationEndpointArn = createRes.endpointArn;
          }
        }
        const { success, user } = await this.db.users.updateUserDeviceStats(originalUser._id, newStats);
        if (success && user) {
          await this.db.rsvps.updateUserDeviceStatsOnRSVPs(user._id, newStats);
          res.send(user);
        } else {
          res.sendStatus(500);
          return;
        }
      });
    } catch (e) {
      await session.abortTransaction();
      res.sendStatus(500);
    } finally {
      await session.endSession();
    }
  }

  async spamNotifications(req: Request, res: Response) {
    const users = await this.db.users.collection.find({}).toArray();
    for (const u of users) {
      if (u?.device?.notificationEndpointArn) {
        this.sns.sendNotification(u.device.notificationEndpointArn, req.body.message);
      }
    }
    res.sendStatus(200);
  }

  isValidUserCreationBody(req: Request) {
    return (!!req.body.firstname &&
      !!req.body.lastname &&
      !!req.body.email &&
      !!req.body.password);
  }
}
