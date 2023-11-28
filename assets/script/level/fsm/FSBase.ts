
import { Direction } from "../data/LevelScriptableData";
import { TiledMap } from "../tiledmap/TiledMap";
import { FSCheckData, FSDataBase, FSPrepareData, FSSwitchData } from "./FSData";
import { StateFactory } from "./StateFactory";
import { BlockerAttribute } from "../../table/BlockTable";
import { BlockSubType, BlockType } from "../blocker/BlockerManager";
import { EffectController, EffectType } from "../effect/EffectController";
import { EffectData } from "../effect/EffectBase";
import { EffectControllerFactory } from "../effect/EffectControllerFactory";
import { Tiled } from "../tiledmap/Tiled";
import { FallingManager } from "../drop/FallingManager";
import { TimerData, TimerManager, TimerType } from "../../tools/TimerManager";
import { UIManager } from "../../ui/UIManager";
import { MatchTipsManager } from "../../tools/MatchTipsManager";
import { AudioManager } from "../../tools/AudioManager";

export class FSBase {
    public PreState: FSBase | null = null;
    public NextState: FSBase | null = null;
    public m_isStop: boolean = true;
    private m_stateType: FSStateType;

    public get StateType(): FSStateType {
        return this.m_stateType;
    }

    constructor(stateType: FSStateType) {
        this.m_stateType = stateType;
    }

    public Reset(): void {
        // Implement reset logic if needed
    }

    public GetData(): FSDataBase | null {
        return null;
    }

    public Start(pre: FSBase): void {
        this.PreState = pre;
        this.m_isStop = false;
    }

    public IsOver(): boolean {
        return true;
    }

    public Stop(): void {
        this.m_isStop = true;
    }

    OnFinish(nextState?: FSBase)
    {
        this.Stop();
        if (this.PreState !== null) {
            const state = this.PreState;
            this.PreState = null;
            state.OnFinish(nextState);
        }

        if (this.StateType !== FSStateType.enPrepare && this.StateType !== FSStateType.enFSM) {
            StateFactory.Instance.Recycle(this);
        }
    }

    public BackMove(data: FSDataBase, nextState?: FSBase): void {
        this.Stop();
        if (this.PreState !== null) {
            const state = this.PreState;
            this.PreState = null;
            state.BackMove(data, nextState);
        }

        if (this.StateType !== FSStateType.enPrepare && this.StateType !== FSStateType.enFSM) {
            StateFactory.Instance.Recycle(this);
        }
    }
}

export enum FSStateType
{
    enNone = 0,
    enFSM = 1,
    enAdpater = 2,
    enPrepare = 3,
    enSwitch = 4,
    enShuffle = 5,
    enSecondStageBlockers = 6,
    enInitFalling = 7,
    enFalling = 8,
    enExecuteEffect = 9,
    enEndPreMatch = 10,
    enConveryor = 11,
    enConveryorMatch = 12,
    enCheck = 13,
    enBoostCheck = 14,
    enFlippedTiled = 15,
}

export enum FSStartType
{
    enNone,
    enNormal,
    enInit,
    enBoost,
    enDoubleClick,
}

export class FSM extends FSBase
{
    private static instance: FSM | null = null;

    public static getInstance(): FSM{
        if (!FSM.instance)
        {
            FSM.instance = new FSM(FSStateType.enFSM);
        }
        return FSM.instance;
    }

    MovingCanMatch: boolean = true;
    m_prepareState: FSBase[] = [];

    OnBeginDrag(row: number, col: number, tiled: Tiled, direction: Direction)
    {
        MatchTipsManager.Instance.StopMatchTipsAnimation();

        let fsprepare = StateFactory.Instance.Create(FSStateType.enPrepare);
        this.m_prepareState.push(fsprepare);

        let data = fsprepare.GetData() as FSPrepareData;
        data.curPos.x = row;
        data.curPos.y = col;
        data.startType = FSStartType.enNormal;
        data.Neighbor = tiled;
        data.Direction = direction;
        fsprepare.Start(this);
    }

    OnDoubleClick(row: number, col: number)
    {
        MatchTipsManager.Instance.StopMatchTipsAnimation();

        let fsprepare = StateFactory.Instance.Create(FSStateType.enPrepare);
        this.m_prepareState.push(fsprepare);

        let data = fsprepare.GetData() as FSPrepareData;
        data.curPos.x = row;
        data.curPos.y = col;
        data.startType = FSStartType.enDoubleClick;
        data.Neighbor = null;
        data.Direction = Direction.None;
        fsprepare.Start(this);   
    }

    CanOperate()
    {
        if (!this.MovingCanMatch)
        {
            return false;
        }
        if (this.IsGameEnd())
        {
            return false;
        }
        return true;
    }

    OnFinish(nextState: FSBase)
    {
        this.CheckFinish(nextState);
        // cc.error("CheckGameEnd OnFinish !!! " + this.m_prepareState.length);
    }

    BackMove(data: FSDataBase, nextState: FSBase): void 
    {
        this.CheckFinish(nextState);
        // cc.error("CheckGameEnd BackMove !!! " + this.m_prepareState.length);
    }

    CheckFinish(nextState: FSBase)
    {
        for (let i = 0; i < this.m_prepareState.length; i++) {
            const element = this.m_prepareState[i];
            if (element == nextState)
            {
                this.m_prepareState.splice(i, 1);
                break;
            }
        }
        if (this.m_prepareState.length <= 0)
        {
            this.CheckGameEnd();
        }
    }

    CheckGameEnd()
    {
        // cc.error("CheckGameEnd !!! ");

        if (this.IsGameEnd())
        {
            UIManager.Instance.OpenLevelPass();
        }
        else
        {
            MatchTipsManager.Instance.OnBeginCheckTiledMap();
        }
    }

    IsGameEnd()
    {
        return TiledMap.getInstance().UseStep >= 3 || TiledMap.getInstance().TotalTargetCount <= 0;
    }

    OnUpdate()
    {
        // if (this.IsGameEnd() && FallingManager.Instance.IsStopFalling())
        // {
        //     UIManager.Instance.OpenLevelPass();
        // }
    }
}

export class FSPrepare extends FSBase {
    m_data: FSPrepareData = new FSPrepareData();

    constructor() {
        super(FSStateType.enPrepare);
    }

    public GetData(): FSDataBase | null {
        return this.m_data;
    }

    public Reset(): void {
        this.m_data.Reset();
    }

    private CallBack(tiled: Tiled, neighbor: Tiled, direction: Direction): void {
        if (
            !tiled.CanMove() ||
            !tiled.CanMoveBlocker?.CanMove() ||
            !tiled.CanSwitchInDirection(direction)
        ) {
            this.BackMove(this.m_data);
            return;
        }

        if (neighbor === null || !neighbor.IsValidTiled()) {
            this.BackMove(this.m_data);
            return;
        }

        if (
            (!neighbor.CanMoveBlocker ||
                !neighbor.CanMove() ||
                !neighbor.CanMoveBlocker.CanMove() ||
                !neighbor.CanMoveBlocker.IsCanSwitch() ||
                neighbor.CanMoveBlocker.ForbidSwitch())
        ) {
            this.BackMove(this.m_data);
            return;
        }
        this.NextState = StateFactory.Instance.Create(FSStateType.enSwitch);
        const nextData: FSSwitchData | null = this.NextState.GetData() as FSSwitchData | null;
        if (nextData != null) {
            nextData.src = tiled;
            nextData.dest = neighbor;
            nextData.startType = this.m_data.startType;
            this.NextState.Start(this);
        }
    }

    public Start(pre: FSBase): void {
        super.Start(pre);
        if (this.m_data.startType === FSStartType.enNormal) {
            const tiled  = TiledMap.getInstance().GetTiled(this.m_data.curPos.x, this.m_data.curPos.y);

            if (!tiled?.CanMoveBlocker?.IsCanSwitch()) {
                this.BackMove(this.m_data);
                return;
            }

            this.OnCheckNormal(tiled);

        } else if (this.m_data.startType === FSStartType.enDoubleClick) {
            const tiled = TiledMap.getInstance().GetTiled(this.m_data.curPos.x, this.m_data.curPos.y);

            if (
                    !tiled?.CanMoveBlocker?.IsCanSwitch() ||
                    tiled.IsLocked() ||
                    !tiled.IsValidTiled() ||
                    !tiled.CanMove() ||
                    /*(tiled.CanMoveBlocker?.IsSameColor() && !LevelManager.Instance.Map.IsHaveSameColorCanDestroyBlocker()) || */
                    (tiled.CanMoveBlocker?.TableData.Data.SubType !== BlockSubType.Special)
                ) 
            {
                this.BackMove(this.m_data);
                return;
            }

            TiledMap.getInstance().CurrentLevelLimit--;

            this.NextState = StateFactory.Instance.Create(FSStateType.enCheck);
            const nextData: FSCheckData | null = this.NextState.GetData() as FSCheckData | null;
            if (nextData) {
                nextData.isMain = true;
                nextData.src = tiled;
                nextData.isTriggerEffect = true;
                nextData.startType = this.m_data.startType;
                this.NextState.Start(this);
            }
        }
    }

    private OnCheckNormal(tiled: Tiled): void {
        if (this.m_data.Neighbor == null) {
            if (this.m_data.Direction === Direction.Left) {
                this.m_data.Neighbor = tiled.GetNeighborLeft();
            } else if (this.m_data.Direction === Direction.Right) {
                this.m_data.Neighbor = tiled.GetNeighborRight();
            } else if (this.m_data.Direction === Direction.Down) {
                this.m_data.Neighbor = tiled.GetNeighborBottom();
            } else if (this.m_data.Direction === Direction.Up) {
                this.m_data.Neighbor = tiled.GetNeighborTop();
            }
        }

        const isPlayCanNotSwitch = this.PlayCanNotSwitchAnimationIfNeeded(tiled, this.m_data.Neighbor, this.m_data.Direction);
        if (isPlayCanNotSwitch) {
            this.BackMove(this.m_data);
        } else {
            this.CallBack(tiled, this.m_data.Neighbor, this.m_data.Direction);
        }
    }

    public OnFinish(): void {
        this.Stop();
        if (this.PreState !== null) {
            const state = this.PreState;
            this.PreState = null;
            state.OnFinish(this);
        }
        if (this.StateType !== FSStateType.enFSM) {
            StateFactory.Instance.Recycle(this);
        }
    }

    public BackMove(data: FSDataBase): void {
        this.Stop();
        if (this.PreState !== null) {
            const state = this.PreState;
            this.PreState = null;
            state.BackMove(data, this);
        }
        if (this.StateType !== FSStateType.enFSM) {
            StateFactory.Instance.Recycle(this);
        }
    }

    private PlayCanNotSwitchAnimationIfNeeded(srcTiled: Tiled, dstTiled: Tiled, movedir: Direction): boolean {
        if (dstTiled === null || srcTiled === null) {
            return false;
        }

        let otherdir: Direction = movedir;
        switch (movedir) {
            case Direction.Left:
                otherdir = Direction.Right;
                break;
            case Direction.Right:
                otherdir = Direction.Left;
                break;
            case Direction.Down:
                otherdir = Direction.Up;
                break;
            case Direction.Up:
                otherdir = Direction.Down;
                break;
        }
        if (srcTiled.CanSwitch() && dstTiled.CanSwitch() && srcTiled.CanSwitchInDirection(movedir) && dstTiled.CanSwitchInDirection(otherdir)) {
            return false;
        }

        if (srcTiled.CanMoveBlocker !== null) {
            if (!dstTiled.IsCanSwitchNoMatchBlocker() && !dstTiled.CanSwitchInDirection(otherdir)) {
                // srcTiled.CanMoveBlocker.PlayForbidSwitchAnim(operation);
                return true;
            }
        }

        const dstTiledMatchBlocker = dstTiled.MatchBlocker;
        if (dstTiledMatchBlocker !== null && dstTiledMatchBlocker.TableData.Data.SubType !== BlockSubType.HideMiddle) {
            if (!srcTiled.IsCanSwitchNoMatchBlocker() && !srcTiled.CanSwitchInDirection(movedir)) {
                // if (operation === Operation.LeftMove || operation === Operation.RightMove) {
                //     dstTiled.CanMoveBlocker?.PlayForbidSwitchAnim(12 - operation);
                // } else if (operation === Operation.UpMove || operation === Operation.DownMove) {
                //     dstTiled.CanMoveBlocker?.PlayForbidSwitchAnim(18 - operation);
                // }
                return true;
            }
        }

        return false;
    }
}

export class FSSwitch extends FSBase {

    constructor() {
        super(FSStateType.enSwitch);
        this.m_data = new FSSwitchData();
    }

    private m_data: FSSwitchData;

    public GetData(): FSDataBase {
        return this.m_data;
    }

    public Reset(): void {
        this.m_data.Reset();
    }

    public Start(pre: FSBase): void {
        super.Start(pre);

        const switchBlocker = this.m_data.dest.CanMoveBlocker;
        this.m_data.dest.CanMoveBlocker = this.m_data.src.CanMoveBlocker;

        if (this.m_data.dest.CanMoveBlocker) {
            this.m_data.dest.CanMoveBlocker.MarkMatch = true;
            this.m_data.dest.CanMoveBlocker.IsSwitching = true;
            this.m_data.dest.CanMoveBlocker.SelfTiled = this.m_data.dest;
            this.m_data.dest.CanMoveBlocker.Marked = true;
        }

        this.m_data.src.CanMoveBlocker = switchBlocker;

        if (this.m_data.src.CanMoveBlocker) {
            this.m_data.src.CanMoveBlocker.MarkMatch = true;
            this.m_data.src.CanMoveBlocker.IsSwitching = true;
            this.m_data.src.CanMoveBlocker.SelfTiled = this.m_data.src;
            this.m_data.src.CanMoveBlocker.Marked = true;
        }

        this.OnPlaySwitchAnimation(this.m_data, () => {
            if (this.m_data.src.CanMoveBlocker) {
                this.m_data.src.CanMoveBlocker.MarkMatch = false;
                this.m_data.src.CanMoveBlocker.IsSwitching = false;
            }

            if (this.m_data.dest.CanMoveBlocker) {
                this.m_data.dest.CanMoveBlocker.MarkMatch = false;
                this.m_data.dest.CanMoveBlocker.IsSwitching = false;
            }

            this.NextState = StateFactory.Instance.Create(FSStateType.enCheck);
            const nextdata = this.NextState.GetData() as FSCheckData;
            nextdata.isCheck = false;
            this.m_data.isCheck = nextdata.isCheck;
            nextdata.src = this.m_data.src;
            nextdata.dest = this.m_data.dest;
            nextdata.isMain = true;
            nextdata.startType = this.m_data.startType;
            this.NextState.Start(this);
        });
    }

    public BackMove(data: FSDataBase): void {
        if (!this.m_data.isCheck) {

            const switchBlocker = this.m_data.dest.CanMoveBlocker;
            this.m_data.dest.CanMoveBlocker = this.m_data.src.CanMoveBlocker;

            if (this.m_data.dest.CanMoveBlocker) {
                this.m_data.dest.CanMoveBlocker.MarkMatch = true;
                this.m_data.dest.CanMoveBlocker.IsSwitching = true;
                this.m_data.dest.CanMoveBlocker.SelfTiled = this.m_data.dest;
            }

            this.m_data.src.CanMoveBlocker = switchBlocker;

            if (this.m_data.src.CanMoveBlocker) {
                this.m_data.src.CanMoveBlocker.MarkMatch = true;
                this.m_data.src.CanMoveBlocker.IsSwitching = true;
                this.m_data.src.CanMoveBlocker.SelfTiled = this.m_data.src;
            }

            this.OnPlaySwitchAnimation(this.m_data, () => {
                if (this.m_data.src.CanMoveBlocker) {
                    this.m_data.src.CanMoveBlocker.MarkMatch = false;
                    this.m_data.src.CanMoveBlocker.IsSwitching = false;
                }

                if (this.m_data.dest.CanMoveBlocker) {
                    this.m_data.dest.CanMoveBlocker.MarkMatch = false;
                    this.m_data.dest.CanMoveBlocker.IsSwitching = false;
                }

                if (this.m_data.src.CanMoveBlocker && !this.m_data.src.CanMoveBlocker.IsDestroy || !this.m_data.src.CanMoveBlocker) {
                    
                    if (this.m_data.src.CanMoveBlocker != null) {
                        this.m_data.src.CanMoveBlocker.Marked = false;
                        this.m_data.src.CanMoveBlocker.DelayCheck(0.2);
                    }

                    this.m_data.src.CheckTriggerFall();
                }

                if (this.m_data.dest.CanMoveBlocker && !this.m_data.dest.CanMoveBlocker.IsDestroy || !this.m_data.dest.CanMoveBlocker) {
                    if (this.m_data.dest.CanMoveBlocker != null) {
                        this.m_data.dest.CanMoveBlocker.Marked = false;
                        this.m_data.dest.CanMoveBlocker.DelayCheck(0.2);
                    }

                    this.m_data.dest.CheckTriggerFall();
                }

                super.BackMove(data);
            }, true);
        }
    }

    MoveTime: number = 0.15;

    private OnPlaySwitchAnimation(fsdata: FSSwitchData, action: () => void, isBackMove: boolean = false): void {

        let m_srcTiledPlaySwitch = true;
        if (fsdata.src != null && fsdata.src.CanMoveBlocker != null && fsdata.src.CanMoveBlocker.TableData.Data.SubType == BlockSubType.Special
            && fsdata.dest != null && fsdata.dest.CanMoveBlocker != null && fsdata.dest.CanMoveBlocker.TableData.Data.SubType == BlockSubType.Special)
        {
            m_srcTiledPlaySwitch = false;
        }

        if (fsdata.src.CanMoveBlocker != null && m_srcTiledPlaySwitch)
        {
            cc.tween(fsdata.src.CanMoveBlocker.m_blocker)
            .to(this.MoveTime, { position : cc.v3(fsdata.src.LocalPosition.x, fsdata.src.LocalPosition.y, 0)})
            .start();
        }
        
        if (fsdata.dest.CanMoveBlocker != null)
        {
            cc.tween(fsdata.dest.CanMoveBlocker.m_blocker)
            .to(this.MoveTime, { position : cc.v3(fsdata.dest.LocalPosition.x, fsdata.dest.LocalPosition.y, 0)})
            .start();
        }

        let timeData = new TimerData();
        timeData.objthis = this;
        timeData.type = TimerType.enOnce;
        timeData.interval = this.MoveTime + TimerManager.Instance.GetDeltaTime();
        timeData.body = ()=>
        {
            action();
        };
        TimerManager.Instance.CreateTimer(timeData);

        // BaseOperate.Instance.ExchangeBlockers(fsdata.src, fsdata.dest, action, AppFacade.Instance.GameCfg.switchAnimSpeed, isBackMove);
    }
}

export class FSCheck extends FSBase {
    private readonly m_WrongMatchAudio: number = 37;
    private m_data: FSCheckData;
    private m_ctrl: EffectController;
    private m_effData: EffectData = new EffectData();
    private m_isDeductLimited: boolean = false;

    constructor() {
        super(FSStateType.enCheck);
        this.m_data = new FSCheckData();
    }

    public GetData(): FSDataBase {
        return this.m_data;
    }

    public Reset(): void {
        this.m_effData.Reset();
        this.m_data.Reset();
        this.m_isDeductLimited = false;
    }

    private ExecuteEffectBefore(): void {
        // this.SetIsExpandGrapeJuice();
    }

    public Start(pre: FSBase): void {
        super.Start(pre);
        this.m_isDeductLimited = false;
        // if (this.m_data.isMain && (this.m_data.startType === FSM.StartType.enNormal || this.m_data.startType === FSM.StartType.enDoubleClick)) {
        //     LevelManager.Instance.FindLightBlockersOn();
        // }
        if (this.m_data.src !== null && this.m_data.dest !== null) {
            if (this.CheckSwitchMatch(this.ExecuteEffectBefore.bind(this))) {
                return;
            }
        }

        if (this.m_data.isTriggerEffect) {
            if (this.m_data.src !== null && this.m_data.src.CanMoveBlocker != null && !this.m_data.src.CanMoveBlocker.CrushState) {
                // this.m_data.src.IsExpandGrapeJuice = this.m_data.src.IsHaveGrapeJuice();
                this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));

                if (this.m_data.src.CanMoveBlocker.IsLineBlocker()) {
                    this.m_ctrl.CreateEffect(EffectType.LineCrush, this.m_data.src, this.m_effData, this.m_data.dest);
                } else if (this.m_data.src.CanMoveBlocker.IsAreaBlocker()) {
                    // this.m_data.src.CanMoveBlocker.DisableSameColorCrushAnim();
                    this.m_ctrl.CreateEffect(EffectType.AreaCrush, this.m_data.src, this.m_effData);
                } else if (this.m_data.src.CanMoveBlocker.IsSameColor()) {
                    this.m_ctrl.CreateEffect(EffectType.SameColorBase, this.m_data.src, this.m_effData);
                } else if (this.m_data.src.CanMoveBlocker.IsSquareBlocker()) {
                    this.m_ctrl.CreateEffect(EffectType.SquareCrush, this.m_data.src, this.m_effData);
                }

                this.m_ctrl.Execute();
            } else {
                this.BackMove(this.m_data);
            }
        } else {
            this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
            // 3 match
            if (this.m_data.src !== null && this.m_data.src.CanMoveBlocker != null && this.m_data.src.CanMoveBlocker.CanMatch()) {
                // this.m_data.src.IsExpandGrapeJuice = this.m_data.src.IsHaveGrapeJuice();
                this.m_ctrl.CreateEffect(EffectType.BaseCrush, this.m_data.src, this.m_effData);
            }

            if (this.m_data.dest !== null && this.m_data.dest.CanMoveBlocker != null && this.m_data.dest.CanMoveBlocker.CanMatch()) {
                // this.m_data.dest.IsExpandGrapeJuice = this.m_data.dest.IsHaveGrapeJuice();
                this.m_ctrl.CreateEffect(EffectType.BaseCrush, this.m_data.dest, this.m_effData);
            }

            this.m_ctrl.Execute();
        }
    }

    private DeductLimit(): void {
        if (this.m_data.startType === FSStartType.enNormal) {
            this.m_isDeductLimited = true;
            TiledMap.getInstance().CurrentLevelLimit--;
        }
    }

    // private SetIsExpandGrapeJuice(): void {
    //     const isHaveGrapeJuice = this.m_data.src.IsHaveGrapeJuice() || this.m_data.dest.IsHaveGrapeJuice();
    //     if (isHaveGrapeJuice) {
    //         this.m_data.src.IsExpandGrapeJuice = true;
    //         if (!this.m_data.src.IsHaveGrapeJuice()) {
    //             this.m_data.src.SpecialExpandIndex = this.m_data.dest.Guid;
    //         }
    //         this.m_data.dest.IsExpandGrapeJuice = true;
    //         if (!this.m_data.dest.IsHaveGrapeJuice()) {
    //             this.m_data.dest.SpecialExpandIndex = this.m_data.src.Guid;
    //         }
    //     }
    // }

    private CheckSwitchMatch(executeEffectBefore: () => void): boolean {
        try {
            const srcBlocker = this.m_data.src.CanMoveBlocker;
            const destBlocker = this.m_data.dest.CanMoveBlocker;
            if (destBlocker === null) {
                return false;
            }

            if (srcBlocker !== null) {
                if (srcBlocker.IsSameColor() || destBlocker.IsSameColor()) {
                    // 彩球+基本元素
                    if (srcBlocker.TableData.Data.SubType === BlockSubType.none || destBlocker.TableData.Data.SubType === BlockSubType.none) {
                        if (srcBlocker.CanMatch() && destBlocker.CanMatch()) {
                            const blocker = (srcBlocker.TableData.Data.SubType === BlockSubType.none) ? srcBlocker : destBlocker;
                            if (blocker.TableData.Data.Type === BlockType.BaseBlock || blocker.TableData.Data.Type === BlockType.SpecialBlock || blocker.TableData.IsHasAttribute(BlockerAttribute.canSwitchWithSameColor)) {
                                this.DeductLimit();
                                executeEffectBefore();

                                const spblocker = (srcBlocker.TableData.Data.SubType !== BlockSubType.none) ? srcBlocker : destBlocker;
                                this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                                this.m_ctrl.CreateEffect(EffectType.SameColorBase, spblocker.SelfTiled, this.m_effData, blocker);
                                this.m_ctrl.Execute();
                                return true;
                            }
                        }
                        this.BackMove(this.m_data);
                        return true;
                    }
                    // 彩球+横/竖条纹
                    else if (srcBlocker.IsLineBlocker() || destBlocker.IsLineBlocker()) {
                        this.DeductLimit();
                        // LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SameColorLine);
                        executeEffectBefore();
                        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                        this.m_ctrl.CreateEffect(EffectType.SameColorLine, this.m_data.dest, this.m_effData, srcBlocker);
                        this.m_ctrl.Execute();
                        return true;
                    }
                    // 彩球+包装
                    else if (srcBlocker.IsAreaBlocker() || destBlocker.IsAreaBlocker()) {
                        this.DeductLimit();
                        // LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SameColorArea);
                        executeEffectBefore();
                        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                        this.m_ctrl.CreateEffect(EffectType.SameColorArea, this.m_data.dest, this.m_effData, srcBlocker);
                        this.m_ctrl.Execute();
                        return true;
                    }
                    // 彩球+彩球
                    else if (srcBlocker.IsSameColor() && destBlocker.IsSameColor()) {
                        this.DeductLimit();
                        // LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SameColor);
                        executeEffectBefore();
                        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                        this.m_ctrl.CreateEffect(EffectType.SameColorAndSameColor, this.m_data.dest, this.m_effData, srcBlocker);
                        this.m_ctrl.Execute();
                        return true;
                    }
                    // 彩球+田字消
                    else if (srcBlocker.IsSquareBlocker() || destBlocker.IsSquareBlocker()) {
                        this.DeductLimit();
                        // LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SameColorSquare);
                        executeEffectBefore();
                        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                        this.m_ctrl.CreateEffect(EffectType.SameColorSquare, this.m_data.dest, this.m_effData, srcBlocker);
                        this.m_ctrl.Execute();
                        return true;
                    }

                    this.BackMove(this.m_data);
                    return true;
                }
                else if (BlockSubType.Special === srcBlocker.TableData.Data.SubType && BlockSubType.Special === destBlocker.TableData.Data.SubType) {
                    // 包装
                    if (srcBlocker.IsAreaBlocker() || destBlocker.IsAreaBlocker()) {
                        // 包装+横/竖条纹
                        if (srcBlocker.IsLineBlocker() || destBlocker.IsLineBlocker()) {
                            this.DeductLimit();
                            // LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.AreaLine);
                            executeEffectBefore();
                            this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                            this.m_ctrl.CreateEffect(EffectType.AreaLine, this.m_data.dest, this.m_effData, this.m_data.src);
                            this.m_ctrl.Execute();
                            return true;
                        }
                        // 包装+包装
                        else if (srcBlocker.IsAreaBlocker() && destBlocker.IsAreaBlocker()) {
                            this.DeductLimit();
                            // LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.AreaAndArea);
                            executeEffectBefore();
                            this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                            this.m_ctrl.CreateEffect(EffectType.AreaAndArea, destBlocker.SelfTiled, this.m_effData, srcBlocker.SelfTiled);
                            this.m_ctrl.Execute();
                            return true;
                        }
                        else if (srcBlocker.IsSquareBlocker() || destBlocker.IsSquareBlocker()) {
                            this.DeductLimit();
                            // LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SquareAreaCompose);
                            executeEffectBefore();
                            this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                            this.m_ctrl.CreateEffect(EffectType.SquareAreaCompose, destBlocker.SelfTiled, this.m_effData, srcBlocker.SelfTiled);
                            this.m_ctrl.Execute();
                            return true;
                        }
                    }
                    // 竖条纹+横条纹/横条纹+竖条纹
                    else if (srcBlocker.IsLineBlocker() && destBlocker.IsLineBlocker()) {
                        this.DeductLimit();
                        // LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.LineLine);
                        executeEffectBefore();
                        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                        this.m_ctrl.CreateEffect(EffectType.LineLine, destBlocker.SelfTiled, this.m_effData, srcBlocker.SelfTiled);
                        this.m_ctrl.Execute();
                        return true;
                    }
                    else if (srcBlocker.IsSquareBlocker() && destBlocker.IsSquareBlocker()) {
                        this.DeductLimit();
                        // LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SquareAndSquare);
                        executeEffectBefore();
                        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                        this.m_ctrl.CreateEffect(EffectType.SquareAndSquare, destBlocker.SelfTiled, this.m_effData, srcBlocker.SelfTiled);
                        this.m_ctrl.Execute();
                        return true;
                    }
                    else if (srcBlocker.IsSquareBlocker() || destBlocker.IsSquareBlocker()) {
                        if (srcBlocker.IsLineBlocker() || destBlocker.IsLineBlocker()) {
                            this.DeductLimit();
                            // LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SquareLineCompose);
                            executeEffectBefore();
                            this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                            this.m_ctrl.CreateEffect(EffectType.SquareLineCompose, destBlocker.SelfTiled, this.m_effData, srcBlocker.SelfTiled);
                            this.m_ctrl.Execute();
                            return true;
                        }
                    }
                }
                else if ((srcBlocker.TableData.Data.SubType === BlockSubType.Special && destBlocker.TableData.Data.SubType === BlockSubType.none) || (srcBlocker.TableData.Data.SubType === BlockSubType.none && destBlocker.TableData.Data.SubType === BlockSubType.Special)) {
                    if (srcBlocker.IsAreaBlocker() || destBlocker.IsAreaBlocker()) {
                        this.DeductLimit();
                        executeEffectBefore();
                        const packageBlocker = srcBlocker.IsAreaBlocker() ? srcBlocker : destBlocker;
                        const normalBlocker = (srcBlocker.TableData.Data.SubType === BlockSubType.none) ? srcBlocker : destBlocker;
                        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                        if (normalBlocker.CanMatch()) {
                            this.m_ctrl.CreateEffect(EffectType.BaseCrush, normalBlocker.SelfTiled, this.m_effData);
                        }
                        this.m_ctrl.CreateEffect(EffectType.AreaCrush, packageBlocker.SelfTiled, this.m_effData);
                        this.m_ctrl.Execute();
                        return true;
                    }
                    if (srcBlocker.IsLineBlocker() || destBlocker.IsLineBlocker()) {
                        this.DeductLimit();
                        executeEffectBefore();
                        const lineBlocker = (srcBlocker.TableData.Data.SubType === BlockSubType.none) ? destBlocker : srcBlocker;
                        const normalBlocker = (srcBlocker.TableData.Data.SubType === BlockSubType.none) ? srcBlocker : destBlocker;
                        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                        if (normalBlocker.CanMatch()) {
                            this.m_ctrl.CreateEffect(EffectType.BaseCrush, normalBlocker.SelfTiled, this.m_effData);
                        }
                        normalBlocker.Marked = false;
                        this.m_ctrl.CreateEffect(EffectType.LineCrush, lineBlocker.SelfTiled, this.m_effData, normalBlocker.SelfTiled);
                        this.m_ctrl.Execute();
                        return true;
                    }
                    // 田字消
                    if (srcBlocker.IsSquareBlocker() || destBlocker.IsSquareBlocker()) {
                        this.DeductLimit();
                        executeEffectBefore();
                        const squareBlocker = (srcBlocker.TableData.Data.SubType === BlockSubType.none) ? destBlocker : srcBlocker;
                        const normalBlocker = (srcBlocker.TableData.Data.SubType === BlockSubType.none) ? srcBlocker : destBlocker;
                        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                        if (normalBlocker.CanMatch()) {
                            this.m_ctrl.CreateEffect(EffectType.BaseCrush, normalBlocker.SelfTiled, this.m_effData);
                        }
                        normalBlocker.Marked = false;
                        this.m_ctrl.CreateEffect(EffectType.SquareCrush, squareBlocker.SelfTiled, this.m_effData);
                        this.m_ctrl.Execute();
                        return true;
                    }
                }
            }
            else {
                if (destBlocker.TableData.Data.SubType === BlockSubType.Special) {
                    if (destBlocker.IsAreaBlocker()) {
                        this.DeductLimit();
                        executeEffectBefore();
                        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                        this.m_ctrl.CreateEffect(EffectType.AreaCrush, destBlocker.SelfTiled, this.m_effData);
                        this.m_ctrl.Execute();
                        return true;
                    }
                    if (destBlocker.IsLineBlocker()) {
                        this.DeductLimit();
                        executeEffectBefore();
                        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                        this.m_ctrl.CreateEffect(EffectType.LineCrush, destBlocker.SelfTiled, this.m_effData, destBlocker.ID);
                        this.m_ctrl.Execute();
                        return true;
                    }
                    // 田字消
                    if (destBlocker.IsSquareBlocker()) {
                        this.DeductLimit();
                        executeEffectBefore();
                        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                        this.m_ctrl.CreateEffect(EffectType.SquareCrush, destBlocker.SelfTiled, this.m_effData);
                        this.m_ctrl.Execute();
                        return true;
                    }
                }
            }

            let first = this.m_data.src;
            let second = this.m_data.dest;

            if (first.Row === second.Row) {
                first = this.m_data.src.Col < this.m_data.dest.Col ? this.m_data.src : this.m_data.dest;
                second = this.m_data.src.Col > this.m_data.dest.Col ? this.m_data.src : this.m_data.dest;
            }
            if ((first.CanMoveBlocker != null && first.CanMoveBlocker.CanMatch()) || (second.CanMoveBlocker != null && second.CanMoveBlocker.CanMatch())) {
                executeEffectBefore();
                this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
                if (first.CanMoveBlocker != null && first.CanMoveBlocker.CanMatch()) {
                    this.m_ctrl.CreateEffect(EffectType.BaseCrush, first, this.m_effData);
                }
                if (second.CanMoveBlocker != null && second.CanMoveBlocker.CanMatch()) {
                    this.m_ctrl.CreateEffect(EffectType.BaseCrush, second, this.m_effData);
                }
                this.m_ctrl.Execute();
                return true;
            }
        }
        catch (error) {

        }
        return false;
    }

    public OnEffectCtrlCallback() {
        
        const issucced = this.m_effData.IsSuccess;
        this.m_effData.IsSuccess = false;
        // if (this.m_data.isUseItem) {
        //     if (this.m_data.src != null) {
        //         this.m_data.src.RecyleIngredients();
        //     }
        //     if (this.m_data.dest != null) {
        //         this.m_data.dest.RecyleIngredients();
        //     }
        // }
        if (!issucced) {
            if (this.m_data.src != null && this.m_data.dest != null && !this.m_data.isCheck && !this.m_data.isUseItem) {
                AudioManager.Instance.PlaySource("Audio_Match_WrongMatch");
            }
            this.BackMove(this.m_data);
        }
        else {
            if (this.m_data.src != null && this.m_data.dest != null && !this.m_data.isUseItem) {
                // this.m_data.src.RecyleIngredients();
                // this.m_data.dest.RecyleIngredients();
                if (this.m_data.startType === FSStartType.enNormal) {
                    
                    if (!this.m_isDeductLimited)
                    {
                        this.m_isDeductLimited = true;
                        TiledMap.getInstance().CurrentLevelLimit--;
                    }
                    
                    if ((this.m_data.src.CanMoveBlocker != null && !this.m_data.src.CanMoveBlocker.IsDestroy) || this.m_data.src.CanMoveBlocker == null) {
                        if (this.m_data.src.CanMoveBlocker != null) {
                            this.m_data.src.CanMoveBlocker.Marked = false;
                        }

                        this.m_data.src.CheckTriggerFall();
                    }

                    if ((this.m_data.dest.CanMoveBlocker != null && !this.m_data.dest.CanMoveBlocker.IsDestroy) || this.m_data.dest.CanMoveBlocker == null) {
                        if (this.m_data.dest.CanMoveBlocker != null) {
                            this.m_data.dest.CanMoveBlocker.Marked = false;
                        }

                        this.m_data.dest.CheckTriggerFall();
                    }
                }
            }

            if (this.m_data.isMain)
            {
                FallingManager.Instance.OnStartFalling(this);
            }
            else
            {
                this.OnFinish();
            }
        }
    }
}

class EffectAdapter {
    m_wraps: FSAdpater[] = [];
    m_callback: () => void;

    constructor(cb: () => void) {
        this.m_callback = cb;
    }

    Reset() {
        this.m_wraps = [];
    }

    CreateEffect(tiled: Tiled) {
        const Wrap: FSAdpater | null = StateFactory.Instance.Create(FSStateType.enAdpater) as FSAdpater;

        if (Wrap) {
            this.m_wraps.push(Wrap);
            Wrap.StartTriggerEffect(tiled, this.OnEffectCallback.bind(this));
        }
    }

    OnEffectCallback(wrap: FSAdpater) {
        const index: number = this.m_wraps.indexOf(wrap);

        if (index !== -1) {
            this.m_wraps.splice(index, 1);

            if (this.m_wraps.length <= 0) {
                this.m_callback();
            }
        }
    }
}

export class IntervalExecEffect {
    m_blockers: Tiled[];
    m_callback: () => void;
    m_adapter: EffectAdapter;
    m_isRet: boolean = false;
    private m_isCheckOver: boolean = false;

    constructor(blockers: Tiled[], handle: () => void) {
        this.m_blockers = blockers;
        this.m_callback = handle;
        this.m_isRet = true;
        this.m_adapter = new EffectAdapter(this.OnAdapterCallback.bind(this));
    }

    OnAdapterCallback() {
        this.m_isRet = true;
        this.OnFinish();
    }

    Start() {
        this.OnStartStepExecute();
    }

    private OnStartStepExecute() {
        // Sort by Guid, assuming TiledMap.QuickSortTildByGuid is defined
        TiledMap.QuickSortTildByGuid(this.m_blockers, 0, this.m_blockers.length - 1);
        this.OnStepByStepExecute();
    }

    private OnStepByStepExecute() {
        if (this.m_blockers.length <= 0) {
            this.TryFinish();
            return;
        }

        const tiled = this.m_blockers[0];
        this.m_blockers.shift();

        if (tiled && tiled.CanMoveBlocker && tiled.CanMoveBlocker.TableData.Data.SubType == BlockSubType.Special) {
            if (!tiled.CanMoveBlocker.Falling && tiled.CanMoveBlocker.IsNotTriggerMatched()) {
                this.m_isRet = false;
                this.m_adapter.CreateEffect(tiled);

                let timerData = new TimerData();
                timerData.objthis = this;
                timerData.type = TimerType.enOnce;
                timerData.interval = 0.25;
                timerData.body = this.OnStepByStepExecute.bind(this);
                TimerManager.Instance.CreateTimer(timerData);

            } else {
                this.OnStepByStepExecute();
            }
        } else {
            this.OnStepByStepExecute();
        }
    }

    TryFinish() {
        this.m_isCheckOver = true;
        if (!this.m_isRet) {
            return;
        }
        this.OnFinish();
    }

    OnFinish() {
        if (this.m_isCheckOver) {
            this.m_callback();
        }
    }
}

export class FSAdpater extends FSBase {
    private m_tiled: Tiled | null;
    private m_action: (wrap: FSAdpater) => void | null;

    constructor() {
        super(FSStateType.enAdpater);
        FallingManager.Instance.AdpaterStates.push(this);
    }

    public Reset() {
        this.m_tiled = null;
        this.m_action = null;
        FallingManager.Instance.AdpaterStates.push(this);
    }

    public StartTriggerEffect(tiled: Tiled, action: (wrap: FSAdpater) => void): void;
    public StartTriggerEffect(tiled: Tiled): void;

    public StartTriggerEffect(tiled: Tiled, action?: (wrap: FSAdpater) => void): void {
        if (action != null) {
            this.m_action = action;
        }
        this.m_tiled = tiled;
        // this.m_tiled.IsExpandGrapeJuice = this.m_tiled.IsHaveGrapeJuice();
        this.NextState = StateFactory.Instance.Create(FSStateType.enCheck);
        const checkData = this.NextState.GetData() as FSCheckData;
        checkData.src = this.m_tiled;
        checkData.isTriggerEffect = true;
        this.NextState.Start(this);
    }

    public StartTriggerTiled(tiled: Tiled) {
        this.m_tiled = tiled;
        this.NextState = StateFactory.Instance.Create(FSStateType.enCheck);
        const checkData = this.NextState.GetData() as FSCheckData;
        checkData.src = this.m_tiled;
        this.NextState.Start(this);
    }

    // public StartExecuteEffect(type: EffectType, tiled: NormalTiled, isExpand: boolean) {
    //     this.m_tiled = tiled;
    //     // this.m_tiled.IsExpandGrapeJuice = isExpand;
    //     this.NextState = StateFactory.Instance.Create(FSStateType.enExecuteEffect);
    //     const checkData = this.NextState.GetData() as FSExecuteEffectData;
    //     checkData.src = this.m_tiled;
    //     checkData.effectType = type;
    //     this.NextState.start(this);
    // }

    public BackMove(data: FSDataBase) {
        FallingManager.Instance.AdpaterStates.splice(FallingManager.Instance.AdpaterStates.indexOf(this), 1);
        if (this.m_action != null) {
            this.m_action(this);
        }
        if (this.m_tiled !== null && this.m_tiled.GetNextTiled() !== null) {
            if (this.m_tiled.GetNextTiled().CanMoveBlocker === null && this.m_tiled.GetNextTiled().CheckCanArriveFromLineTiled(this.m_tiled)) {
                FallingManager.Instance.OnTriggerFalling(this.m_tiled.GetNextTiled());
            }
        }
        super.BackMove(data);
    }

    public OnFinish() {
        FallingManager.Instance.AdpaterStates.splice(FallingManager.Instance.AdpaterStates.indexOf(this), 1);
        if (this.m_action != null) {
            this.m_action(this);
        }
        if (this.m_tiled !== null && this.m_tiled.GetNextTiled() !== null) {
            if (this.m_tiled.GetNextTiled().CanMoveBlocker === null && this.m_tiled.GetNextTiled().CheckCanArriveFromLineTiled(this.m_tiled)) {
                FallingManager.Instance.OnTriggerFalling(this.m_tiled.GetNextTiled());
            }
        }
        super.OnFinish();
    }
}