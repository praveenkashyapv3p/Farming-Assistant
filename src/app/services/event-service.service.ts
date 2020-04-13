import {Injectable} from '@angular/core';
import PouchDB from 'pouchdb';

@Injectable({
    providedIn: 'root'
})

export class EventServiceService {

    allNotes: any;
    event = {
        step: '',
        title: '',
        desc: '',
        start: new Date(),
        end: new Date(),
        allDay: false,
        url: ''
    };
    eventSource = [];
    private database: any;
    private myEvents: any;
    private readonly remote: any;

    constructor() {
        this.database = new PouchDB('calen');
        this.remote = 'http://127.0.0.1:5984/calen';
        this.database.sync(this.remote);
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

    // public updateEvent(updatedEvent: any) {
    //     let db = new PouchDB('calen');
    //     let offset = 0;
    //     let diff: any;
    //     let i = 0;
    //
    //     this.database.get('test1').then(function (doc) {
    //         for (i; i < doc.note.instructions.length; i++) {
    //             let ii = i + 1;
    //             if (doc.note.instructions[i].step === updatedEvent.step) {
    //                 let preveStartTime = new Date(doc.note.instructions[i].startTime);
    //                 let preveEndTime = new Date(doc.note.instructions[i].endTime);
    //                 console.log(preveStartTime + " " + preveEndTime);
    //                 doc.note.instructions[i].startTime = updatedEvent.start._d.toISOString();
    //                 doc.note.instructions[i].endTime = updatedEvent.end._d.toISOString();
    //                 console.log(doc.note.instructions[i].step + " " + doc.note.instructions[i].startTime + " " + doc.note.instructions[i].endTime);
    //                 let fsd = new Date(doc.note.instructions[i].startTime);
    //                 const diffTime = (fsd.getTime() - preveStartTime.getTime());
    //                 offset = Math.ceil(diffTime / (1000 * 3600 * 24));
    //                 console.log(offset);
    //             }
    //             if (doc.note.instructions.length != ii) {
    //                 const prevStart = new Date(doc.note.instructions[ii].startTime);
    //                 const preEnd = new Date(doc.note.instructions[ii].endTime);
    //                 const diffTime = (preEnd.getTime() - prevStart.getTime());
    //                 diff = Math.ceil(diffTime / (1000 * 3600 * 24));
    //
    //                 const newStart = new Date();
    //                 const newEndTime = new Date();
    //                 newStart.setDate(prevStart.getDate() + offset);
    //                 newEndTime.setDate(newStart.getDate() + diff);
    //                 //console.log("i: " + i + " ii: " + ii + " length " + doc.note.instructions.length);
    //                 //console.log(doc.note.instructions[ii].step + " " + newStart.toISOString() + " " + newEndTime.toISOString());
    //                 doc.note.instructions[ii].startTime = newStart.toISOString();
    //                 doc.note.instructions[ii].endTime = newEndTime.toISOString();
    //             }
    //         }
    //         console.log("_id: " + doc._id + " _rev: " + doc._rev + " note: " + doc.note.instructions);
    //         return db.put({_id: doc._id, _rev: doc._rev, note: doc.note });
    //     }).then(function () {
    //         console.log("coming here... ");
    //         return db.get(updatedEvent.step);
    //     }).catch(function (doc) {
    //         console.log("kommt " + doc);
    //     });
    //     this.database.sync(this.remote);
    // }


    // public getStartEvent(crop, dataId, date) {
    //     let db = new PouchDB('calen');
    //     let diff: any;
    //     this.database.get(dataId).then(function (doc) {
    //         const prevStart = new Date(doc.note.instructions[0].startTime);
    //         const preEnd = new Date(doc.note.instructions[0].endTime);
    //         const diffTime = Math.abs(preEnd.getTime() - prevStart.getTime());
    //         diff = Math.ceil(diffTime / (1000 * 3600 * 24));
    //         doc.note.instructions[0].startTime = new Date(date).toISOString();
    //         const newStart = new Date(doc.note.instructions[0].startTime);
    //         let newEndTime = new Date(doc.note.instructions[0].endTime);
    //         newEndTime.setDate(newStart.getDate() + diff);
    //         doc.note.instructions[0].endTime = newEndTime.toISOString();
    //         return db.put(doc);
    //     }).then(function () {
    //         return db.get(dataId);
    //     }).then(function (doc) {
    //     });
    //     this.database.sync(this.remote);
    // }
}
