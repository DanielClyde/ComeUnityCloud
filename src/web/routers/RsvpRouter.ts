import { AuthMiddleware } from './AuthMiddleware';
import { Application, Request, Response } from 'express';
import { DB } from '../../db/db';

export class RsvpRouter {
  private db: DB;

  public route(app: Application) {
    app.get(
      '/api/rsvps/:userId',
      AuthMiddleware.authentication(this.db),
      this.findForUser.bind(this)
    );

    app.get(
      '/api/rsvp/:id',
      AuthMiddleware.authentication(this.db),
      this.findById.bind(this)
    );

    app.post(
      '/api/rsvp',
      AuthMiddleware.authentication(this.db),
      this.createRsvp.bind(this)
    );

    app.put(
      '/api/rsvp/:id/notifications',
      AuthMiddleware.authentication(this.db),
      this.updateRsvpNotificationPreferences.bind(this)
    );
  }

  constructor(db: DB) {
    this.db = db;
  }

  async updateRsvpNotificationPreferences(req: Request, res: Response) {
    try {
      const { success, rsvp } =
        await this.db.rsvps.updateNotificationPreferencesOnRSVP(
          req.params.id,
          req.body
        );
      res.send({ success, rsvp });
    } catch (e) {
      res.send({ success: false });
    }
  }

  async createRsvp(req: Request, res: Response) {
    const { success, rsvp } = await this.db.rsvps.createRsvp(req.body);
    res.send({ success, rsvp });
  }

  async findForUser(req: Request, res: Response) {
    const rsvps = await this.db.rsvps.findAllForUser(req.params.userId);
    res.send({ success: true, rsvps });
  }

  async findById(req: Request, res: Response) {
    const rsvp = await this.db.rsvps.findById(req.params.id);
    res.send({ success: !!rsvp, rsvp });
  }
}
