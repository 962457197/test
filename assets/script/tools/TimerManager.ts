export class TimerData {
    type: TimerType;
    interval: number;
    keep: () => boolean;
    condition: () => boolean;
    body: () => void;
    end: () => void;
    objthis: any;
}

export class TimerManager {

    DeltaTime()
    {
        const dt: number = 1 / cc.director.getScheduler().getTimeScale();
        return dt;
    }

    private static s_instance: TimerManager | null = null;
    private m_timerBuilder: TimerBuilder;

    constructor() {
        this.m_timerBuilder = new TimerBuilder();
    }

    public static get Instance(): TimerManager {
        if (this.s_instance === null) {
            this.s_instance = new TimerManager();
        }
        return this.s_instance;
    }

    public OnUpdate(dt: number) {
        this.m_timerBuilder.OnFixedUpdate(dt);
    }

    public OnQuit() {
        this.m_timerBuilder.OnQuit();
    }

    public OnDestroy() {
        this.m_timerBuilder.OnDestroy();
    }

    public ForceStopTimer(timer: Timer, obj: any) {
        this.m_timerBuilder.ForceStopTimer(timer, obj);
    }

    public CreateTimer(data: TimerData): Timer | null {
        return this.m_timerBuilder.CreateTimer(data);
    }
}

export class TimerBuilder {
    private m_timers: Timer[] = [];
    private m_queues: Timer[] = [];
    private m_timerPool: Timer[] = [];
    private m_removes: Timer[] = [];

    private CheckPoolHasTimer(timer: Timer): boolean {
        for (let i = 0; i < this.m_timerPool.length; i++) {
            if (this.m_timerPool[i].Guid === timer.Guid) {
                return true;
            }
        }
        return false;
    }

    public OnFixedUpdate(dt: number) {
        if (this.m_queues.length > 0) {
            this.m_timers.push(...this.m_queues);
            this.m_queues.length = 0;
        }
        for (let i = 0; i < this.m_timers.length; i++) {
            const timer: Timer = this.m_timers[i];
            if (!timer.IsFinished) {
                if (!timer.Tick(dt)) {
                    timer.OnFinish();
                    this.m_removes.push(timer);
                }
            } else {
                this.m_removes.push(timer);
            }
        }
        for (let i = 0; i < this.m_removes.length; i++) {
            const timer: Timer = this.m_removes[i];
            this.m_timers.splice(this.m_timers.indexOf(timer), 1);
            if (this.CheckPoolHasTimer(timer)) {

            } else {
                timer.SubUse();
                this.m_timerPool.push(timer);
                timer.Stop();
            }
        }
        this.m_removes.length = 0;
    }

    public OnQuit() {
        for (let i = 0; i < this.m_timers.length; i++) {
            this.m_timers[i].Stop();
        }
        for (let i = 0; i < this.m_queues.length; i++) {
            this.m_queues[i].Stop();
        }
    }

    public OnDestroy() {
        // Implement OnDestroy if needed
    }

    public ForceStopTimer(timer: Timer, obj: any) {
        if (timer.objthis !== null && timer.objthis !== obj) {
            return;
        }
        timer.Stop();
    }

    public CreateTimer(data: TimerData): Timer | null {
        let timer: Timer | null = null;
        for (let i = 0; i < this.m_timerPool.length; i++) {
            if (this.m_timerPool[i].Type === data.type) {
                timer = this.m_timerPool[i];
                this.m_timerPool.splice(i, 1);
                break;
            }
        }
        if (timer !== null) {
            timer.Reset(data);
            this.m_queues.push(timer);
            return timer;
        }
        switch (data.type) {
            case TimerType.enLoop:
                timer = new LoopTimer(data);
                break;
            case TimerType.enOnce:
                timer = new OnceTimer(data);
                break;
            case TimerType.enConditionLoop:
                timer = new ConditionLoopTimer(data);
                break;
            case TimerType.enConditionOnce:
                timer = new ConditionOnceTimer(data);
                break;
            default:
                break;
        }
        if (timer !== null) {
            this.m_queues.push(timer);
            return timer;
        }
        return null;
    }
}

export enum TimerType {
    enOnce,
    enLoop,
    enConditionLoop,
    enConditionOnce,
}

export abstract class Timer {
    public objthis: any;
    public objName: string;
    public isNew: boolean;
    public useCount: number = 0;

    m_continue: () => boolean;
    m_body: () => void;
    m_end: () => void;
    m_isStart: boolean = true;
    m_guid: number = 0;

    public get Guid(): number {
        return this.m_guid;
    }

    public constructor(data: TimerData) {
        this.isNew = true;
        this.objthis = data.objthis;
        this.objName = this.objthis.toString();
        // this.m_guid = Timer.GenGUID++;
        this.useCount = 1;
        this.m_isStart = true;
        this.m_continue = data.keep;
        this.m_body = data.body;
        this.m_end = data.end;
    }

    public abstract get Type(): TimerType;

    public get IsFinished(): boolean {
        return !this.m_isStart;
    }

    public Tick(dt: number): boolean
    {
        return this.m_continue();
    }

    public Reset(data: TimerData) {
        this.isNew = false;
        this.objthis = data.objthis;
        this.objName = this.objthis.toString();
        this.useCount++;
        this.m_isStart = true;
        this.m_body = data.body;
        this.m_end = data.end;
        this.m_continue = data.keep;
    }

    public Stop() {
        this.m_isStart = false;
        this.objthis = null;
    }

    public OnFinish() {
        this.m_isStart = false;
        this.m_end?.call(this);
    }

    public SubUse() {
        this.useCount--;
    }
}

export abstract class ConditionTimer extends Timer {
    protected m_condition: () => boolean;

    public constructor(data: TimerData) {
        super(data);
        this.m_condition = data.condition;
    }

    public Reset(data: TimerData) {
        this.m_condition = data.condition;
        super.Reset(data);
    }
}

export class ConditionLoopTimer extends ConditionTimer {
    public constructor(data: TimerData) {
        super(data);
    }

    public get Type(): TimerType {
        return TimerType.enConditionLoop;
    }

    public Tick(dt: number): boolean {
        if (this.m_condition()) {
            this.m_body();
        }
        return super.Tick(dt);
    }
}

export class ConditionOnceTimer extends ConditionTimer {
    public constructor(data: TimerData) {
        super(data);
    }

    public get Type(): TimerType {
        return TimerType.enConditionOnce;
    }

    public Tick(dt: number): boolean {
        if (this.m_condition()) {
            this.m_body();
            return false;
        }
        return true;
    }
}

export abstract class TimeTimer extends Timer {
    protected m_interval: number;
    protected m_startTime: number;

    public constructor(data: TimerData) {
        super(data);
        this.m_interval = data.interval;
        this.m_startTime = 0;
    }

    public Reset(data: TimerData) {
        this.m_interval = data.interval;
        this.m_startTime = 0;
        super.Reset(data);
    }
}

export class LoopTimer extends TimeTimer {
    public constructor(data: TimerData) {
        super(data);
    }

    public get Type(): TimerType {
        return TimerType.enLoop;
    }

    public Tick(dt: number): boolean {
        this.m_startTime += dt;
        if (this.m_startTime >= this.m_interval) {
            this.m_body();
            this.m_startTime = 0;
        }
        return super.Tick(dt);
    }
}

export class OnceTimer extends TimeTimer {
    public constructor(data: TimerData) {
        super(data);
    }

    public get Type(): TimerType {
        return TimerType.enOnce;
    }

    public Tick(dt: number): boolean {
        this.m_startTime += dt;
        if (this.m_startTime >= this.m_interval) {
            this.m_body();
            this.m_startTime = 0;
            return false;
        }
        return true;
    }
}
