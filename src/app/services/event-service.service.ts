import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';

@Injectable({
  providedIn: 'root'
})
export class EventServiceService {

  private database: any;
  private myEvents: any;
  private remote: any;

  constructor() {
    this.database = new PouchDB('calen');
    this.remote = 'http://127.0.0.1:5984/calen';
    this.database.sync(this.remote);
  }

  public addEvent(theEvent: string): Promise<string> {
    const promise = this.database
        .put({
          _id: ('event:' + (new Date()).getTime()),
          note: JSON.parse(theEvent)
        })
        .then((result): string => {
          return (result.id);
        });

    return (promise);
  }

  public async getMyEvents() {
    return new Promise(resolve => {
      let _self = this;
      this.database.allDocs({
        include_docs: true,
        attachments: true
      }).then(function (result) {
        // handle result
        _self.myEvents = result.rows;
        //console.log("Results: " + JSON.stringify(_self.myEvents));
        resolve(_self.myEvents);

      }).catch(function (err) {
        console.log(err);
      });
    });
  }
}
