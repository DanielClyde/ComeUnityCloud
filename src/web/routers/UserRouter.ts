import { UserDTO } from './../../db/models/User';
import { ObjectID } from 'bson';
import { DB } from './../../db/db';
import { Application, Request, Response } from "express";

export class UserRouter {
  private db: DB;

  public route(app: Application) {
    console.log('setting up user router...');
    app.get('/api/user/:id',this.findUserById.bind(this));
    app.post('/api/user', this.createNewUser.bind(this));
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
      createdAt: new Date(),
      _id: new ObjectID(),
    }
    const response = await this.db.users.createUser(userDTO);
    if (response.success) {
      res.send(response.user);
    } else {
      res.sendStatus(500);
    }
  }
}
