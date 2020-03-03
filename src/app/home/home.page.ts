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

    resetEventFork() {
        this.event = {
            step: this.event.step,
            title: this.event.title,
            desc: this.event.desc,
            start: new Date(this.event.start),
            end: new Date(this.event.end),
            allDay: this.event.allDay,
            url: this.event.url
        };
    }

    ngOnInit() {
        this.calEvents.getMyEvents().then(data => {
            this.allNotes = data;
            let abc = [];
            let renderCount = 0;
            let originalDate;
            for (let i = 0; i < this.allNotes[0]["doc"]["note"]["instructions"].length; i++) {
                this.event.step = this.allNotes[0]["doc"]["note"]["instructions"][i].step;
                this.event.title = this.allNotes[0]["doc"]["note"]["instructions"][i].title;
                this.event.desc = this.allNotes[0]["doc"]["note"]["instructions"][i].description;
                this.event.allDay = this.allNotes[0]["doc"]["note"]["instructions"][i].allDay;
                this.event.start = new Date(this.allNotes[0]["doc"]["note"]["instructions"][i].startTime);
                this.event.end = new Date(this.allNotes[0]["doc"]["note"]["instructions"][i].endTime);
                this.event.url = this.allNotes[0]["doc"]["note"]["instructions"][i].url;
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
                     if(c != null) {
                         if (renderCount != 1) {
                             renderCount = 1;
                              let eventService = new EventServiceService();
                              //eventService.getStartEvent(c, date);
                             calendar.fullCalendar('renderEvents', abc, true);
                         }
                     }
                    //calendar.fullCalendar('renderEvents', abc, true);
                },
                eventClick:  function(event, jsEvent, view) {
                    jsEvent.preventDefault();
                    $('#modalTitle').html(event.title);
                    $('#modalBody').html("Description: "+ event.desc + "<br>Start: " + event.start._d + "<br>End: " + event.end._d +
                   "<br>Visit: <a href="+event.url+" target=\"_blank\">"+event.url+"</a>");
                    $('#calendarModal').appendTo("body").modal();
                },
                eventDragStart: function (event) {
                    originalDate = new Date(event.start).toISOString();
                },
                eventDrop: function (info) {
                    let eventService = new EventServiceService();
                    eventService.updateEvent(info);
                    console.log("original date: "+ originalDate + " drop date: "+ info.start.toISOString() + " " + info.end.toISOString());
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
