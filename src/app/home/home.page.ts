import {Component, OnInit} from '@angular/core';
import * as Hammer from 'hammerjs';
import PouchDB from 'pouchdb';
import * as moment from 'moment';
import {EventServiceService} from "../services/event-service.service";

declare var $: any;
declare var define: any;
declare var exports: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage implements OnInit {
  event = {
    step: '',
    title: '',
    desc: '',
    start: moment(),
    end: moment(),
    allDay: false,
    url: '',
    cropName: '',
    imageurl: ''
  };
  selectedValue: any;
  clients = [
    {id: '1', clientName: 'a'},
    {id: '2', clientName: 'b'},
    {id: '3', clientName: 'c'}
  ];

  constructor() {
  }

  async ngOnInit() {
    let onceTime = 1;
    let mergedEvents = [];
    let originalDate;
    let cList = [];
    let db = new PouchDB('http://localhost:5984/calen');
    let event = {
      step: '',
      title: '',
      desc: '',
      start: moment(),
      end: moment(),
      allDay: false,
      url: '',
      cropName: '',
      imageurl: ''
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
        event.start = moment(allEvents["note"]["instructions"][i].start);
        event.end = moment(allEvents["note"]["instructions"][i].end);
        event.url = allEvents["note"]["instructions"][i].url;
        event.cropName = allEvents["note"]["instructions"][i].cropName;
        event.imageurl = allEvents["note"]["instructions"][i].imageurl;
        eventSource.push(event);
        event = {
          step: event.step,
          title: event.title,
          desc: event.desc,
          start: moment(event.start),
          end: moment(event.end),
          allDay: event.allDay,
          url: event.url,
          cropName: event.cropName,
          imageurl: event.imageurl
        };
      }
      return eventSource;
    }

    let eventServiceService = new EventServiceService();
    eventServiceService.getPDF();

    function cropUpdate(eventSource, dates) {
      let offset = 0;
      for (let i = 0; i < eventSource.doc.note.instructions.length; i++) {
        const previousStart = moment(eventSource.doc.note.instructions[i].start);
        const previousEnd = moment(eventSource.doc.note.instructions[i].end);
        const prvStartEndDiff = previousEnd.diff(previousStart, 'd');
        if (i === 0) {
          eventSource.doc.note.instructions[i].start = moment(dates).toISOString();
          let newStDate = moment(eventSource.doc.note.instructions[i].start);
          //const  prvStartEndDiff = previousEnd.diff(previousStart,'d');
          let newEndDate = newStDate.add(prvStartEndDiff, 'd')
          eventSource.doc.note.instructions[i].end = newEndDate.toISOString();
          console.log(prvStartEndDiff + "\t" + newEndDate);
          const clickedDate = moment(dates);
          offset = clickedDate.diff(previousStart, 'd');
        } else {
          let newStart = previousStart.add(offset, 'd');
          eventSource.doc.note.instructions[i].start = newStart.toISOString();
          const newSt = moment(eventSource.doc.note.instructions[i].start);
          let newEndDate = newSt.add(prvStartEndDiff, 'd')
          eventSource.doc.note.instructions[i].end = newEndDate.toISOString();
        }
      }
      return eventSource;
    }

    function validateSelDate(date: any, eventflag) {
      let c;
      if (eventflag == "dayclcick ") {
        c = prompt("Enter Crop: ", "Potato");
      }
      const begin = moment('16/03/____', 'DD/MM/____') // begin
      const end = moment('16/04/____', 'DD/MM/____') // end
      if (moment(date).isBetween(begin, end, 'days', '[]')) {
        return c;
      } else {
        switch (eventflag) {
          case "dayclcick":
            if (confirm("The recommended start date for farming of potatoes is between March to mid April. " +
              "Do you still want to continue with current selected date?")) {
              return c;
            }
            break;
          case "evetdrp":
            if (confirm("The recommended start date for farming of potatoes is between March to mid April." +
              "This modification pushes the start date out of recommended range. " +
              "Do you still want to continue with current selected date?")) {
              return true;
            }
            break;
        }

      }
    }

    async function dayClicking(date, jsEvent, calendar) {
      let eventSource, cropId, cropRev;
      let allCropRev, allCropNote;
      let events = [];
      let cropLis = [];
      let c = validateSelDate(date, "dayclcick");


      //try to remove prompt and replace modal
      // jsEvent.preventDefault();
      // $('#modalTitle').html("Enter Crop");
      // $('#modalBody').html(
      //   "<label for=\"fname\">First name:</label><br>\n" +
      //   "  <input type=\"text\" id=\"fname\" name=\"fname\"><br>" +
      //   "  ");
      // $('#calendarModal').appendTo("body").modal();


      if (c != null) {
        try {
          await db.allDocs({
            include_docs: true,
            attachments: true
          }).then(function (result) {
            for (let i = 0; i < result.rows.length; i++) {
              let cr = result.rows[i].doc._id;
              if (c.toLowerCase() === cr.toLowerCase()) {
                eventSource = cropUpdate(result.rows[i], date);
                cropId = result.rows[i].doc._id;
                cList.push(cropId);
                cropRev = result.rows[i].doc._rev;
                events = eventSource.doc.note.instructions;
                if (onceTime === 1) {
                  mergedEvents = events;
                  onceTime = 0;
                } else {
                  for (let k = 0; k < events.length; k++)
                    mergedEvents.push(events[k]);
                  allCropNote.instructions = mergedEvents;
                }
              }
              if (result.rows[i].doc._id === 'allCrops') {
                allCropRev = result.rows[i].doc._rev;
                allCropNote = result.rows[i].doc.note;
              }
              if (i === (result.rows.length - 1)) {
                allCropNote.instructions = mergedEvents;
                db.put({
                  _id: "allCrops",
                  _rev: allCropRev,
                  note: allCropNote
                });
              }
            }
            db.get('crop').then(function (doc) {
              return db.put({
                _id: 'crop',
                _rev: doc._rev,
                cropList: cList
              });
            }).then(function (response) {
              console.log(response);
            }).catch(function (err) {
              console.log(err);
            });
            db.sync('http://127.0.0.1:5984/calen');
          }).then(function () {
            calendar.fullCalendar('removeEvents');
          }).then(function () {
            calendar.fullCalendar('renderEvents', allCropNote.instructions, true);
          }).then(function () {
            calendar.render();
          });
        } catch (e) {
          console.log(e);
        }
      }
    }

    async function eventDropping(info, calendar) {
      let presrntevent = calendar.fullCalendar('clientEvents');
      console.log(presrntevent);
      //let checkstart;
      let def = [];
      let offset = 0;
      let i = 0;
      let getCropJson = [];
      try {
        await db.get('crop').then(function (doc) {
          getCropJson = doc.cropList;
        }).catch(function (err) {
          console.log(err);
        });
        await db.get("allCrops").then(function (doc) {
          let c;
          for (i; i < doc.note.instructions.length; i++) {
            if (doc.note.instructions[i].step == 1) {
              i = 0;
              c = validateSelDate(doc.note.instructions[i].start, "evetdrp");
              if (!c) {
                calendar.fullCalendar('renderEvents', presrntevent, true);
                break;
              }
            }
            if (c) {
              let ii = i + 1;
              if (doc.note.instructions[i].step === info.step && doc.note.instructions[i].cropName === info.cropName) {
                let preveStartTime = moment(doc.note.instructions[i].start);
                //checkstart = moment(info.start).toISOString();
                doc.note.instructions[i].start = moment(info.start).toISOString();
                doc.note.instructions[i].end = moment(info.end).toISOString();
                let newStrt = moment(doc.note.instructions[i].start);
                offset = newStrt.diff(preveStartTime, 'd');
              }
              if (doc.note.instructions.length != ii && doc.note.instructions[ii].cropName === info.cropName) {
                const prevStart = moment(doc.note.instructions[ii].start);
                let prevEnd = moment(doc.note.instructions[ii].end);
                let newSt = prevStart.add(offset, 'd');
                doc.note.instructions[ii].start = newSt.toISOString();
                let diffe = prevEnd.diff(prevStart, 'd');
                let newStrt = moment(doc.note.instructions[ii].start);
                let newEnd = newStrt.add(diffe, 'd');
                doc.note.instructions[ii].end = newEnd.toISOString();
              }
            }
          }
          return db.put({_id: doc._id, _rev: doc._rev, crop: doc.crop, note: doc.note});
        }).then(function () {
          for (let i = 0; i < getCropJson.length; i++) {
            db.get("allCrops").then(function (doc) {
              let ghi = getAllEvents(doc);
              def = [...ghi];
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
      } catch (e) {
        console.log(e);
      }
    }

    db.get('allCrops').then(function (doc) {
      //cropList has user crops
      let abc = getAllEvents(doc);
      if (abc.length > 0) {
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
          eventColor: '#ffffff',
          eventTextColor: '#000000',
          events: abc,
          dayClick: function (date, jsEvent) {
            dayClicking(date, jsEvent, calendar);
          },
          eventRender: function (event, eventElement) {
            let todayDate = new Date();
            if (event.imageurl) {
              eventElement.find("div.fc-content").prepend("<img src='assets/icon/" + event.cropName + ".jpeg' width='35' height='35' alt='' >");
            }
            if (event.start < todayDate)
              eventElement.css('color', 'green');
          },
          eventClick: function (event, jsEvent) {
            jsEvent.preventDefault();
            $('#modalTitle').html(event.title);
            $('#modalBody').html("Description: " + event.desc + "<br>Date: " + event.start.format("dddd, MMMM Do YYYY") +
              "<br>Visit: <a href=" + event.url + " target=\"_blank\">" + event.url + "</a>" +
              "<br> <label for=\"status\">Status:</label>\n" +
              "\n" +
              "<select (change) = \"selectChangeHandler($event)\" id=\"status\">\n" +
              "  <option value=\"To do\">Todo</option>\n" +
              "  <option value=\"InProgress\">In Progress</option>\n" +
              "  <option value=\"Done\">Done</option>\n" +
              "</select>\n" +
              "  ");
            $('#calendarModal').appendTo("body").modal();
          },
          eventDragStart: function (event) {
            originalDate = moment(event.start).toISOString();
          },
          eventDrop: function (info) {
            //validateSelDate();
            eventDropping(info, calendar);
          }
        });

        //Hammer Js swipe
        calendar.hammer().on("swipeleft", function (event) {
          calendar.fullCalendar('next');
        });
        calendar.hammer().on("swiperight", function (event) {
          calendar.fullCalendar('prev');
        });
      } else {
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
          eventColor: '#ffffff',
          eventTextColor: '#000000',
          dayClick: function (date, jsEvent) {
            dayClicking(date, jsEvent, calendar);
          },
          eventRender: function (event, eventElement) {
            if (event.imageurl) {
              eventElement.find("div.fc-content").prepend("<img src='assets/icon/" + event.cropName + ".jpeg' width='35' height='35' alt='' >");
            }
          },
          eventClick: function (event, jsEvent) {
            jsEvent.preventDefault();
            $('#modalTitle').html(event.title);
            $('#modalBody').html("Description: " + event.desc + "<br>Date: " + event.start.format("dddd, MMMM Do YYYY") +
              "<br>Visit: <a href=" + event.url + " target=\"_blank\">" + event.url + "</a>");
            $('#calendarModal').appendTo("body").modal();
          },
          eventDragStart: function (event) {
            originalDate = moment(event.start).toISOString();
          },
          eventDrop: function (info) {
            console.log(info.cropName);
            eventDropping(info, calendar);
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
    });
  }

  public changeClient(): void { //here item is an object
    console.log(this.selectedValue);
  }
}
