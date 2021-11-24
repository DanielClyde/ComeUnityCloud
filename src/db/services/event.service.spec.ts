import { Coords, Event, EventDTO, Comment } from 'comeunitymodels';
import { EventService } from './event.service';
import { assert } from 'chai';
import { MockDB } from './../../../mocks/db.mock';
import { DB } from './../db';
import moment from 'moment';

describe('Event Service', () => {
  let db: DB;
  beforeEach(async () => {
    db = await MockDB.GetDB();
    await MockDB.ClearDB();
  });

  it('Should init', () => {
    assert.isOk(db.events);
    assert.isTrue(db.events instanceof EventService);
    assert.equal(EventService.collectionName, 'events');
  });

  it('Should create event', async () => {
    const now = new Date();
    const nextWeek = moment().add(1, 'week').toDate();
    const { success, event } = await db.events.createEvent({
      address: {
        description: 'some address description',
        coords: new Coords([50, 55]),
      },
      title: 'My Event 1',
      startsAt: nextWeek,
      imgUrl: 'my_img_url',
      description: 'A super fun event!',
      announcements: [],
      comments: [],
      interestTags: ['Fun stuff', 'entertainment', 'crafts'],
      durationMinutes: 60,
      _id: 'e_123',
      createdAt: now,
      createdBy: 'me',
    });

    assert.isTrue(success);
    assert.isTrue(event instanceof Event);

    const foundEvent = await db.events.findById('e_123');
    assert.isTrue(foundEvent instanceof Event);
    assert.equal(foundEvent.title, 'My Event 1');
    assert.equal(foundEvent.address.description, 'some address description');
    assert.deepEqual(foundEvent.address.coords.coordinates, [50, 55]);
    assert.equal(foundEvent.createdAt.getTime(), now.getTime());
    assert.equal(foundEvent.startsAt.getTime(), nextWeek.getTime());
    assert.equal(foundEvent.imgUrl, 'my_img_url');
    assert.equal(foundEvent.description, 'A super fun event!');
    assert.isEmpty(foundEvent.announcements);
    assert.isEmpty(foundEvent.comments);
    assert.deepEqual(foundEvent.interestTags, ['Fun stuff', 'entertainment', 'crafts']);
    assert.equal(foundEvent.durationMinutes, 60);
    assert.equal(foundEvent._id, 'e_123');
    assert.isUndefined(foundEvent.updatedAt);
    assert.isUndefined(foundEvent.deletedAt);
  });

  it('Should update by id', async () => {
    const { success, event } = await db.events.createEvent({
      title: 'My Event',
      address: {
        coords: new Coords([50, 50]),
        description: 'address description'
      },
      description: 'a bad description',
      imgUrl: 'img',
      startsAt: moment().add(1, 'day').toDate(),
      durationMinutes: 30,
    } as EventDTO);
    assert.isTrue(success);
    assert.equal(event.durationMinutes, 30);
    const update = await db.events.updateById(event._id, {
      title: 'new title',
      description: 'better description',
      imgUrl: 'new_img',
    });
    assert.isTrue(update.success);
    assert.equal(update.event?.description, 'better description');
    assert.equal(update.event?.imgUrl, 'new_img');
  });

  it('Should be able to post comment', async () => {
    const now = new Date();
    const nextWeek = moment().add(1, 'week').startOf('hour').toDate();
    const { success, event } = await db.events.createEvent({
      address: {
        description: 'address description',
        coords: new Coords([50, 55]),
      },
      title: 'My Event 1',
      startsAt: nextWeek,
      imgUrl: 'my_img_url',
      description: 'A super fun event!',
      announcements: [],
      comments: [],
      interestTags: ['Fun stuff', 'entertainment', 'crafts'],
      durationMinutes: 60,
      _id: 'e_123',
      createdAt: now,
      createdBy: 'me',
    });
    assert.isTrue(success);
    assert.isEmpty(event.comments);
    const postCommentResponse = await db.events.postCommentToEvent(event._id, {
      postedBy: {
        _id: 'me',
        firstname: 'my firstname',
        lastname: 'my lastname',
        email: 'my email',
      },
      body: 'This is a comment',
    } as Comment);
    assert.isTrue(postCommentResponse.success);
    assert.equal(postCommentResponse.event.comments.length, 1);
    assert.isDefined(postCommentResponse.event.comments[0].createdAt);
    assert.isDefined(postCommentResponse.event.comments[0]._id);
    assert.equal(postCommentResponse.event.comments[0].body, 'This is a comment');
  });

  it('Should be able to post an announcement', async () => {
    const { success, event } = await db.events.createEvent({
      title: 'Test Event',
      createdBy: 'ME',
      address: {
        description: 'some address',
        coords: new Coords([60, 60]),
      }
    } as EventDTO);
    assert.isTrue(success);
    assert.isEmpty(event.announcements);
    const announcementResponse = await db.events.postAnnouncementToEvent(event._id, {
      body: 'This is an official announcement',
      postedBy: {
        _id: 'me',
        firstname: 'my firstname',
        lastname: 'my lastname',
        email: 'my email',
      },
    } as Comment);
    assert.isTrue(announcementResponse.success);
    assert.equal(announcementResponse.event.announcements.length, 1);
  });
});
