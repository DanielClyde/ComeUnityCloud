import { DB } from './../db/db';
import { UserRouter } from './routers/UserRouter';
import express from 'express';
import * as bodyParser from 'body-parser';
const compression = require('compression');

export class WebServer {
  public app: express.Application;
  private userRouter: UserRouter;

  constructor(db: DB) {
    this.userRouter = new UserRouter(db);
    this.app = express();
    this.configureWebApp();
    this.setupRouters(db);
  }

  private configureWebApp(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: false}));
    this.app.use(compression());
  }

  private setupRouters(db: DB): void {
    this.userRouter.route(this.app);
  }
}
