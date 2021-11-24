import { User } from 'comeunitymodels';
import { Request, Response } from 'express';
import { assert } from 'chai';
import { AuthRouter, AppleAuthResponse } from './AuthRouter';
import { MockDB } from './../../../mocks/db.mock';
import { DB } from './../../db/db';

describe('AuthRouter', () => {
  let db: DB;
  let router: AuthRouter;
  beforeEach(async () => {
    db = await MockDB.GetDB();
    await MockDB.ClearDB();
    router = new AuthRouter(db);
  });

  it('Should init', () => {
    assert.isOk(router);
    assert.isTrue(router instanceof AuthRouter);
  });

  it('Apple auth new user', (done) => {
    const body: AppleAuthResponse = {
      email: 'test@test.com',
      familyName: 'Testers',
      givenName: 'Testy',
      user: 'user.id.test.id',
      authorizationCode: 'auth123Code',
      identityToken: '123123123123',
      platform: 'ios',
      deviceIdForRefresh: 'deviceIdForRefreshingStuff',
    };

    const res = {
      send: (result: { success: boolean, user?: User, token?: string, refreshToken?: string }) => {
        assert.isTrue(result.success);
        const user = result.user;
        assert.approximately(user.createdAt.getTime(), new Date().getTime(), 2000);
        assert.equal(user._id, 'user.id.test.id');
        assert.equal(user.firstname, 'Testy');
        assert.equal(user.lastname, 'Testers');
        assert.equal(user.email, 'test@test.com');
        assert.equal(user.device.deviceIdForRefresh, 'deviceIdForRefreshingStuff');
        assert.equal(user.device.platform, 'ios');
        assert.equal(user.preferences.distanceRange, 10);
        assert.equal(user.preferences.distanceUnits, 'mi');
        assert.isUndefined(user.preferences[0]);
        assert.isDefined(result.token);
        assert.isDefined(result.refreshToken);
        done();
      },
    };

    router.handleAppleAuth({ body } as Request, res as Response);
  });

  it('Apple auth returning user', (done) => {
    const res = {
      send: (result: { success: boolean, user?: User, token?: string, refreshToken?: string }) => {
        const { success, user, token, refreshToken } = result;
        assert.isTrue(success);
        assert.isDefined(token);
        assert.isDefined(refreshToken);
        assert.equal(user._id, 'user.id');
        assert.equal(user.device.platform, 'ios');
        assert.equal(user.device.deviceIdForRefresh, 'device.id');
        done();
      }
    }

    db.users.createUser({
      _id: 'user.id',
      firstname: 'firstname',
      lastname: 'lastname',
      email: 'email',
      device: { platform: 'ios', deviceIdForRefresh: 'device.id' },
      preferences: {},
      interests: ['tacos'],
      createdAt: new Date(),
    }).then((value) => {
      const body: AppleAuthResponse = {
        authorizationCode: 'code',
        identityToken: 'token',
        user: 'user.id',
      };
      router.handleAppleAuth({ body } as any, res as any);
    });
  });

  it('Apple auth returning user with new deviceIdForRefresh', (done) => {
    const res = {
      send: (result: { success: boolean, user?: User, token?: string, refreshToken?: string }) => {
        const { success, user, token, refreshToken } = result;
        assert.isTrue(success);
        assert.isDefined(token);
        assert.isDefined(refreshToken);
        assert.equal(user._id, 'some.user.id');
        assert.equal(user.device.platform, 'ios');
        assert.equal(user.device.deviceIdForRefresh, 'new.device.id');
        done();
      }
    }

    db.users.createUser({
      _id: 'some.user.id',
      firstname: 'firstname',
      lastname: 'lastname',
      email: 'email',
      device: { platform: 'ios', deviceIdForRefresh: 'device.id' },
      preferences: {},
      interests: ['tacos'],
      createdAt: new Date(),
    }).then((value) => {
      const body: AppleAuthResponse = {
        authorizationCode: 'code',
        identityToken: 'token',
        user: 'some.user.id',
        deviceIdForRefresh: 'new.device.id',
      };
      router.handleAppleAuth({ body } as any, res as any);
    });
  });

  it('refresh token', (done) => {
    const body: AppleAuthResponse = {
      email: 'test@test.com',
      familyName: 'Testers',
      givenName: 'Testy',
      user: 'user.id.test.id',
      authorizationCode: 'auth123Code',
      identityToken: '123123123123',
      platform: 'ios',
      deviceIdForRefresh: 'deviceIdForRefreshingStuff',
    };

    const res = {
      send: (result: { success: boolean, user?: User, token?: string, refreshToken?: string }) => {
        assert.isTrue(result.success);
        const user = result.user;
        assert.approximately(user.createdAt.getTime(), new Date().getTime(), 2000);
        assert.equal(user._id, 'user.id.test.id');
        assert.equal(user.firstname, 'Testy');
        assert.equal(user.lastname, 'Testers');
        assert.equal(user.email, 'test@test.com');
        assert.equal(user.device.deviceIdForRefresh, 'deviceIdForRefreshingStuff');
        assert.equal(user.device.platform, 'ios');
        assert.equal(user.preferences.distanceRange, 10);
        assert.equal(user.preferences.distanceUnits, 'mi');
        assert.isUndefined(user.preferences[0]);
        assert.isDefined(result.token);
        assert.isDefined(result.refreshToken);

        const res2 = {
          send: (result: { success: boolean, user?: User, token?: string, refreshToken?: string }) => {
            const { success, user, token, refreshToken } = result;
            assert.isTrue(success);
            assert.isDefined(token);
            assert.isDefined(refreshToken);
            assert.equal(user._id, 'user.id.test.id');
            done();
          },
        };
        router.refresh({body: {refreshToken: result.refreshToken}} as any, res2 as any);
      },
    };

    router.handleAppleAuth({ body } as Request, res as Response);
  });
});
