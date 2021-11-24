import { S3Adapter } from './adapters/s3.adapter';
import { EventRouter } from './routers/EventRouter';
import { AuthRouter } from './routers/AuthRouter';
import { SNSAdapter } from './adapters/sns.adapter';
import { DB } from './../db/db';
import { UserRouter } from './routers/UserRouter';
import express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import cors from 'cors';
import { RsvpRouter } from './routers/RsvpRouter';
const compression = require('compression');

export class WebServer {
  public app: express.Application;
  private userRouter: UserRouter;
  private authRouter: AuthRouter;
  private eventRouter: EventRouter;
  private rsvpRouter: RsvpRouter;
  private sns: SNSAdapter;
  private s3: S3Adapter;

  constructor(db: DB) {
    this.sns = new SNSAdapter();
    this.s3 = new S3Adapter();
    this.authRouter = new AuthRouter(db);
    this.userRouter = new UserRouter(db, this.sns);
    this.eventRouter = new EventRouter(db, this.sns, this.s3);
    this.rsvpRouter = new RsvpRouter(db);
    this.app = express();
    this.configureWebApp();
    this.setupRouters();
  }

  private configureWebApp(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(compression());
    this.app.use(cors({
      origin: [
        '*',
        'http://udownmobile.com',
        'https://udownmobile.com',
        'capacitor://udownapp.com',
        'http://localhost:4200',
        'http://10.0.0.104:4200',
      ],
    }));
  }

  private setupRouters(): void {
    this.userRouter.route(this.app);
    this.authRouter.route(this.app);
    this.eventRouter.route(this.app);
    this.rsvpRouter.route(this.app);
    console.log('path', path.join(__dirname, '../../public'));
    this.app.use('/', express.static(path.join(__dirname, '../../public')));
    this.app.use('/*', express.static(path.join(__dirname, '../../public')));
  }
}
