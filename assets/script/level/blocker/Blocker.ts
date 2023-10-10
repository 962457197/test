// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../../Game";
import { Utils } from "../../tools/Utils";
import { FirstActionType, BlockerData } from "../../table/BlockTable";
import { Tiled } from "../tiledmap/Tiled";
import { TiledMap } from "../tiledmap/TiledMap";
import BaseBlockerCom from "./BaseBlockerCom";
import BlockerCom from "./BlockerCom";
import { BlockSubType, BlockType, BlockerClassType, BlockerID, BlockerManager } from "./BlockerManager"
import { ColorManager } from "./ColorManager";
import { NormalTiled } from "../tiledmap/NormalTiled";
import { EffectType } from "../effect/EffectController";
import { StateFactory } from "../fsm/StateFactory";
import { FSStateType } from "../fsm/FSM";
import { FSAdpater } from "../fsm/FSBase";

export class Blocker {
    ClassType: BlockerClassType = BlockerClassType.None;

    IsDestroy: boolean;
    ID: number;
    CurHp: number;
    m_parentId: number;
    m_bufCount: number;
    m_blocker: cc.Node;
    m_blockerCom: BlockerCom;
    m_mono: cc.Node;
    m_AttributeState: number;
    m_prefabName: string;
    TableData: BlockerData;
    Color: number;
    SelfTiled: NormalTiled;
    MarkMatch: boolean;
    CrushState: boolean;
    Marked: boolean;
    Falling: boolean;
    IsSwitching: boolean;
    IsAlreadyCheckMatch: boolean;
    MatchGuid: number;
    MatchEffectType: EffectType;
    IsTriggerEffect: boolean;

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

        this.MarkMatch = false;
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
            this.m_blocker.setPosition(this.SelfTiled.LocalPosition());
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
                this.m_blocker.setParent(TiledMap.getInstance().m_blockerRoot);
                this.m_blocker.name = this.SelfTiled.Row + "_" + this.SelfTiled.Col + "_" + this.ID;
                this.m_blockerCom = this.m_blocker.getComponent(BlockerCom);
                this.OnBorning();
                Game.LoadingAssetCount--;
            })
        }
        else
        {
            this.m_blocker = blocker;
            this.m_blocker.setParent(TiledMap.getInstance().m_blockerRoot);
            this.m_blocker.name = this.SelfTiled.Row + "_" + this.SelfTiled.Col + "_" + this.ID;
            this.m_blockerCom = this.m_blocker.getComponent(BlockerCom);
            this.OnBorning();
        }
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

    public CanBlock(): boolean {
        return this.TableData.HasAction(FirstActionType.Block);
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

    IsNoColor()
    {
        if (this.TableData.Data.SubType == BlockSubType.Special)
        {
            return true;
        }
        return false;
    }
    
    IsBottomBlocker()
    {
        return false;
    }

    IsSameColor()
    {
        return false;
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
        // FallingManager.Instance.AddDelayCount(this);//DelayCount++;
        // m_delayCheckTimer = Inf.TimerManager.Instance.CreateTimer(new Inf.TimerData { type = Inf.TimerType.enOnce, objthis = this, interval = delayTime, body = this.OnDelayWrapCheck });
    }

    // OnDelayWrapCheck()
    // {
    //     FallingManager.Instance.RemoveDelayCount(this);//DelayCount--;
    //     m_delayCheckTimer = null;
    //     if (this.SelfTiled == null || this.SelfTiled.CanMoveBlocker == null)
    //     {
    //         return;
    //     }
    //     var wrap = StateFactory.Instance.Create(FSStateType.enAdpater) as FSAdpater;//new FSAdpater();
    //     wrap.StartByTiled(this.SelfTiled);
    // }

    Destroy()
    {

    }

    OnDestroyObj()
    {

    }
}

export class BaseBlocker extends Blocker {

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

    Destroy()
    {
        this.OnDestroyObj();
    }

    OnDestroyObj()
    {
        BlockerManager.getInstance().Push(this, this.m_prefabName, this.m_blocker);
        this.m_blocker = null;
        this.m_blockerCom = null;
    }
}
