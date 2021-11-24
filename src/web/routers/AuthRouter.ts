import { AuthMiddleware, IRequest } from './AuthMiddleware';
import { UserDTO, Range, User } from 'comeunitymodels';
import { Application, Request, Response } from 'express';
import { DB } from './../../db/db';
const passwordHash = require('password-hash');

export interface AppleAuthResponse extends AuthResponse {
  authorizationCode: string;
  familyName?: string;
  givenName?: string;
  identityToken: string;
  user: string;
}

export interface AuthResponse {
  email?: string;
  platform?: 'ios' | 'android' | 'web';
  deviceIdForRefresh?: string;
}

export class AuthRouter {
  private db: DB;

  public route(app: Application) {
    app.post('/api/auth/apple', this.handleAppleAuth.bind(this));
    app.post('/api/auth/refresh', this.refresh.bind(this));
    app.post('/api/auth/credentials', this.handleCredentialAuth.bind(this));
  }

  constructor(db: DB) {
    this.db = db;
  }

  public async refresh(req: IRequest, res: Response) {
    if (!req.body.refreshToken) {
      res.status(400).send({ success: false });
    } else {
      try {
        const verified = await AuthMiddleware.verifyRefreshToken(req.body.refreshToken);
        const user = await this.db.users.findById(verified?.userId);
        this.onAuthenticationFinish(res, user, !!user)
      } catch (e) {
        res.status(400).send({ success: false });
      }
    }
  }

  public async handleAppleAuth(req: Request, res: Response) {
    const appleAuthBody: AppleAuthResponse = req.body;
    const foundUser = await this.db.users.findById(appleAuthBody.user);
    if (foundUser) {
      if (
        (appleAuthBody?.platform && appleAuthBody.platform !== foundUser.device?.platform) ||
        (appleAuthBody?.deviceIdForRefresh && appleAuthBody.deviceIdForRefresh !== foundUser.device?.deviceIdForRefresh)) {
        const { success, user } = await this.db.users.updateUserDeviceStats(
          foundUser._id,
          {
            ...foundUser.device,
            platform: appleAuthBody.platform || foundUser.device?.platform,
            deviceIdForRefresh: appleAuthBody.deviceIdForRefresh || foundUser.device?.deviceIdForRefresh
          });
        this.onAuthenticationFinish(res, user, success);
      } else {
        this.onAuthenticationFinish(res, foundUser, true);
      }
    } else if (this.isNewAppleAuth(appleAuthBody)) {
      const userDTO: UserDTO = {
        email: appleAuthBody.email,
        firstname: appleAuthBody.givenName,
        lastname: appleAuthBody.familyName,
        _id: appleAuthBody.user,
        createdAt: new Date(),
        interests: [],
        device: {
          deviceIdForRefresh: appleAuthBody.deviceIdForRefresh,
          platform: appleAuthBody.platform,
        },
        preferences: {
          distanceRange: Range.TEN,
          distanceUnits: 'mi',
        },
      };
      const { success, user } = await this.db.users.createUser(userDTO);
      this.onAuthenticationFinish(res, user, success);
    } else {
      res.status(400).send({ success: false });
    }
  }

  public async handleCredentialAuth(req: Request, res: Response) {
    const u: User | null = await this.db.users.findByEmail(req.body.email);
    if (u && u.passwordHash && passwordHash.verify(req.body.password, u.passwordHash)) {
      if (
        (req.body.platform && req.body.platform !== u.device.platform) ||
        (req.body.deviceIdForRefresh && req.body.deviceIdForRefresh !== u.device.deviceIdForRefresh)) {
        const { success, user } = await this.db.users.updateUserDeviceStats(
          u._id,
          {
            ...u.device,
            platform: req.body.platform || u.device?.platform,
            deviceIdForRefresh: req.body.deviceIdForRefresh || u.device?.deviceIdForRefresh
          });
        this.onAuthenticationFinish(res, user, success);
      } else {
        this.onAuthenticationFinish(res, u, true);
      }
    } else {
      this.onAuthenticationFinish(res);
    }
  }

  private isNewAppleAuth(appleAuth: AppleAuthResponse): appleAuth is Required<AppleAuthResponse> {
    return (!!appleAuth.authorizationCode && !!appleAuth.email &&
      !!appleAuth.familyName && !!appleAuth.givenName &&
      !!appleAuth.identityToken && !!appleAuth.user);
  }

  private onAuthenticationFinish(res: Response, user?: User | null, success = false) {
    if (!success) {
      res.status(401).send({ success });
    } else {
      delete user?.passwordHash;
      res.send({ success, user, token: user ? AuthMiddleware.getTokenForUser(user) : undefined, refreshToken: user ? AuthMiddleware.getRefreshTokenForUser(user) : undefined });
    }
  }

}
