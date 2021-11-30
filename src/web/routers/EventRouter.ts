import { S3Adapter } from './../adapters/s3.adapter';
import { AuthMiddleware } from './AuthMiddleware';
import { SNSAdapter } from './../adapters/sns.adapter';
import { DeviceStats, Comment, Event } from 'comeunitymodels';
import { EventUpdate } from './../../db/services/event.service';
import { Application, Request, Response } from 'express';
import { DB } from './../../db/db';
export class EventRouter {
  private db: DB;
  private sns: SNSAdapter;
  private s3: S3Adapter;

  public route(app: Application) {
    app.get('/api/events/nearby',
      AuthMiddleware.authentication(this.db),
      this.findByDistance.bind(this),
    );

    app.get('/api/events/:id',
      AuthMiddleware.authentication(this.db),
      this.findById.bind(this),
    );

    app.get('/api/events/created/:userId',
      AuthMiddleware.authentication(this.db),
      this.findByCreatorId.bind(this),
    );

    app.post('/api/events',
      AuthMiddleware.authentication(this.db),
      this.createEvent.bind(this),
    );

    app.put('/api/events/:id/announcements',
      AuthMiddleware.authentication(this.db),
      this.postAnnouncement.bind(this),
    );
    app.put('/api/events/:id/comments',
      AuthMiddleware.authentication(this.db),
      this.postComment.bind(this),
    );
    app.put('/api/events/:id',
      AuthMiddleware.authentication(this.db),
      this.updateById.bind(this),
    );
  }

  constructor(db: DB, sns: SNSAdapter, s3: S3Adapter) {
    this.db = db;
    this.sns = sns;
    this.s3 = s3;
  }

  public async findByCreatorId(req: Request, res: Response) {
    const events: Event[] = await this.db.events.findByCreator(req.params.userId);
    res.send({ success: true, events });
  }

  public async findById(req: Request, res: Response) {
    const event: Event | null = await this.db.events.findById(req.params.id);
    res.send({ success: !!event, event });
  }

  public async findByDistance(req: Request, res: Response) {
    if (req.query.long && req.query.lat) {
      const events: Event[] = await this.db.events.findByDistance([+req.query.long, +req.query.lat], 1000 * 100);
      res.send({ success: true, events });
    } else {
      const events: Event[] = await this.db.events.collection.find({ deletedAt: { $exists: false } }).toArray();
      res.send({ success: true, events });
    }
  }

  public async createEvent(req: Request, res: Response) {
    const { success, event } = await this.db.events.createEvent(req.body, this.s3);
    res.send({ success, event });
  }

  public async updateById(req: Request, res: Response) {
    const update: EventUpdate = req.body;
    const id = req.params.id;
    if (!id || !update || (Object.keys(update).length < 1)) {
      res.send({ success: false });
    } else {
      const { success, event } = await this.db.events.updateById(id, update);
      res.send({ success, event });
      if ('address' in update || 'startsAt' in update || 'description' in update || 'title' in update) {
        const deviceStats: DeviceStats[] = await this.db.rsvps.findAllToNotifyForEvent(id, 'update');
        deviceStats.forEach((stats) => {
          if (stats.notificationEndpointArn) {
            const message = event?.title ? `Event "${event.title}" was recently updated, check out what has changed!` :
              'An event you have RSVPd to was recently updated, check out what has changed!';
            this.sns.sendNotification(stats.notificationEndpointArn, message);
          }
        });
      }
    }
  }

  public async postAnnouncement(req: Request, res: Response) {
    const id = req.params.id;
    const announcement: Comment = req.body;
    if (!id || !announcement) {
      res.send({ success: false });
    }
    const { success, event } = await this.db.events.postAnnouncementToEvent(id, announcement);
    res.send({ success, event });
    const deviceStats: DeviceStats[] = await this.db.rsvps.findAllToNotifyForEvent(id, 'announcement');
    deviceStats.forEach((stats) => {
      if (stats.notificationEndpointArn) {
        const message = event?.title ? `An official announcement has been posted for the "${event.title}" event!` :
          'An official announcement has been posted for an event you are RSVPd to';
        this.sns.sendNotification(stats.notificationEndpointArn, message);
      }
    });
  }

  public async postComment(req: Request, res: Response) {
    const id = req.params.id;
    const comment: Comment = req.body;
    if (!id || !comment) {
      res.send({ success: false });
    }
    const { success, event } = await this.db.events.postCommentToEvent(id, comment);
    res.send({ success, event });
    const deviceStats: DeviceStats[] = await this.db.rsvps.findAllToNotifyForEvent(id, 'comment');
    deviceStats.forEach((stats) => {
      if (stats.notificationEndpointArn) {
        const message = event?.title ? `A comment has been posted on the "${event.title}" event!` :
          'A comment has been posted on an event you are RSVPd to';
        this.sns.sendNotification(stats.notificationEndpointArn, message);
      }
    });
  }


}
