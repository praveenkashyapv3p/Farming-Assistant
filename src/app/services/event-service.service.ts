import {Injectable} from '@angular/core';
import PouchDB from 'pouchdb';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';

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

    public getPDF(){
        //activity,crop_date,allcrop_date
        //get crop name from droplist from calendar view - currently selecteCrop variable.
        let selectedCrop = 'potato';
        let activitiesCropJSON = [];
        let activitiesAllCropJSON = [];
        let db = new PouchDB('calen');
        db.allDocs({include_docs: true}).then(function (result) {
            for (let i = 0; i < result.rows.length; i++) {
                if (result.rows[i].doc._id === selectedCrop){
                    for(let j=0; j < result.rows[i].doc.note.instructions.length; j++){
                        let activitiesCropArray = [];
                        activitiesCropArray.push(result.rows[i].doc.note.instructions[j].title, result.rows[i].doc.note.instructions[j].start, result.rows[i].doc.note.instructions[j].description);
                        activitiesCropJSON.push(JSON.parse(JSON.stringify(activitiesCropArray)));
                    }
                }
                if (result.rows[i].doc._id === 'allCrops'){
                    for(let j=0; j < result.rows[i].doc.note.instructions.length; j++){
                        let activitiesAllCropArray = [];
                        if (result.rows[i].doc.note.instructions[j].cropName === selectedCrop){
                            activitiesAllCropArray.push(result.rows[i].doc.note.instructions[j].title, result.rows[i].doc.note.instructions[j].start, result.rows[i].doc.note.instructions[j].description);
                            activitiesAllCropJSON.push(JSON.parse(JSON.stringify(activitiesAllCropArray)));
                        }
                    }
                }
            }

            let keys = ["title", "date","description"];
            let newArr = activitiesCropJSON.slice(0, activitiesCropJSON.length);
            let formatted = [], data = newArr, cols = keys, l = cols.length;
            for (let i=0; i<data.length; i++) {
                let d = data[i], o = {};
                for (let j=0; j<l; j++)
                    o[cols[j]] = d[j];
                formatted.push(o);
            }
            console.log(formatted);
            let doc = new jsPDF();
            let col1 = ["Title", "Date", "Description"];
            let rows1 = [];
            formatted.forEach(element => {
                let temp1 = [element.title,element.date, element.description];
                rows1.push(temp1);
            });
            doc.autoTable(col1, rows1, {theme: 'grid'}, { startY: 60 });
            doc.save('Test.pdf');
        })
    }

}
