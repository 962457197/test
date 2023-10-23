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
import { BlockLayer, BlockSubType, BlockType, BlockZIndex, BlockerClassType, BlockerID, BlockerManager } from "./BlockerManager"
import { ColorManager } from "./ColorManager";
import { EffectType } from "../effect/EffectController";
import { StateFactory } from "../fsm/StateFactory";
import { Direction } from "../data/LevelScriptableData";
import { TimerData, TimerManager, TimerType } from "../../tools/TimerManager";
import { FallingManager } from "../drop/FallingManager";
import { FSAdpater, FSStateType } from "../fsm/FSBase";
import ButterCookiesCom from "./ButterCookiesCom";

export class Blocker {

    static m_blockerGuid: number = 0;

    ClassType: BlockerClassType = BlockerClassType.None;

    IsDestroy: boolean = false;
    ID: number = 0;
    Guid: number = 0;
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
    IsTabDestroy: boolean = false;

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
        this.Guid = Blocker.m_blockerGuid++;
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
                this.m_blocker.setPosition(0, 0);
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
        //cc.log(`match3 falling = ${this.Falling} marked = ${this.Marked} markmatch = ${this.MarkMatch} crushstate = ${this.CrushState} isDestroy = ${this.IsDestroy} IsSwitching = ${this.IsSwitching}`);
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
        return ButterCookiesBlocker.IsButterCookies(this.ID);
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

    Destroy(tiled: Tiled) : Blocker
    {
        if (this.IsDestroy)
        {
            return null;
        }
        this.IsDestroy = true;

        this.OnDestroyObj(tiled);
        return null;
    }

    OnDestroyObj(tiled: Tiled, needFalling: boolean = true, isQuit: boolean = false)
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
        }
    }

    public ImediateDestroyWithoutTriggerFalling(needTarget: boolean = true, isShowDes: boolean = true, needFalling: boolean = true): void {
        this.IsDestroy = true;
        this.m_bufCount = 0;
        this.CurHp = 0;
    
        this.OnDestroyObj(this.SelfTiled, needFalling);
    }


    private static MatchTipNormal: string = "match_tip";
    private static MatchTipDirectionUp: string = "match_tip_up";
    private static MatchTipDirectionDown: string = "match_tip_down";
    private static MatchTipDirectionLeft: string = "match_tip_left";
    private static MatchTipDirectionRight: string = "match_tip_right";
    
    PlayMatchTipsAnimation(dir: Direction = Direction.None)
    {
        let matchTip = Blocker.MatchTipNormal;
        switch (dir)
        {
            case Direction.Up:
                matchTip = Blocker.MatchTipDirectionUp;
                break;
            case Direction.Down:
                matchTip = Blocker.MatchTipDirectionDown;
                break;
            case Direction.Left:
                matchTip = Blocker.MatchTipDirectionLeft;
                break;
            case Direction.Right:
                matchTip = Blocker.MatchTipDirectionRight;
                break;
        }

        this.m_blockerCom.PlayAnim(matchTip);
    }

    StopMatchTipsAnimation()
    {
        this.m_blockerCom.Anim.stop();
        this.m_blockerCom.Anim.node.setScale(cc.Vec2.ONE);
        this.m_blockerCom.Anim.node.setRotation(0);
    }
}

export class BaseBlocker extends Blocker {

    ClassType: BlockerClassType = BlockerClassType.Base;

    m_baseBlockerCom: BaseBlockerCom;

    constructor(id: number) {
        super(id);
    }

    protected OnCreated(): void {
        super.OnCreated();
        this.m_baseBlockerCom = this.m_blockerCom as BaseBlockerCom;
        this.m_baseBlockerCom.RefreshIcon(this.TableData.Data.IconId);
        this.m_baseBlockerCom.node.zIndex = BlockZIndex.Middle;
    }
}

export class ObstacleBlocker extends Blocker {

    ClassType: BlockerClassType = BlockerClassType.Obstacle;

    m_baseBlockerCom: BaseBlockerCom;

    constructor(id: number) {
        super(id);
    }

    IsCookie(id: number)
    {
        return id == BlockerID.cookies_a_id
            || id == BlockerID.cookies_b_id
            || id == BlockerID.cookies_c_id
            || id == BlockerID.cookies_d_id
            || id == BlockerID.cookies_e_id;
    }

    static IsBottom(id: number)
    {
        return id == BlockerID.bottom_a_id || id == BlockerID.bottom_b_id || id == BlockerID.bottom_c_id;
    }

    static IsMovedOBBrick(id: number)
    {
        return id == BlockerID.moved_ob_brickid;
    }

    protected OnCreated(): void {
        super.OnCreated();
        this.m_baseBlockerCom = this.m_blockerCom as BaseBlockerCom;
        this.m_baseBlockerCom.RefreshIcon(this.TableData.Data.IconId);

        if (ObstacleBlocker.IsBottom(this.ID))
        {
            if (this.ID == BlockerID.bottom_c_id)
            {
                this.m_baseBlockerCom.node.zIndex = BlockZIndex.Bottom + 2;
            }
            else if (this.ID == BlockerID.bottom_b_id)
            {
                this.m_baseBlockerCom.node.zIndex = BlockZIndex.Bottom + 1;
            }
            else
            {
                this.m_baseBlockerCom.node.zIndex = BlockZIndex.Bottom;
            }
        }
        else
        {
            this.m_baseBlockerCom.node.zIndex = BlockZIndex.Middle;
        }
    }

    Destroy(tiled: Tiled) : Blocker
    {
        if (this.m_parentId > 0)
        {
            this.ID = this.m_parentId;
            this.TableData = Game.GetBlockData(this.ID);
            this.m_parentId = this.TableData.Data.ParentId;

            this.m_baseBlockerCom.RefreshIcon(this.TableData.Data.IconId);

            if (this.CanMove() && !this.Occupy())
            {
                this.SelfTiled.CheckTriggerFall();
            }
            return this;
        }
        return super.Destroy(tiled);
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
        super.OnCreated();
        this.m_baseBlockerCom = this.m_blockerCom as BaseBlockerCom;
        this.m_baseBlockerCom.RefreshIcon(this.TableData.Data.IconId);
        this.m_baseBlockerCom.node.zIndex = BlockZIndex.Middle;
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
        super.OnCreated();
        this.m_baseBlockerCom = this.m_blockerCom as BaseBlockerCom;
        this.m_baseBlockerCom.RefreshIcon(this.TableData.Data.IconId);
        this.m_baseBlockerCom.node.zIndex = BlockZIndex.Middle;
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
        super.OnCreated();
        this.m_baseBlockerCom = this.m_blockerCom as BaseBlockerCom;
        this.m_baseBlockerCom.RefreshIcon(this.TableData.Data.IconId);
        this.m_baseBlockerCom.node.zIndex = BlockZIndex.Middle;
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
        super.OnCreated();
        this.m_baseBlockerCom = this.m_blockerCom as BaseBlockerCom;
        this.m_baseBlockerCom.RefreshIcon(this.TableData.Data.IconId);
        this.m_baseBlockerCom.node.zIndex = BlockZIndex.Middle;
    }
}

export class MultiTiledBlocker extends Blocker {
    static DEFAULT_COLLECT_COUNT: number = 3;
    static DEFAULT_AREA_ROW: number = 2;
    static DEFAULT_AREA_COL: number = 2;

    // Do not set array elements to null or clear m_selfComList in subclasses.
    protected m_selfComList: MultiTiledComBlocker[] = [];

    constructor(id: number) {
        super(id);
    }

    get SelfComList(): MultiTiledComBlocker[] {
        return this.m_selfComList;
    }

    private m_triggerEffectGuidList: number[] = [];

    get TriggerEffectGuidList(): number[] {
        return this.m_triggerEffectGuidList;
    }

    protected m_areaRow: number = MultiTiledBlocker.DEFAULT_AREA_ROW;
    protected m_areaCol: number = MultiTiledBlocker.DEFAULT_AREA_COL;

    get AreaRow(): number {
        return this.m_areaRow;
    }

    set AreaRow(value: number) {
        this.m_areaRow = value;
    }

    get AreaCol(): number {
        return this.m_areaCol;
    }

    set AreaCol(value: number) {
        this.m_areaCol = value;
    }

    public Reborn(id: number, parent: number): void {
        super.Reborn(id, parent);
        this.m_selfComList.length = 0;
    }

    protected OnCreated(): void {
        this.m_triggerEffectGuidList = [];
        this.SetMultiTiledBlockerData();

        super.OnCreated();

        this.LocalPosition = new cc.Vec2(
            this.SelfTiled.LocalPosition.x + (this.m_areaCol - 1) * Tiled.WIDTH / 2,
            this.SelfTiled.LocalPosition.y - (this.m_areaRow - 1) * Tiled.HEIGHT / 2,
        );

    }

    public SetActive(act: boolean, isPush: boolean = false): void {
        Utils.SetNodeActive(this.m_blocker, act);
    }

    public SetMultiTiledBlockerData(): void {
        this.m_areaRow = MultiTiledBlocker.DEFAULT_AREA_ROW;
        this.m_areaCol = MultiTiledBlocker.DEFAULT_AREA_COL;
    }

    public GenerateMultiTiledComBlocker(tiled: Tiled, index: number): void {
        
    }

    public SetBlockerDiaplay(isActive: boolean): void {
        if (this.m_blocker != null && this.m_blocker.active !== isActive) {
            this.SetActive(isActive);
        }
    }

    public AddCom(index: number, blocker: MultiTiledComBlocker): void {
        this.m_selfComList.push(blocker);
    }

    public DestroyCom(com: MultiTiledComBlocker): Blocker {
        return null;
    }

    public DestroyComObj(index: number, needFalling: boolean, isQuit: boolean): void {
        const count: number = this.m_selfComList.length - 1;
        if (index <= count) {
            this.m_selfComList[index].IsDestroyObj = true;
        }

        let isDestroy: boolean = true;
        for (let i: number = 0; i < this.m_selfComList.length; i++) {
            if (!this.m_selfComList[i].IsDestroyObj) {
                isDestroy = false;
                break;
            }
        }

        if (isDestroy) {
            this.OnDestroyObj(this.SelfTiled, needFalling, isQuit);
        }
    }

    public CheckCanAddDestroy(guid: number): boolean {
        if (!this.m_triggerEffectGuidList.includes(guid)) {
            this.m_triggerEffectGuidList.push(guid);
            return true;
        }
        return false;
    }

    public RemoveTriggerEffectGuidList(guid: number): void {
        if (this.m_triggerEffectGuidList.length <= 0) {
            return;
        }
        
        const index: number = this.m_triggerEffectGuidList.indexOf(guid);
        if (index !== -1) {
            this.m_triggerEffectGuidList.splice(index, 1);
        }
    }

    public RealDestroyCom(com: MultiTiledDestroyableComBlocker): void {
        this.CurHp = 0;
        this.DestroyCom(com);
    }

    public OnDestroyObj(tiled: Tiled, needFalling: boolean = true, isQuit: boolean = false): void {
        this.RecycleAllCom();
        super.OnDestroyObj(tiled, needFalling, isQuit);
    }

    private RecycleAllCom(): void {
        for (const item of this.m_selfComList) {
            item?.RecycleCom();
        }
        this.m_selfComList = [];
    }

    protected RemoveAllCom(isFalling: boolean = true): void {
        for (const item of this.m_selfComList) {
            item?.RemoveCom(isFalling);
        }
    }
}

class MultiTiledComBlocker extends Blocker {
    protected m_entity: MultiTiledBlocker;
    get Entity(): MultiTiledBlocker {
        return this.m_entity;
    }

    private m_index: number;
    private m_isShow: boolean;
    get IsShow(): boolean {
        return this.m_isShow;
    }
    set IsShow(value: boolean) {
        this.m_isShow = value;
    }

    private m_isDestroyObj: boolean = false;
    get IsDestroyObj(): boolean {
        return this.m_isDestroyObj;
    }
    set IsDestroyObj(value: boolean) {
        this.m_isDestroyObj = value;
    }

    // Used to determine whether the current comBlocker can respond to collisions
    private m_isForbidCom: boolean = false;
    get IsForbidCom(): boolean {
        return this.m_isForbidCom;
    }
    set IsForbidCom(value: boolean) {
        this.m_isForbidCom = value;
    }

    // get position(): Vector3 {
    //     return this.m_entity.position;
    // }

    // Whether to share Entity Tiled's IsSquareTarget
    // get IsSquareTargetSameEntity(): boolean {
    //     return true;
    // }

    constructor(id: number) {
        super(id);
        this.Reset();
    }

    private Reset(): void {
        // this.IsShow = true;
        // this.IsForbidCom = false;
        this.IsDestroyObj = false;
        this.TableData = Game.GetBlockData(this.ID);
        this.m_prefabName = "MultiTiledComBlock";
    }

    public Reborn(id: number, parent: number): void {
        super.Reborn(id, parent);
        this.Reset();
    }

    public InitCom(blocker: MultiTiledBlocker, tiled: Tiled, index: number): void {
        this.m_index = index;
        this.m_entity = blocker;
        this.SelfTiled = tiled;
        this.m_entity.AddCom(index, this);
    }

    // public CreateComGo(parent: Transform, pos: Vector3): void {
    //     this.m_blocker = BlockerManager.Instance.Pop(this.m_prefabName);
    //     this.m_blocker.transform.SetParent(parent, false);
    //     this.m_blocker.transform.position = pos;
    //     this.m_blocker.SetActive(true);
    //     this.m_mono = this.m_blocker.GetComponent<BlockerMono>();
    //     this.m_blocker.name += this.m_index;
    // }

    // public SetIcon(sprite: Sprite): void {
    //     // Implement this in derived classes if necessary
    // }

    // public GetMainSprite(): Sprite {
    //     return null;
    // }

    // public SetSquareTarget(value: boolean): void {
    //     if (this.m_entity == null) {
    //         return;
    //     }
    //     this.m_entity.SelfTiled.IsSquareTarget = value;
    // }

    // public GetSquareTarget(): boolean {
    //     if (this.m_entity != null) {
    //         return this.m_entity.SelfTiled.IsSquareTarget;
    //     }
    //     return false;
    // }

    // public SetSquareTargetStatus(value: number): void {
    //     if (this.m_entity == null) {
    //         return;
    //     }
    //     this.m_entity.SelfTiled.SquareTargetStatus = value;
    // }

    // public GetSquareTargetStatus(): number {
    //     if (this.m_entity != null) {
    //         return this.m_entity.SelfTiled.SquareTargetStatus;
    //     }
    //     return 0;
    // }

    // public CheckMulSelectWithSquare(): boolean {
    //     return this.m_entity.CheckMulSelectWithSquare();
    // }

    // public SetBlockerDiaplay(isActive: boolean): void {
    //     Utils.SetObjActive(this.gameObject, isActive);
    //     this.m_entity?.SetBlockerDiaplay(isActive);
    // }

    public GetColor(): number {
        return this.m_entity?.Color || 0;
    }

    public RecycleCom(): void {
        if (this.m_blocker != null) {
            BlockerManager.getInstance().Push(this, this.m_prefabName, this.m_blocker);
            this.m_blocker = null;
        } else {
            BlockerManager.getInstance().PushBlocker(this);
        }
    }

    public RemoveCom(isFalling: boolean = true): void {
        this.IsShow = false;
        if (this.SelfTiled != null) {
            this.SelfTiled.RemoveBlocker(this, isFalling);
        }
    }

    public OnDestroyObj(tiled: Tiled, needFalling:boolean = false, isQuit: boolean = false): void {
        this.IsShow = false;
        this.m_entity.DestroyComObj(this.m_index, needFalling, isQuit);
    }
}

export class MultiTiledDestroyableComBlocker extends MultiTiledComBlocker {

    ClassType: BlockerClassType = BlockerClassType.DefaultDestroyableCom;

    constructor(id: number) {
        super(id);
    }

    // External destruction of this comBlocker
    public Destroy(tiled: Tiled): Blocker {
        return this.m_entity.DestroyCom(this);
    }

    public OnRealDestroy(tiled: Tiled): void {
        this.m_entity.RealDestroyCom(this);
    }

    public CheckCanAddDestroy(guid: number): boolean {
        return this.m_entity.CheckCanAddDestroy(guid);
    }

    public RemoveTriggerEffectGuidList(guid: number): void {
        this.m_entity.RemoveTriggerEffectGuidList(guid);
    }
}

export class ButterCookiesComBlocker extends MultiTiledDestroyableComBlocker {
    constructor(id: number) {
        super(id);
    }

    ClassType: BlockerClassType = BlockerClassType.ButterCookiesCom;

    // get MatchEffectType(): EffectType {
    //     return this.m_entity?.MatchEffectType || EffectType.None;
    // }
    // set MatchEffectType(value: EffectType) {
    //     if (this.m_entity) {
    //         this.m_entity.MatchEffectType = value;
    //     }
    // }

    // get MarkMatch(): boolean {
    //     return this.m_entity?.MarkMatch || false;
    // }
    // set MarkMatch(value: boolean) {
    //     if (this.m_entity) {
    //         this.m_entity.MarkMatch = value;
    //     }
    // }

    public DecrHP(): void {
        this.m_entity?.DecrHP();
    }

    public CheckCanAddDestroy(guid: number): boolean {
        return true;
    }
}



export class ButterCookiesBlocker extends MultiTiledBlocker {
    // private static readonly Audio_Match_ButterCookies: number = 204;
    // private static readonly Audio_Match_ButterCookies_Vanish: number = 205;
    
    // private static readonly ANIM_COM_DESTROY_NAME: string = "ele_anim_buttercookies";
    // private static readonly ANIM_RESET_NAME: string = "ele_anim_buttercookies_reset";

    ClassType: BlockerClassType = BlockerClassType.None;

    m_selfCom: ButterCookiesCom = null;
    m_offsetIndex: number = 0;
    // m_currentDestroyCookiesPos: cc.Vec2 = cc.Vec2.ZERO;

    constructor(id: number) {
        super(id);
    }

    static IsButterCookies(id: number): boolean {
        return id === BlockerID.butter_cookies_a_id
            || id === BlockerID.butter_cookies_b_id
            || id === BlockerID.butter_cookies_c_id;
    }

    protected OnCreated(): void {
        super.OnCreated();
        this.m_selfCom = this.m_blocker.getComponent(ButterCookiesCom);
        this.InitCurrentHpOffsetIndex();
        this.Reset();
    }

    public SetActive(act: boolean, isPush: boolean = false): void {
        super.SetActive(act, isPush);
        // if (act) {
        //     this.Reset();
        // }
    }

    public Reborn(id: number, parent: number): void {
        super.Reborn(id, parent);
        this.IsTabDestroy = false;
        this.m_offsetIndex = 0;
        // this.m_currentDestroyCookiesPos = cc.Vec2.ZERO;
    }

    public GenerateMultiTiledComBlocker(tiled: Tiled, index: number): void {
        const comblocker = BlockerManager.getInstance().CreateFactoryCom(BlockerClassType.ButterCookiesCom, this.ID);
        if (comblocker != null) {
            (comblocker as MultiTiledComBlocker).InitCom(this, tiled, index);
            tiled.AddBlocker(comblocker);
        }
    }

    public DecrHP(): void {
        this.CurHp--;
        if (this.CurHp < 0) {
            this.CurHp = 0;
        }
        this.MarkMatch = true;
    }

    public DestroyCom(com: MultiTiledComBlocker): Blocker {
        if (this.IsTabDestroy) {
            return this;
        }

        this.RefreshDisplay();
        if (this.CurHp <= 0) {
            // AudiosManager.Instance.PlayLimitSound(ButterCookiesBlocker.Audio_Match_ButterCookies_Vanish);
            this.IsTabDestroy = true;
            super.Destroy(this.SelfTiled);
        } else {
            // AudiosManager.Instance.PlayLimitSound(ButterCookiesBlocker.Audio_Match_ButterCookies);
            this.MarkMatch = false;
        }

        return this;
    }

    public OnDestroyObj(tiled: Tiled, needFalling: boolean = true, isQuit: boolean = false): void {
        this.RemoveAllCom();
        super.OnDestroyObj(tiled, needFalling, isQuit);
    }

    private Reset(): void {

        // this.StopAnimation();
        // this.m_selfMono.anim.Play(ButterCookiesBlocker.ANIM_RESET_NAME);

        for (let i = 0; i < this.m_selfCom.SpriteRenderers.length; i++) {
            Utils.SetNodeActive(this.m_selfCom.SpriteRenderers[i].node, false);
        }

        for (let i = this.m_offsetIndex; i < this.m_selfCom.SpriteRenderers.length; i++) {
            Utils.SetNodeActive(this.m_selfCom.SpriteRenderers[i].node, true);
        }
    }

    private RefreshDisplay(): void {
        // this.StopAnimation();
        // this.m_selfMono.anim.Play(ButterCookiesBlocker.ANIM_COM_DESTROY_NAME);

        for (let i = this.m_offsetIndex; i < this.TableData.Data.HP - this.CurHp + this.m_offsetIndex; i++) {
            Utils.SetNodeActive(this.m_selfCom.SpriteRenderers[i].node, false);

            // this.m_currentDestroyCookiesPos = this.m_selfCom.SpriteRenderers[i].node.getPosition();
            // this.DecrNeedTargetCount();
        }
    }

    private InitCurrentHpOffsetIndex(): void {
        if (this.ID === BlockerID.butter_cookies_a_id) {
            this.m_offsetIndex = 4;
        } else if (this.ID === BlockerID.butter_cookies_b_id) {
            this.m_offsetIndex = 2;
        } else {
            this.m_offsetIndex = 0;
        }
    }

    // public DecrNeedTargetCount(): boolean {
    //     return LevelManager.Instance.Map.CheckCollect(this, this.m_currentDestroyCookiesPos);
    // }
}

