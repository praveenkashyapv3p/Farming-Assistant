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
        let abc = [];
        let renderCount = 0;
        let myEvents: any;
        let diff: any;
        let originalDate, dataId, cropName;
        let eventSource = [];
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


        this.calEvents.getMyEvents().then(data => {
            this.allNotes = data;
            dataId = this.allNotes[1].id;
            cropName = this.allNotes[1]["doc"]["note"]["crop"];
            if (this.allNotes[1]["doc"]["note"]["instructions"].length > 0) {
                console.log("cropName: " + cropName);
            } else {
                console.log("working");
            }
        });

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
                let c = prompt("Enter Crop: ", "Potato");
                if (c != null) {
                    let db = new PouchDB('calen');
                    db.get('test1').then(function (doc) {
                        const prevStart = new Date(doc.note.instructions[0].startTime);
                        const preEnd = new Date(doc.note.instructions[0].endTime);
                        const diffTime = Math.abs(preEnd.getTime() - prevStart.getTime());
                        diff = Math.ceil(diffTime / (1000 * 3600 * 24));
                        doc.note.instructions[0].startTime = new Date(date).toISOString();
                        const newStart = new Date(doc.note.instructions[0].startTime);
                        let newEndTime = new Date(doc.note.instructions[0].endTime);
                        newEndTime.setDate(newStart.getDate() + diff);
                        doc.note.instructions[0].endTime = newEndTime.toISOString();
                        return db.put(doc);
                    }).then(function () {
                        return db.get('test1');
                    }).then(function (doc) {
                    });
                    db.sync('http://127.0.0.1:5984/calen');

                    db.allDocs({
                        include_docs: true,
                        attachments: true
                    }).then(function (result) {
                        myEvents = result.rows;
                        for (let i = 0; i < myEvents[1]["doc"]["note"]["instructions"].length; i++) {
                            event.step = myEvents[1]["doc"]["note"]["instructions"][i].step;
                            event.title = myEvents[1]["doc"]["note"]["instructions"][i].title;
                            event.desc = myEvents[1]["doc"]["note"]["instructions"][i].description;
                            event.allDay = myEvents[1]["doc"]["note"]["instructions"][i].allDay;
                            event.start = new Date(myEvents[1]["doc"]["note"]["instructions"][i].startTime);
                            event.end = new Date(myEvents[1]["doc"]["note"]["instructions"][i].endTime);
                            event.url = myEvents[1]["doc"]["note"]["instructions"][i].url;
                            event.backgroundColor = myEvents[1]["doc"]["note"]["instructions"][i].backgroundColor;
                            eventSource.push(event);
                            abc = eventSource;
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
                    }).then(function () {
                        calendar.fullCalendar('renderEvents', abc, true);
                    }).catch(function (err) {
                        console.log(err);
                    });
                }
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
                let diff: any;
                let i = 0;
                db.get('test1').then(function (doc) {
                    for (i; i < doc.note.instructions.length; i++) {
                        let ii = i + 1;
                        if (doc.note.instructions[i].step === info.step) {
                            let preveStartTime = new Date(doc.note.instructions[i].startTime);
                            let preveEndTime = new Date(doc.note.instructions[i].endTime);
                            console.log(preveStartTime + " " + preveEndTime);
                            doc.note.instructions[i].startTime = info.start._d.toISOString();
                            doc.note.instructions[i].endTime = info.end._d.toISOString();
                            console.log(doc.note.instructions[i].step + " " + doc.note.instructions[i].startTime + " " + doc.note.instructions[i].endTime);
                            let fsd = new Date(doc.note.instructions[i].startTime);
                            const diffTime = (fsd.getTime() - preveStartTime.getTime());
                            offset = Math.ceil(diffTime / (1000 * 3600 * 24));
                        }
                        if (doc.note.instructions.length != ii) {
                            const prevStart = new Date(doc.note.instructions[ii].startTime);
                            const preEnd = new Date(doc.note.instructions[ii].endTime);
                            const diffTime = (preEnd.getTime() - prevStart.getTime());
                            diff = Math.ceil(diffTime / (1000 * 3600 * 24));
                            const newStart = new Date();
                            const newEndTime = new Date();
                            newStart.setDate(prevStart.getDate() + offset);
                            newEndTime.setDate(newStart.getDate() + diff);
                            doc.note.instructions[ii].startTime = newStart.toISOString();
                            doc.note.instructions[ii].endTime = newEndTime.toISOString();
                        }
                    }
                    //calendar.fullCalendar('rerenderEvents');
                    console.log("_id: " + doc._id + " _rev: " + doc._rev + " note: " + doc.note.instructions);
                    return db.put({_id: doc._id, _rev: doc._rev, note: doc.note});
                }).then(function () {
                    return db.allDocs({include_docs: true});
                }).then(function () {
                    calendar.fullCalendar('rerenderEvents');
                    console.log("coming here... ");
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
    }
}
