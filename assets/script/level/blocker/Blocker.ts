// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../../Game";
import { Utils } from "../../tools/Utils";
import { FirstActionType, BlockerData } from "../../table/BlockTable";
import { BornEffect, Tiled } from "../tiledmap/Tiled";
import { TiledMap } from "../tiledmap/TiledMap";
import BaseBlockerCom from "./BaseBlockerCom";
import BlockerCom from "./BlockerCom";
import { BlockLayer, BlockSubType, BlockType, BlockerClassType, BlockerID, BlockerManager } from "./BlockerManager"
import { ColorManager } from "./ColorManager";
import { EffectType } from "../effect/EffectController";
import { StateFactory } from "../fsm/StateFactory";
import { FSStateType } from "../fsm/FSM";
import { Direction } from "../data/LevelScriptableData";
import { TimerData, TimerManager, TimerType } from "../../tools/TimerManager";
import { FallingManager } from "../drop/FallingManager";
import { FSAdpater } from "../fsm/FSBase";

export class Blocker {
    ClassType: BlockerClassType = BlockerClassType.None;

    IsDestroy: boolean = false;
    ID: number = 0;
    CurHp: number = 0;
    m_parentId: number = -1;
    m_bufCount: number = 0;
    m_blocker: cc.Node = null;
    m_blockerCom: BlockerCom = null;
    m_mono: cc.Node = null;
    m_AttributeState: number = 0;
    m_prefabName: string = '';
    TableData: BlockerData = null;
    Color: number = 0;
    SelfTiled: Tiled = null;
    MarkMatch: boolean = false;
    CrushState: boolean = false;
    Marked: boolean = false;
    Falling: boolean = false;
    IsSwitching: boolean = false;
    IsAlreadyCheckMatch: boolean = false;
    MatchGuid: number = 0;
    MatchEffectType: EffectType = EffectType.None;
    IsTriggerEffect: boolean = false;

    SpecialParent: cc.Node  = null;
    BornEffect: BornEffect = BornEffect.none;
    ExtraPosition: cc.Vec2 = cc.Vec2.ZERO;

    get LocalPosition()
    {
        // if (this.m_blocker == null)
        // {
        //     cc.log(`match3 this.m_blocker == null row = ${this.SelfTiled.Row} col = ${this.SelfTiled.Col}`);
        // }
        return this.m_blocker.getPosition();
    }
    set LocalPosition(position: cc.Vec2)
    {
        this.m_blocker.setPosition(position);
    }

    get WorldPosition()
    {
        const worldPositionAR = this.m_blocker.convertToWorldSpaceAR(cc.Vec2.ZERO);
        return worldPositionAR;
    }

    // set position (position: cc.Vec2)
    // {
    //     const worldPositionAR = this.m_blocker.convertToNodeSpaceAR(position);
    //     this.m_blocker.setPosition(worldPositionAR);
    // }

    // 构造函数
    constructor(id: number) {
        this.ID = id;
        this.Init();
    }

    // 重生函数
    public Reborn(id: number, parent: number): void {
        this.ID = id;
        this.Init();
    }

    public Init(): void {
        this.Color = -1;
        this.CurHp = 1;
        this.m_parentId = 0;
        this.m_bufCount = 0;
        this.m_blocker = null;
        this.MarkMatch = false;
        this.CrushState = false;
        this.Marked = false;
        this.Falling = false;
        this.IsDestroy = false;
        this.SpecialParent = null;
    }

    public Build(data: BlockerData | null = null): void {
        this.TableData = Game.GetBlockData(this.ID);
        this.Color = ColorManager.IsBaseColor(this.ID) ? this.ID : this.TableData.Data.Color;
        this.m_parentId = this.TableData.Data.ParentId;
        this.m_bufCount = 0;
        this.CurHp = this.TableData.Data.HP;
        this.InitPrefabName();
        this.CreateGameObject();
        // this.m_mono.box.enabled = false;
        // if (this.CanMove()) {
        //     this.m_mono.box.enabled = true;
        // }
    }

    protected InitPrefabName(): void {
        this.m_prefabName = this.TableData.Data.PerfabName;
    }

    protected OnBorning(): void {
        this.SetActive(true);
        this.OnCreated();
    }
    SetActive(act: boolean, isPush: boolean = false) {
        if (act)
        {
            Utils.SetNodeActive(this.m_blocker, true);
            if (this.SpecialParent != null)
            {
                this.m_blocker.setPosition(cc.Vec2.ZERO);
            }
            else
            {
                this.m_blocker.setPosition(this.SelfTiled.LocalPosition);
            }
            return;
        }
        
        Utils.SetNodeActive(this.m_blocker, false);
    }

    protected OnCreated(): void {

    }

    protected CreateGameObject(): void {
        let blocker = BlockerManager.getInstance().Pop(this.m_prefabName);
        if (blocker == null)
        {
            Game.LoadingAssetCount++;
            cc.resources.load("prefab/blocker/"+ this.m_prefabName, (err, data: any) =>{
                this.m_blocker = cc.instantiate(data);
                this.OnGoLoaded();
                Game.LoadingAssetCount--;
            })
        }
        else
        {
            this.m_blocker = blocker;
            this.OnGoLoaded();
        }
    }

    private OnGoLoaded()
    {
        if (this.SpecialParent != null)
        {
            this.m_blocker.setParent(this.SpecialParent);
        }
        else
        {
            this.m_blocker.setParent(TiledMap.getInstance().m_blockerRoot);
        }
        
        this.m_blocker.name = this.SelfTiled.Row + "_" + this.SelfTiled.Col + "_" + this.ID;
        this.m_blockerCom = this.m_blocker.getComponent(BlockerCom);
        this.OnBorning();
    }
    
    static IsMagician(id: number) : boolean
    {
        if (id === BlockerID.magician_a_id ||
            id === BlockerID.magician_b_id ||
            id === BlockerID.magician_c_id ||
            id === BlockerID.magician_d_id ||
            id === BlockerID.magician_e_id)
            {
                return true;
            }
        return false;
    }

    public GetBlockType(): BlockType {
        return this.TableData.Data.Type;
    }

    public CanMatch(): boolean {
        return this.TableData.HasAction(FirstActionType.Match) || this.TableData.HasAction(FirstActionType.PassiveMatch);
    }

    public CanMove(): boolean {
        return this.TableData.HasAction(FirstActionType.Move);
    }

    public IsSticky(): boolean {
        return this.TableData.HasAction(FirstActionType.Sticky);
    }

    public ForbidMove(): boolean {
        return this.ForbidSwitch() && this.ForbidGravity() && !this.IsDestroy;
    }

    public ForbidSwitch(): boolean {
        return this.TableData.HasAction(FirstActionType.ForbidSwitch);
    }

    public ForbidGravity(): boolean {
        return this.TableData.HasAction(FirstActionType.ForbidGravity);
    }

    public ActiveMatch(): boolean {
        return this.TableData.HasAction(FirstActionType.Match);
    }

    public PassiveMatch(): boolean {
        return this.TableData.HasAction(FirstActionType.PassiveMatch);
    }

    public NearMatch(): boolean {
        return this.TableData.HasAction(FirstActionType.NearMatch);
    }


    public CanRecycle(): boolean {
        return this.TableData.HasAction(FirstActionType.Recycle);
    }

    public Occupy(): boolean {
        return this.TableData.HasAction(FirstActionType.Occupy) && !this.IsDestroy;
    }

    public IsMarked(): boolean {
        return this.MarkMatch || this.CrushState || this.Marked;
    }
    
    public IsCanSwitch(): boolean {
        // DebugView.e("MarkMatch:" + MarkMatch + ",CrushState:" + CrushState + ",Marked:" + Marked + ",Falling:" + Falling);
        return !this.IsMarked() && !this.Falling;
    }

    PringLog()
    {
        cc.log(`match3 falling = ${this.Falling} marked = ${this.Marked} markmatch = ${this.MarkMatch} crushstate = ${this.CrushState} isDestroy = ${this.IsDestroy} IsSwitching = ${this.IsSwitching}`);
    }

    OnTriggerEffect(): boolean {
        if (this.IsNoColor()) {
            if (!this.CrushState) {
                // this.StopBornAnimation();
                const wrap = StateFactory.Instance.Create(FSStateType.enAdpater) as FSAdpater;
                wrap.StartTriggerEffect(this.SelfTiled);
                return true;
            }
        }
        return false;
    }

    IsNoColor()
    {
        if (this.TableData.Data.SubType == BlockSubType.Special)
        {
            return true;
        }
        return false;
    }

    IsIngredient()
    {
        return false;
    }

    IsJelly()
    {
        return false;
    }
    
    IsBottomBlocker()
    {
        return false;
    }

    IsLineBlocker()
    {
        return LineBlocker.IsLineBlocker(this.ID);
    }

    IsAreaBlocker()
    {
        return AreaBlocker.IsAreaBlocker(this.ID);
    }

    IsSameColor()
    {
        return SameColorBlocker.IsSameColorBlocker(this.ID);;
    }
    
    IsSquareBlocker()
    {
        return SquareBlocker.IsSquareBlocker(this.ID);
    }

    IsMagicHat()
    {
        return false;
    }

    IsCoCo()
    {
        return false;
    }

    IsBlinds()
    {
        return false;
    }

    IsChameleon()
    {
        return false;
    }

    IsButterCookies()
    {
        return false;
    }

    IsLight()
    {
        return false;
    }

    IsOrangeJamJar()
    {
        return false;
    }

    IsGreedyMonster()
    {
        return false;
    }

    IsMagician()
    {
        return false;
    }

    IsBoxingGlove()
    {
        return false;
    }

    IsNotTriggerMatched()
    {
        if (!this.MarkMatch && !this.CrushState)
        {
            return true;
        }
        return false;
    }

    CheckIsTop()
    {
        return this.TableData.Data.Layer == BlockLayer.Top;
    }

    DecrHP()
    {
        this.CurHp = this.CurHp - 1;
        this.m_bufCount++;
        this.MarkMatch = true;
    }

    IsCanCrushBottomBlocker()
    {
        if (this.TableData == null)
        {
            return false;
        }
        let type = this.TableData.Data.Type;
        if (type != BlockType.BaseBlock
            && type != BlockType.SpecialBlock
            /*&& !(IsGreedyMonster())
            && !IsMentosSugar()
            && !(IsMagician() && ActiveMatch())//魔术师第一状态不消除底层冰*/
            ) 
        {
            return false;
        }

        return true;
    }

    DelayCheck(delayTime: number = 0.5)
    {
        FallingManager.Instance.AddDelayCount();
        
        let timerData = new TimerData();
        timerData.type = TimerType.enOnce;
        timerData.objthis = this;
        timerData.interval = delayTime;
        timerData.body = this.OnDelayWrapCheck.bind(this);

        TimerManager.Instance.CreateTimer(timerData);
    }

    OnDelayWrapCheck()
    {
        FallingManager.Instance.RemoveDelayCount();
        if (this.SelfTiled == null || this.SelfTiled.CanMoveBlocker == null)
        {
            return;
        }

        const wrap: FSAdpater = StateFactory.Instance.Create(FSStateType.enAdpater) as FSAdpater;
        wrap.StartTriggerTiled(this.SelfTiled);
    }

    Destroy(tiled: Tiled)
    {
        if (this.IsDestroy)
        {
            return;
        }
        this.IsDestroy = true;

        this.OnDestroyObj(tiled);
    }

    OnDestroyObj(tiled: Tiled, needFalling: boolean = true)
    {
        BlockerManager.getInstance().Push(this, this.m_prefabName, this.m_blocker);
        this.m_blocker = null;
        this.m_blockerCom = null;

        if (null != this.SelfTiled.CanMoveBlocker && this.SelfTiled.CanMoveBlocker.ID == this.ID)
        {
            this.SelfTiled.CanMoveBlocker = null;
        }
        if (this.SelfTiled != null)
        {
            this.SelfTiled.BeTriggerTiled = null;
        }
        if (needFalling)
        {
            this.SelfTiled.CheckTriggerFall();
        }
        this.SelfTiled = null;
    }

    StartFalling()
    {
        this.Falling = true;
    }

    StopFalling(toDir: Direction)
    {
        this.Falling = false;

        // m_toDir = toDir;
        // PlayAnimation(AnimState.dropEnd);
    }

    ChangeSortLayer()
    {
        if (this.SpecialParent != null)
        {
            this.SpecialParent = null;
            this.m_blocker.setParent(TiledMap.getInstance().m_blockerRoot);
            this.LocalPosition = TiledMap.getInstance().m_blockerRoot.convertToNodeSpaceAR(this.WorldPosition);
        }
    }

    public ImediateDestroyWithoutTriggerFalling(needTarget: boolean = true, isShowDes: boolean = true, needFalling: boolean = true): void {
        this.IsDestroy = true;
        this.m_bufCount = 0;
        this.CurHp = 0;
    
        this.OnDestroyObj(this.SelfTiled, needFalling);
    }
    
}

export class BaseBlocker extends Blocker {

    ClassType: BlockerClassType = BlockerClassType.Base;

    m_baseBlockerCom: BaseBlockerCom;

    constructor(id: number) {
        super(id);
    }

    protected OnCreated(): void {
        this.m_baseBlockerCom = this.m_blockerCom as BaseBlockerCom;
        cc.resources.load("texture/" + Game.GetIconName(this.TableData.Data.IconId), cc.SpriteFrame, (err, data: any) =>
        {
            this.m_baseBlockerCom.Icon.spriteFrame = data;
        });
    }
}

export class LineBlocker extends Blocker {

    ClassType: BlockerClassType = BlockerClassType.Line;

    m_baseBlockerCom: BaseBlockerCom;

    constructor(id: number) {
        super(id);
    }

    static IsLineBlocker(id: number)
    {
        if (id == BlockerID.horizontal ||
            id == BlockerID.vertical)
        {
            return true;
        }
        return false;
    }

    protected OnCreated(): void {
        this.m_baseBlockerCom = this.m_blockerCom as BaseBlockerCom;
        cc.resources.load("texture/" + Game.GetIconName(this.TableData.Data.IconId), cc.SpriteFrame, (err, data: any) =>
        {
            this.m_baseBlockerCom.Icon.spriteFrame = data;
        });
    }
}

export class SquareBlocker extends Blocker {

    ClassType: BlockerClassType = BlockerClassType.Square;

    m_baseBlockerCom: BaseBlockerCom;

    static IsSquareBlocker(id: number)
    {
        if (id == BlockerID.squareid)
        {
            return true;
        }
        return false;
    }

    constructor(id: number) {
        super(id);
    }

    protected OnCreated(): void {
        this.m_baseBlockerCom = this.m_blockerCom as BaseBlockerCom;
        this.m_baseBlockerCom.RefreshIcon(this.TableData.Data.IconId);
    }
}

export class AreaBlocker extends Blocker {

    ClassType: BlockerClassType = BlockerClassType.Area;

    m_baseBlockerCom: BaseBlockerCom;

    static IsAreaBlocker(id: number)
    {
        if (id == BlockerID.area)
        {
            return true;
        }
        return false;
    }

    constructor(id: number) {
        super(id);
    }

    protected OnCreated(): void {
        this.m_baseBlockerCom = this.m_blockerCom as BaseBlockerCom;
        cc.resources.load("texture/" + Game.GetIconName(this.TableData.Data.IconId), cc.SpriteFrame, (err, data: any) =>
        {
            this.m_baseBlockerCom.Icon.spriteFrame = data;
        });
    }
}

export class SameColorBlocker extends Blocker {

    ClassType: BlockerClassType = BlockerClassType.Samecolor;

    m_baseBlockerCom: BaseBlockerCom;

    static IsSameColorBlocker(id: number)
    {
        if (id == BlockerID.samecolor)
        {
            return true;
        }
        return false;
    }

    constructor(id: number) {
        super(id);
    }

    protected OnCreated(): void {
        this.m_baseBlockerCom = this.m_blockerCom as BaseBlockerCom;
        cc.resources.load("texture/" + Game.GetIconName(this.TableData.Data.IconId), cc.SpriteFrame, (err, data: any) =>
        {
            this.m_baseBlockerCom.Icon.spriteFrame = data;
        });
    }
}
