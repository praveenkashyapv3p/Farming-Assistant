import {Injectable} from '@angular/core';
import PouchDB from 'pouchdb';

@Injectable({
    providedIn: 'root'
})

export class EventServiceService {

    private database: any;
    private myEvents: any;
    private readonly remote: any;

    constructor() {
        this.database = new PouchDB('calen');
        this.remote = 'http://127.0.0.1:5984/calen';
        this.database.sync(this.remote);
    }

    public addEvent(theEvent: string): Promise<string> {
        let eventAdd = JSON.parse(theEvent);
        console.log(eventAdd.title);
        const promise = this.database
            .put({
                _id: (eventAdd.title),
                note: eventAdd
            })
            .then((result): string => {
                return (result.id);
            });

        return (promise);
    }

    public updateEvent(updatedEvent: any) {
        let db = new PouchDB('calen');
        db.get(updatedEvent.title).then(function (doc) {
            doc.note.startTime = updatedEvent.start._d;
            doc.note.endTime = updatedEvent.end._d;
            return db.put(doc);
        }).then(function () {
            return db.get(updatedEvent.title);
        }).then(function (doc) {
            console.log(doc);
        });
        db.sync(this.remote);
    }

    public async getMyEvents() {
        return new Promise(resolve => {
            let _self = this;
          this.database.allDocs({
                include_docs: true,
                attachments: true
            }).then(function (result) {
            _self.myEvents = result.rows;
                resolve(_self.myEvents);
            }).catch(function (err) {
                console.log(err);
            });
        });
    }

    public getStartEvent(crop, date){
        let db = new PouchDB('calen');
        let prevStart = new Date();
        let preEnd = new Date();
        let diff : any;
        this.database.get('test').then(function (doc) {
            console.log(doc, date);
            prevStart = new Date(doc.note.startTime);
            preEnd = new Date(doc.note.endTime);
            let diffTime = preEnd.getTime() - prevStart.getTime();
            diff = diffTime / (1000 * 3600 * 24);
            console.log(diffTime + "count: " + diff);
            doc.note.startTime = new Date(date).toISOString();
            return db.put(doc);
        }).then(function () {
            return db.get('test');
        }).then(function (doc) {
            console.log(doc);
        });
        this.database.sync(this.remote);
    }
}
