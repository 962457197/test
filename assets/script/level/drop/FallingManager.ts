import { Blocker } from "../blocker/Blocker";
import { TiledType, Direction } from "../data/LevelScriptableData";
import { FSBase, FSAdpater, FSStateType } from "../fsm/FSBase";
import { StateFactory } from "../fsm/StateFactory";
import { Tiled } from "../tiledmap/Tiled";
import { TiledMap } from "../tiledmap/TiledMap";
import { FallingAnimation } from "./FallingAnimation";

class FallingWaitData {
    public waitTiled: Tiled;
    public startTime: number;

    constructor(tiled: Tiled) {
        this.waitTiled = tiled;
        this.startTime = cc.director.getTotalTime();
    }
}

class EmptyTiledData {
    public emptyTiled: Tiled;

    constructor(tiled: Tiled) {
        this.emptyTiled = tiled;
    }
}

export class FallingManager {
    private static s_instance: FallingManager;
    m_animPools: FallingAnimation[] = [];
    m_anims: FallingAnimation[] = [];
    m_dequeueAnim: FallingAnimation[] = [];
    m_emptyLst: EmptyTiledData[] = [];
    m_cachedList: EmptyTiledData[] = [];
    m_lastState: FSBase | null = null;
    m_isStart: boolean = false;
    m_isPauseFallingCount: number = 0;
    DelayCount: number = 0;
    AdpaterStates: FSAdpater[] = [];
    m_waitList: FallingWaitData[] = [];
    m_endlessDropTime: number = 0;

    FallingInterval = 50;

    private static instance: FallingManager;
    public static get Instance(): FallingManager {
        if (this.instance == null) {
            this.instance = new FallingManager();
        }
        return this.instance;
    }

    private constructor() {

    }

    public OnTriggerFalling(curTiled: Tiled): void {
        this.m_isStart = true;
        this.PushEmptyTiled(curTiled);
    }
    
    m_allFallStateLst: FSBase[] = [];
    public OnStartFalling(fall: FSBase): void {
        this.m_isStart = true;
        this.m_allFallStateLst.push(fall);
    }

    public AddDelayCount(): void {
        this.DelayCount++;
    }
    
    public RemoveDelayCount(): void {
        this.DelayCount--;
    }
    
    
    public OnPauseFalling(): void {
        this.m_isPauseFallingCount++;
    }
    
    public OnResumeFalling(): void {
        this.m_isPauseFallingCount--;
    }
    
    public IsStopFalling(): boolean {
        return (this.m_anims.length <= 0
            && this.AdpaterStates.length <= 0
            && this.m_emptyLst.length <= 0
            && this.m_cachedList.length <= 0
            && this.DelayCount <= 0);
    }
    
    public OnQuit(): void {
        this.DelayCount = 0;
        this.m_isStart = false;
        this.m_emptyLst = [];
        this.m_cachedList = [];
        this.m_anims = [];
        this.m_dequeueAnim = [];
        this.AdpaterStates = [];
        this.m_isPauseFallingCount = 0;
        this.m_waitList = [];
    }
    
    private PopFallingAnim(): FallingAnimation {
        if (this.m_animPools.length > 0) {
            const anim = this.m_animPools.pop();
            return anim;
        }
        return new FallingAnimation();
    }
    
    private PushEmptyTiled(curTiled: Tiled): void {
        for (let i = 0; i < this.m_emptyLst.length; i++) {
            if (this.m_emptyLst[i].emptyTiled.Guid === curTiled.Guid) {
                return;
            }
        }

        this.m_emptyLst.push(new EmptyTiledData(curTiled));
    }
    
    private PopEmptyTiled(): EmptyTiledData {
        let empty: EmptyTiledData = new EmptyTiledData(null);
        while (this.m_emptyLst.length > 0) {
            const tmp = this.m_emptyLst.pop();
            if (tmp.emptyTiled.Marked) {
                continue;
            }
            if (null == tmp.emptyTiled.CanMoveBlocker && tmp.emptyTiled.IsValidTiled()) {
                empty.emptyTiled = tmp.emptyTiled;
                break;
            }
            let curTiled = tmp.emptyTiled;
            const start = curTiled;
            while (null != curTiled.GetPrevTiled() && null != curTiled.CanMoveBlocker) {
                curTiled = curTiled.GetPrevTiled();
                if (curTiled.Guid === start.Guid) {
                    break;
                }
            }
            if (curTiled.CanArrive()) {
                empty.emptyTiled = curTiled;
                break;
            }
        }
        return empty;
    }
    
    private GetIdxByGuid(guid: number): number {
        let idx = -1;
        for (let i = 0; i < this.m_waitList.length; i++) {
            if (this.m_waitList[i].waitTiled.Guid === guid) {
                idx = i;
                break;
            }
        }
        return idx;
    }
    
    public CheckFallingWait(tiled: Tiled): boolean {
        const idx: number = this.GetIdxByGuid(tiled.Guid);
        if (idx === -1) {
            return true;
        }
        const wait: FallingWaitData = this.m_waitList[idx];
        const interval: number = cc.director.getTotalTime() - wait.startTime;
        if (interval <= this.FallingInterval) {
            return false;
        }
        this.m_waitList.splice(idx, 1);
        return true;
    }
    
    public OnUpdate(): void {
        if (this.m_isPauseFallingCount > 0) {
            return;
        }
        this.CheckFalling();
    }
    
    public CheckFalling(): void {
        if (!this.m_isStart) {
            return;
        }
        if (this.m_cachedList.length > 0) {
            this.m_emptyLst.push(...this.m_cachedList);
            this.m_cachedList.length = 0;
        }
        let empty: EmptyTiledData = this.PopEmptyTiled();
        while (null != empty.emptyTiled) {
            if (!empty.emptyTiled.CanGoIn()) {
                empty = this.PopEmptyTiled();
                continue;
            }
            const preTiled: Tiled | null = this.FindPrevMoveBlockerTiled(empty.emptyTiled);
            if (preTiled != null && preTiled.GetNextTiled() != null) {
                if (preTiled.GetSpecialID() <= 0 && this.CheckFallingWait(preTiled)) {
                    const anim: FallingAnimation = this.PopFallingAnim();
                    anim.Init(preTiled, preTiled.GetNextTiled(), this.OnFallingEnd.bind(this), this.OnFallingInterrupt.bind(this));
                    this.m_anims.push(anim);
                    this.PushEmptyTiled(preTiled);
                    const prePreTiled: Tiled | null = preTiled.GetPrevTiled();
                    if (prePreTiled != null && prePreTiled.CanMove() && !prePreTiled.CanMoveBlocker.IsMarked() && !prePreTiled.Marked) {
                        const idx: number = this.GetIdxByGuid(preTiled.PrevTiledGuid);
                        if (idx === -1) {
                            this.m_waitList.push(new FallingWaitData(prePreTiled));
                        }
                    } else if (prePreTiled == null || !prePreTiled.CanMove()) {
                        if (this.CheckValidEnterPoint(preTiled)) {
                            const idx: number = this.GetIdxByGuid(preTiled.EnterPoint.Guid);
                            if (idx !== -1) {
                                this.m_waitList.splice(idx, 1);
                            }
                            this.m_waitList.push(new FallingWaitData(preTiled.EnterPoint));
                        }
                    }
                } else {
                    this.m_cachedList.push(empty);
                }
            } else {
                if (this.CheckValidEnterPoint(empty.emptyTiled)) {
                    let enterTiled: Tiled = empty.emptyTiled;
                    let nextTiled: Tiled = empty.emptyTiled;
                    if (empty.emptyTiled.EnterPoint != null) {
                        enterTiled = empty.emptyTiled.EnterPoint;
                    } else {
                        nextTiled = empty.emptyTiled.GetNextTiled();
                    }
                    if (nextTiled != null && nextTiled.CanMoveBlocker == null) {
                        if (this.CheckFallingWait(enterTiled)) {
                            enterTiled.RandomBlocker();
                            const anim: FallingAnimation = this.PopFallingAnim();
                            anim.Init(enterTiled, nextTiled, this.OnFallingEnd.bind(this),this.OnFallingInterrupt.bind(this));
                            this.m_anims.push(anim);
                            const idx: number = this.GetIdxByGuid(enterTiled.Guid);
                            if (idx === -1) {
                                this.m_waitList.push(new FallingWaitData(enterTiled));
                            }
                        }
                        this.m_cachedList.push(new EmptyTiledData(enterTiled));
                    }
                } else {
                    if (empty.emptyTiled.GetTiledType() === TiledType.Entry || empty.emptyTiled.PrevTiledCanFalling() || empty.emptyTiled.IsConnectedToEnterPoint()) {
                        // Debug.LogError(empty.emptyTiled.Guid + " LLLLLL --  有联通的掉落口，不执行斜向掉落");
                    } else {
                        this.ExecuteSlantFalling(empty.emptyTiled);
                    }
                }
            }
            empty = this.PopEmptyTiled();
        }

        for (let i = 0; i < this.m_anims.length; i++) {
            this.m_anims[i].OnUpdate();
            if (this.m_anims[i].IsFinish()) {
                this.m_dequeueAnim.push(this.m_anims[i]);
            }
        }
        for (let i = 0; i < this.m_dequeueAnim.length; i++) {
            const index: number = this.m_anims.indexOf(this.m_dequeueAnim[i]);
            if (index !== -1) {
                this.m_anims.splice(index, 1);
                this.m_animPools.push(this.m_dequeueAnim[i]);
            }
        }
        this.m_dequeueAnim = [];
        if (this.IsStopFalling()) {
            if (this.m_allFallStateLst.length > 0)
            {
                for (let i = this.m_allFallStateLst.length - 1; i >= 0; i--) {
                    const element = this.m_allFallStateLst[i];
                    if (element.IsOver()) {
                        element.OnFinish();
                        this.m_allFallStateLst.splice(i, 1);
                    }   
                }

                if (this.m_allFallStateLst.length <= 0)
                {
                    this.m_waitList.length = 0;
                    this.m_isStart = false;
                }
            }
            else
            {
                this.m_waitList.length = 0;
                this.m_isStart = false;
            }
        }
    }
        
    // 递归检查前置格子是否可以向tiled掉落
    private FindPrevMoveBlockerTiled(tiled: Tiled): Tiled {
        if (tiled.Guid === -1 || tiled.Guid >= TiledMap.ENTRY_GUID_OFFSET) {
            return null;
        }
        let preTiled: Tiled | null = tiled.GetPrevTiled();
        if (preTiled == null || (!tiled.CheckCanFallingFromPrevTiled() && !preTiled.PrevTiledCanFalling() && !preTiled.IsConnectedToEnterPoint()) || !tiled.CheckCanArriveFromLineTiled(preTiled)) {
            
            // if (!LevelManager.Instance.Map.IsMoveDirection) {
                return null;
            // }

            preTiled = tiled.OnGetPrevTiledAround();
            if (preTiled == null) {
                return null;
            }
        }
        if (!tiled.CheckCanArriveFromLineTiled(preTiled)) {
            return null;
        }
        if (preTiled.CanMoveBlocker != null && preTiled.CanMoveBlocker.Falling) {
            return null;
        }
        if (preTiled.CanMoveBlocker != null && preTiled.CanMoveBlocker.IsMarked() && preTiled.GetSpecialID() <= 0) {
            return null;
        }
        if (preTiled.CanMoveBlocker != null) {
            return preTiled;
        }
        return this.FindPrevMoveBlockerTiled(preTiled);
    }
    
    private OnFallingEnd(ani: FallingAnimation, tiled: Tiled, toDir: Direction): void {
        if (tiled !== null) {
            tiled.StopFalling(toDir);
            // tiled.CheckDestroyBlockers();
            if (tiled.CanMoveBlocker != null) {
                const wrap: FSAdpater = StateFactory.Instance.Create(FSStateType.enAdpater) as FSAdpater;
                wrap.StartTriggerTiled(tiled);
            }
        }
    }
    
    private OnFallingInterrupt(ani: FallingAnimation, tiled: Tiled): void {
    }
    
    // TODO:生成口生效逻辑需要改
    public CheckValidEnterPoint(tiled: Tiled): boolean {
        const middle: Blocker | null = tiled.MiddleBlocker();
        const toptop: Blocker | null = tiled.TopTopBlocker();
        const preTiled: Tiled | null = tiled.GetPrevTiled();
        const result: boolean = tiled.IsEnterPoint() && (preTiled === null || !tiled.IsConnectedToEnterPoint()) && !(middle?.IsMagicHat() ?? false) && toptop === null && this.CheckEmptyTiledCouldMakeSpawnerFall(tiled, preTiled);
        // (tiled is Spawner) and (have no PreTiled or have no connected Spawner) and (Middle is not MagicHat) and (with no TopTop Elements)
        return result;
    }
    
    private CheckEmptyTiledCouldMakeSpawnerFall(tiled: Tiled, preTiled: Tiled): boolean {
        if (preTiled === null || !preTiled.IsCanSwitchNoMatchBlocker()) {
            tiled.ForbidFindEnterPoint = false;
            return true;
        }
        const isHaveTelPort: boolean = preTiled.IsTeleportIn() || preTiled.IsTeleportOut();
        if (isHaveTelPort || tiled.OnCheckTiledBorderStopFalling(preTiled, tiled.FallingDir)) {
            tiled.ForbidFindEnterPoint = false;
            return true;
        }
        tiled.ForbidFindEnterPoint = true;
        return false;
    }
    
    /*
        1.正向掉落
            查找PrevTile，能补则补，不能则触发斜向掉落
    
        2.斜向掉落
            先查找自身上左右三个格子，循环补充
            左右不能补充，再查找PrevTile的左右，能掉则循环补充
            前置的左右不能斜向掉落，则查找自身的左上、右上能否斜向掉落
    
        问题：
            T型布局，斜向还是直向掉？
        */
    
    private ExecuteSlantFalling(emptyTiled: Tiled): void {
        const preTiled: Tiled | null = emptyTiled.OnGetSlantTiled();
        if (preTiled !== null && preTiled.CanMoveBlocker != null) {
            const anim: FallingAnimation = this.PopFallingAnim();
            anim.Init(preTiled, emptyTiled, this.OnFallingEnd.bind(this), this.OnFallingInterrupt.bind(this));
            this.m_anims.push(anim);
            this.PushEmptyTiled(preTiled);
        } else {
            // Debug.LogError(emptyTiled.Guid + "正向、斜向都没找到可填充的元素，如果前方正在掉落中。。。。 加入缓存池");
        }
    }
    
}
