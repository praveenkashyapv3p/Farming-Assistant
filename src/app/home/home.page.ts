import {Component} from '@angular/core';
import {EventServiceService} from "../services/event-service.service";
import * as Hammer from 'hammerjs';

declare var $: any;
declare var define: any;
declare var exports: any;

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {
    allNotes: any;
    eventSource = [];
    event = {
        title: '',
        desc: '',
        start: new Date(),
        end: new Date(),
        allDay: false,
        url: ''
    };

    constructor(public myEvents: EventServiceService) {
    }

    resetEventFork() {
        this.event = {
            title: this.event.title,
            desc: this.event.desc,
            start: new Date(this.event.start),
            end: new Date(this.event.end),
            allDay: this.event.allDay,
            url: this.event.url
        };
    }

    ngOnInit() {
        this.myEvents.getMyEvents().then(data => {
            this.allNotes = data;
            let abc = [];
            for (let i = 0; i < this.allNotes.length; i++) {
                this.event.title = this.allNotes[i]["doc"]["note"]["title"];
                this.event.desc = this.allNotes[i]["doc"]["note"]["desc"];
                this.event.allDay = this.allNotes[i]["doc"]["note"]["allDay"];
                this.event.start = new Date(this.allNotes[i]["doc"]["note"]["startTime"]);
                this.event.end = new Date(this.allNotes[i]["doc"]["note"]["endTime"]);
                this.event.url = this.allNotes[i]["doc"]["note"]["url"];
                this.eventSource.push(this.event);
                abc = this.eventSource;
                this.resetEventFork();
            }
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
            // page is now ready, initialize the calendar...
            let calendar = $("#calendar").fullCalendar({
                themeSystem: 'bootstrap4',
                // buttonText: {
                //     prev: 'prev',
                //     next: 'next'
                // },
                header: {
                    left: 'title',
                    center: 'today month,agendaWeek,agendaDay,list',
                    right: ''
                },
                navLinks: true,
                editable: true,
                eventLimit: true,
                defaultView: 'month',
                contentHeight: 445,
                handleWindowResize: true,
                dayClick: function (date) {
                    let c = prompt("Enter Crop: ", "Grape");
                    console.log("crop: " + c + " on " + date.format() + abc);
                    calendar.fullCalendar('renderEvents', abc);
                }
            });
            //Hammer Js swipe
            calendar.hammer().on("swipeleft", function (event) {
                calendar.fullCalendar('next');
            });
            calendar.hammer().on("swiperight", function (event) {
                calendar.fullCalendar('prev');
            });
        });
    }

}
