
import { Direction } from "../data/LevelScriptableData";
import { NormalTiled } from "../tiledmap/NormalTiled";
import { TiledMap } from "../tiledmap/TiledMap";
import { FSM, FSStartType, FSStateType } from "./FSM";
import { FSCheckData, FSDataBase, FSPrepareData, FSSwitchData } from "./FSData";
import { StateFactory } from "./StateFactory";
import { BlockerAttribute } from "../../table/BlockTable";
import { BlockSubType, BlockType } from "../blocker/BlockerManager";
import { EffectController, EffectType } from "../effect/EffectController";
import { EffectData } from "../effect/EffectBase";
import { EffectControllerFactory } from "../effect/EffectControllerFactory";
import { Tiled } from "../tiledmap/Tiled";

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

    public BackMove(data: FSDataBase): void {
        this.Stop();
        if (this.PreState !== null) {
            const state = this.PreState;
            this.PreState = null;
            state.BackMove(data);
        }

        if (this.StateType !== FSStateType.enPrepare && this.StateType !== FSStateType.enFSM) {
            StateFactory.Instance.Recycle(this);
        }
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

    private CallBack(tiled: NormalTiled, neighbor: NormalTiled, direction: Direction): void {
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
            const tiled: NormalTiled | null = TiledMap.getInstance().GetTiled(this.m_data.curPos.x, this.m_data.curPos.y);

            if (!tiled?.CanMoveBlocker?.IsCanSwitch()) {
                this.BackMove(this.m_data);
                return;
            }

            this.OnCheckNormal(tiled);

        } else if (this.m_data.startType === FSStartType.enDoubleClick) {
            // const tiled: NormalTiled | null = TiledMap.getInstance().GetTiled(this.m_data.curPos.x, this.m_data.curPos.y);

            // if (
            //         !tiled?.CanMoveBlocker?.IsCanSwitch() ||
            //         tiled.IsLocked() ||
            //         !tiled.isValidTiled() ||
            //         !tiled.CanMove() ||
            //         (tiled.CanMoveBlocker?.IsSameColor() &&
            //             !LevelManager.Instance.Map.IsHaveSameColorCanDestroyBlocker()) ||
            //         (tiled.CanMoveBlocker?.SubType !== BlockSubType.Special)
            //     ) {
            //         this.BackMove(this.m_data);
            //         return;
            //     }

            // if (User.Instance.PlayMode === PlayMode.Normal) {
                
            // }

            // this.NextState = StateFactory.Instance.Create(FSStateType.enCheck);
            // const nextData: FSCheckData | null = this.NextState.GetData() as FSCheckData | null;
            // if (nextData) {
            //     nextData.isMain = true;
            //     nextData.src = tiled;
            //     nextData.isTriggerEffect = true;
            //     nextData.startType = this.m_data.startType;
            //     this.NextState.Start(this);
            // }
        }
    }

    private OnCheckNormal(tiled: NormalTiled): void {
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
        // if (this.PreState !== null) {
        //     const state = this.PreState;
        //     this.PreState = null;
        //     state.OnFinish(this);
        // }
        if (this.StateType !== FSStateType.enFSM) {
            StateFactory.Instance.Recycle(this);
        }
    }

    public BackMove(data: FSDataBase): void {
        this.Stop();
        // if (this.PreState !== null) {
        //     const state = this.PreState;
        //     this.PreState = null;
        //     state.BackMove(data, this);
        // }
        if (this.StateType !== FSStateType.enFSM) {
            StateFactory.Instance.Recycle(this);
        }
    }

    private PlayCanNotSwitchAnimationIfNeeded(srcTiled: NormalTiled, dstTiled: NormalTiled, movedir: Direction): boolean {
        if (dstTiled === null || srcTiled === null) {
            return false;
        }

        // let otherdir: Direction = movedir;
        // switch (movedir) {
        //     case Direction.Left:
        //         otherdir = Direction.Right;
        //         break;
        //     case Direction.Right:
        //         otherdir = Direction.Left;
        //         break;
        //     case Direction.Down:
        //         otherdir = Direction.Up;
        //         break;
        //     case Direction.Up:
        //         otherdir = Direction.Down;
        //         break;
        // }
        // if (srcTiled.CanSwitch() && dstTiled.CanSwitch() && srcTiled.CanSwitchInDirection(movedir) && dstTiled.CanSwitchInDirection(otherdir)) {
        //     return false;
        // }

        // if (srcTiled.CanMoveBlocker !== null) {
        //     if (!dstTiled.IsCanSwitchNoMatchBlocker() && (!dstTiled.CanSwitch() || !dstTiled.SwitchDirectionHaveBorderBlocker(otherdir))) {
        //         srcTiled.CanMoveBlocker.PlayForbidSwitchAnim(operation);
        //         return true;
        //     }
        // } else {
        //     console.log(`PlayCanNotSwitchAnimationIfNeeded srcTiled.CanMoveBlocker == null EffectType:${srcTiled.CanMoveEffectType} OpenLevel:${User.Instance.OpenLevel} srcTiled.Guid:${srcTiled.Guid} dstTiled.Guid:${dstTiled.Guid}`);
        // }

        // const dstTiledMatchBlocker = dstTiled.MatchBlocker;
        // if (dstTiledMatchBlocker !== null && dstTiledMatchBlocker.SubType !== BlockSubType.HideMiddle) {
        //     if (!srcTiled.IsCanSwitchNoMatchBlocker() && (!srcTiled.CanSwitch() || !srcTiled.SwitchDirectionHaveBorderBlocker(movedir))) {
        //         if (operation === Operation.LeftMove || operation === Operation.RightMove) {
        //             dstTiled.CanMoveBlocker?.PlayForbidSwitchAnim(12 - operation);
        //         } else if (operation === Operation.UpMove || operation === Operation.DownMove) {
        //             dstTiled.CanMoveBlocker?.PlayForbidSwitchAnim(18 - operation);
        //         }
        //         return true;
        //     }
        // }

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

                FSM.getInstance().MovingCanMatch = true;

                // if (this.m_data.src.CanMoveBlocker && !this.m_data.src.CanMoveBlocker.IsDestroy || !this.m_data.src.CanMoveBlocker) {
                    
                //     if (!this.m_data.src.CanMoveBlocker) {
                //         EventDispatcher.Notify(GCEventType.TriggerFalling, this.m_data.src);
                //     } else {
                //         this.m_data.src.CanMoveBlocker.Marked = false;
                //         this.m_data.src.CanMoveBlocker.DelayCheck(0.2);
                //     }

                //     if (this.m_data.src.GetNextTiled() && this.m_data.src.GetNextTiled().CanArrive(this.m_data.src)) {
                //         EventDispatcher.Notify(GCEventType.TriggerFalling, this.m_data.src.GetNextTiled());
                //     } else {
                //         const slantTiled = this.m_data.src.CheckSlantArrvieTiled();

                //         if (slantTiled) {
                //             EventDispatcher.Notify(GCEventType.TriggerFalling, slantTiled);
                //         }
                //     }
                // }

                // if (this.m_data.dest.CanMoveBlocker && !this.m_data.dest.CanMoveBlocker.IsDestroy || !this.m_data.dest.CanMoveBlocker) {
                //     if (!this.m_data.dest.CanMoveBlocker) {
                //         EventDispatcher.Notify(GCEventType.TriggerFalling, this.m_data.dest);
                //     } else {
                //         this.m_data.dest.CanMoveBlocker.Marked = false;
                //         this.m_data.dest.CanMoveBlocker.DelayCheck(0.2);
                //     }

                //     if (this.m_data.dest.GetNextTiled() && this.m_data.dest.GetNextTiled().CanArrive(this.m_data.dest)) {
                //         EventDispatcher.Notify(GCEventType.TriggerFalling, this.m_data.dest.GetNextTiled());
                //     } else {
                //         const slantTiled = this.m_data.dest.CheckSlantArrvieTiled();

                //         if (slantTiled) {
                //             EventDispatcher.Notify(GCEventType.TriggerFalling, slantTiled);
                //         }
                //     }
                // }

                super.BackMove(data);
            }, true);
        }
    }

    private OnPlaySwitchAnimation(fsdata: FSSwitchData, action: () => void, isBackMove: boolean = false): void {

        cc.log(" OnPlaySwitchAnimation src row = " + fsdata.src.Row + " col = " + fsdata.src.Col + "dest row = " + fsdata.dest.Row + " col = " + fsdata.dest.Col);

        cc.tween(fsdata.src.CanMoveBlocker.m_blocker)
        .to(0.5, { position : cc.v3(fsdata.dest.CanMoveBlocker.m_blocker.position.x, fsdata.dest.CanMoveBlocker.m_blocker.position.y, 0)})
        .start();

        cc.tween(fsdata.dest.CanMoveBlocker.m_blocker)
        .to(0.5, { position : cc.v3(fsdata.src.CanMoveBlocker.m_blocker.position.x, fsdata.src.CanMoveBlocker.m_blocker.position.y, 0)})
        .call(action)
        .start();

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
            if (this.CheckSwitchMatch(this.ExecuteEffectBefore)) {
                return;
            }
        }

        if (this.m_data.isTriggerEffect) {
            if (this.m_data.src !== null && this.m_data.src.CanMoveBlocker !== null && !this.m_data.src.CanMoveBlocker.CrushState) {
                // this.m_data.src.IsExpandGrapeJuice = this.m_data.src.IsHaveGrapeJuice();
                this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);

                // if (this.m_data.src.CanMoveBlocker.IsLineBlocker()) {
                //     this.m_ctrl.CreateEffect(EffectType.LineCrush, this.m_data.src, this.m_effData, this.m_data.dest);
                // } else if (this.m_data.src.CanMoveBlocker.IsAreaBlocker()) {
                //     this.m_data.src.CanMoveBlocker.DisableSameColorCrushAnim();
                //     this.m_ctrl.CreateEffect(EffectType.AreaCrush, this.m_data.src, this.m_effData);
                // } else if (this.m_data.src.CanMoveBlocker.IsSameColor()) {
                //     this.m_ctrl.CreateEffect(EffectType.SameColorBase, this.m_data.src, this.m_effData);
                // } else if (this.m_data.src.CanMoveBlocker.IsSquareBlocker()) {
                //     this.m_ctrl.CreateEffect(EffectType.SquareCrush, this.m_data.src, this.m_effData);
                // }
                this.m_ctrl.Execute();
            } else {
                this.BackMove(this.m_data);
            }
        } else {
            this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            // 3 match
            if (this.m_data.src !== null && this.m_data.src.CanMoveBlocker !== null && this.m_data.src.CanMoveBlocker.CanMatch()) {
                // this.m_data.src.IsExpandGrapeJuice = this.m_data.src.IsHaveGrapeJuice();
                this.m_ctrl.CreateEffect(EffectType.BaseCrush, this.m_data.src, this.m_effData);
            }

            if (this.m_data.dest !== null && this.m_data.dest.CanMoveBlocker !== null && this.m_data.dest.CanMoveBlocker.CanMatch()) {
                // this.m_data.dest.IsExpandGrapeJuice = this.m_data.dest.IsHaveGrapeJuice();
                this.m_ctrl.CreateEffect(EffectType.BaseCrush, this.m_data.dest, this.m_effData);
            }

            this.m_ctrl.Execute();
        }
    }

    private DeductLimit(): void {
        // if (this.m_data.startType === FSStartType.enNormal) {
        //     this.m_isDeductLimited = true;
        // }
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

            // if (srcBlocker !== null) {
            //     if (srcBlocker.IsSameColor() || destBlocker.IsSameColor()) {
            //         // 彩球+基本元素
            //         if (srcBlocker.SubType === BlockSubType.none || destBlocker.SubType === BlockSubType.none) {
            //             if (srcBlocker.CanMatch() && destBlocker.CanMatch()) {
            //                 const blocker = (srcBlocker.SubType === BlockSubType.none) ? srcBlocker : destBlocker;
            //                 if (blocker.TableData.type === BlockType.BaseBlock || blocker.TableData.type === BlockType.SpecialBlock || blocker.IsHasAttribute(BlockerAttribute.canSwitchWithSameColor)) {
            //                     this.DeductLimit();
            //                     const spblocker = (srcBlocker.SubType !== BlockSubType.none) ? srcBlocker : destBlocker;
            //                     executeEffectBefore();
            //                     this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //                     this.m_ctrl.CreateEffect(EffectType.SameColorBase, spblocker.SelfTiled, this.m_effData, blocker);
            //                     this.m_ctrl.Execute();
            //                     return true;
            //                 }
            //             }
            //             this.BackMove(this.m_data);
            //             return true;
            //         }
            //         // 彩球+横/竖条纹
            //         else if (srcBlocker.IsLineBlocker() || destBlocker.IsLineBlocker()) {
            //             this.DeductLimit();
            //             LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SameColorLine);
            //             executeEffectBefore();
            //             this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //             this.m_ctrl.CreateEffect(EffectType.SameColorLine, this.m_data.dest, this.m_effData, srcBlocker);
            //             this.m_ctrl.Execute();
            //             return true;
            //         }
            //         // 彩球+包装
            //         else if (srcBlocker.IsAreaBlocker() || destBlocker.IsAreaBlocker()) {
            //             this.DeductLimit();
            //             LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SameColorArea);
            //             executeEffectBefore();
            //             this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //             this.m_ctrl.CreateEffect(EffectType.SameColorArea, this.m_data.dest, this.m_effData, srcBlocker);
            //             this.m_ctrl.Execute();
            //             return true;
            //         }
            //         // 彩球+彩球
            //         else if (srcBlocker.IsSameColor() && destBlocker.IsSameColor()) {
            //             this.DeductLimit();
            //             LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SameColor);
            //             executeEffectBefore();
            //             this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //             this.m_ctrl.CreateEffect(EffectType.SameColor, this.m_data.dest, this.m_effData, srcBlocker);
            //             this.m_ctrl.Execute();
            //             return true;
            //         }
            //         // 彩球+田字消
            //         else if (srcBlocker.IsSquareBlocker() || destBlocker.IsSquareBlocker()) {
            //             this.DeductLimit();
            //             LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SameColorSquare);
            //             executeEffectBefore();
            //             this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //             this.m_ctrl.CreateEffect(EffectType.SameColorSquare, this.m_data.dest, this.m_effData, srcBlocker);
            //             this.m_ctrl.Execute();
            //             return true;
            //         }

            //         this.BackMove(this.m_data);
            //         return true;
            //     }
            //     else if (BlockSubType.Special === srcBlocker.SubType && BlockSubType.Special === destBlocker.SubType) {
            //         // 包装
            //         if (srcBlocker.IsAreaBlocker() || destBlocker.IsAreaBlocker()) {
            //             // 包装+横/竖条纹
            //             if (srcBlocker.IsLineBlocker() || destBlocker.IsLineBlocker()) {
            //                 this.DeductLimit();
            //                 LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.AreaLine);
            //                 executeEffectBefore();
            //                 this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //                 this.m_ctrl.CreateEffect(EffectType.AreaLine, this.m_data.dest, this.m_effData, this.m_data.src);
            //                 this.m_ctrl.Execute();
            //                 return true;
            //             }
            //             // 包装+包装
            //             else if (srcBlocker.IsAreaBlocker() && destBlocker.IsAreaBlocker()) {
            //                 this.DeductLimit();
            //                 LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.AreaAndArea);
            //                 executeEffectBefore();
            //                 this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //                 this.m_ctrl.CreateEffect(EffectType.AreaAndArea, destBlocker.SelfTiled, this.m_effData, srcBlocker.SelfTiled);
            //                 this.m_ctrl.Execute();
            //                 return true;
            //             }
            //             else if (srcBlocker.IsSquareBlocker() || destBlocker.IsSquareBlocker()) {
            //                 this.DeductLimit();
            //                 LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SquareAreaCompose);
            //                 executeEffectBefore();
            //                 this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //                 this.m_ctrl.CreateEffect(EffectType.SquareAreaCompose, destBlocker.SelfTiled, this.m_effData, srcBlocker.SelfTiled);
            //                 this.m_ctrl.Execute();
            //                 return true;
            //             }
            //         }
            //         // 竖条纹+横条纹/横条纹+竖条纹
            //         else if (srcBlocker.IsLineBlocker() && destBlocker.IsLineBlocker()) {
            //             this.DeductLimit();
            //             LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.LineLine);
            //             executeEffectBefore();
            //             this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //             this.m_ctrl.CreateEffect(EffectType.LineLine, destBlocker.SelfTiled, this.m_effData, srcBlocker.SelfTiled);
            //             this.m_ctrl.Execute();
            //             return true;
            //         }
            //         else if (srcBlocker.IsSquareBlocker() && destBlocker.IsSquareBlocker()) {
            //             this.DeductLimit();
            //             LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SquareAndSquare);
            //             executeEffectBefore();
            //             this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //             this.m_ctrl.CreateEffect(EffectType.SquareAndSquare, destBlocker.SelfTiled, this.m_effData, srcBlocker.SelfTiled);
            //             this.m_ctrl.Execute();
            //             return true;
            //         }
            //         else if (srcBlocker.IsSquareBlocker() || destBlocker.IsSquareBlocker()) {
            //             if (srcBlocker.IsLineBlocker() || destBlocker.IsLineBlocker()) {
            //                 this.DeductLimit();
            //                 LevelManager.Instance.Collector.SetLevelAutomaticEffect(EffectType.SquareLineCompose);
            //                 executeEffectBefore();
            //                 this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //                 this.m_ctrl.CreateEffect(EffectType.SquareLineCompose, destBlocker.SelfTiled, this.m_effData, srcBlocker.SelfTiled);
            //                 this.m_ctrl.Execute();
            //                 return true;
            //             }
            //         }
            //     }
            //     else if ((srcBlocker.SubType === BlockSubType.Special && destBlocker.SubType === BlockSubType.none) || (srcBlocker.SubType === BlockSubType.none && destBlocker.SubType === BlockSubType.Special)) {
            //         if (srcBlocker.IsAreaBlocker() || destBlocker.IsAreaBlocker()) {
            //             this.DeductLimit();
            //             executeEffectBefore();
            //             const packageBlocker = srcBlocker.IsAreaBlocker() ? srcBlocker : destBlocker;
            //             const normalBlocker = (srcBlocker.SubType === BlockSubType.none) ? srcBlocker : destBlocker;
            //             this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //             if (normalBlocker.CanMatch()) {
            //                 this.m_ctrl.CreateEffect(EffectType.BaseCrush, normalBlocker.SelfTiled, this.m_effData);
            //             }
            //             this.m_ctrl.CreateEffect(EffectType.AreaCrush, packageBlocker.SelfTiled, this.m_effData);
            //             this.m_ctrl.Execute();
            //             return true;
            //         }
            //         if (srcBlocker.IsLineBlocker() || destBlocker.IsLineBlocker()) {
            //             this.DeductLimit();
            //             executeEffectBefore();
            //             const lineBlocker = (srcBlocker.SubType === BlockSubType.none) ? destBlocker : srcBlocker;
            //             const normalBlocker = (srcBlocker.SubType === BlockSubType.none) ? srcBlocker : destBlocker;
            //             this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //             if (normalBlocker.CanMatch()) {
            //                 this.m_ctrl.CreateEffect(EffectType.BaseCrush, normalBlocker.SelfTiled, this.m_effData);
            //             }
            //             normalBlocker.Marked = false;
            //             this.m_ctrl.CreateEffect(EffectType.LineCrush, lineBlocker.SelfTiled, this.m_effData, normalBlocker.SelfTiled);
            //             this.m_ctrl.Execute();
            //             return true;
            //         }
            //         // 田字消
            //         if (srcBlocker.IsSquareBlocker() || destBlocker.IsSquareBlocker()) {
            //             this.DeductLimit();
            //             executeEffectBefore();
            //             const squareBlocker = (srcBlocker.SubType === BlockSubType.none) ? destBlocker : srcBlocker;
            //             const normalBlocker = (srcBlocker.SubType === BlockSubType.none) ? srcBlocker : destBlocker;
            //             this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //             if (normalBlocker.CanMatch()) {
            //                 this.m_ctrl.CreateEffect(EffectType.BaseCrush, normalBlocker.SelfTiled, this.m_effData);
            //             }
            //             normalBlocker.Marked = false;
            //             this.m_ctrl.CreateEffect(EffectType.SquareCrush, squareBlocker.SelfTiled, this.m_effData);
            //             this.m_ctrl.Execute();
            //             return true;
            //         }
            //     }
            // }
            // else {
            //     if (destBlocker.SubType === BlockSubType.Special) {
            //         if (destBlocker.IsAreaBlocker()) {
            //             this.DeductLimit();
            //             executeEffectBefore();
            //             this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //             this.m_ctrl.CreateEffect(EffectType.AreaCrush, destBlocker.SelfTiled, this.m_effData);
            //             this.m_ctrl.Execute();
            //             return true;
            //         }
            //         if (destBlocker.IsLineBlocker()) {
            //             this.DeductLimit();
            //             executeEffectBefore();
            //             this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //             this.m_ctrl.CreateEffect(EffectType.LineCrush, destBlocker.SelfTiled, this.m_effData, destBlocker.ID);
            //             this.m_ctrl.Execute();
            //             return true;
            //         }
            //         // 田字消
            //         if (destBlocker.IsSquareBlocker()) {
            //             this.DeductLimit();
            //             executeEffectBefore();
            //             this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
            //             this.m_ctrl.CreateEffect(EffectType.SquareCrush, destBlocker.SelfTiled, this.m_effData);
            //             this.m_ctrl.Execute();
            //             return true;
            //         }
            //     }
            // }

            let first = this.m_data.src;
            let second = this.m_data.dest;

            if (first.Row === second.Row) {
                first = this.m_data.src.Col < this.m_data.dest.Col ? this.m_data.src : this.m_data.dest;
                second = this.m_data.src.Col > this.m_data.dest.Col ? this.m_data.src : this.m_data.dest;
            }
            if ((first.CanMoveBlocker != null && first.CanMoveBlocker.CanMatch()) || (second.CanMoveBlocker != null && second.CanMoveBlocker.CanMatch())) {
                executeEffectBefore();
                this.m_ctrl = EffectControllerFactory.Instance.PopController(()=> {this.OnEffectCtrlCallback} );
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
        cc.log("this.m_effData = " + this.m_effData);
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
            // if (this.m_data.src != null && this.m_data.dest != null && !this.m_data.isCheck && !this.m_data.isUseItem) {
            //     AudiosManager.Instance.PlayOneShot(this.m_WrongMatchAudio);
            // }
            this.BackMove(this.m_data);
        }
        else {
            if (this.m_data.src != null && this.m_data.dest != null && !this.m_data.isUseItem) {
                // this.m_data.src.RecyleIngredients();
                // this.m_data.dest.RecyleIngredients();
                if (this.m_data.startType === FSStartType.enNormal) {
                    
                    if ((this.m_data.src.CanMoveBlocker != null && !this.m_data.src.CanMoveBlocker.IsDestroy) || this.m_data.src.CanMoveBlocker == null) {
                        if (this.m_data.src.CanMoveBlocker != null) {
                            this.m_data.src.CanMoveBlocker.Marked = false;
                        }

                        // EventDispatcher.Notify(GCEventType.TriggerFalling, this.m_data.src);
                        // if (this.m_data.src.GetNextTiled() != null && this.m_data.src.GetNextTiled().CanArrive(this.m_data.src)) {
                        //     EventDispatcher.Notify(GCEventType.TriggerFalling, this.m_data.src.GetNextTiled());
                        // }
                        // else {
                        //     const slantTiled = this.m_data.src.CheckSlantArrvieTiled();
                        //     if (slantTiled != null) {
                        //         EventDispatcher.Notify(GCEventType.TriggerFalling, slantTiled);
                        //     }
                        // }
                    }
                }
            }
        }
    }
}

export class FSAdpater extends FSBase
{
    StartByTiled(tiled: Tiled)
    {

    }
}