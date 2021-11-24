import { User } from 'comeunitymodels';
import { Request } from 'express';
import { DB } from './../../db/db';
import * as jwt from 'jsonwebtoken';

export const JWT_SECRET = 'Batman Cat Eats the Taco Cat';
export const JWT_REFRESH_SECRET = 'thisIsARefreshSecret';
export type IRequest = Request & { session?: { user?: User } };
export const SessionTokenExpiresIn = 3600 * 24;    // 24 hours

export class AuthMiddleware {
  public static getTokenForUser(user: User): string {
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: SessionTokenExpiresIn });
    return token;
  }

  public static getRefreshTokenForUser(user: User): string | null {
    if (user?.device?.deviceIdForRefresh) {
      return jwt.sign({ userId: user._id, deviceIdForRefresh: user.device.deviceIdForRefresh }, JWT_REFRESH_SECRET);
    } else {
      return null;
    }
  }

  public static verifyRefreshToken(refreshToken: string): Promise<{ userId: string, deviceIdForRefresh: string }> {
    return new Promise((resolve, reject) => {
      jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
        if (err || !decoded.userId) {
          reject();
        } else {
          resolve({ userId: decoded.userId, deviceIdForRefresh: decoded.deviceIdForRefresh });
        }
      });
    });
  }

  public static authentication(db: DB): (req: any, res: any, next: any) => void {
    return (req, res, next) => {
      const token = req.headers.authorization;
      const response = { success: false, msg: 'Failed to authenticate token' };
      if (!token) {
        res.status(401).send(response);
      } else {
        jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
          if (err || !decoded.userId) {
            res.status(401).send(response);
          } else {
            db.users.findById(decoded.userId).then((u) => {
              req.session = req.session || {};
              req.session.user = u || undefined;
              next();
            })
          }
        })
      }
    }
  }
}
