import { BlockerAttribute } from "../../table/BlockTable";
import { MatchHelper } from "../../tools/MatchHelper";
import { Timer, TimerManager, TimerData, TimerType } from "../../tools/TimerManager";
import { Blocker } from "../blocker/Blocker";
import { BlockerID } from "../blocker/BlockerManager";
import { NormalTiled } from "../tiledmap/NormalTiled";
import { Tiled } from "../tiledmap/Tiled";
import { TiledMap } from "../tiledmap/TiledMap";
import { EffectController, EffectType } from "./EffectController";
import { EffectControllerFactory } from "./EffectControllerFactory";

export class EffectData
{
    IsSuccess: boolean = false;

    Reset()
    {
        this.IsSuccess = false;
    }
}

export class EffectCheckValidBlockerData {
    isResist: boolean;
    isAddedBlocker: boolean;

    Reset()
    {
        this.isResist = false;
        this.isAddedBlocker = false;
    }
}

export class EffectBase
{
    WaitTime: number = 0;
    m_FinishTimer: Timer;
    EffType: EffectType = EffectType.None;
    m_ctrl: EffectController;
    m_Data: EffectData;
    m_matchSuccess: boolean;
    m_orign: NormalTiled;
    m_isExpandGrapeJuice: any;
    m_callback: (success: boolean, effect: EffectBase) => void;
    m_args: any;
    m_isStart: boolean;
    m_IsSkipCompleteState: boolean;
    m_ComposeAnimation_Obj: any;
    m_CurrentEffectTableData: any;
    m_matchItems: any[];
    m_filterLst: any[];
    m_markBlocks: any[];
    m_checkVaildBlockerData

    constructor(effectType: EffectType)
    {
        this.EffType = effectType;
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback);
        this.m_Data = check;
        this.m_matchSuccess = false;
        this.m_orign = orign as NormalTiled;
        // if (this.m_orign != null) {
        //     this.m_isExpandGrapeJuice = this.m_orign.IsExpandGrapeJuice;
        //     this.m_orign.ResetIsExpandGrapeJuice();
        // }
        this.m_callback = callback;
        this.m_args = args;
        this.m_isStart = true;
        this.WaitTime = 0;
        this.m_IsSkipCompleteState = false;
        this.m_ComposeAnimation_Obj = null;
        this.m_CurrentEffectTableData = null;
        this.m_matchItems = [];
        this.m_filterLst = [];
        this.m_markBlocks = [];
        if (this.m_FinishTimer != null) {
            TimerManager.Instance.ForceStopTimer(this.m_FinishTimer, this);
            this.m_FinishTimer = null;
        }
    }

    public StartCompose(): void {
    }
    
    public ExecutePlayCondition(): boolean {
        const dt: number = TimerManager.Instance.DeltaTime();
        this.WaitTime -= dt;
        return this.WaitTime <= 0;
    }
    
    public OnPlayCallback(): void {
        let timerData = new TimerData();
        timerData.type = TimerType.enConditionOnce;
        timerData.objthis = this;
        timerData.condition = this.ExecuteFinishCondition;
        timerData.body = this.Finish;
        timerData.end = this.OnFinishCallback;

        this.m_FinishTimer = TimerManager.Instance.CreateTimer(timerData);
    }
    
    public OnRecovery(): void {
        if (this.m_FinishTimer != null) {
            TimerManager.Instance.ForceStopTimer(this.m_FinishTimer, this);
            this.m_FinishTimer = null;
        }
    }
    
    public ExecuteFinishCondition(): boolean {
        const dt: number = TimerManager.Instance.DeltaTime();
        this.WaitTime -= dt;
        return this.WaitTime <= 0;
    }
    
    public OnFinishCallback(): void {
        this.m_FinishTimer = null;
        // Debug.Log("OnFinishCallback:" + this.GetHashCode());
    }
    
    public Start(): void {

    }
    
    public Play(): void {
        this.WaitTime = 0;
    }
    
    public Finish(): void {
    }
    
    OnEffectCtrlCallback()
    {
        this.m_callback(this.m_matchSuccess, this);
        this.Clearup();
    }

    Clearup()
    {
        this.m_callback = null;
        this.m_isStart = false;
        this.m_ctrl = null;
        this.m_args = null;
        this.m_Data = null;
        this.m_matchItems.length = 0;
        this.m_filterLst.length = 0;
        this.m_markBlocks.length = 0;
        this.m_IsSkipCompleteState = false;
    }

    // public checkValidBlockers(tiled: Tiled, blockers: Blocker[], isSkipSelf: boolean = false, isAddVBs: boolean = true, isAddMagicHat: boolean = false): boolean {
        
    //     if (tiled === null) {
    //         return false;
    //     }
    
    //     // const toptopBlocker: Blocker = tiled.topTopBlocker();
    //     // if (toptopBlocker !== null && !toptopBlocker.isBlinds()) {
    //     //     return false;
    //     // }
    
    //     // Check if adding Valid Destroy Blockers is needed
    //     // if (isAddVBs) {
    //     //     BlockerManager.instance.addValidDestroyBlockers(tiled);
    
    //     //     const leftBorder: EliminableBorder = tiled.getEliminableBorder(BlockerID.left_candy);
    //     //     if (leftBorder !== null) {
    //     //         leftBorder.DecrHP();
    //     //         blockers.push(leftBorder);
    //     //         leftBorder.matchEffectType = this.m_effType;
    //     //         this.m_checkVaildBlockerData.isAddedBlocker = true;
    //     //     }
    
    //     //     const topBorder: EliminableBorder = tiled.getEliminableBorder(BlockerID.top_candy);
    //     //     if (topBorder !== null) {
    //     //         topBorder.DecrHP();
    //     //         blockers.push(topBorder);
    //     //         topBorder.matchEffectType = this.m_effType;
    //     //         this.m_checkVaildBlockerData.isAddedBlocker = true;
    //     //     }
    //     // }
    
    //     const bottom: Blocker = tiled.BottomBlocker();
    //     if (this.m_orign.BeTriggerTiled !== null && this.m_orign.BeTriggerTiled.Guid === tiled.Guid) {
    //         if (tiled.CanMoveBlocker !== null) {
    //             if (bottom !== null && bottom.CurHp > 0) {
    //                 bottom.DecrHP();
    //                 blockers.push(bottom);
    //                 bottom.matchEffectType = this.EffType;
    //                 bottom.isTriggerEffect = true;
    //                 this.m_checkVaildBlockerData.isAddedBlocker = true;
    //             }
    //         } else {
    //             const match: Blocker = tiled.matchBlocker;
    //             if (match !== null && match.curHP > 0 && !(match instanceof MultiTiledNotDestroyableComBlocker)) {
    //                 match.DecrHP();
    //                 blockers.push(match);
    //                 match.matchEffectType = this.m_effType;
    //                 match.isTriggerEffect = true;
    //                 this.m_checkVaildBlockerData.isAddedBlocker = true;
    //             }
    
    //             this.m_checkVaildBlockerData.isResist = false;
    //             return this.m_checkVaildBlockerData;
    //         }
    
    //         return this.m_checkVaildBlockerData;
    //     }
    
    //     const destroyBlocker: Blocker = tiled.matchBlocker;
    //     if (destroyBlocker === null || destroyBlocker instanceof MultiTiledNotDestroyableComBlocker || destroyBlocker.isIngredient()) {
    //         this.m_checkVaildBlockerData.isResist = false;
    //         return this.m_checkVaildBlockerData;
    //     }
    
    //     if (destroyBlocker.canBlock()) {
    //         if (destroyBlocker.curHP > 0) {
    //             destroyBlocker.DecrHP();
    //             destroyBlocker.matchEffectType = this.m_effType;
    //             destroyBlocker.isTriggerEffect = true;
    //             blockers.push(destroyBlocker);
    
    //             this.m_checkVaildBlockerData.isResist = true;
    //             this.m_checkVaildBlockerData.isAddedBlocker = true;
    //             return this.m_checkVaildBlockerData;
    //         }
    //     }
    
    //     if (!isSkipSelf && tiled.guid === this.m_orign.guid) {
    //         if (tiled.isCanCrushBottomBlocker()) {
    //             if (bottom !== null && bottom.curHP > 0) {
    //                 bottom.DecrHP();
    //                 blockers.push(bottom);
    //                 bottom.matchEffectType = this.m_effType;
    //                 bottom.isTriggerEffect = true;
    
    //                 this.m_checkVaildBlockerData.isResist = false;
    //                 this.m_checkVaildBlockerData.isAddedBlocker = true;
    //                 return this.m_checkVaildBlockerData;
    //             }
    //         }
    //     }
    
    //     if (destroyBlocker instanceof MultiTiledDestroyableComBlocker) {
    //         if (destroyBlocker instanceof JackComBlocker) {
    //             const com: MultiTiledComBlocker = destroyBlocker;
    //             if (!com.isShow || com.markMatch) {
    //                 this.m_checkVaildBlockerData.isResist = false;
    //                 return this.m_checkVaildBlockerData;
    //             }
    //         } else {
    //             const com: MultiTiledDestroyableComBlocker = destroyBlocker;
    //             if (!com.isForbibCom && com.checkCanAddDestroy(this.m_orign.guid)) {
    //                 com.DecrHP();
    //                 com.isTriggerEffect = true;
    //                 com.matchEffectType = this.m_effType;
    //                 blockers.push(com);
    
    //                 this.m_checkVaildBlockerData.isAddedBlocker = true;
    //             }
    //             this.m_checkVaildBlockerData.isResist = false;
    //             return this.m_checkVaildBlockerData;
    //         }
    //     } else if (destroyBlocker instanceof ChameleonBlocker) {
    //         const chameleon: ChameleonBlocker = destroyBlocker;
    //         if (chameleon.isNeverChanged()) {
    //             chameleon.DecrHP();
    //             blockers.push(chameleon);
    //             chameleon.matchEffectType = this.m_effType;
    
    //             this.m_checkVaildBlockerData.isResist = false;
    //             this.m_checkVaildBlockerData.isAddedBlocker = true;
    //             return this.m_checkVaildBlockerData;
    //         }
    //     } else if (destroyBlocker instanceof MagicHatBlocker && isAddMagicHat) {
    //         const magicHatBlocker: MagicHatBlocker = destroyBlocker;
    //         magicHatBlocker.DecrHP();
    //         blockers.push(magicHatBlocker);
    //         magicHatBlocker.matchEffectType = this.m_effType;
    
    //         this.m_checkVaildBlockerData.isResist = false;
    //         this.m_checkVaildBlockerData.isAddedBlocker = true;
    //         return this.m_checkVaildBlockerData;
    //     } else if (destroyBlocker.isBreakfastMachineClose()) {
    //         if (this.m_effType === EffectType.HammerMallet || this.m_effType === EffectType.BoostTNT || (this instanceof EffectBoostCrossLine && (this as EffectBoostCrossLine).checkCloseBreakfastMachine())) {
    //             destroyBlocker.DecrHP();
    //             destroyBlocker.matchEffectType = this.m_effType;
    //             destroyBlocker.isTriggerEffect = true;
    //             blockers.push(destroyBlocker);
    //             this.m_checkVaildBlockerData.isAddedBlocker = true;
    //         }
    
    //         this.m_checkVaildBlockerData.isResist = false;
    //         return this.m_checkVaildBlockerData;
    //     }
    
    //     if (destroyBlocker.canMatch()) {
    //         if (destroyBlocker.isSwitching) {
    //             this.checkBottomMatch(destroyBlocker, blockers);
    //             this.m_checkVaildBlockerData.isResist = false;
    //             return this.m_checkVaildBlockerData;
    //         }
    //         if (destroyBlocker.markMatch && destroyBlocker.curHP <= 0) {
    //             if (destroyBlocker.tableData.layer !== BlockLayer.Middle && !destroyBlocker.isJelly()) {
    //                 this.m_checkVaildBlockerData.isResist = false;
    //                 return this.m_checkVaildBlockerData;
    //             } else if (!destroyBlocker.isHasAttribute(BlockerAttribute.totalDestroyCanBottom)) {
    //                 if (bottom !== null && bottom.curHP > 0) {
    //                     bottom.DecrHP();
    //                     blockers.push(bottom);
    //                     bottom.matchEffectType = this.m_effType;
    //                     bottom.isTriggerEffect = true;
    //                     this.m_checkVaildBlockerData.isAddedBlocker = true;
    //                 }
    //             }
    //             this.m_checkVaildBlockerData.isResist = false;
    //             return this.m_checkVaildBlockerData;
    //         }
    //         if (destroyBlocker.crushState || destroyBlocker.falling) {
    //             this.checkBottomMatch(destroyBlocker, blockers);
    //             this.m_checkVaildBlockerData.isResist = false;
    //             return this.m_checkVaildBlockerData;
    //         }
    
    //         destroyBlocker.DecrHP();
    //         destroyBlocker.matchEffectType = this.m_effType;
    //         destroyBlocker.isTriggerEffect = true;
    //         blockers.push(destroyBlocker);
    //         destroyBlocker.stopBornAnimation();
    //         this.m_checkVaildBlockerData.isAddedBlocker = true;
    //     }
    
    //     if (destroyBlocker.tableData.layer === BlockLayer.Top) {
    //         if (destroyBlocker.selfTiled.CanMoveBlocker !== null) {
    //             this.m_markBlocks.push(destroyBlocker.selfTiled.CanMoveBlocker);
    //         }
    //     }
    
    //     if (tiled.guid !== this.m_orign.guid || !isSkipSelf) {
    //         this.checkBottomMatch(destroyBlocker, blockers);
    //     }
    
    //     if (destroyBlocker.canBlock()) {
    //         this.m_checkVaildBlockerData.isResist = true;
    //         return this.m_checkVaildBlockerData;
    //     }
    
    //     this.m_checkVaildBlockerData.isResist = false;
    //     return this.m_checkVaildBlockerData;
    // }


    protected CheckBottomMatch(blk: Blocker, blockers: Blocker[] | null = null): Blocker | null {
        if (blk === null) {
            return null;
        }
    
        const selfTiled = blk.SelfTiled;
    
        if (!(selfTiled?.IsCanCrushBottomBlocker() ?? false)) {
            return null;
        }
    
        if (selfTiled.CanMoveBlocker !== null /*&& !JellyBlocker.isJellyBlocker(blk.id)*/ && selfTiled.CanMoveBlocker.ID === blk.ID) {
            if (selfTiled.TopBlocker() !== null || selfTiled.TopTopBlocker() !== null) {
                return null;
            }
    
            const bottom: Blocker | null = selfTiled.BottomBlocker();
            if (bottom !== null && bottom.CurHp > 0) {
                bottom.DecrHP();
    
                if (blockers === null) {
                    this.m_matchItems.push(bottom);
                } else {
                    blockers.push(bottom);
                }
    
                bottom.MatchEffectType = this.EffType;
                bottom.IsTriggerEffect = true;
                this.m_checkVaildBlockerData.isAddedBlocker = true;
                return bottom;
            }
        }
    
        return null;
    }
    
    
}

export class EffectBaseCrush extends EffectBase {
    private readonly WAIT_MULTI: number = 3;
    private readonly EMPTY_TILED_WAIT_TIME: number = 0.09;
    private m_spType: BlockerID = BlockerID.none;
    private setTiled: NormalTiled | null = null;

    constructor() {
        super(EffectType.BaseCrush);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);
        this.m_spType = BlockerID.none;
        this.setTiled = null;
    }

    public Start(): void {
        super.Start();
        // this.InitTableData(0, GlobalTableID.NormalCrushRatio);
        this.Check();
    }

    public Play(): void {
        if (this.m_matchItems.length >= 3) {
            this.m_matchSuccess = true;
        }
    }

    public DestroyBlockers(): void {
        TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);
    }

    public Finish(): void {
        this.m_filterLst = [];
        if (this.m_Data != null && !this.m_Data.IsSuccess) {
            this.m_Data.IsSuccess = this.m_matchSuccess;
        }

        if (!this.m_matchSuccess) {
            this.OnEffectCtrlCallback();
        } else {
            this.ExcuteMatch();
        }
    }

    public ExcuteMatch(): void {
        this.setTiled = null;
        if (this.m_spType !== BlockerID.none) {
            let isHave: boolean = false;
            for (let i = 0; i < this.m_matchItems.length; i++) {
                if (this.m_matchItems[i].SelfTiled != null) {
                    if (this.m_matchItems[i].SelfTiled.Guid === this.m_orign.Guid) {
                        isHave = true;
                        break;
                    }
                } else {
                    console.error("ExcuteMatch matchitem tiled null:" + this.m_matchItems[i].ID);
                }
            }
            if (!isHave) {
                this.setTiled = this.GetBornTiled();
            } else {
                if (this.m_orign.CanMoveBlocker == null) {
                    this.setTiled = this.GetBornTiled();
                } else if (this.m_orign.IsLocked() || this.m_orign.CanMoveBlocker.TableData.IsHasAttribute(BlockerAttribute.needGetOtherBornEffectTiled)) {
                    this.setTiled = this.GetBornTiled();
                } else {
                    this.setTiled = this.m_orign;
                }
            }
            if (this.setTiled != null) {
                this.setTiled.SetSpecialID(this.m_spType);
            }
            this.m_spType = BlockerID.none;
        }
        if (this.setTiled == null) {
            this.setTiled = this.m_orign;
        }
        for (let i = 0; i < this.m_filterLst.length; i++) {
            if (this.m_filterLst[i] == null) {
                
            } else {
                this.m_matchItems = this.m_matchItems.filter(item => item !== this.m_filterLst[i]);
            }
        }
        this.DestroyBlockers();
        this.m_ctrl.Execute();
    }

    private GetBornTiled(): NormalTiled | null {
        for (let i = 0; i < this.m_matchItems.length; i++) {
            if (this.m_matchItems[i].SelfTiled != null && !this.m_matchItems[i].SelfTiled.IsLocked() && !this.m_matchItems[i].IsHasAttribute(BlockerAttribute.needGetOtherBornEffectTiled)) {
                return this.m_matchItems[i].SelfTiled;
            } else {
                console.error(`GetBornTiled matchitem tiled null index: ${i} id: ${this.m_matchItems[i].ID}`);
            }
        }
        return null;
    }

    public Check(): void {
        let waitCount: number = 0;
        this.m_spType = MatchHelper.CheckMatch(this.m_orign, this.m_matchItems);
        waitCount = MatchHelper.FallingWaitCount;

        if (this.m_matchItems.length >= 3) {
            MatchHelper.m_blklst = [];
            let tmpLst = MatchHelper.m_blklst;
            for (let i = 0; i < this.m_matchItems.length; i++) {
                let matchItem = this.m_matchItems[i];
                if (matchItem != null) {
                    matchItem.DecrHP();
                    matchItem.MatchEffectType = this.EffType;
                }
            }

            tmpLst.push(...this.m_matchItems);
            for (let i = 0; i < tmpLst.length; i++) {
                this.CheckBottomMatch(tmpLst[i]);
            }

            // let isHaveOriginGrapeJuice = false;
            // for (let i = 0; i < this.m_matchItems.length; i++) {
            //     let matchItem = this.m_matchItems[i];
            //     if (matchItem != null && matchItem.IsGrapeJuice()) {
            //         if (matchItem.SelfTiled.Guid === this.m_orign.Guid) {
            //             isHaveOriginGrapeJuice = true;
            //             break;
            //         }
            //     }
            // }

            // let isHaveGrapeJuiceTiled: Tiled | null = null;
            // if (isHaveOriginGrapeJuice && this.m_isExpandGrapeJuice) {
            //     isHaveGrapeJuiceTiled = this.m_orign;
            // } else {
            //     for (let i = 0; i < this.m_matchItems.length; i++) {
            //         let matchItem = this.m_matchItems[i];
            //         if (matchItem != null && matchItem.IsGrapeJuice()) {
            //             let isCreateGrapeJuice: boolean = (matchItem as GrapeJuiceBlocker).DisplayState !== GrapeJuiceBlocker.DisplayStateEnum.Disable;
            //             if (isCreateGrapeJuice) {
            //                 isHaveGrapeJuiceTiled = matchItem.SelfTiled;
            //                 break;
            //             }
            //         }
            //     }
            // }

            // if (isHaveGrapeJuiceTiled != null) {
            //     let bottomBlocker = isHaveGrapeJuiceTiled.BottomBlocker();
            //     let grapeJuiceBlocker = bottomBlocker as GrapeJuiceBlocker;
            //     if (grapeJuiceBlocker != null) {
            //         let specialExpandIndex = grapeJuiceBlocker.SpecialExpandIndex;
            //         if (specialExpandIndex === -1) {
            //             specialExpandIndex = isHaveGrapeJuiceTiled.SpecialExpandIndex;
            //         }

            //         LevelManager.Instance.SetBlockersExpand(this.m_matchItems, specialExpandIndex);

            //         if (grapeJuiceBlocker.SpecialExpandIndex === isHaveGrapeJuiceTiled.GetNeighborRight()?.Guid) {
            //             grapeJuiceBlocker.GrapeJuiceMoveDirection = Direction.Left;
            //         } else if (grapeJuiceBlocker.SpecialExpandIndex === isHaveGrapeJuiceTiled.GetNeighborLeft()?.Guid) {
            //             grapeJuiceBlocker.GrapeJuiceMoveDirection = Direction.Right;
            //         } else if (grapeJuiceBlocker.SpecialExpandIndex === isHaveGrapeJuiceTiled.GetNeighborTop()?.Guid) {
            //             grapeJuiceBlocker.GrapeJuiceMoveDirection = Direction.Down;
            //         } else if (grapeJuiceBlocker.SpecialExpandIndex === isHaveGrapeJuiceTiled.GetNeighborBottom()?.Guid) {
            //             grapeJuiceBlocker.GrapeJuiceMoveDirection = Direction.Up;
            //         }
            //         grapeJuiceBlocker.RefreshDisplay(GrapeJuiceBlocker.DisplayStateEnum.PlayAnim);
            //     }
            // }
        } else {
            if (this.m_orign.BeforeNoCheckMatch) {
                if (waitCount > 2) {
                    if (this.m_orign.CanMoveBlocker != null) {
                        this.m_orign.CanMoveBlocker.DelayCheck((waitCount - 2) * this.EMPTY_TILED_WAIT_TIME);
                    }
                } else if (waitCount > 0) {
                    if (this.m_orign.CanMoveBlocker != null) {
                        this.m_orign.CanMoveBlocker.DelayCheck(waitCount * this.EMPTY_TILED_WAIT_TIME);
                    }
                }
            }
            //this.m_orign.ResetIsExpandGrapeJuice();
        }
    }
}

