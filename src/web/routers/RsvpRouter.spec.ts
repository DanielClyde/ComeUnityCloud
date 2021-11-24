import { Rsvp, RsvpDTO, RsvpNotificationPreferences, DeviceStats } from 'comeunitymodels';
import { assert } from 'chai';
import { MockDB } from './../../../mocks/db.mock';
import { RsvpRouter } from './RsvpRouter';
import { DB } from '../../db/db';
import { Request, Response } from 'express';

describe('RsvpRouter', () => {
  let db: DB;
  let router: RsvpRouter;

  beforeEach(async () => {
    db = await MockDB.GetDB();
    await MockDB.ClearDB();
    router = new RsvpRouter(db);
  });

  it('Should init', () => {
    assert.isOk(router);
    assert.isTrue(router instanceof RsvpRouter);
  });

  it('Should create rsvp', async () => {
    const res = await createTestRsvp(router, {
      eventId: 'e_123',
      userId: 'u_123',
    });
    assert.isTrue(res.success);
    assert.equal(res.rsvp.eventId, 'e_123');
    assert.equal(res.rsvp.userId, 'u_123');
    assert.isDefined(res.rsvp.createdAt);
    assert.isUndefined(res.rsvp.deletedAt);
    assert.isUndefined(res.rsvp.deletedAt);
  })

  it('Should get rsvps for user', (done) => {
    createTestRsvp(router, {
      eventId: 'my_event_id',
      userId: 'u_123',
    }).then((result) => {
      assert.isTrue(result.success);
      assert.equal(result.rsvp?.userId, 'u_123');
      assert.equal(result.rsvp?.eventId, 'my_event_id');
      const res = {
        send: (result: { success: boolean, rsvps: Rsvp[] }) => {
          assert.isTrue(result.success);
          assert.equal(result.rsvps.length, 1);
          const r = result.rsvps[0];
          assert.equal(r.eventId, 'my_event_id');
          assert.equal(r.userId, 'u_123');
          done();
        }
      };

      router.findForUser({params: {userId: 'u_123'}} as any, res as Response);
    })
  });

  it('Should be able to update notification preferences', async () => {
    const { success, rsvp } = await createTestRsvp(router, {
      eventId: 'e_123',
      userId: 'u_123'
    });
    assert.isTrue(success);
    assert.isDefined(rsvp._id);
    assert.isUndefined(rsvp.preferences);
    let updateResult = await updateTestRsvpPreferences(router, rsvp._id, {notifyOnAnnouncement: true});
    assert.isTrue(updateResult.success);
    assert.isTrue(updateResult.rsvp.preferences.notifyOnAnnouncement);
    assert.isUndefined(updateResult.rsvp.preferences.notifyOnComment);
    assert.isUndefined(updateResult.rsvp.preferences.notifyOnUpdates);
    updateResult = await updateTestRsvpPreferences(router, rsvp._id, {notifyOnComment: true});
    assert.isTrue(updateResult.success);
    assert.isTrue(updateResult.rsvp.preferences.notifyOnAnnouncement);
    assert.isTrue(updateResult.rsvp.preferences.notifyOnComment);
    assert.isUndefined(updateResult.rsvp.preferences.notifyOnUpdates);
    updateResult = await updateTestRsvpPreferences(router, rsvp._id, {notifyOnUpdates: true});
    assert.isTrue(updateResult.success);
    assert.isTrue(updateResult.rsvp.preferences.notifyOnAnnouncement);
    assert.isTrue(updateResult.rsvp.preferences.notifyOnComment);
    assert.isTrue(updateResult.rsvp.preferences.notifyOnUpdates);
    updateResult = await updateTestRsvpPreferences(router, rsvp._id, {notifyOnUpdates: false});
    assert.isTrue(updateResult.success);
    assert.isTrue(updateResult.rsvp.preferences.notifyOnAnnouncement);
    assert.isTrue(updateResult.rsvp.preferences.notifyOnComment);
    assert.isFalse(updateResult.rsvp.preferences.notifyOnUpdates);
  });
});

function createTestRsvp(router: RsvpRouter, dto: Partial<RsvpDTO>): Promise<{success: boolean, rsvp?: Rsvp}> {
  return new Promise((resolve) => {
    const res = {
      send: (result: { success: boolean, rsvp?: Rsvp }) => {
        resolve(result);
      }
    }
    router.createRsvp({body: dto} as any, res as any);
  });
}

function updateTestRsvpPreferences(router: RsvpRouter, rsvpId: string, update: Partial<Omit<RsvpNotificationPreferences, keyof DeviceStats>>): Promise<{success: boolean, rsvp?: Rsvp}> {
  return new Promise((resolve) => {
    const res = {
      send: (result: {success: boolean, rsvp?: Rsvp}) => {
        resolve(result);
      }
    };
    router.updateRsvpNotificationPreferences({params: {id: rsvpId}, body: update} as any, res as any);
  })
}
