import { Range, User, UserDTO } from 'comeunitymodels';
import { UserService } from './user.service';
import { DB } from './../db';
import { MockDB } from '../../../mocks/db.mock';
import { assert } from 'chai';

describe('User Service', () => {
  let db: DB;
  beforeEach(async () => {
    db = await MockDB.GetDB();
    await MockDB.ClearDB();
  });

  it('Should init', () => {
    assert.isOk(db.users);
    assert.isTrue(db.users instanceof UserService);
    assert.equal(UserService.collectionName, 'users');
  });

  it('Should be able to create a user', async () => {
    const res = await db.users.createUser({
      firstname: 'Danny',
      lastname: 'Clyde',
      email: 'dantheman27c@gmail.com',
      device: {
        platform: 'ios',
      },
      preferences: {},
      interests: ['pina coladas'],
    } as UserDTO);
    assert.isTrue(res.success);
    assert.isTrue(res.user instanceof User);
    assert.approximately(res.user.createdAt.getTime(), new Date().getTime(), 1000);

    const found = await db.users.findById(res.user._id);
    assert.deepEqual(res.user, found);
    assert.approximately(found.createdAt.getTime(), new Date().getTime(), 1000);
  });

  it('Should be able to update a user', async () => {
    const { success, user } = await db.users.createUser({
      firstname: 'Danny',
      lastname: 'Clyde',
      email: 'dantheman27c@gmail.com',
      device: {
        platform: 'ios',
      },
      preferences: {},
      interests: ['pina coladas'],
    } as UserDTO);
    assert.isTrue(success);
    assert.isTrue(user instanceof User);
    assert.deepEqual(user.preferences, {});
    assert.deepEqual(user.interests, ['pina coladas']);
    assert.isUndefined(user.updatedAt);

    const update = await db.users.updateById(user._id, {
      interests: [...user.interests, 'getting caught in the rain'],
      preferences: {
        distanceRange: Range.FIFTY,
        distanceUnits: 'mi',
      },
    });

    assert.isTrue(update.success);
    assert.isTrue(update.user instanceof User);
    assert.deepEqual(update.user.interests, ['pina coladas', 'getting caught in the rain']);
    assert.deepEqual(update.user.preferences, {
      distanceRange: Range.FIFTY,
      distanceUnits: 'mi',
    });
    assert.approximately(update.user.updatedAt.getTime(), new Date().getTime(), 100);
  });

  it('Should update device stats', async () => {
    const { success, user } = await db.users.createUser({
      firstname: 'Danny',
      lastname: 'Clyde',
      email: 'dantheman27c@gmail.com',
      device: {
        platform: 'ios',
      },
      preferences: {},
      interests: ['pina coladas'],
    } as UserDTO);
    assert.isTrue(success);
    assert.isTrue(user instanceof User);
    assert.deepEqual(user.preferences, {});
    assert.deepEqual(user.interests, ['pina coladas']);
    assert.isUndefined(user.updatedAt);

    const update = await db.users.updateUserDeviceStats(user._id, {
      platform: 'android',
      notificationEndpointArn: 'test_arn',
      pushDeviceToken: 'test_token',
    });
    assert.isTrue(update.success);
    assert.isTrue(update.user instanceof User);
    assert.deepEqual(update.user.device, {
      platform: 'android',
      notificationEndpointArn: 'test_arn',
      pushDeviceToken: 'test_token',
    });
    assert.approximately(update.user.updatedAt.getTime(), new Date().getTime(), 100);
  });
});
