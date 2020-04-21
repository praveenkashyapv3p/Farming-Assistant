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



}
