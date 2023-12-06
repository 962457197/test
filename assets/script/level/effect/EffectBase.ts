import Game from "../../Game";
import { BlockerAttribute } from "../../table/BlockTable";
import { AudioManager } from "../../tools/AudioManager";
import { MatchHelper } from "../../tools/MatchHelper";
import { Timer, TimerManager, TimerData, TimerType } from "../../tools/TimerManager";
import { Utils } from "../../tools/Utils";
import BaseBlockerCom from "../blocker/BaseBlockerCom";
import { Blocker, MultiTiledDestroyableComBlocker, SameColorBlocker } from "../blocker/Blocker";
import { BlockLayer, BlockZIndex, BlockerID } from "../blocker/BlockerManager";
import { Direction } from "../data/LevelScriptableData";
import { FallingManager } from "../drop/FallingManager";
import { FSM, IntervalExecEffect } from "../fsm/FSBase";
import { LevelManager } from "../tiledmap/LevelManager";
import { BornEffect, NormalTiled, Tiled } from "../tiledmap/Tiled";
import { TiledMap } from "../tiledmap/TiledMap";
import { EffectController, EffectType } from "./EffectController";
import { EffectControllerFactory } from "./EffectControllerFactory";
import LineMoveEffectCom from "./com/LineMoveEffectCom";
import SameColorEmitCom from "./com/SameColorEmitCom";
import SquareFlyCom from "./com/SquareFlyCom";

export class EffectData
{
    IsSuccess: boolean = false;

    Reset()
    {
        this.IsSuccess = false;
    }
}

export enum EffectZIndex
{
    Layer1 = 0,
    Layer2 = 1000,
    Layer3 = 2000,
}

export class EffectBase
{
    WaitTime: number = 0;
    m_FinishTimer: Timer;
    EffType: EffectType = EffectType.None;
    m_ctrl: EffectController;
    m_Data: EffectData;
    m_matchSuccess: boolean;
    m_orign: Tiled;
    m_isExpandGrapeJuice: any;
    m_callback: (success: boolean, effect: EffectBase) => void;
    m_args: any;
    m_isStart: boolean;
    m_IsSkipCompleteState: boolean;
    m_ComposeAnimation_Obj: any;
    m_CurrentEffectTableData: any;
    m_matchItems: Blocker[] = [];
    m_filterLst: any[] = [];
    m_markBlocks: any[] = [];
    IsAddedBlocker: boolean = false;

    constructor(effectType: EffectType)
    {
        this.EffType = effectType;
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        this.m_ctrl = EffectControllerFactory.Instance.PopController(this.OnEffectCtrlCallback.bind(this));
        this.m_Data = check;
        this.m_matchSuccess = false;
        this.m_orign = orign;
        // if (this.m_orign != null) {
        //     this.m_isExpandGrapeJuice = this.m_orign.IsExpandGrapeJuice;
        //     this.m_orign.ResetIsExpandGrapeJuice();
        // }
        this.m_callback = callback
        this.m_args = args;
        this.m_isStart = true;
        this.WaitTime = 0;
        this.m_IsSkipCompleteState = false;
        this.m_ComposeAnimation_Obj = null;
        this.m_CurrentEffectTableData = null;
        this.m_matchItems.length = 0;
        this.m_filterLst.length = 0;
        this.m_markBlocks.length = 0;
        if (this.m_FinishTimer != null) {
            TimerManager.Instance.ForceStopTimer(this.m_FinishTimer, this);
            this.m_FinishTimer = null;
        }
    }

    public StartCompose(): void {
    }
    
    public ExecutePlayCondition(): boolean {
        const dt: number = TimerManager.Instance.GetDeltaTime();
        this.WaitTime = this.WaitTime - dt;
        let condition = this.WaitTime <= 0;
        return condition;
    }
    
    public OnPlayCallback(): void {
        let timerData = new TimerData();
        timerData.type = TimerType.enConditionOnce;
        timerData.objthis = this;
        timerData.condition = this.ExecuteFinishCondition.bind(this);
        timerData.body = this.Finish.bind(this);
        timerData.end = this.OnFinishCallback.bind(this);

        this.m_FinishTimer = TimerManager.Instance.CreateTimer(timerData);
    }
    
    public OnRecovery(): void {
        if (this.m_FinishTimer != null) {
            TimerManager.Instance.ForceStopTimer(this.m_FinishTimer, this);
            this.m_FinishTimer = null;
        }
    }
    
    public ExecuteFinishCondition(): boolean {
        const dt: number = TimerManager.Instance.GetDeltaTime();
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

    public CheckValidBlockers(tiled: Tiled, blockers: Blocker[], isSkipSelf: boolean = false, isAddVBs: boolean = true, isAddMagicHat: boolean = false): boolean {
        this.IsAddedBlocker = false;
        
        if (tiled === null) {
            return false;
        }
    
        // const toptopBlocker: Blocker = tiled.topTopBlocker();
        // if (toptopBlocker !== null && !toptopBlocker.isBlinds()) {
        //     return false;
        // }
    
        // Check if adding Valid Destroy Blockers is needed
        // if (isAddVBs) {
        //     BlockerManager.instance.addValidDestroyBlockers(tiled);
    
        //     const leftBorder: EliminableBorder = tiled.getEliminableBorder(BlockerID.left_candy);
        //     if (leftBorder !== null) {
        //         leftBorder.DecrHP();
        //         blockers.push(leftBorder);
        //         leftBorder.matchEffectType = this.m_effType;
        //         this.IsAddedBlocker = true;
        //     }
    
        //     const topBorder: EliminableBorder = tiled.getEliminableBorder(BlockerID.top_candy);
        //     if (topBorder !== null) {
        //         topBorder.DecrHP();
        //         blockers.push(topBorder);
        //         topBorder.matchEffectType = this.m_effType;
        //         this.IsAddedBlocker = true;
        //     }
        // }
    
        const bottom: Blocker = tiled.BottomBlocker();
        if (this.m_orign.BeTriggerTiled !== null && this.m_orign.BeTriggerTiled.Guid === tiled.Guid) {
            if (tiled.CanMoveBlocker !== null) {
                if (bottom !== null && bottom.CurHp > 0) {
                    bottom.DecrHP();
                    blockers.push(bottom);
                    bottom.MatchEffectType = this.EffType;
                    bottom.IsTriggerEffect = true;
                    this.IsAddedBlocker = true;
                }
            } else {
                const match: Blocker = tiled.MatchBlocker;
                if (match !== null && match.CurHp > 0 /* && !(match instanceof MultiTiledNotDestroyableComBlocker) */) {
                    match.DecrHP();
                    blockers.push(match);
                    match.MatchEffectType = this.EffType;
                    match.IsTriggerEffect = true;
                    this.IsAddedBlocker = true;
                }
    
                return this.IsAddedBlocker;
            }
    
            return this.IsAddedBlocker;
        }
    
        const destroyBlocker: Blocker = tiled.MatchBlocker;
        if (destroyBlocker === null /*|| destroyBlocker instanceof MultiTiledNotDestroyableComBlocker*/ || destroyBlocker.IsIngredient()) {
            return this.IsAddedBlocker;
        }
    
        if (!isSkipSelf && tiled.Guid === this.m_orign.Guid) {
            if (tiled.IsCanCrushBottomBlocker()) {
                if (bottom !== null && bottom.CurHp > 0) {
                    bottom.DecrHP();
                    blockers.push(bottom);
                    bottom.MatchEffectType = this.EffType;
                    bottom.IsTriggerEffect = true;
    
                    this.IsAddedBlocker = true;
                    return this.IsAddedBlocker;
                }
            }
        }
    
        if (destroyBlocker instanceof MultiTiledDestroyableComBlocker) {
            // if (destroyBlocker instanceof JackComBlocker) 
            // {
            //     const com: MultiTiledComBlocker = destroyBlocker;
            //     if (!com.isShow || com.markMatch) {
                    
            //         return this.IsAddedBlocker;
            //     }
            // } 
            // else 
            {
                const com: MultiTiledDestroyableComBlocker = destroyBlocker;
                if (!com.IsForbidCom && com.CheckCanAddDestroy(this.m_orign.Guid)) {
                    com.DecrHP();
                    com.IsTriggerEffect = true;
                    com.MatchEffectType = this.EffType;
                    blockers.push(com);
    
                    this.IsAddedBlocker = true;
                }
                
                return this.IsAddedBlocker;
            }
        }
        
        // else if (destroyBlocker instanceof ChameleonBlocker) {
        //     const chameleon: ChameleonBlocker = destroyBlocker;
        //     if (chameleon.isNeverChanged()) {
        //         chameleon.DecrHP();
        //         blockers.push(chameleon);
        //         chameleon.matchEffectType = this.EffType;
    
        //         
        //         this.IsAddedBlocker = true;
        //         return this.IsAddedBlocker;
        //     }
        // } else if (destroyBlocker instanceof MagicHatBlocker && isAddMagicHat) {
        //     const magicHatBlocker: MagicHatBlocker = destroyBlocker;
        //     magicHatBlocker.DecrHP();
        //     blockers.push(magicHatBlocker);
        //     magicHatBlocker.matchEffectType = this.EffType;
    
        //     
        //     this.IsAddedBlocker = true;
        //     return this.IsAddedBlocker;
        // } else if (destroyBlocker.isBreakfastMachineClose()) {
        //     if (this.EffType === EffectType.HammerMallet || this.EffType === EffectType.BoostTNT || (this instanceof EffectBoostCrossLine && (this as EffectBoostCrossLine).checkCloseBreakfastMachine())) {
        //         destroyBlocker.DecrHP();
        //         destroyBlocker.MatchEffectType = this.EffType;
        //         destroyBlocker.IsTriggerEffect = true;
        //         blockers.push(destroyBlocker);
        //         this.IsAddedBlocker = true;
        //     }
    
        //     
        //     return this.IsAddedBlocker;
        // }
    
        if (destroyBlocker.CanMatch()) {
            if (destroyBlocker.IsSwitching) {
                this.CheckBottomMatch(destroyBlocker, blockers);
                
                return this.IsAddedBlocker;
            }
            if (destroyBlocker.MarkMatch && destroyBlocker.CurHp <= 0) {
                if (destroyBlocker.TableData.Data.Layer !== BlockLayer.Middle && !destroyBlocker.IsJelly()) {
                    
                    return this.IsAddedBlocker;
                } else if (!destroyBlocker.TableData.IsHasAttribute(BlockerAttribute.totalDestroyCanBottom)) {
                    if (bottom !== null && bottom.CurHp > 0) {
                        bottom.DecrHP();
                        blockers.push(bottom);
                        bottom.MatchEffectType = this.EffType;
                        bottom.IsTriggerEffect = true;
                        this.IsAddedBlocker = true;
                    }
                }
                
                return this.IsAddedBlocker;
            }
            if (destroyBlocker.CrushState || destroyBlocker.Falling) {
                this.CheckBottomMatch(destroyBlocker, blockers);
                
                return this.IsAddedBlocker;
            }
    
            destroyBlocker.DecrHP();
            destroyBlocker.MatchEffectType = this.EffType;
            destroyBlocker.IsTriggerEffect = true;
            blockers.push(destroyBlocker);
            // destroyBlocker.StopBornAnimation();
            this.IsAddedBlocker = true;
        }
    
        if (destroyBlocker.TableData.Data.Layer === BlockLayer.Top) {
            if (destroyBlocker.SelfTiled.CanMoveBlocker !== null) {
                this.m_markBlocks.push(destroyBlocker.SelfTiled.CanMoveBlocker);
            }
        }
    
        if (tiled.Guid !== this.m_orign.Guid || !isSkipSelf) {
            this.CheckBottomMatch(destroyBlocker, blockers);
        }
        
        return this.IsAddedBlocker;
    }


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
                this.IsAddedBlocker = true;
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
    private setTiled: Tiled | null = null;
    tempBlockers: Blocker[] = [];

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
            LevelManager.Instance.CombCount++;
        }
    }

    public DestroyBlockers(): void {
        this.ComposeEffect(this.m_matchItems);

        TiledMap.getInstance().DestroyTopAndMiddleBlockers(this.m_matchItems);
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

    private GetBornTiled(): Tiled | null {
        for (let i = 0; i < this.m_matchItems.length; i++) {
            if (this.m_matchItems[i].SelfTiled != null && !this.m_matchItems[i].SelfTiled.IsLocked() && !this.m_matchItems[i].TableData.IsHasAttribute(BlockerAttribute.needGetOtherBornEffectTiled)) {
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
                this.m_orign.BeforeNoCheckMatch = false;
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

    public ComposeEffect(blockers: Blocker[]): void {
        for (let i = 0; i < blockers.length; i++) {
            if (blockers[i] !== null) {
                const tiled = blockers[i].SelfTiled;
                if (tiled !== null && tiled.GetSpecialID() > 0) {
                    // 合成特效
                    this.tempBlockers.length = 0;
                    for (let j = 0; j < blockers.length; j++) {
                        if (blockers[j] !== null) {
                            if (blockers[j].SelfTiled !== null) {
                                if (tiled !== blockers[j].SelfTiled && blockers[j].SelfTiled.CanMove()) {
                                    this.tempBlockers.push(blockers[j]);
                                }
                            }
                        }
                    }
                    this.CreateComposeEffect(tiled, this.tempBlockers);
                    // blockers[i].DecrNeedTargetCount();
                    break;
                }
            }
        }
    }

    private CreateComposeEffect(bornTiled: Tiled, blockers: Blocker[]): void {

        for (let i = 0; i < blockers.length; i++) {
            if (blockers[i] === null || blockers[i].ForbidSwitch() || blockers[i].TableData.IsHasAttribute(BlockerAttribute.cantPlayComposeEffect)) {
                continue;
            }

            FallingManager.Instance.AddDelayCount();

            let blkPosition = blockers[i].LocalPosition;
            cc.resources.load("prefab/blocker/BaseBlock", (err, data: any) =>{
                let effect: cc.Node = cc.instantiate(data);
                let baseBlockerCom = effect.getComponent(BaseBlockerCom);
                cc.resources.load("icon/" + Game.GetIconName(blockers[i].TableData.Data.IconId), cc.SpriteFrame, (err, data: any) =>
                {
                    baseBlockerCom.Icon.spriteFrame = data;
                });

                effect.active = true;
                effect.setParent(TiledMap.getInstance().m_blockerRoot);
                effect.setPosition(blkPosition);

                cc.tween(effect)
                .to(0.2, { position : cc.v3(bornTiled.LocalPosition.x, bornTiled.LocalPosition.y, 0)})
                .call(()=> { effect.destroy() })
                .start();

                FallingManager.Instance.RemoveDelayCount();
            });

            blockers[i].SetActive(false);
        }

        bornTiled.DelayUpdateToSpecial();

        // // 先积分
        // if (aimTiled.CanMoveBlocker !== null) {
        //     aimTiled.PlayLightAnimation();
        // }
    }
}

class EffectAreaBase extends EffectBase {
    constructor(type: EffectType) {
        super(type);
    }

    public Finish(): void {
        super.Finish();
        for (let i = 0; i < this.m_markBlocks.length; i++) {
            this.m_markBlocks[i].OnEffectFinished();
        }

        // this.ResetBlockTriggerEffect(this.m_matchItems);
    }

    public CheckMatch(tiled: Tiled): void {
        this.CheckValidBlockers(tiled, this.m_matchItems);
    }

    protected FindCenterMatch(): void {
        const maxrow = this.m_orign.Row + 2;
        const maxcol = this.m_orign.Col + 2;
        for (let row = this.m_orign.Row - 2; row <= maxrow; row++) {
            for (let col = this.m_orign.Col - 2; col <= maxcol; col++) {
                if (
                    (row === this.m_orign.Row - 2 && col === this.m_orign.Col - 2) ||
                    (row === this.m_orign.Row + 2 && col === this.m_orign.Col - 2) ||
                    (row === this.m_orign.Row - 2 && col === this.m_orign.Col + 2) ||
                    (row === this.m_orign.Row + 2 && col === this.m_orign.Col + 2)
                ) {
                    continue;
                }
                const tiled1 = TiledMap.getInstance().GetTiled(row, col);
                if (tiled1 === null) {
                    continue;
                }
                this.CheckMatch(tiled1);
                // tiled1.IsExpandGrapeJuice = this.m_isExpandGrapeJuice;
            }
        }
    }
}

export class EffectAreaCrush extends EffectAreaBase
{
    constructor() {
        super(EffectType.AreaCrush);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        this.m_orign.CanMoveBlocker.MarkMatch = true;
        this.m_orign.CanMoveBlocker.CrushState = true;
        this.m_orign.CanMoveBlocker.MatchEffectType = this.EffType;
    }

    public Start(): void {
        super.Start();
        this.FindCenterMatch();
    }

    public Play(): void {
        super.Play();

        AudioManager.Instance.PlaySource("Audio_Match_AreaCrusher");

        cc.resources.load("prefab/effect/AreaEffect", (err, data: any) =>{
            var effect = cc.instantiate(data);

            effect.setParent(TiledMap.getInstance().m_effectRoot);
            let spacePos = effect.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
            effect.setPosition(spacePos);

            effect.zIndex = EffectZIndex.Layer2;
        });

        this.WaitTime = 0.23;
    }

    public Finish(): void {
        super.Finish();

        this.m_Data.IsSuccess = true;
        TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);
        TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker);

        this.m_ctrl.Execute();
    }
}

export class EffectAreaAndArea extends EffectAreaBase
{
    m_otherTiled: Tiled = null;

    constructor() {
        super(EffectType.AreaAndArea);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        this.m_orign.CanMoveBlocker.MarkMatch = true;
        this.m_orign.CanMoveBlocker.CrushState = true;
        this.m_orign.CanMoveBlocker.MatchEffectType = this.EffType;

        this.m_otherTiled = args as Tiled;
        this.m_otherTiled.CanMoveBlocker.MarkMatch = true;
        this.m_otherTiled.CanMoveBlocker.CrushState = true;
        this.m_otherTiled.CanMoveBlocker.MatchEffectType = this.EffType;
    }

    public Start(): void {
        super.Start();
        this.FindCenterMatch();
    }

    FindCenterMatch(): void {
        const maxrow = this.m_orign.Row + 3;
        const maxcol = this.m_orign.Col + 3;
        for (let row = this.m_orign.Row - 3; row <= maxrow; row++) {
            for (let col = this.m_orign.Col - 3; col <= maxcol; col++) {
                if (
                    (row === this.m_orign.Row - 3 && col === this.m_orign.Col - 3) ||
                    (row === this.m_orign.Row + 3 && col === this.m_orign.Col - 3) ||
                    (row === this.m_orign.Row - 3 && col === this.m_orign.Col + 3) ||
                    (row === this.m_orign.Row + 3 && col === this.m_orign.Col + 3)
                ) {
                    continue;
                }
                const tiled1 = TiledMap.getInstance().GetTiled(row, col);
                if (tiled1 === null) {
                    continue;
                }
                this.CheckMatch(tiled1);
                // tiled1.IsExpandGrapeJuice = this.m_isExpandGrapeJuice;
            }
        }
    }

    public Play(): void {
        super.Play();

        AudioManager.Instance.PlaySource("Audio_Match_BigBomb_Shake");

        cc.resources.load("prefab/effect/AreaAreaEffect", (err, data: any) =>{
            var effect = cc.instantiate(data);

            effect.setParent(TiledMap.getInstance().m_effectRoot);
            let spacePos = effect.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
            effect.setPosition(spacePos);

            effect.zIndex = EffectZIndex.Layer2;
        });

        this.WaitTime = 1.7;
    }

    public Finish(): void {
        super.Finish();

        this.m_Data.IsSuccess = true;
        TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker);
        TiledMap.getInstance().DestroyBlocker(this.m_otherTiled.CanMoveBlocker);
        TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);

        this.m_ctrl.Execute();
    }
}

export class EffectSquareAreaCrush extends EffectAreaBase
{
    constructor() {
        super(EffectType.SquareAreaCrush);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        if (this.m_orign.CanMoveBlocker != null)
        {
            this.m_orign.CanMoveBlocker.MarkMatch = true;
            this.m_orign.CanMoveBlocker.CrushState = true;
            this.m_orign.CanMoveBlocker.MatchEffectType = this.EffType;
        }
    }

    public Start(): void {
        super.Start();
        this.FindCenterMatch();
    }

    public Play(): void {
        super.Play();

        AudioManager.Instance.PlaySource("Audio_Match_AreaCrusher");

    }

    public Finish(): void {
        super.Finish();

        this.m_Data.IsSuccess = true;
        if (this.m_orign.CanMoveBlocker != null)
        {
            this.m_orign.CanMoveBlocker.CrushState = false;
            this.m_matchItems.push(this.m_orign.CanMoveBlocker);
        }
        TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);

        this.m_ctrl.Execute();
    }
}

class EffectLineBase extends EffectBase {

    OFFSET: number = 25;
    m_end1PointTiled: Tiled = null;
    m_end2PointTiled: Tiled = null;
    m_markTiledList: Tiled[] = [];

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);
        this.m_end1PointTiled = null;
        this.m_end2PointTiled = null;
        this.m_markTiledList.length = 0;
    }
    
    GetTarPos1(blockerID: BlockerID, tiled: Tiled)
    {
        let workdPos = tiled.WorldPosition;
        if (blockerID == BlockerID.horizontal)
        {
            return new cc.Vec2(workdPos.x - this.OFFSET * Game.CC_SIZE_MULTI, workdPos.y);
        }
        return new cc.Vec2(workdPos.x, workdPos.y - this.OFFSET * Game.CC_SIZE_MULTI);
    }

    GetTarPos2(blockerID: BlockerID, tiled: Tiled)
    {
        let workdPos = tiled.WorldPosition;
        if (blockerID == BlockerID.horizontal)
        {
            return new cc.Vec2(workdPos.x + this.OFFSET * Game.CC_SIZE_MULTI, workdPos.y);
        }
        return new cc.Vec2(workdPos.x, workdPos.y + this.OFFSET * Game.CC_SIZE_MULTI);
    }

    CheckMatch(tiled: Tiled, blockers: Blocker[])
    {
        this.CheckValidBlockers(tiled, blockers);
    }

    InitEndPoint(spType: BlockerID, origin: Tiled | null = null): void 
    {
        this.m_markTiledList.length = 0;

        if (origin == null) {
          origin = this.m_orign;
        }
      
        if (spType === BlockerID.horizontal) 
        {
            for (let j = origin.Col - 1; j >= 0; j--) 
            {
                const tiled = TiledMap.getInstance().GetTiled(origin.Row, j);
                if (tiled !== null && tiled.IsValidTiled()) {
                    tiled.Marked = true;
                    this.m_markTiledList.push(tiled);
                }
                if (this.m_end1PointTiled === null || this.m_end1PointTiled.Col > tiled.Col) {
                    this.m_end1PointTiled = tiled;
                    }
            }

            for (let j = origin.Col; j < TiledMap.MAX_COL; j++) 
            {
                const tiled = TiledMap.getInstance().GetTiled(origin.Row, j);
                if (tiled !== null && tiled.IsValidTiled()) {
                    tiled.Marked = true;
                    this.m_markTiledList.push(tiled);
                }
                if (this.m_end2PointTiled === null || this.m_end2PointTiled.Col < tiled.Col) {
                    this.m_end2PointTiled = tiled;
                    }
            }

        } 
        else if (spType === BlockerID.vertical) 
        {
          for (let j = origin.Row; j < TiledMap.MAX_ROW; j++) {
            const tiled = TiledMap.getInstance().GetTiled(j, origin.Col);
            if (tiled !== null && tiled.IsValidTiled()) {
              tiled.Marked = true;
              this.m_markTiledList.push(tiled);
              }
              if (this.m_end1PointTiled === null || this.m_end1PointTiled.Row < tiled.Row) {
                this.m_end1PointTiled = tiled;
              }
            }
      
          for (let j = origin.Row - 1; j >= 0; j--) {
            const tiled = TiledMap.getInstance().GetTiled(j, origin.Col);
            if (tiled !== null && tiled.IsValidTiled()) {
              tiled.Marked = true;
              this.m_markTiledList.push(tiled);
              }
              if (this.m_end2PointTiled === null || this.m_end2PointTiled.Row > tiled.Row) {
                this.m_end2PointTiled = tiled;
              }
            }
        }

        if (this.m_end1PointTiled == null)
        {
            this.m_end1PointTiled = this.m_orign;
        }
        if (this.m_end2PointTiled == null)
        {
            this.m_end2PointTiled = this.m_orign;
        }
    }
}

export class EffectLineCrush extends EffectLineBase {

    m_moveEffectCount: number = 0;
    m_otherTiled: Tiled = null;
    m_spType: BlockerID = BlockerID.none;

    constructor() {
        super(EffectType.LineCrush);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        this.m_orign.CanMoveBlocker.MarkMatch = true;
        this.m_orign.CanMoveBlocker.CrushState = true;
        this.m_orign.CanMoveBlocker.MatchEffectType = this.EffType;
        this.m_spType = this.m_orign.CanMoveBlocker.ID as BlockerID;
        this.m_otherTiled = null;
        if (args != null)
        {
            this.m_otherTiled = args as Tiled;
        }
    }

    public Start(): void {
        super.Start();
    }

    public Play(): void {
        super.Play();
        this.m_moveEffectCount = 0;

        this.m_moveEffectCount++;
        this.InitEndPoint(this.m_spType, this.m_orign);
        let end1PointTiled = this.m_end1PointTiled;
        let end2PointTiled = this.m_end2PointTiled;
        let markTiledList = this.m_markTiledList;

        let iconId = 26;
        if (this.m_spType == BlockerID.vertical)
        {
            iconId = 27;
        }

        AudioManager.Instance.PlaySource("Audio_Match_LineCrusher");

        cc.resources.load("prefab/effect/" + "LineMoveEffect", (err, data: any) =>{
            let moveEffectNode : cc.Node = cc.instantiate(data);

            moveEffectNode.setParent(TiledMap.getInstance().m_effectRoot);
            let spacePos = moveEffectNode.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
            moveEffectNode.setPosition(spacePos);

            moveEffectNode.zIndex = EffectZIndex.Layer2;

            let moveEffectCom: LineMoveEffectCom = moveEffectNode.getComponent(LineMoveEffectCom);
            moveEffectCom.StartMove(this.m_orign, this.GetTarPos1(this.m_spType, this.m_orign), end1PointTiled.WorldPosition, this.GetTarPos2(this.m_spType, this.m_orign), 
                            end2PointTiled.WorldPosition, iconId,this.EndAction.bind(this), this.CheckMatch.bind(this), this.m_spType, markTiledList);

            this.CheckOriginAndOtherTiled();
        });
    }

    CheckOriginAndOtherTiled()
    {
        if (this.m_otherTiled != null && this.m_otherTiled.CanMoveBlocker != null)
        {
            this.m_otherTiled.CanMoveBlocker.Marked = false;
        }
        TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker);
    }

    EndAction()
    {
        this.m_moveEffectCount--;
    }

    public ExecuteFinishCondition(): boolean {
        return this.m_moveEffectCount <= 0;
    }

    public Finish(): void {
        super.Finish();
        this.m_Data.IsSuccess = true;
        this.m_ctrl.Execute();
    }
}

export class EffectSquareLineCrush extends EffectLineBase {
    m_moveEffectCount: number = 0;
    m_spType: BlockerID = BlockerID.none;

    constructor() {
        super(EffectType.SquareLineCrush);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        if (this.m_orign.CanMoveBlocker != null)
        {
            this.m_orign.CanMoveBlocker.MarkMatch = true;
            this.m_orign.CanMoveBlocker.CrushState = true;
            this.m_orign.CanMoveBlocker.MatchEffectType = this.EffType;
        }
        
        if (args != null)
        {
            this.m_spType = args as BlockerID;
        }
    }

    public Start(): void {
        super.Start();
    }

    public Play(): void {
        super.Play();
        this.m_moveEffectCount = 0;

        this.m_moveEffectCount++;
        let iconId = 26;
        if (this.m_spType == BlockerID.vertical)
        {
            iconId = 27;
        }
        this.InitEndPoint(this.m_spType, this.m_orign);
        let end1PointTiled = this.m_end1PointTiled;
        let end2PointTiled = this.m_end2PointTiled;
        let markTiledList = this.m_markTiledList;

        AudioManager.Instance.PlaySource("Audio_Match_LineCrusher");

        cc.resources.load("prefab/effect/" + "LineMoveEffect", (err, data: any) =>{
            let moveEffectNode : cc.Node = cc.instantiate(data);

            moveEffectNode.setParent(TiledMap.getInstance().m_effectRoot);
            let spacePos = moveEffectNode.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
            moveEffectNode.setPosition(spacePos);

            moveEffectNode.zIndex = EffectZIndex.Layer2;

            let moveEffectCom: LineMoveEffectCom = moveEffectNode.getComponent(LineMoveEffectCom);
            moveEffectCom.StartMove(this.m_orign, this.GetTarPos1(this.m_spType, this.m_orign), end1PointTiled.WorldPosition, this.GetTarPos2(this.m_spType, this.m_orign), 
                            end2PointTiled.WorldPosition, iconId, this.EndAction.bind(this), this.CheckMatch.bind(this), this.m_spType, markTiledList);

            this.CheckOriginAndOtherTiled();
        });
    }

    CheckOriginAndOtherTiled()
    {
        if (this.m_orign.CanMoveBlocker != null)
        {
            this.m_orign.CanMoveBlocker.CrushState = false;
            TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker, true, true);
        }
    }

    EndAction()
    {
        this.m_moveEffectCount--;
    }

    public ExecuteFinishCondition(): boolean {
        return this.m_moveEffectCount <= 0;
    }

    public Finish(): void {
        super.Finish();
        this.m_Data.IsSuccess = true;
        this.m_ctrl.Execute();
    }
}

export class EffectLineAndLine extends EffectLineBase {

    m_moveEffectCount: number = 0;
    m_otherTiled: Tiled = null;

    constructor() {
        super(EffectType.LineLine);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        this.m_orign.CanMoveBlocker.MarkMatch = true;
        this.m_orign.CanMoveBlocker.CrushState = true;
        this.m_orign.CanMoveBlocker.MatchEffectType = this.EffType;
        this.m_otherTiled = null;
        if (args != null)
        {
            this.m_otherTiled = args as Tiled;
        }
        this.m_moveEffectCount = 0;
    }

    public Start(): void {
        super.Start();
    }

    public Play(): void {
        super.Play();

        AudioManager.Instance.PlaySource("Audio_Match_LineAndLineCrusher");

        this.m_moveEffectCount++;
        this.InitEndPoint(BlockerID.horizontal, this.m_orign);
        let horizontalEnd1PointTiled = this.m_end1PointTiled;
        let horizontalEnd2PointTiled = this.m_end2PointTiled;
        let horMarkTiledList = [];
        horMarkTiledList.push(...this.m_markTiledList)

        cc.resources.load("prefab/effect/" + "LineMoveEffect", (err, data: any) =>{
            let moveEffectNode : cc.Node = cc.instantiate(data);

            moveEffectNode.setParent(TiledMap.getInstance().m_effectRoot);
            let spacePos = moveEffectNode.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
            moveEffectNode.setPosition(spacePos);

            moveEffectNode.zIndex = EffectZIndex.Layer2;

            let moveEffectCom: LineMoveEffectCom = moveEffectNode.getComponent(LineMoveEffectCom);
            moveEffectCom.StartMove(this.m_orign, this.GetTarPos1(BlockerID.horizontal, this.m_orign), horizontalEnd1PointTiled.WorldPosition, this.GetTarPos2(BlockerID.horizontal, this.m_orign), 
                            horizontalEnd2PointTiled.WorldPosition, 26, this.EndAction.bind(this), this.CheckMatch.bind(this), BlockerID.horizontal, horMarkTiledList);

            TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker);
        });

        this.m_moveEffectCount++;
        this.InitEndPoint(BlockerID.vertical, this.m_orign);
        let verticalEnd1PointTiled = this.m_end1PointTiled;
        let verticalEnd2PointTiled = this.m_end2PointTiled;
        let verticalMarkTiledList = [];
        verticalMarkTiledList.push(...this.m_markTiledList);

        cc.resources.load("prefab/effect/" + "LineMoveEffect", (err, data: any) =>{
            let moveEffectNode : cc.Node = cc.instantiate(data);

            moveEffectNode.setParent(TiledMap.getInstance().m_effectRoot);
            let spacePos = moveEffectNode.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
            moveEffectNode.setPosition(spacePos);

            moveEffectNode.zIndex = EffectZIndex.Layer2;

            let moveEffectCom: LineMoveEffectCom = moveEffectNode.getComponent(LineMoveEffectCom);
            moveEffectCom.StartMove(this.m_orign, this.GetTarPos1(BlockerID.vertical, this.m_orign), verticalEnd1PointTiled.WorldPosition, this.GetTarPos2(BlockerID.vertical, this.m_orign), 
                            verticalEnd2PointTiled.WorldPosition, 27, this.EndAction.bind(this), this.CheckMatch.bind(this), BlockerID.vertical, verticalMarkTiledList);

            TiledMap.getInstance().DestroyBlocker(this.m_otherTiled.CanMoveBlocker);
        });
    }

    EndAction()
    {
        this.m_moveEffectCount--;
    }

    public ExecuteFinishCondition(): boolean {
        return this.m_moveEffectCount <= 0;
    }

    public Finish(): void {
        super.Finish();
        this.m_Data.IsSuccess = true;
        this.m_ctrl.Execute();
    }
}

export class EffectAreaLine extends EffectLineBase {

    m_moveEffectCount: number = 0;
    m_otherTiled: Tiled = null;

    constructor() {
        super(EffectType.AreaLine);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        this.m_orign.CanMoveBlocker.MarkMatch = true;
        this.m_orign.CanMoveBlocker.CrushState = true;
        this.m_orign.CanMoveBlocker.MatchEffectType = this.EffType;
        this.m_otherTiled = null;
        if (args != null)
        {
            this.m_otherTiled = args as Tiled;
        }
    }

    public Start(): void {
        super.Start();
    }

    public Play(): void {
        super.Play();
        this.m_moveEffectCount = 0;

        AudioManager.Instance.PlaySource("Audio_Match_LineAndAreaCrusher");


        for (let i = this.m_orign.Row - 1; i <= this.m_orign.Row + 1; i++) {
            let tiled = TiledMap.getInstance().GetTiled(i, this.m_orign.Col);
            if (tiled == null || !tiled.IsValidTiled())
            {
                continue;
            }

            this.m_moveEffectCount++;
            this.InitEndPoint(BlockerID.horizontal, tiled);
            let end1PointTiled = this.m_end1PointTiled;
            let end2PointTiled = this.m_end2PointTiled;
            let markTiledList = [];
            markTiledList.push(...this.m_markTiledList);

            cc.resources.load("prefab/effect/" + "LineMoveEffect", (err, data: any) =>{
                let moveEffectNode : cc.Node = cc.instantiate(data);
    
                moveEffectNode.setParent(TiledMap.getInstance().m_effectRoot);
                let spacePos = moveEffectNode.parent.convertToNodeSpaceAR(tiled.WorldPosition);
                moveEffectNode.setPosition(spacePos);

                moveEffectNode.zIndex = EffectZIndex.Layer2;
    
                let moveEffectCom: LineMoveEffectCom = moveEffectNode.getComponent(LineMoveEffectCom);
                moveEffectCom.StartMove(tiled, this.GetTarPos1(BlockerID.horizontal, tiled), end1PointTiled.WorldPosition, this.GetTarPos2(BlockerID.horizontal, tiled), 
                                end2PointTiled.WorldPosition, 26, this.EndAction.bind(this), this.CheckMatch.bind(this), BlockerID.horizontal, markTiledList);
    
            });
        }

        for (let i = this.m_orign.Col - 1; i <= this.m_orign.Col + 1; i++) {
            let tiled = TiledMap.getInstance().GetTiled(this.m_orign.Row, i);
            if (tiled == null || !tiled.IsValidTiled())
            {
                continue;
            }

            this.m_moveEffectCount++;
            this.InitEndPoint(BlockerID.vertical, tiled);
            let end1PointTiled = this.m_end1PointTiled;
            let end2PointTiled = this.m_end2PointTiled;
            let markTiledList = [];
            markTiledList.push(...this.m_markTiledList);

            cc.resources.load("prefab/effect/" + "LineMoveEffect", (err, data: any) =>{
                let moveEffectNode : cc.Node = cc.instantiate(data);

                moveEffectNode.setParent(TiledMap.getInstance().m_effectRoot);
                let spacePos = moveEffectNode.parent.convertToNodeSpaceAR(tiled.WorldPosition);
                moveEffectNode.setPosition(spacePos);

                moveEffectNode.zIndex = EffectZIndex.Layer2;

                let moveEffectCom: LineMoveEffectCom = moveEffectNode.getComponent(LineMoveEffectCom);
                moveEffectCom.StartMove(tiled, this.GetTarPos1(BlockerID.vertical, tiled), end1PointTiled.WorldPosition, this.GetTarPos2(BlockerID.vertical, tiled), 
                                end2PointTiled.WorldPosition, 27, this.EndAction.bind(this), this.CheckMatch.bind(this), BlockerID.vertical, markTiledList);

            });
        }

        TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker);
        TiledMap.getInstance().DestroyBlocker(this.m_otherTiled.CanMoveBlocker);
    }

    EndAction()
    {
        this.m_moveEffectCount--;
    }

    public ExecuteFinishCondition(): boolean {
        return this.m_moveEffectCount <= 0;
    }

    public Finish(): void {
        super.Finish();
        this.m_Data.IsSuccess = true;
        this.m_ctrl.Execute();
    }
}

class EffectSquareBase extends EffectBase {
    m_moveEffectCount: number = 0;
    m_flyTotalCount = 0;

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);
        this.m_moveEffectCount = 0;

        if (this.m_orign.CanMoveBlocker != null)
        {
            this.m_orign.CanMoveBlocker.MarkMatch = true;
            this.m_orign.CanMoveBlocker.CrushState = true;
            this.m_orign.CanMoveBlocker.MatchEffectType = this.EffType;
        }
    }

    public Start(): void {
        super.Start();
    }

    public Play(): void {
        super.Play();
        this.CheckMatch();

        let iconId = 0;
        if (this.m_orign.CanMoveBlocker != null)
        {
            iconId = this.m_orign.CanMoveBlocker.TableData.Data.IconId;
        }

        for (let i = 0; i < this.m_flyTotalCount; i++) {
            let index = i;
            cc.resources.load("prefab/effect/" + "SuqareFly", (err, data: any) =>{
                let moveEffectNode : cc.Node = cc.instantiate(data);

                moveEffectNode.setParent(TiledMap.getInstance().m_effectRoot);
                let spacePos = moveEffectNode.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
                moveEffectNode.setPosition(spacePos);

                moveEffectNode.zIndex = EffectZIndex.Layer2;

                let flyCom: SquareFlyCom = moveEffectNode.getComponent(SquareFlyCom);

                let targetTiled = TiledMap.getInstance().GetSquareTargetTiled();
                flyCom.InitSquareData(this.m_orign, null, targetTiled, this.EffType, index, (tiled: Tiled) => { this.OnArrivedAction(tiled); }, iconId);
            });
        }
    }

    OnArrivedAction(tiled: Tiled)
    {
        this.m_matchItems.length = 0;

        this.CheckValidBlockers(tiled, this.m_matchItems);
        TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);

        this.m_flyTotalCount--;

        AudioManager.Instance.PlaySource("Audio_Match_Rocket_Explode");
    }

    public ExecuteFinishCondition(): boolean {
        return this.m_flyTotalCount <= 0;
    }

    public Finish(): void {
        super.Finish();
        this.m_Data.IsSuccess = true;

        this.m_ctrl.Execute();
    }

    CheckMatch()
    {
        this.CheckValidBlockers(this.m_orign, this.m_matchItems);
        this.CheckValidBlockers(this.m_orign.GetNeighborTop(), this.m_matchItems);
        this.CheckValidBlockers(this.m_orign.GetNeighborBottom(), this.m_matchItems);
        this.CheckValidBlockers(this.m_orign.GetNeighborLeft(), this.m_matchItems);
        this.CheckValidBlockers(this.m_orign.GetNeighborRight(), this.m_matchItems);
    }
}

export class EffectSquareCrush extends EffectSquareBase {

    constructor() {
        super(EffectType.SquareCrush);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);
        this.m_flyTotalCount = 1;
    }

    public Play(): void {
        super.Play();

        cc.resources.load("prefab/effect/SquareEffect", (err, data: any) =>{
            var effect = cc.instantiate(data);

            effect.setParent(TiledMap.getInstance().m_effectRoot);
            let spacePos = effect.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
            effect.setPosition(spacePos);

        });

        TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker);
        TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);
    }
}

export class EffectSquareAndSquare extends EffectSquareBase {

    m_otherTiled: Tiled = null;

    constructor() {
        super(EffectType.SquareAndSquare);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        this.m_flyTotalCount = 3;

        this.m_otherTiled = args as Tiled;
        this.m_otherTiled.CanMoveBlocker.MarkMatch = true;
        this.m_otherTiled.CanMoveBlocker.CrushState = true;
        this.m_otherTiled.CanMoveBlocker.MatchEffectType = this.EffType;
    }

    CheckMatch()
    {
        super.CheckMatch();

        this.CheckValidBlockers(this.m_orign.GetNeighborLeftTop(), this.m_matchItems);
        this.CheckValidBlockers(this.m_orign.GetNeighborLeftBottom(), this.m_matchItems);
        this.CheckValidBlockers(this.m_orign.GetNeighborRightTop(), this.m_matchItems);
        this.CheckValidBlockers(this.m_orign.GetNeighborRightBottom(), this.m_matchItems);
    }

    public Play(): void {
        super.Play();

        cc.resources.load("prefab/effect/SquareBigEffect", (err, data: any) =>{
            var effect = cc.instantiate(data);

            effect.setParent(TiledMap.getInstance().m_effectRoot);
            let spacePos = effect.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
            effect.setPosition(spacePos);

            setTimeout(function () {
                effect.destroy();
              }.bind(this), 1500);
        });

        TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker);
        TiledMap.getInstance().DestroyBlocker(this.m_otherTiled.CanMoveBlocker);
        TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);
    }
}

export class EffectSquareLineCompose extends EffectSquareBase
{
    m_otherTiled: Tiled = null;
    m_spType: BlockerID = BlockerID.none;

    constructor() {
        super(EffectType.SquareLineCompose);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        this.m_flyTotalCount = 1;

        this.m_otherTiled = args as Tiled;
        this.m_otherTiled.CanMoveBlocker.MarkMatch = true;
        this.m_otherTiled.CanMoveBlocker.CrushState = true;
        this.m_otherTiled.CanMoveBlocker.MatchEffectType = this.EffType;

        if (this.m_orign.CanMoveBlocker.IsLineBlocker())
        {
            this.m_spType = this.m_orign.CanMoveBlocker.ID;
        }
        else
        {
            this.m_spType = this.m_otherTiled.CanMoveBlocker.ID;
        }
    }

    public Play(): void {

        this.CheckMatch();

        let iconId = 0;
        if (this.m_orign.CanMoveBlocker != null)
        {
            iconId = this.m_orign.CanMoveBlocker.TableData.Data.IconId;
        }

        cc.resources.load("prefab/effect/" + "SuqareFly", (err, data: any) =>{
            let moveEffectNode : cc.Node = cc.instantiate(data);

            moveEffectNode.setParent(TiledMap.getInstance().m_effectRoot);
            let spacePos = moveEffectNode.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
            moveEffectNode.setPosition(spacePos);

            moveEffectNode.zIndex = EffectZIndex.Layer2;

            let flyCom: SquareFlyCom = moveEffectNode.getComponent(SquareFlyCom);

            let targetTiled = TiledMap.getInstance().GetSquareTargetTiled();
            flyCom.InitSquareData(this.m_orign, this.m_otherTiled, targetTiled, this.EffType, 0, (tiled: Tiled) => { this.OnArrivedAction(tiled); }, iconId);

            TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker);
            TiledMap.getInstance().DestroyBlocker(this.m_otherTiled.CanMoveBlocker);
            TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);
        });
    }

    OnArrivedAction(tiled: Tiled)
    {
        let m_effData = new EffectData();
        let ctrl = EffectControllerFactory.Instance.PopController(() => 
        { 
            this.m_Data.IsSuccess = true;
            this.m_ctrl.Execute() 
        });
        ctrl.CreateEffect(EffectType.SquareLineCrush, tiled, m_effData, this.m_spType);
        ctrl.Execute();
    }
}

export class EffectSquareAreaCompose extends EffectSquareBase
{
    m_otherTiled: Tiled = null;
    m_spType: BlockerID = BlockerID.none;

    constructor() {
        super(EffectType.SquareAreaCompose);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        this.m_flyTotalCount = 1;

        this.m_otherTiled = args as Tiled;
        this.m_otherTiled.CanMoveBlocker.MarkMatch = true;
        this.m_otherTiled.CanMoveBlocker.CrushState = true;
        this.m_otherTiled.CanMoveBlocker.MatchEffectType = this.EffType;

        if (this.m_orign.CanMoveBlocker.IsLineBlocker())
        {
            this.m_spType = this.m_orign.CanMoveBlocker.ID;
        }
        else
        {
            this.m_spType = this.m_otherTiled.CanMoveBlocker.ID;
        }
    }

    public Play(): void {

        this.CheckMatch();

        let iconId = 0;
        if (this.m_orign.CanMoveBlocker != null)
        {
            iconId = this.m_orign.CanMoveBlocker.TableData.Data.IconId;
        }

        cc.resources.load("prefab/effect/" + "SuqareFly", (err, data: any) =>{
            let moveEffectNode : cc.Node = cc.instantiate(data);

            moveEffectNode.setParent(TiledMap.getInstance().m_effectRoot);
            let spacePos = moveEffectNode.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
            moveEffectNode.setPosition(spacePos);

            moveEffectNode.zIndex = EffectZIndex.Layer2;

            let flyCom: SquareFlyCom = moveEffectNode.getComponent(SquareFlyCom);

            let targetTiled = TiledMap.getInstance().GetSquareTargetTiled();
            flyCom.InitSquareData(this.m_orign, this.m_otherTiled, targetTiled, this.EffType, 0, (tiled: Tiled) => { this.OnArrivedAction(tiled); }, iconId);

            TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker);
            TiledMap.getInstance().DestroyBlocker(this.m_otherTiled.CanMoveBlocker);
            TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);
        });
    }

    OnArrivedAction(tiled: Tiled)
    {
        let m_effData = new EffectData();
        let ctrl = EffectControllerFactory.Instance.PopController(() => 
        { 
            this.m_Data.IsSuccess = true;
            this.m_ctrl.Execute() 
        });
        ctrl.CreateEffect(EffectType.SquareAreaCrush, tiled, m_effData, this.m_spType);
        ctrl.Execute();
    }
}

export class EffectSquareAndArea extends EffectSquareBase
{
    m_otherTiled: Tiled = null;

    constructor() {
        super(EffectType.SquareAreaCompose);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        this.m_flyTotalCount = 1;

        this.m_otherTiled = args as Tiled;
        this.m_otherTiled.CanMoveBlocker.MarkMatch = true;
        this.m_otherTiled.CanMoveBlocker.CrushState = true;
        this.m_otherTiled.CanMoveBlocker.MatchEffectType = this.EffType;
    }

    public Play(): void {
        this.CheckMatch();

        let iconId = 0;
        if (this.m_orign.CanMoveBlocker != null)
        {
            iconId = this.m_orign.CanMoveBlocker.TableData.Data.IconId;
        }

        cc.resources.load("prefab/effect/" + "SuqareFly", (err, data: any) =>{
            let moveEffectNode : cc.Node = cc.instantiate(data);

            moveEffectNode.setParent(TiledMap.getInstance().m_effectRoot);
            let spacePos = moveEffectNode.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
            moveEffectNode.setPosition(spacePos);

            moveEffectNode.zIndex = EffectZIndex.Layer2;

            let flyCom: SquareFlyCom = moveEffectNode.getComponent(SquareFlyCom);

            let targetTiled = TiledMap.getInstance().GetSquareTargetTiled();
            flyCom.InitSquareData(this.m_orign, this.m_otherTiled, targetTiled, this.EffType, 0, (tiled: Tiled) => { this.OnArrivedAction(tiled); }, iconId);

            TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker);
            TiledMap.getInstance().DestroyBlocker(this.m_otherTiled.CanMoveBlocker);
            TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);
        });

    }

    OnArrivedAction(tiled: Tiled)
    {
        super.OnArrivedAction(tiled);
        
    }
}

class EffectSameColorInterface extends EffectBase {
    private readonly LESS_COUNT: number = 3;
    private readonly INIT_TIME: number = 0.3;
    protected readonly m_SameColorStandbyAudio: number = 64;
    protected readonly m_SameColorCrushAudio: number = 69;

    protected m_samecolor: SameColorBlocker | null = null;
    protected m_isSameColorOrigin: boolean = false;
    protected m_count: number = 0;
    protected m_srcBlocker: Blocker | null = null;
    protected m_otherTiled: Tiled | null = null;
    protected m_mostId: number = 0;
    protected m_tiledlst: Tiled[] = [];
    protected m_tempTiledLst: Tiled[] = [];
    protected m_sameColorCrusherStandbyId = 0;

    constructor(type: EffectType) {
        super(type);
    }

    Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);
        this.m_isSameColorOrigin = false;
        if (this.m_orign.CanMoveBlocker.IsSameColor()) {
            this.m_isSameColorOrigin = true;
        }
        this.m_srcBlocker = null;
        this.m_otherTiled = null;
        if (args != null) {
            this.m_srcBlocker = args as Blocker;
            this.m_otherTiled = this.m_srcBlocker.SelfTiled;
        }
        this.m_samecolor = null;
        this.m_count = 0;
        FSM.getInstance().MovingCanMatch = false;
        this.m_tiledlst = [];
        this.m_tempTiledLst = [];
        this.m_sameColorCrusherStandbyId = 0;
    }

    Start(): void {
        super.Start();
        if (this.m_isSameColorOrigin) {
            this.m_samecolor = this.m_orign.CanMoveBlocker as SameColorBlocker;
        } else {
            this.m_samecolor = this.m_srcBlocker as SameColorBlocker;
        }
        this.m_samecolor.PlayReadyAnim();

        cc.resources.load("audio/Audio_Match_SameColorCrusherStandby", cc.AudioClip, null, (err, clip: any) =>{
            this.m_sameColorCrusherStandbyId = cc.audioEngine.playEffect(clip, true);
        });

        // AudioManager.Instance.PlaySourceLoop("Audio_Match_SameColorCrusherStandby");
    }

    InitWaitTimeByLessCount(): void {
        if (this.m_count < this.LESS_COUNT) {
            this.WaitTime = this.INIT_TIME;
        }
    }

    ExecutePlayCondition(): boolean {
        this.WaitTime -= TimerManager.Instance.GetDeltaTime();
        return this.WaitTime <= 0;
    }

    ExecuteFinishCondition(): boolean {
        if (this.m_count <= 0) {
            this.WaitTime -= TimerManager.Instance.GetDeltaTime();
        }
        return this.m_count <= 0 && this.WaitTime <= 0;
    }

    Finish(): void {
        super.Finish();
        this.m_Data.IsSuccess = true;
        FSM.getInstance().MovingCanMatch = true;

        cc.audioEngine.stopEffect(this.m_sameColorCrusherStandbyId);

        // AudioManager.Instance.StopSourceLoop();
        AudioManager.Instance.PlaySource("Audio_Match_SameColorCrusherExplode");
    }
}

export class EffectSameColorBase extends EffectSameColorInterface {

    constructor() {
        super(EffectType.SameColorBase);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        this.m_orign.CanMoveBlocker.MarkMatch = true;
        this.m_orign.CanMoveBlocker.CrushState = true;
        this.m_orign.CanMoveBlocker.MatchEffectType = this.EffType;
    }

    public Start(): void {
        super.Start();

        if (this.m_srcBlocker != null)
        {
            this.m_mostId = this.m_srcBlocker.Color;
        }
        else
        {
            this.m_mostId = TiledMap.getInstance().GetMostBaseID();
        }
        if (this.m_orign.CanMoveBlocker != null)
        {
            this.m_orign.CanMoveBlocker.Color = this.m_mostId;
            this.m_orign.CanMoveBlocker.SetActive(false);
        }


    }

    MatchCheck()
    {
        let lst = TiledMap.getInstance().GetBlocksByBaseID(this.m_mostId);
        for (let i = 0; i < lst.length; i++) {
            const blocker = lst[i];
            if (blocker.CurHp > 0)
            {
                if (!this.m_tiledlst.includes(blocker.SelfTiled))
                {
                    this.CheckValidBlockers(blocker.SelfTiled, this.m_matchItems);

                    blocker.SelfTiled.Marked = true;

                    this.m_tiledlst.push(blocker.SelfTiled);
                    this.m_tempTiledLst.push(blocker.SelfTiled);
                }
            }
        }
    }

    CreateEffect()
    {
        this.m_count += this.m_tempTiledLst.length;
        this.InitWaitTimeByLessCount();

        while(this.m_tempTiledLst.length > 0)
        {
            let index = TiledMap.getInstance().RandomRange(0, this.m_tempTiledLst.length - 1);
            let temptiled: Tiled = this.m_tempTiledLst[index];
            this.m_tempTiledLst.splice(index, 1);

            let waitTime = this.m_tempTiledLst.length * 0.1;

            cc.resources.load("prefab/effect/SameColorEmit", (err, data: any) =>
            {
                let moveEffectNode = cc.instantiate(data);

                moveEffectNode.setParent(TiledMap.getInstance().m_effectRoot);
                let spacePos = moveEffectNode.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
                moveEffectNode.setPosition(spacePos);

                moveEffectNode.zIndex = EffectZIndex.Layer1;

                let com: SameColorEmitCom = moveEffectNode.getComponent(SameColorEmitCom);
                com.MoveTo(temptiled, waitTime, (tiled: Tiled) => 
                {
                    if (temptiled.CanMoveBlocker != null)
                    {
                        temptiled.CanMoveBlocker.PlaySameColorShake();
                    }
                    
                    this.m_count--;
                    if (this.m_count <= 0)
                    {
                        this.MatchCheck();
                        if (this.m_tempTiledLst.length > 0)
                        {
                            this.CreateEffect();
                        }
                    }
                });
            });
        }

        this.WaitTime = 0.3;
    }

    public Play(): void {
        super.Play();
        this.MatchCheck();
        this.CreateEffect();
    }

    public Finish(): void {
        super.Finish();

        this.CheckBottomMatch(this.m_orign.CanMoveBlocker, this.m_matchItems);
        this.CheckBottomMatch(this.m_srcBlocker, this.m_matchItems);

        TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker);
        TiledMap.getInstance().DestroyBlocker(this.m_srcBlocker);
        TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);

        for (let i = 0; i < this.m_tiledlst.length; i++) {
            const tiled = this.m_tiledlst[i];
            tiled.Marked = false;
            tiled.CheckTriggerFall();
        }

        this.m_ctrl.Execute();
    }
}

export class EffectSameColorOtherEffectBase extends EffectSameColorInterface
{
    createEffectBlockerId = BlockerID.none;
    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);

        this.SetOriginAndSrcBlockerState();
        this.m_mostId = TiledMap.getInstance().GetMostBaseID();
    }

    public Start(): void {
        super.Start();
    }

    public Play(): void {
        super.Play();
        this.MatchCheck();
        this.CreateEffect();
    }

    public Finish(): void {
        super.Finish();

        if (this.m_samecolor != null)
        {
            this.m_samecolor.MatchEffectType = this.EffType;
        }

        this.AddSrcBlockerToTiledList();
        TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);
        TiledMap.getInstance().DestroyBlocker(this.m_samecolor);

        for (let i = 0; i < this.m_tiledlst.length; i++) {
            const tiled = this.m_tiledlst[i];
            tiled.Marked = false;
            tiled.CheckTriggerFall();
        }

        let exec = new IntervalExecEffect(this.m_tiledlst, this.OnEffectCtrlCallback.bind(this));
        exec.Start();
    }
    
    SetOriginAndSrcBlockerState(): void {
        if (this.m_isSameColorOrigin) {
            this.m_orign.CanMoveBlocker.MarkMatch = true;
            this.m_orign.CanMoveBlocker.CrushState = true;

            if (this.m_srcBlocker !== null) {
                this.m_srcBlocker.MarkMatch = true;
                this.m_srcBlocker.CrushState = true;
                this.m_srcBlocker.SetActive(false);
            }
        } else {
            if (this.m_srcBlocker !== null) {
                this.m_srcBlocker.MarkMatch = true;
                this.m_srcBlocker.CrushState = true;
            }

            this.m_orign.CanMoveBlocker.MarkMatch = true;
            this.m_orign.CanMoveBlocker.CrushState = true;
            this.m_orign.CanMoveBlocker.SetActive(false);
        }
    }

    AddSrcBlockerToTiledList(): void {
        if (this.m_isSameColorOrigin) {
            if (this.m_otherTiled !== null) {
                this.m_otherTiled.SwitchCanMoveBlocker(this.m_orign, false);
            }
        }

        if (this.m_orign.CanMoveBlocker !== null) {
            this.m_orign.CanMoveBlocker.MarkMatch = false;
            this.m_orign.CanMoveBlocker.CrushState = false;
            this.m_orign.CanMoveBlocker.SetActive(true);
        }

        this.m_tiledlst.push(this.m_orign);
    }

    MatchCheck() {
        this.m_tempTiledLst = [];
        TiledMap.getInstance().GetTiledsByBaseID(this.m_mostId, this.m_tempTiledLst);

        for (let i = this.m_tempTiledLst.length - 1; i >= 0; i--) {
            const tiled: Tiled = this.m_tempTiledLst[i];

            if (this.m_tiledlst.includes(tiled)) {
                this.m_tempTiledLst.splice(i, 1);
            }
        }

        for (let i = 0; i < this.m_tempTiledLst.length; i++) {
            const tiled: Tiled = this.m_tempTiledLst[i];
            tiled.CanMoveBlocker?.DecrHP();
            this.m_tiledlst.push(tiled);
            tiled.Marked = true;
        }
    }

    CreateEffect()
    {
        this.m_count += this.m_tempTiledLst.length;
        this.InitWaitTimeByLessCount();

        while(this.m_tempTiledLst.length > 0)
        {
            let index = TiledMap.getInstance().RandomRange(0, this.m_tempTiledLst.length - 1);
            let temptiled: Tiled = this.m_tempTiledLst[index];
            this.m_tempTiledLst.splice(index, 1);
            
            let waitTime = this.m_tempTiledLst.length * 0.1;

            cc.resources.load("prefab/effect/SameColorEmit", (err, data: any) =>
            {
                let moveEffectNode = cc.instantiate(data);

                moveEffectNode.setParent(TiledMap.getInstance().m_effectRoot);
                let spacePos = moveEffectNode.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
                moveEffectNode.setPosition(spacePos);

                moveEffectNode.zIndex = EffectZIndex.Layer1;

                let com: SameColorEmitCom = moveEffectNode.getComponent(SameColorEmitCom);
                com.MoveTo(temptiled, waitTime, (tiled: Tiled) => 
                {
                    if (temptiled.TopBlocker() != null)
                    {
                        this.m_matchItems.push(temptiled.TopBlocker());
                        temptiled.CanMoveBlocker?.PlaySameColorShake();
                    }
                    else
                    {
                        this.RefreshCreateEffectBlockerId();
                        temptiled.UpdateToSpecial(this.createEffectBlockerId, BornEffect.samecolor, false, true, false, false);
                        temptiled.CanMoveBlocker.Marked = true;
                    }

                    
                    this.m_count--;
                    if (this.m_count <= 0)
                    {
                        this.MatchCheck();
                        if (this.m_tempTiledLst.length > 0)
                        {
                            this.CreateEffect();
                        }
                    }
                });
            });

            
        }

        this.WaitTime = 0.3;
    }

    RefreshCreateEffectBlockerId()
    {

    }
}

export class EffectSameColorLine extends EffectSameColorOtherEffectBase {

    constructor() {
        super(EffectType.SameColorLine);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);
    }

    RefreshCreateEffectBlockerId()
    {
        this.createEffectBlockerId = TiledMap.getInstance().GetRandomLineBlocker();
    }
}

export class EffectSameColorArea extends EffectSameColorOtherEffectBase {

    constructor() {
        super(EffectType.SameColorArea);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);
        this.createEffectBlockerId = BlockerID.area;
    }
}

export class EffectSameColorSquare extends EffectSameColorOtherEffectBase {

    constructor() {
        super(EffectType.SameColorSquare);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);
        this.createEffectBlockerId = BlockerID.squareid;
    }
}

export class EffectSameColorAndSameColor extends EffectBase
{
    m_srcBlocker: Blocker = null;

    constructor() {
        super(EffectType.SameColorAndSameColor);
    }

    public Reset(orign: Tiled, callback: (success: boolean, effect: EffectBase) => void, check: EffectData, args: any): void {
        super.Reset(orign, callback, check, args);
        this.m_orign.CanMoveBlocker.MarkMatch = true;
        this.m_orign.CanMoveBlocker.CrushState = true;
        this.m_orign.CanMoveBlocker.MatchEffectType = this.EffType;
        this.m_orign.CanMoveBlocker.SetActive(false);

        this.m_srcBlocker = args as Blocker;
        this.m_srcBlocker.MarkMatch = true;
        this.m_srcBlocker.CrushState = true;
        this.m_srcBlocker.MatchEffectType = this.EffType;
        this.m_srcBlocker.SetActive(false);

        FSM.getInstance().MovingCanMatch = false;
    }

    public Start(): void {
        super.Start();
        this.WaitTime = 1;

        AudioManager.Instance.PlaySource("Audio_Match_SameColorCrusherBoom");

        TiledMap.getInstance().SameColorTriggeringCount++;

        cc.resources.load("prefab/effect/SameColorChangeEffect", (err, data: any) =>{
            let effect: cc.Node = cc.instantiate(data);

            effect.setParent(TiledMap.getInstance().m_effectRoot);
            let spacePos = effect.parent.convertToNodeSpaceAR(this.m_orign.WorldPosition);
            effect.setPosition(spacePos);

            effect.zIndex = EffectZIndex.Layer2;

            setTimeout(function () {
                effect.destroy();
              }.bind(this), 2000);
        });
    }

    public Play(): void {
        super.Play();

        for (let i = 0; i < TiledMap.getInstance().TiledArray.length; i++) {
            const element = TiledMap.getInstance().TiledArray[i];
            if (element.IsValidTiled())
            {
                this.CheckValidBlockers(element, this.m_matchItems);
            }
        }

        TiledMap.getInstance().DelayDestroyBlockers(this.m_matchItems);
        TiledMap.getInstance().DestroyBlocker(this.m_orign.CanMoveBlocker);
        TiledMap.getInstance().DestroyBlocker(this.m_srcBlocker);

        this.WaitTime = 0.3;
    }

    public Finish(): void {
        super.Finish();

        FSM.getInstance().MovingCanMatch = true;
        TiledMap.getInstance().SameColorTriggeringCount--;

        this.m_ctrl.Execute();
    }
}
