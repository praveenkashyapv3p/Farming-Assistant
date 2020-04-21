import {Component, OnInit} from '@angular/core';
import {EventServiceService} from "../services/event-service.service";
import * as Hammer from 'hammerjs';
import PouchDB from 'pouchdb';

declare var $: any;
declare var define: any;
declare var exports: any;

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})

export class HomePage implements OnInit {
    allNotes: any;
    eventSource = [];
    event = {
        step: '',
        title: '',
        desc: '',
        start: new Date(),
        end: new Date(),
        allDay: false,
        url: ''
    };

    constructor(public calEvents: EventServiceService) {

    }

    ngOnInit() {

        let renderCount = 0;
        let myEvents: any;
        let diff: any;
        let originalDate, dataId, cropName;

        let event = {
            step: '',
            title: '',
            desc: '',
            start: new Date(),
            end: new Date(),
            allDay: false,
            url: '',
            backgroundColor: ''
        };
        (function (factory) {
            if (typeof define === 'function' && define.amd) {
                define(['jquery', 'hammerjs'], factory);
            } else if (typeof exports === 'object') {
                factory($, Hammer);
            } else {
                factory($, Hammer);
            }
        }(function ($, Hammer) {
            function hammerify(el, options) {
                let $el = $(el);
                if (!$el.data("hammer")) {
                    $el.data("hammer", new Hammer($el[0], options));
                }
            }

            $.fn.hammer = function (options) {
                return this.each(function () {
                    hammerify(this, options);
                });
            };
            // extend the emit method to also trigger jQuery events
            Hammer.Manager.prototype.emit = (function (originalEmit) {
                return function (type, data) {
                    originalEmit.call(this, type, data);
                    $(this.element).trigger({
                        type: type,
                        gesture: data
                    });
                };
            })(Hammer.Manager.prototype.emit);
        }));

        function getAllEvents(allEvents) {
            let eventSource = [];
            for (let i = 0; i < allEvents["note"]["instructions"].length; i++) {
                event.step = allEvents["note"]["instructions"][i].step;
                event.title = allEvents["note"]["instructions"][i].title;
                event.desc = allEvents["note"]["instructions"][i].description;
                event.allDay = allEvents["note"]["instructions"][i].allDay;
                event.start = new Date(allEvents["note"]["instructions"][i].start);
                event.end = new Date(allEvents["note"]["instructions"][i].end);
                event.url = allEvents["note"]["instructions"][i].url;
                event.backgroundColor = allEvents["note"]["instructions"][i].backgroundColor;
                eventSource.push(event);
                event = {
                    step: event.step,
                    title: event.title,
                    desc: event.desc,
                    start: new Date(event.start),
                    end: new Date(event.end),
                    allDay: event.allDay,
                    url: event.url,
                    backgroundColor: event.backgroundColor
                };
            }
            return eventSource;
        }

        function cropUpdate(eventSource, datesss) {
            let offset = 0;
            for (let i = 0; i < eventSource.doc.note.instructions.length; i++) {
                if (i === 0) {
                    const prevStart = new Date(eventSource.doc.note.instructions[i].start);
                    const preEnd = new Date(eventSource.doc.note.instructions[i].end);
                    const diffTime = preEnd.getTime() - prevStart.getTime();
                    diff = Math.ceil(diffTime / (1000 * 3600 * 24));
                    eventSource.doc.note.instructions[i].start = new Date(datesss).toISOString();
                    const newStart = new Date(eventSource.doc.note.instructions[i].start);
                    let newEndTime = new Date(eventSource.doc.note.instructions[i].end);
                    newEndTime.setDate(newStart.getDate() + diff);
                    eventSource.doc.note.instructions[0].end = newEndTime.toISOString();

                    const clickedDate = new Date(datesss);
                    const differTime = (clickedDate.getTime() - prevStart.getTime());
                    offset = Math.ceil(differTime / (1000 * 3600 * 24));
                } else {
                    const previousStart = new Date(eventSource.doc.note.instructions[i].start);
                    const preEnd = new Date(eventSource.doc.note.instructions[i].end);
                    const diffTime = preEnd.getTime() - previousStart.getTime();
                    diff = Math.ceil(diffTime / (1000 * 3600 * 24));
                    const newStart = new Date();
                    const newEndTime = new Date();
                    newStart.setDate(previousStart.getDate() + offset);
                    newEndTime.setDate(newStart.getDate() + diff);
                    eventSource.doc.note.instructions[i].start = newStart.toISOString();
                    eventSource.doc.note.instructions[i].end = newEndTime.toISOString();
                }
            }
            return eventSource;
        }

        let cList = [];
        let db = new PouchDB('calen');
        db.get('crop').then(function (doc) {
            //cropList has user crops
            // if (doc.cropList.length < 0) {
            //     console.log(doc.cropList);
            // }
            // //croplList is empty; add user defined crop to cropList
            // else {

            // initialize the calendar
            let calendar = $("#calendar").fullCalendar({
                themeSystem: 'bootstrap4',
                buttonText: {
                    prev: 'prev',
                    next: 'next'
                },
                header: {
                    left: 'title',
                    center: 'today month,agendaWeek,agendaDay,list prev,next',
                    right: ''
                },
                navLinks: true,
                editable: true,
                eventLimit: true,
                defaultView: 'month',
                contentHeight: 445,
                handleWindowResize: true,
                dayClick: function (date) {
                    let eventSource, cropId, cropRev;
                    let events = [];
                    let cropLis = [];
                    let c = prompt("Enter Crop: ", "Potato");
                    //cList.push(c);
                    if (c != null) {
                        let db = new PouchDB('calen');
                        db.allDocs({
                            include_docs: true,
                            attachments: true
                        }).then(function (result) {
                            for (let i = 0; i < result.rows.length; i++) {
                                if (result.rows[i].doc._id === 'crop') {
                                    cropLis = result.rows[i].doc.cropList;
                                    if (cropLis.includes(c) === false)
                                        cropLis.push(c);
                                    db.put({
                                        _id: result.rows[i].doc._id,
                                        _rev: result.rows[i].doc._rev,
                                        cropList: cropLis
                                    });
                                }
                                let cr = result.rows[i].doc.crop;
                                if (c === cr) {
                                    eventSource = cropUpdate(result.rows[i], date);
                                    cropId = result.rows[i].doc._id;
                                    cList.push(cropId);
                                    cropRev = result.rows[i].doc._rev;
                                    events = eventSource.doc.note.instructions;
                                }
                            }
                            db.put({
                                _id: cropId,
                                _rev: cropRev,
                                crop: eventSource.doc.crop,
                                note: eventSource.doc.note
                            });
                            db.sync('http://127.0.0.1:5984/calen');
                        }).then(function () {
                            calendar.fullCalendar('renderEvents', events, true);
                        });
                    }
                    //calendar.fullCalendar('renderEvents', events, true);
                },
                eventClick: function (event, jsEvent) {
                    jsEvent.preventDefault();
                    $('#modalTitle').html(event.title);
                    $('#modalBody').html("Description: " + event.desc + "<br>Start: " + event.start._d + "<br>End: " + event.end._d +
                        "<br>Visit: <a href=" + event.url + " target=\"_blank\">" + event.url + "</a>");
                    $('#calendarModal').appendTo("body").modal();
                },
                eventDragStart: function (event) {
                    originalDate = new Date(event.start).toISOString();
                },
                eventDrop: function (info) {
                    let db = new PouchDB('calen');
                    let offset = 0;
                    let def = [];
                    let diff: any;
                    let i = 0;
                    let getCropJson;
                    if (info.backgroundColor === "blue") {
                        getCropJson = "crop1";
                    } else if (info.backgroundColor === "red") {
                        getCropJson = "crop2";
                    } else {
                        getCropJson = "crop3";
                    }
                    db.get(getCropJson).then(function (doc) {
                        for (i; i < doc.note.instructions.length; i++) {
                            let ii = i + 1;
                            if (doc.note.instructions[i].step === info.step) {
                                let preveStartTime = new Date(doc.note.instructions[i].start);
                                doc.note.instructions[i].start = info.start._d.toISOString();
                                doc.note.instructions[i].end = info.end._d.toISOString();
                                let fsd = new Date(doc.note.instructions[i].start);
                                const diffTime = (fsd.getTime() - preveStartTime.getTime());
                                offset = Math.ceil(diffTime / (1000 * 3600 * 24));
                            }
                            if (doc.note.instructions.length != ii) {
                                const prevStart = new Date(doc.note.instructions[ii].start);
                                const preEnd = new Date(doc.note.instructions[ii].end);
                                const diffTime = (preEnd.getTime() - prevStart.getTime());
                                diff = Math.ceil(diffTime / (1000 * 3600 * 24));
                                const newStart = new Date();
                                const newEndTime = new Date();
                                newStart.setDate(prevStart.getDate() + offset);
                                newEndTime.setDate(newStart.getDate() + diff);
                                doc.note.instructions[ii].start = newStart.toISOString();
                                doc.note.instructions[ii].end = newEndTime.toISOString();
                            }
                        }
                        return db.put({_id: doc._id, _rev: doc._rev, crop: doc.crop, note: doc.note});
                    }).then(function () {
                        console.log("eventsources: " + cList);
                        for (let i = 0; i < cList.length; i++) {
                            db.get(cList[i]).then(function (doc) {
                                myEvents = doc;
                                let ghi = getAllEvents(myEvents);
                                def = [...def, ...ghi];
                                console.log(def);
                            }).then(function () {
                                calendar.fullCalendar('removeEvents');
                            }).then(function () {
                                calendar.fullCalendar('renderEvents', def, true);
                            }).catch(function (err) {
                                console.log(err);
                            });
                        }
                        return db.allDocs({include_docs: true});
                    }).catch(function (err) {
                        console.log("kommt " + err);
                    });
                    db.sync('http://127.0.0.1:5984/calen');
                }
            });

            //Hammer Js swipe
            calendar.hammer().on("swipeleft", function (event) {
                calendar.fullCalendar('next');
            });
            calendar.hammer().on("swiperight", function (event) {
                calendar.fullCalendar('prev');
            });
            // }
        });
    }
}
