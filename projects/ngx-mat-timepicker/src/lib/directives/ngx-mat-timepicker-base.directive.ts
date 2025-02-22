import {Directive, HostListener, Inject, Input, OnDestroy, OnInit, Optional} from "@angular/core";
import {ThemePalette} from "@angular/material/core";
//
import {NgxMatTimepickerEventService} from "../services/ngx-mat-timepicker-event.service";
import {NgxMatTimepickerService} from "../services/ngx-mat-timepicker.service";
import {NgxMatTimepickerAdapter} from "../services/ngx-mat-timepicker-adapter";
//
import {NgxMatTimepickerUnits} from "../models/ngx-mat-timepicker-units.enum";
import {NgxMatTimepickerClockFace} from "../models/ngx-mat-timepicker-clock-face.interface";
import {NgxMatTimepickerPeriods} from "../models/ngx-mat-timepicker-periods.enum";
import {NGX_MAT_TIMEPICKER_LOCALE} from "../tokens/ngx-mat-timepicker-time-locale.token";
import {NGX_MAT_TIMEPICKER_CONFIG} from "../tokens/ngx-mat-timepicker-config.token";
//
import {Observable, Subject} from "rxjs";
import {shareReplay, takeUntil} from "rxjs/operators";

@Directive({
    selector: "[ngxMatTimepickerBase]"
})
export class NgxMatTimepickerBaseDirective implements OnInit, OnDestroy {

    @Input()
    set color(newValue: ThemePalette) {
        this._color = newValue;
    }

    get color(): ThemePalette {
        return this._color;
    }

    get defaultTime(): string {
        return this._defaultTime;
    }

    @Input()
    set defaultTime(time: string) {
        this._defaultTime = time;
        this._setDefaultTime(time);
    }

    activeTimeUnit: NgxMatTimepickerUnits = NgxMatTimepickerUnits.HOUR;
    selectedHour: Observable<NgxMatTimepickerClockFace>;
    selectedMinute: Observable<NgxMatTimepickerClockFace>;
    selectedPeriod: Observable<NgxMatTimepickerPeriods>;
    timeUnit: typeof NgxMatTimepickerUnits = NgxMatTimepickerUnits;

    protected _color: ThemePalette = "primary";
    protected _defaultTime: string;
    protected _subsCtrl$ = new Subject();

    constructor(protected _timepickerSrv: NgxMatTimepickerService,
                protected _eventSrv: NgxMatTimepickerEventService,
                @Inject(NGX_MAT_TIMEPICKER_LOCALE) protected _locale: string,
                @Inject(NGX_MAT_TIMEPICKER_CONFIG) @Optional() public data) {

        this.color = data.color;
        this.defaultTime = data.defaultTime;
    }

    changePeriod(period: NgxMatTimepickerPeriods): void {
        this._timepickerSrv.period = period;
        this._onTimeChange();
    }

    changeTimeUnit(unit: NgxMatTimepickerUnits): void {
        this.activeTimeUnit = unit;
    }

    close(res: boolean): void {
        this.data.timepickerBaseRef.close(res);
    }

    ngOnDestroy(): void {
        this._subsCtrl$.next();
        this._subsCtrl$.complete();
    }

    ngOnInit(): void {
        this._defineTime();
        this.selectedHour = this._timepickerSrv.selectedHour
            .pipe(shareReplay({bufferSize: 1, refCount: true}));
        this.selectedMinute = this._timepickerSrv.selectedMinute
            .pipe(shareReplay({bufferSize: 1, refCount: true}));
        this.selectedPeriod = this._timepickerSrv.selectedPeriod
            .pipe(shareReplay({bufferSize: 1, refCount: true}));
        this.data.timepickerBaseRef.timeUpdated.pipe(takeUntil(this._subsCtrl$))
            .subscribe(this._setDefaultTime.bind(this));
    }

    onHourChange(hour: NgxMatTimepickerClockFace): void {
        this._timepickerSrv.hour = hour;
        this._onTimeChange();
    }

    onHourSelected(hour: number): void {
        if (!this.data.hoursOnly) {
            this.changeTimeUnit(NgxMatTimepickerUnits.MINUTE);
        }
        this.data.timepickerBaseRef.hourSelected.next(hour);
    }

    @HostListener("keydown", ["$event"])
    onKeydown(e: any): void {
        this._eventSrv.dispatchEvent(e);
        e.stopPropagation();
    }

    onMinuteChange(minute: NgxMatTimepickerClockFace): void {
        this._timepickerSrv.minute = minute;
        this._onTimeChange();
    }

    setTime(): void {
        this.data.timepickerBaseRef.timeSet.next(this._timepickerSrv.getFullTime(this.data.format));
    }

    protected _defineTime(): void {
        const minTime = this.data.minTime;

        if (minTime && (!this.data.time && !this.data.defaultTime)) {
            const time = NgxMatTimepickerAdapter.fromDateTimeToString(minTime, this.data.format);

            this._setDefaultTime(time);
        }
    }

    protected _onTimeChange(): void {
        const time = NgxMatTimepickerAdapter.toLocaleTimeString(this._timepickerSrv.getFullTime(this.data.format), {
            locale: this._locale,
            format: this.data.format
        });

        this.data.timepickerBaseRef.timeChanged.emit(time);
    }

    protected _setDefaultTime(time: string): void {
        this._timepickerSrv.setDefaultTimeIfAvailable(
            time, this.data.minTime, this.data.maxTime, this.data.format, this.data.minutesGap);
    }
}
