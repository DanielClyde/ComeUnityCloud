import { CreateDB } from './db/db';
import { WebServer } from './web/WebServer';

const PORT = 3000;

CreateDB().then((db) => {
  console.log('DB CREATED');
  new WebServer(db).app.listen(PORT, () => {
    console.log('Express server listening on port ' + PORT);
  });
});
