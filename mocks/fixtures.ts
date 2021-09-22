import { MockDB } from './db.mock';

export const mochaGlobalSetup = async () => {
  await MockDB.GetDB();
  console.log('Test DB Created!');
}

export const mochaGlobalTeardown = async () => {
  await MockDB.DestroyDB();
  console.log('Test DB Destroyed!');
}
