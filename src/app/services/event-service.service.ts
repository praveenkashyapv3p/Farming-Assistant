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
        console.log(updatedEvent);
        this.database.get('test1').then(function (doc) {
            for (let i = 0; i < doc.note.instructions.length; i++) {
                if (doc.note.instructions[i].step === updatedEvent.step) {
                    doc.note.instructions[i].startTime = updatedEvent.start._d.toISOString();
                    doc.note.instructions[i].endTime = updatedEvent.end._d.toISOString();
                }
            }
            console.log(doc.note);
            return db.put({
                _id: doc._id,
                _rev: doc._rev,
                note: doc.note
            });
        }).then(function () {
            console.log("coming here lets see-- ");
            return db.get(updatedEvent.step);
        }).catch(function (doc) {
            console.log("coming here catch-- " + doc);
        });
        this.database.sync(this.remote);
    }

    public updateAllEvents() {

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

    public getStartEvent(crop, date) {
        let db = new PouchDB('calen');
        let diff: any;
        this.database.get('test1').then(function (doc) {
            const prevStart = new Date(doc.note.startTime);
            const preEnd = new Date(doc.note.endTime);
            const diffTime = Math.abs(preEnd.getTime() - prevStart.getTime());
            diff = Math.ceil(diffTime / (1000 * 3600 * 24));
            doc.note.startTime = new Date(date).toISOString();
            console.log("bantu " + crop + " " + date.toISOString());
            return db.put(doc);
        }).then(function () {
            return db.get('test1');
        }).then(function (doc) {
            console.log(doc);
        });
        this.database.sync(this.remote);
    }
}
