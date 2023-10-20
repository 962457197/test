// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../../Game";
import { FirstActionType } from "../../table/BlockTable";
import { Timer, TimerData, TimerManager, TimerType } from "../../tools/TimerManager";
import { Utils } from "../../tools/Utils";
import { Blocker, MultiTiledBlocker } from "../blocker/Blocker";
import { BlockLayer, BlockSubType, BlockZIndex, BlockerID, BlockerManager } from "../blocker/BlockerManager";
import { ColorManager } from "../blocker/ColorManager";
import { Direction, TiledType } from "../data/LevelScriptableData";
import { LevelTiledData } from "../data/LevelScriptableData";
import { FallingManager } from "../drop/FallingManager";
import { EffectBaseCrush } from "../effect/EffectBase";
import { EffectType } from "../effect/EffectController";
import { TiledMap } from "./TiledMap";
import TiledOverCastCom from "./TiledOverCastCom";

export enum BornEffect
{
    none,
    samecolor,
    commonBorn,
    boost,
    bonestime,
    sevenwins,
}

export class Tiled {
    public static WIDTH: number = 116;
    public static HEIGHT: number = 116;

    m_tiledTableData: LevelTiledData = null;
    Row: number = 0;
    Col: number = 0;
    Guid: number = 0;
    m_tiledRoot: cc.Node = null;
    m_tiled: cc.Node = null;
    Bg: cc.Node = null;
    OverCastRoot: cc.Node = null;
    OverCastCom: TiledOverCastCom = null;
    EnterPoint: Tiled = null;
    PrevTiledGuid: number = -1;
    NextTiledGuid: number = -1;
    CanMoveBlocker: Blocker = null;
    m_blockerList: Blocker[] = [];

    private m_markCount: number = 0;

    get Marked(): boolean {
    return this.m_markCount > 0;
    }

    set Marked(value: boolean) {
    if (value) {
        this.m_markCount++;
    } else {
        this.m_markCount--;
    }

    if (this.m_markCount < 0) {
        this.m_markCount = 0;
    }
    }

    BeTriggerTiled: Tiled = null;
    m_specialBlockerIdx: number = null;
    m_canFallingAround: Tiled[] = [];
    CurrentFallingPrevTiled: Tiled = null;
    CurrentSelectedFallingNumber: number;
    ForbidFindEnterPoint: boolean;
    CurrentFallingSlantTiled: Tiled = null;
    CurrentSelectedSlantFallingNumber: number = -1;
    m_isNeedGen: boolean = true;
    m_stickyBlockerId: number = -1;
    BeforeNoCheckMatch: boolean = false;
    TryArrivingTiled: Tiled = null;
    IsSquareTarget: boolean;

    public GetTiledType(): TiledType {
        return this.m_tiledTableData.type;
    }

    get FallingDir() { 
        return this.m_tiledTableData.direction;
    }

    get WorldPosition()
    {
        const worldPositionAR = this.m_tiledRoot.convertToWorldSpaceAR(cc.Vec2.ZERO);
        return worldPositionAR;
    }

    get LocalPosition()
    {
        return this.m_tiledRoot.getPosition();
    }

    Create(idx: number, data: LevelTiledData, parent: cc.Node, row: number, col: number, name: string)
    {
        this.m_markCount = 0;
        this.CanMoveBlocker = null;
    }

    IsValidTiled()
    {
        if (this.m_tiledTableData.type == TiledType.None || this.m_tiledTableData.type == TiledType.Invalid)
        {
            return false;
        }
        return true;
    }

    GetPrevTiled()
    {
        return TiledMap.getInstance().GetTiledByGUID(this.PrevTiledGuid);
    }

    GetNextTiled()
    {
        return TiledMap.getInstance().GetTiledByGUID(this.NextTiledGuid);
    }

    GetNeighborBottom()
    {
        return TiledMap.getInstance().GetTiled(this.Row + 1, this.Col) as NormalTiled;
    }
    GetNeighborLeftBottom()
    {
        return TiledMap.getInstance().GetTiled(this.Row + 1, this.Col - 1) as NormalTiled;
    }
    GetNeighborRightBottom()
    {
        return TiledMap.getInstance().GetTiled(this.Row + 1, this.Col + 1) as NormalTiled;
    }
    GetNeighborTop()
    {
        return TiledMap.getInstance().GetTiled(this.Row - 1, this.Col) as NormalTiled;
    }
    GetNeighborLeftTop()
    {
        return TiledMap.getInstance().GetTiled(this.Row - 1, this.Col - 1) as NormalTiled;
    }
    GetNeighborRightTop()
    {
        return TiledMap.getInstance().GetTiled(this.Row - 1, this.Col + 1) as NormalTiled;
    }
    GetNeighborRight()
    {
        return TiledMap.getInstance().GetTiled(this.Row, this.Col + 1) as NormalTiled;
    }
    GetNeighborLeft()
    {
        return TiledMap.getInstance().GetTiled(this.Row, this.Col - 1) as NormalTiled;
    }

    GetLocalNeighborTop(this: Tiled): Tiled | null {
        switch (this.FallingDir) {
            case Direction.Down: return this.GetNeighborTop();
            case Direction.Left: return this.GetNeighborRight();
            case Direction.Right: return this.GetNeighborLeft();
            case Direction.Up: return this.GetNeighborBottom();
        }
        return null;
    }
    
    GetLocalNeighborBottom(this: Tiled): Tiled | null {
        switch (this.FallingDir) {
            case Direction.Down: return this.GetNeighborBottom();
            case Direction.Left: return this.GetNeighborLeft();
            case Direction.Right: return this.GetNeighborRight();
            case Direction.Up: return this.GetNeighborTop();
        }
        return null;
    }
    
    GetLocalNeighborLeft(this: Tiled): Tiled | null {
        switch (this.FallingDir) {
            case Direction.Down: return this.GetNeighborLeft();
            case Direction.Left: return this.GetNeighborTop();
            case Direction.Right: return this.GetNeighborBottom();
            case Direction.Up: return this.GetNeighborRight();
        }
        return null;
    }
    
    GetLocalNeighborRight(this: Tiled): Tiled | null {
        switch (this.FallingDir) {
            case Direction.Down: return this.GetNeighborRight();
            case Direction.Left: return this.GetNeighborBottom();
            case Direction.Right: return this.GetNeighborTop();
            case Direction.Up: return this.GetNeighborLeft();
        }
        return null;
    }
    
    GetLocalNeighborLeftBottom(this: Tiled): Tiled | null {
        switch (this.FallingDir) {
            case Direction.Down: return this.GetNeighborLeftBottom();
            case Direction.Left: return this.GetNeighborLeftTop();
            case Direction.Right: return this.GetNeighborRightBottom();
            case Direction.Up: return this.GetNeighborRightTop();
        }
        return null;
    }
    
    GetLocalNeighborRightBottom(this: Tiled): Tiled | null {
        switch (this.FallingDir) {
            case Direction.Down: return this.GetNeighborRightBottom();
            case Direction.Left: return this.GetNeighborLeftBottom();
            case Direction.Right: return this.GetNeighborRightTop();
            case Direction.Up: return this.GetNeighborLeftTop();
        }
        return null;
    }
    
    GetLocalNeighborLeftTop(this: Tiled): Tiled | null {
        switch (this.FallingDir) {
            case Direction.Down: return this.GetNeighborLeftTop();
            case Direction.Left: return this.GetNeighborRightTop();
            case Direction.Right: return this.GetNeighborLeftBottom();
            case Direction.Up: return this.GetNeighborRightBottom();
        }
        return null;
    }
    
    GetLocalNeighborRightTop(this: Tiled): Tiled | null {
        switch (this.FallingDir) {
            case Direction.Down: return this.GetNeighborRightTop();
            case Direction.Left: return this.GetNeighborRightBottom();
            case Direction.Right: return this.GetNeighborLeftTop();
            case Direction.Up: return this.GetNeighborLeftBottom();
        }
        return null;
    }
    
    public BelowBottomBlocker(): Blocker | null {
        for (let i = 0; i < this.m_blockerList.length; i++) {
            if (this.m_blockerList[i].TableData.Data.Layer === BlockLayer.BelowBottom) {
                return this.m_blockerList[i];
            }
        }
        return null;
    }
    
    public BottomBlocker(): Blocker | null {
        for (let i = 0; i < this.m_blockerList.length; i++) {
            if (this.m_blockerList[i].TableData.Data.Layer === BlockLayer.Bottom) {
                return this.m_blockerList[i];
            }
        }
        return null;
    }
    
    public TopBlocker(): Blocker | null {
        for (let i = 0; i < this.m_blockerList.length; i++) {
            if (this.m_blockerList[i].TableData.Data.Layer === BlockLayer.Top) {
                return this.m_blockerList[i];
            }
        }
        return null;
    }
    
    public TopTopBlocker(): Blocker | null {
        for (let i = 0; i < this.m_blockerList.length; i++) {
            if (this.m_blockerList[i].TableData.Data.Layer === BlockLayer.TopTop) {
                return this.m_blockerList[i];
            }
        }
        return null;
    }
    
    public MiddleBlocker(): Blocker | null {
        for (let i = 0; i < this.m_blockerList.length; i++) {
            if (this.m_blockerList[i].TableData.Data.Layer === BlockLayer.Middle) {
                return this.m_blockerList[i];
            }
        }
        return null;
    }

    public get MatchBlocker(): Blocker | null {
        const toptop = this.TopTopBlocker();
        if (toptop != null) return toptop;
        const top = this.TopBlocker();
        if (top != null) return top;
        if (this.CanMoveBlocker != null) return this.CanMoveBlocker;
        const middle = this.MiddleBlocker();
        if (middle != null) return middle;
        return this.BottomBlocker();
    }

    IsCanSwitchNoMatchBlocker()
    {
        var blocker = this.MatchBlocker;
        if (blocker != null && blocker.IsBottomBlocker() || blocker == null)
        {
            return true;
        }
        return false;
    }

    public CheckNextArriveTiled(): Tiled | null {
        let nextTiled = this.GetNextTiled();
        if (nextTiled == null) {
            nextTiled = this.GetLocalNeighborBottom();
            if (nextTiled == null) {
                return null;
            }
        }
        
        if (nextTiled.CanMoveBlocker !== null) {
            return null;
        }
    
        if (!nextTiled.CheckCanArriveFromLineTiled(this)) {
            return null;
        }
    
        const prevTiled = nextTiled.GetPrevTiled();
        if (prevTiled == null) {
            return null;
        } else if (nextTiled.CanMoveBlocker == null && nextTiled.PrevTiledGuid !== this.Guid && nextTiled.CheckCanArriveFromLineTiled(nextTiled.GetPrevTiled())) {
            return null;
        }
    
        return nextTiled;
    }

    CanArrive(pre: Tiled = null)
    {
        return false;
    }

    IsTeleportIn()
    {
        return false;
    }
    IsTeleportOut()
    {
        return false;
    }
    IsEnterPoint()
    {
        return this.m_tiledTableData.IsEnterPoint && !this.ForbidFindEnterPoint;
    }
    CanMove()
    {
        return false;
    }
    CanGoIn()
    {
        return false;
    }

    InValidOrOccupy()
    {
        return !this.IsValidTiled() || this.Occupy();
    }

    Occupy()
    {
        if (!this.IsValidTiled())
        {
            return false;
        }

        if (this.CanMoveBlocker != null && this.CanMoveBlocker.Occupy())
        {
            return true;
        }

        for (let i = 0; i < this.m_blockerList.length; i++)
        {
            if (this.m_blockerList[i].Occupy())
            {
                return true;
            }
        }
        return false;
    }

    IsLocked()
    {
        if (!this.IsValidTiled())
        {
            return true;
        }
        //return m_blockerList.Any(i => i.ForbidMove());
        return this.HasForbidMove();
    }

    OnCheckTiledBorderStopFalling(tiled: Tiled, direction: Direction)
    {
        return false;
    }

    SetSpecialID(spType: BlockerID)
    {
        this.m_specialBlockerIdx = spType as number;
    }
    GetSpecialID()
    {
        return this.m_specialBlockerIdx;
    }

    RandomBlocker(offsetY: number = 0)
    {
        return false;
    }

    PrevTiledCanFalling()
    {
        var preTiled = this.GetPrevTiled();
        if (null != preTiled)
        {
            if (this.CheckCanArriveFromLineTiled(preTiled) && (null != preTiled.CanMoveBlocker || preTiled.IsEnterPoint()))
            {
                return true;
            }
        }
        this.OnCheckLocalNeighbors();
        for (let i = 0; i < this.m_canFallingAround.length; i++)
        {
            preTiled = this.m_canFallingAround[i];
            if (this.CheckCanArriveFromLineTiled(preTiled) && (null != preTiled.CanMoveBlocker || preTiled.IsEnterPoint()))
            {
                return true;
            }
        }
        return false;
    }

    OnGetPrevTiledAround(): Tiled {
        this.OnCheckLocalNeighbors();
        return this.OnSelectValidPrevTiled();
    }

    private OnSelectValidPrevTiled(): Tiled {
        let preTiled: Tiled | null = null;
        if (this.m_canFallingAround.length > 1) {
            for (let i = 0; i < this.m_canFallingAround.length; i++) {
                if (this.CurrentFallingPrevTiled !== null && this.m_canFallingAround[i].Guid === this.CurrentFallingPrevTiled.Guid) {
                    this.CurrentSelectedFallingNumber = i;
                    this.m_canFallingAround.splice(i, 1);
                    break;
                }
            }
            if (this.CurrentSelectedFallingNumber >= this.m_canFallingAround.length) {
                this.CurrentSelectedFallingNumber = 0;
            }
            preTiled = this.m_canFallingAround[this.CurrentSelectedFallingNumber];
            this.CurrentSelectedFallingNumber++;
        } else if (this.m_canFallingAround.length >= 1) {
            preTiled = this.m_canFallingAround[0];
        }
        // Store the selected previous tiled for connectivity and drop checks.
        this.CurrentFallingPrevTiled = preTiled;
        return preTiled;
    }
    

    private OnCheckLocalNeighbors(): void {
        this.m_canFallingAround.length = 0;
        this.OnCheckLocalNeighbor(this.GetLocalNeighborTop());
        this.OnCheckLocalNeighbor(this.GetLocalNeighborRight());
        this.OnCheckLocalNeighbor(this.GetLocalNeighborLeft());
    }

    private OnCheckLocalNeighbor(neighborTiled: Tiled): void {
        if (this.CheckCanArriveFromLineTiled(neighborTiled)) {
            this.OnCheckNeighborTiled(neighborTiled);
        }
    }

    private OnCheckNeighborTiled(tiled: Tiled): void {
        if (tiled !== null && tiled.CanMoveBlocker !== null && !TiledMap.TiledsIsHasTiled(this.m_canFallingAround, tiled.Guid)) {
            this.m_canFallingAround.push(tiled);
        }
    }

    public IsConnectedToEnterPoint(): boolean {
        if (this.OnCheckConnected()) {
            return true;
        }
        this.OnCheckLocalNeighbors();
        for (let i = 0; i < this.m_canFallingAround.length; i++) {
            if (this.m_canFallingAround[i].OnCheckConnected()) {
                return true;
            }
        }
        return false;
    }
    
    private OnCheckConnected(): boolean {
        const preTiled: Tiled | null = this.GetPrevTiled();
        if (preTiled === null) {
            return false;
        }
        if (!this.CheckCanArriveFromLineTiled(preTiled, false)) {
            return false;
        }
        // if (preTiled.IsEnterPoint() && preTiled.JamJumpEntryTiledflag) {
        //     return false;
        // }
        if (preTiled.CanMoveBlocker !== null && !preTiled.CanMoveBlocker.MarkMatch) {
            return true;
        }
        if (preTiled.IsEnterPoint()) {
            return true;
        }
        return preTiled.OnCheckConnected();
    }

    private m_SlantTileds: Tiled[] = [];

    public OnGetSlantTiled(): Tiled {
        this.m_SlantTileds.length = 0;
        if (this.GetPrevTiled() !== null) {
            this.OnCheckSlantTiledFromPrevNeighbor();
        }
        let preTiled = this.OnSelectedValidSlantTiled();
        if (preTiled === null) {
            this.OnCheckSlantTiledFromLocalNeighbor();
        }
        return this.OnSelectedValidSlantTiled();
    }

    private OnCheckSlantTiledFromPrevNeighbor(): void {
        this.OnCheckSlantNeighbor(this.GetPrevTiled().GetLocalNeighborLeft());
        this.OnCheckSlantNeighbor(this.GetPrevTiled().GetLocalNeighborRight());
    }

    private OnCheckSlantTiledFromLocalNeighbor(): void {
        this.OnCheckSlantNeighbor(this.GetLocalNeighborLeftTop());
        this.OnCheckSlantNeighbor(this.GetLocalNeighborRightTop());
    }

    private OnCheckSlantNeighbor(neighborTiled: Tiled | null): void {
        if (neighborTiled !== null && this.CheckCanArriveFromSlantTiled(neighborTiled)) {
            const neighborBottom = neighborTiled.GetLocalNeighborBottom();
            if (neighborTiled.CanMoveBlocker === null || !neighborTiled.CanMoveBlocker.IsCanSwitch() ||
                (neighborBottom !== null && neighborBottom.CanMoveBlocker === null &&
                !neighborBottom.InValidOrOccupy() && !neighborBottom.IsLocked() && neighborBottom.CheckCanArriveFromLineTiled(neighborTiled))) {
                return;
            }
            this.m_SlantTileds.push(neighborTiled);
        }
    }

    private OnSelectedValidSlantTiled(): Tiled | null {
        let preSlantTiled: Tiled | null = null;
        if (this.m_SlantTileds.length > 1) {
            for (let i = 0; i < this.m_SlantTileds.length; i++) {
                if (this.CurrentFallingSlantTiled != null && this.m_SlantTileds[i].Guid === this.CurrentFallingSlantTiled.Guid) {
                    this.CurrentSelectedSlantFallingNumber = i;
                    this.m_SlantTileds.splice(i, 1);
                    break;
                }
            }
            if (this.CurrentSelectedSlantFallingNumber >= this.m_SlantTileds.length) {
                this.CurrentSelectedSlantFallingNumber = 0;
            }
            preSlantTiled = this.m_SlantTileds[this.CurrentSelectedSlantFallingNumber];
            this.CurrentSelectedSlantFallingNumber++;
        } else if (this.m_SlantTileds.length === 1) {
            preSlantTiled = this.m_SlantTileds[0];
        }
        this.CurrentFallingSlantTiled = preSlantTiled;
        return preSlantTiled;
    }

    public CheckCanArriveFromSlantTiled(preTiled: Tiled): boolean {
        if (this.Marked || this.IsLocked() || this.InValidOrOccupy() || preTiled === null || preTiled.Marked || preTiled.IsLocked() || preTiled.InValidOrOccupy()) {
            return false;
        }
        // if (this.Map.IsMoveDirection && this.OnCheckIsSameDirectionGroup(preTiled)) {
        //     return false;
        // }
        // const row: number = this.Row - preTiled.Row;
        // const col: number = this.Col - preTiled.Col;
        // if (row === 0 || col === 0) {
        //     return false;
        // }
        // let tiledDirection: Direction;
        // if (row > 1 || row < -1 || col > 1 || col < -1) {
        //     return false;
        // }
        // if (row > 0) {
        //     tiledDirection = col > 0 ? Direction.RightDown : Direction.LeftDown;
        // } else {
        //     tiledDirection = col > 0 ? Direction.RightUp : Direction.LeftUp;
        // }
        // if (this.OnCheckTiledBorderStopSlantFalling(preTiled, tiledDirection)) {
        //     return false;
        // }
        // if (this.OnCheckTiledMoveDirectionStopSlantFalling(preTiled, tiledDirection)) {
        //     return false;
        // }
        return true;
    }

    // OnCheckTiledMoveDirectionStopSlantFalling(preTiled: Tiled, tiledDirection: Direction): boolean {
    //     switch (tiledDirection) {
    //         case Direction.RightDown:
    //             return !((this.FallingDir === Direction.Right || this.FallingDir === Direction.Down) &&
    //                 (preTiled.FallingDir === Direction.Right || preTiled.FallingDir === Direction.Down));
    //         case Direction.LeftDown:
    //             return !((this.FallingDir === Direction.Left || this.FallingDir === Direction.Down) &&
    //                 (preTiled.FallingDir === Direction.Left || preTiled.FallingDir === Direction.Down));
    //         case Direction.RightUp:
    //             return !((this.FallingDir === Direction.Right || this.FallingDir === Direction.Up) &&
    //                 (preTiled.FallingDir === Direction.Right || preTiled.FallingDir === Direction.Up));
    //         case Direction.LeftUp:
    //             return !((this.FallingDir === Direction.Left || this.FallingDir === Direction.Up) &&
    //                 (preTiled.FallingDir === Direction.Left || preTiled.FallingDir === Direction.Up));
    //     }
    //     return false;
    // }

    CheckCanArriveFromLineTiled(preTiled: Tiled, checkTiledMarked = true): boolean {

        const toptopBlocker: Blocker | null = this.TopTopBlocker();
        const middle: Blocker | null = this.MiddleBlocker();
        const isMagicHat: boolean = middle !== null && middle.IsMagicHat();
    
        if ((checkTiledMarked && this.Marked) || toptopBlocker !== null || !this.IsValidTiled() || (this.Occupy() && !isMagicHat) || (this.IsLocked() && !isMagicHat) || preTiled === null ||
            (checkTiledMarked && preTiled.Marked) || preTiled.IsLocked() || preTiled.InValidOrOccupy()) {
            return false;
        }
    
        // if (this.m_map.IsMoveDirection && this.OnCheckIsSameDirectionGroup(preTiled)) {
        //     return false;
        // }
    
        // if (preTiled.IsTeleportIn()) {
        //     if (this.IsTeleportOut()) {
        //         if (!this.IsTeleportSameGuid(preTiled)) {
        //             return false;
        //         }
        //         if (this.OnCheckTeleportStopFalling(preTiled)) {
        //             return false;
        //         }
        //         return true;
        //     } else {
        //         return false;
        //     }
        // }
    
        const row: number = this.Row - preTiled.Row;
        const col: number = this.Col - preTiled.Col;
        let tiledDirection: Direction = Direction.None;
    
        if (row > 1 || row < -1 || col > 1 || col < -1) {
            return false;
        }
    
        if (row === 0) {
            tiledDirection = col > 0 ? Direction.Right : Direction.Left;
        } else if (col === 0) {
            tiledDirection = row > 0 ? Direction.Down : Direction.Up;
        }
    
        if (this.OnCheckTiledBorderStopFalling(preTiled, tiledDirection)) {
            return false;
        }
    
        if (preTiled.FallingDir === tiledDirection) {
            // if (isMagicHat) {
            //     if (preTiled.CanMoveBlocker !== null
            //         && !preTiled.CanMoveBlocker.IsJelly() && !preTiled.CanMoveBlocker.IsBoxingGlove() && !preTiled.CanMoveBlocker.IsMagician()
            //         && preTiled.CanMoveBlocker.Color === middle.TableData.childid && middle.CurHP > 0) {
            //         this.m_tempStopFalling = true;
            //         return true;
            //     }
            // } else 
            {
                return !this.IsTeleportOut();
            }
        }
    
        return false;
    }

    StartFalling()
    {
        this.CanMoveBlocker.StartFalling();
    }

    StopFalling(toDir: Direction)
    {
        this.CanMoveBlocker.StopFalling(toDir);
        // RecyleIngredients();
    }
    
    FindMatchesAround(newList: Blocker[]): Blocker[] {
        if (!this.CanMatchCrush()) {
            return newList;
        }

        newList.push(this.CanMoveBlocker);

        const left = this.CanMoveBlocker.SelfTiled.GetNeighborLeft();
        if (left) {
            newList = left.FindLeftMoreMatches(this.CanMoveBlocker.Color, newList);
        }

        const right = this.CanMoveBlocker.SelfTiled.GetNeighborRight();
        if (right) {
            newList = right.FindRightMoreMatches(this.CanMoveBlocker.Color, newList);
        }

        const top = this.CanMoveBlocker.SelfTiled.GetNeighborTop();
        if (top) {
            newList = top.FindTopMoreMatches(this.CanMoveBlocker.Color, newList);
        }

        const bottom = this.CanMoveBlocker.SelfTiled.GetNeighborBottom();
        if (bottom) {
            newList = bottom.FindBottomMoreMatches(this.CanMoveBlocker.Color, newList);
        }

        this.FilterInvalidNeighbors(newList);

        return newList;
    }

    FindLeftMoreMatches(nID: number, newList: Blocker[]): Blocker[] {
        if (!this.CanMatchCrush()) {
            return newList;
        }

        if (this.CanMoveBlocker.Color === nID && !this.CanMoveBlocker.IsSameColor() && !TiledMap.BlockersIsHasTiled(newList, this.CanMoveBlocker.SelfTiled.Guid)) {
            newList = this.FindMatchesAround(newList);
            const left = this.CanMoveBlocker.SelfTiled.GetNeighborLeft();
            if (left) {
                return left.FindLeftMoreMatches(nID, newList);
            }
        }

        return newList;
    }

    FindRightMoreMatches(nID: number, newList: Blocker[]): Blocker[] {
        if (!this.CanMatchCrush()) {
            return newList;
        }

        if (this.CanMoveBlocker.Color === nID && !this.CanMoveBlocker.IsSameColor() && !TiledMap.BlockersIsHasTiled(newList, this.CanMoveBlocker.SelfTiled.Guid)) {
            newList = this.FindMatchesAround(newList);
            const right = this.CanMoveBlocker.SelfTiled.GetNeighborRight();
            if (right) {
                return right.FindRightMoreMatches(nID, newList);
            }
        }

        return newList;
    }

    FindTopMoreMatches(nID: number, newList: Blocker[]): Blocker[] {
        if (!this.CanMatchCrush()) {
            return newList;
        }

        if (this.CanMoveBlocker.Color === nID && !this.CanMoveBlocker.IsSameColor() && !TiledMap.BlockersIsHasTiled(newList, this.CanMoveBlocker.SelfTiled.Guid)) {
            newList = this.FindMatchesAround(newList);
            const top = this.CanMoveBlocker.SelfTiled.GetNeighborTop();
            if (top) {
                return top.FindTopMoreMatches(nID, newList);
            }
        }

        return newList;
    }

    FindBottomMoreMatches(nID: number, newList: Blocker[]): Blocker[] {
        if (!this.CanMatchCrush()) {
            return newList;
        }

        if (this.CanMoveBlocker.Color === nID && !this.CanMoveBlocker.IsSameColor() && !TiledMap.BlockersIsHasTiled(newList, this.CanMoveBlocker.SelfTiled.Guid)) {
            newList = this.FindMatchesAround(newList);
            const bottom = this.CanMoveBlocker.SelfTiled.GetNeighborBottom();
            if (bottom) {
                return bottom.FindBottomMoreMatches(nID, newList);
            }
        }

        return newList;
    }

    FilterInvalidNeighbors(newList: Blocker[]): void {
        let sameDirectionCount = 0;
        const m_neighborList: Tiled[] = [];
        for (let dir = 0; dir < 4; dir++) {
            let count = 0;
            const nID = this.CanMoveBlocker.Color;
            let nextTiled: Tiled | null = this.CanMoveBlocker.SelfTiled;
            while (nextTiled && nextTiled.CanMoveBlocker && nextTiled.CanMoveBlocker.Color === nID) {
                switch (dir) {
                    case 0:
                        nextTiled = nextTiled.GetNeighborLeft();
                        break;
                    case 1:
                        nextTiled = nextTiled.GetNeighborRight();
                        break;
                    case 2:
                        nextTiled = nextTiled.GetNeighborTop();
                        break;
                    case 3:
                        nextTiled = nextTiled.GetNeighborBottom();
                        break;
                }
                if (nextTiled && nextTiled.CanMoveBlocker && nextTiled.CanMoveBlocker.Color === nID) {
                    count++;
                    if (!TiledMap.TiledsIsHasTiled(m_neighborList, nextTiled.Guid)) {
                        m_neighborList.push(nextTiled);
                    }
                }
            }
            sameDirectionCount = count > 1 ? count : sameDirectionCount > 0 ? sameDirectionCount : 0;
        }

        const neighborCount = m_neighborList.length;
        if (sameDirectionCount === 0) {
            if (neighborCount < 2) {
                const index = newList.indexOf(this.CanMoveBlocker);
                if (index !== -1) {
                    newList.splice(index, 1);
                }
            } else if (neighborCount === 2) {
                for (const item of m_neighborList) {
                    if (!TiledMap.BlockersIsHasTiled(newList, item.Guid)) {
                        const index = newList.indexOf(this.CanMoveBlocker);
                        if (index !== -1) {
                            newList.splice(index, 1);
                        }
                        break;
                    }
                }
            }
        }
    }

    HasValidEnterPoint()
    {
        if (this.IsEnterPoint())
        {
            var preTiled = this.GetPrevTiled();
            if (null != preTiled)
            {
                if (this.CheckCanArriveFromLineTiled(preTiled))
                {
                    return false;
                }
                return true;
            }
            else
            {
                return true;
            }
        }
        return false;
    }

    private IsValidSlant(slantTiled: Tiled): boolean {
        return slantTiled !== null
            && !slantTiled.HasValidEnterPoint()
            && !slantTiled.IsConnectedToEnterPoint()
            && slantTiled.CheckCanArriveFromSlantTiled(this)
            && slantTiled.CanMoveBlocker === null;
    }
    
    public CheckSlantArriveTiled(checkTiled: Tiled | null = null): Tiled | null {
        let slantTiled: Tiled | null = this.GetLocalNeighborLeftBottom();
        if (this.IsValidSlant(slantTiled)) {
            return slantTiled;
        }
        slantTiled = this.GetLocalNeighborRightBottom();
        if (this.IsValidSlant(slantTiled)) {
            return slantTiled;
        }
        return null;
    }

    CheckCanFallingFromPrevTiled()
    {
        return this.FindPrevTiled() != null;
    }

    FindPrevTiled()
    {
        var preTiled = this.GetPrevTiled();
        if (null == preTiled)
        {
            return null;
        }
        if (!this.CheckCanArriveFromLineTiled(preTiled))
        {
            return null;
        }
        if (preTiled.IsLocked() || preTiled.InValidOrOccupy())
        {
            return null;
        }
        if (null != preTiled.CanMoveBlocker && (preTiled.CanMoveBlocker.MarkMatch || preTiled.CanMoveBlocker.CrushState || preTiled.CanMoveBlocker.Marked))
        {
            return null;
        }
        if (null != preTiled.CanMoveBlocker && this.CheckCanArriveFromLineTiled(preTiled))
        {
            return preTiled;
        }
        return preTiled.FindPrevTiled();
    }

    HasForbidMove(): boolean {
        for (let i = 0; i < this.m_blockerList.length; i++) {
            if (this.m_blockerList[i].ForbidMove()) {
                return true;
            }
        }
    
        return false;
    }

    HasTopBlock(): boolean {
        for (let i = 0; i < this.m_blockerList.length; i++) {
            if (this.m_blockerList[i].TableData.Data.Layer === BlockLayer.Top) {
                return true;
            }
        }
        return false;
    }

    GetIsMatchAround(id: number): boolean {
        const topBlocker = this.TopBlocker();
        const toptopBlocker = this.TopTopBlocker();

        if ((this.CanMoveBlocker?.ActiveMatch() ?? false) && (this.CanMoveBlocker?.Color ?? -1) === id 
            && (topBlocker === null || topBlocker.TableData.Data.SubType !== BlockSubType.HideMiddle) && toptopBlocker === null) {
            return true;
        }
        return false;
    }

    CanSwitchInDirection(direction: Direction) : boolean
    {
        return true;
    }

    CanMatchCrush()
    {
        if (this.CanMoveBlocker == null || !this.CanMoveBlocker.ActiveMatch() || this.CanMoveBlocker.MarkMatch || this.CanMoveBlocker.Falling || this.CanMoveBlocker.CrushState
            || this.CanMoveBlocker.IsNoColor() || this.CanMoveBlocker.Color <= 0)
        {
            return false;
        }

        var toptopBlk = this.TopTopBlocker();
        if (toptopBlk != null)
        {
            return false;
        }

        var topBlk = this.TopBlocker();
        if (null != topBlk && (topBlk.MarkMatch || topBlk.TableData.Data.SubType == BlockSubType.HideMiddle))
        {
            return false;
        }
        return true;
    }

    IsCanCrushBottomBlocker()
    {
        let matchBlocker = this.MatchBlocker;
        if (null != matchBlocker)
        {
            return matchBlocker.IsCanCrushBottomBlocker();
        }
        return true;
    }

    CheckTriggerFall()
    {
        FallingManager.Instance.OnTriggerFalling(this);
        if (null != this.GetNextTiled() && this.GetNextTiled().CanArrive())
        {
            FallingManager.Instance.OnTriggerFalling(this.GetNextTiled());
        }
        else
        {
            var slantTiled = this.CheckSlantArriveTiled();
            if (null != slantTiled)
            {
                FallingManager.Instance.OnTriggerFalling(slantTiled);
            }
        }
    }

    private m_DelayUpdateToSpecialTimer: Timer | null = null;

    public DelayUpdateToSpecial(): void 
    {
        if (this.m_DelayUpdateToSpecialTimer == null) 
        {
            FallingManager.Instance.AddDelayCount();

            let timerData = new TimerData();
            timerData.type = TimerType.enOnce;
            timerData.objthis = this;
            timerData.interval = 0.3;
            timerData.body = ()=>
            {
                this.m_DelayUpdateToSpecialTimer = null;
                FallingManager.Instance.RemoveDelayCount();
                this.UpdateToSpecial(this.GetSpecialID(), BornEffect.commonBorn);
                this.SetSpecialID(BlockerID.none);
            }
            TimerManager.Instance.CreateTimer(timerData);
        }
    }

    public UpdateToSpecial(
        id: number,
        effectType: BornEffect,
        playRebound: boolean = false,
        needTarget: boolean = false,
        isShowDes: boolean = true,
        needFalling: boolean = true
    ): void {
        // 生成顶层
        const tableData = Game.GetBlockData(id);
        if ((tableData.Data.Layer === BlockLayer.Top /*&& !JellyBlocker.IsJellyBlocker(id)*/) || tableData.Data.Layer === BlockLayer.Bottom) {
            const blocker = BlockerManager.getInstance().Build(id, this);
            this.AddBlocker(blocker);

            // if (CandyBagBlocker.IsHaveSugarCandyBag(id) || CandyBagBlocker.IsNotHaveSugarCandyBag(id)) {
            //     (blocker as CandyBagBlocker)?.OnUpdateToCandyBag();
            // }
        } else {
            let baseid = BlockerID.baseredid;
            if (this.CanMoveBlocker !== null) {
                baseid = this.CanMoveBlocker.ID;
                this.CanMoveBlocker.ImediateDestroyWithoutTriggerFalling(needTarget, isShowDes, needFalling);
            }

            if (tableData.HasAction(FirstActionType.Move) /*|| JellyBlocker.IsJellyBlocker(id)*/) {
                this.CanMoveBlocker = BlockerManager.getInstance().Build(id, this, baseid, null, effectType);
                // if (playRebound) {
                //     this.CanMoveBlocker.PlayDropEndAnimation(Direction.Down);
                // }
            } else {
                const blocker = BlockerManager.getInstance().Build(id, this);
                this.AddBlocker(blocker);
            }
        }
    }

    public AddBlocker(blocker: Blocker, isSetSelfTiled: boolean = true): void {
        if (blocker.Occupy() && blocker.TableData.Data.Layer === BlockLayer.Middle) {
            this.m_isNeedGen = false;
        }
        this.m_blockerList.push(blocker);
    
        if (isSetSelfTiled) {
            blocker.SelfTiled = this;
        }
    }
    
    public RemoveBlocker(blocker: Blocker, isNotify: boolean = true): void {
        const index = this.m_blockerList.indexOf(blocker);
        if (index !== -1) {
            this.m_blockerList.splice(index, 1);
        }
        if (blocker.Occupy() && blocker.TableData.Data.Layer === BlockLayer.Middle && isNotify) {
            FallingManager.Instance.OnTriggerFalling(this);
        }
    }

    GetEliminableBorder(blockerId: BlockerID)
    {
        return null;
    }

    IsBelongBlindsBlock()
    {
        return false;
    }

    HasCantPassiveMatchTop()
    {
        return false;
    }

    public DestroyTopAndMiddleBlockers(id: number, checkTop: boolean = false): boolean {
        if (this.CanMoveBlocker !== null && this.CanMoveBlocker.ID === id && !this.CanMoveBlocker.PassiveMatch()) {
            const effectType = this.CanMoveBlocker.MatchEffectType;
            // Middle
            if (/*!JellyBlocker.IsJellyBlocker(this.CanMoveBlocker.ID) && 
                !MultiLayerBlocker.IsWalnut(this.CanMoveBlocker.ID) && */
                !checkTop) {
                if (!this.HasTopBlock()) {
                    const leftBorder = this.GetEliminableBorder(BlockerID.left_candy);
                    const topBorder = this.GetEliminableBorder(BlockerID.top_candy);
                    const bottom = this.GetNeighborBottom();
    
                    if (bottom !== null && bottom.GetEliminableBorder(BlockerID.top_candy) === null
                        && (bottom.TopTopBlocker() === null || bottom.IsBelongBlindsBlock())) {
                        bottom.TriggerAroundDestroyBlocker(this.CanMoveBlocker, effectType);
                    }
    
                    const left = this.GetNeighborLeft();
                    if (left !== null && leftBorder === null
                        && (left.TopTopBlocker() === null || left.IsBelongBlindsBlock())) {
                        left.TriggerAroundDestroyBlocker(this.CanMoveBlocker, effectType);
                    }
    
                    const top = this.GetNeighborTop();
                    if (top !== null && topBorder === null
                        && (top.TopTopBlocker() === null || top.IsBelongBlindsBlock())) {
                        top.TriggerAroundDestroyBlocker(this.CanMoveBlocker, effectType);
                    }
    
                    const right = this.GetNeighborRight();
                    if (right !== null && right.GetEliminableBorder(BlockerID.left_candy) === null
                        && (right.TopTopBlocker() === null || right.IsBelongBlindsBlock())) {
                        right.TriggerAroundDestroyBlocker(this.CanMoveBlocker, effectType);
                    }
                }
            }
    
            // Top
            let block: Blocker | null = null;
            for (let i = 0; i < this.m_blockerList.length; i++) {
                if (this.m_blockerList[i].CheckIsTop()) {
                    block = this.m_blockerList[i];
                    break;
                }
            }
    
            if (block !== null) {
                block.DecrHP();
    
                // // TODO: 收集排队飞
                // if (effectType === EffectType.BaseCrush) {
                //     block.WaitCollect = LevelManager.Instance.WaitTimes * (TiledMap.WAIT_FLY_TIME * EffectBaseCrush.WAIT_MULTI) + TiledMap.WAIT_FLY_TIME;
                //     LevelManager.Instance.WaitTimes++;
                // }
    
                if (block.Destroy(this) === null) {
                    const index = this.m_blockerList.indexOf(block);
                    if (index !== -1) {
                        this.m_blockerList.splice(index, 1);
                    }
                }
    
                this.CanMoveBlocker.MarkMatch = false;
                // this.CanMoveBlocker.SelfTiled.IsExpandGrapeJuice = false;
                // this.CanMoveBlocker.DisableSameColorCrushAnim();
                this.CanMoveBlocker.DelayCheck(0.2);
    
                return true;
            }
    
            // // 果冻
            // if (JellyBlocker.IsJellyBlocker(this.CanMoveBlocker.ID)) {
            //     // TODO: 收集排队飞
            //     if (effectType === EffectType.BaseCrush) {
            //         this.CanMoveBlocker.WaitCollect = LevelManager.Instance.WaitTimes * (TiledMap.WAIT_FLY_TIME * EffectBaseCrush.WAIT_MULTI) + TiledMap.WAIT_FLY_TIME;
            //         LevelManager.Instance.WaitTimes++;
            //     }
    
            //     this.CanMoveBlocker.Destroy(this);
    
            //     return true;
            // }
        }
    
        return false;
    }

    ChangeChameleonColor(id: number)
    {
        return false;
    }

    IsSameColorBaseDestroy(type: EffectType)
    {
        return type == EffectType.SameColorBase || type == EffectType.MagicWand;
    }

    private TriggerAroundDestroyBlocker(triggerBlocker: Blocker, effectType: EffectType): void {
        if (triggerBlocker == null) {
            console.log("TriggerAroundDestroyBlocker error triggerBlocker is null, effectType:" + effectType);
            return;
        }
    
        if (TiledMap.getInstance().FindDestroyedTiled(this)) {
            return;
        }
    
        const crushBaseId = triggerBlocker.Color;
        if (this.HasCantPassiveMatchTop()) {
            return;
        }
    
        if ((effectType === EffectType.BaseCrush || this.IsSameColorBaseDestroy(effectType)) && this.ChangeChameleonColor(crushBaseId)) {
            return;
        }
    
        const isCanTriggerNearMatch = !triggerBlocker.IsChameleon() || (triggerBlocker.IsChameleon() && ColorManager.IsBaseColor(triggerBlocker.Color));
    
        let block: Blocker = null;
        let index = -1;
        let topLayer = BlockLayer.None;
    
        for (let i = 0; i < this.m_blockerList.length; i++) {
            if (this.m_blockerList[i] !== null && this.m_blockerList[i].IsBlinds() && (effectType === EffectType.BaseCrush || this.IsSameColorBaseDestroy(effectType))) {
                block = this.m_blockerList[i];
                break;
            }
        }
    
        if (block == null) {
            for (let i = 0; i < this.m_blockerList.length; i++) {
                if (this.m_blockerList[i] !== null) {
                    if ((effectType === EffectType.BaseCrush 
                        || this.IsSameColorBaseDestroy(effectType) 
                        || (this.m_blockerList[i].NearMatch() && isCanTriggerNearMatch && !this.m_blockerList[i].IsTriggerEffect && !this.m_blockerList[i].IsSwitching) 
                        && this.m_blockerList[i].Occupy() 
                        && (this.m_blockerList[i].TableData.Data.Layer === BlockLayer.Middle || this.m_blockerList[i].TableData.Data.Layer === BlockLayer.Top || this.m_blockerList[i].IsBlinds()) 
                        && this.m_blockerList[i].PassiveMatch())) {

                        const layer = this.m_blockerList[i].TableData.Data.Layer;
                        if (layer === BlockLayer.BelowBottom && index === -1) {
                            topLayer = layer;
                            index = i;
                        } else {
                            if (topLayer === BlockLayer.BelowBottom) {
                                topLayer = layer;
                                index = i;
                            } else if (layer !== BlockLayer.BelowBottom && layer > topLayer) {
                                topLayer = layer;
                                index = i;
                            }
                        }
                    }
                } else {
                    this.m_blockerList.splice(i, 1);
                    i--;
                    console.log("TriggerAroundDestroyBlocker error m_blockerList has null m_blockerList.count:" + this.m_blockerList.length + ", i:" + i + ", effectType:" + effectType);
                }
            }
    
            if (index !== -1 && this.m_blockerList[index] !== null) {
                block = this.m_blockerList[index];
            }
        }
    
        if (block !== null) {
            block.MatchEffectType = EffectType.None;
            // if (block instanceof MacaronBoxComBlocker) {
            //     const com = block as MacaronBoxComBlocker;
            //     com.TryPassiveMatchByColor(crushBaseId, LevelManager.Instance.WaitTimes * (TiledMap.WAIT_FLY_TIME * EffectBaseCrush.WAIT_MULTI) + TiledMap.WAIT_FLY_TIME);
            //     LevelManager.Instance.WaitTimes++;
            // } else if (block instanceof CommonDestroyableComBlocker) {
            //     (block as CommonDestroyableComBlocker).DecrHpJudgeGuid(this.IsSameColorBaseDestroy(effectType), triggerBlocker.MatchGuid);
            // } else if (block instanceof DynamicRemoveComBlocker) {
            //     (block as DynamicRemoveComBlocker).DecrHpJudgeGuid(this.IsSameColorBaseDestroy(effectType), triggerBlocker.MatchGuid);
            // } else if (block instanceof JuiceComBlocker) {
            //     (block as JuiceComBlocker).DecrHpJudgeColor(triggerBlocker.Color);
            // } else 
            {
                block.DecrHP();
                // // TODO: 收集排队飞
                // if (effectType === EffectType.BaseCrush) {
                //     block.WaitCollect = LevelManager.Instance.WaitTimes * (TiledMap.WAIT_FLY_TIME * EffectBaseCrush.WAIT_MULTI) + TiledMap.WAIT_FLY_TIME;
                //     LevelManager.Instance.WaitTimes++;
                // }
                if (block.Destroy(this) === null) {
                    this.m_blockerList.splice(this.m_blockerList.indexOf(block), 1);
                }
                if (!block.IsButterCookies() && !this.IsSameColorBaseDestroy(effectType)) {
                    TiledMap.getInstance().AddDestroyedTiled(this);
                }
                // if (this.m_canMove !== null) {
                //     this.m_canMove.DisableSameColorCrushAnim();
                // }
            }
        } else {
            if (null !== this.CanMoveBlocker && (effectType === EffectType.BaseCrush || this.IsSameColorBaseDestroy(effectType) || this.CanMoveBlocker.NearMatch())) {
                // if (this.CanMoveBlocker.IsIngredient()) {
                //     this.CanMoveBlocker.PlayAnimation(Blocker.AnimState.match);
                // }
                if (this.CanMoveBlocker.PassiveMatch() && !this.CanMoveBlocker.Falling) {
                    this.CanMoveBlocker.MatchEffectType = EffectType.None;
                    // // TODO: 收集排队飞
                    // if (effectType === EffectType.BaseCrush) {
                    //     this.CanMoveBlocker.WaitCollect = LevelManager.Instance.WaitTimes * (TiledMap.WAIT_FLY_TIME * EffectBaseCrush.WAIT_MULTI) + TiledMap.WAIT_FLY_TIME;
                    //     LevelManager.Instance.WaitTimes++;
                    // }
                    if (this.CanMoveBlocker.IsLight() || this.CanMoveBlocker.IsOrangeJamJar()) {
                        if (!this.IsSameColorBaseDestroy(effectType)) {
                            TiledMap.getInstance().AddDestroyedTiled(this);
                        }
                    } else {
                        TiledMap.getInstance().AddDestroyedTiled(this);
                    }
                    this.CanMoveBlocker.DecrHP();
                    this.DestroyBlocker(this.CanMoveBlocker.ID, true, false);
                }
            }
        }
    }

    public DestroyBlocker(id: number, isMatch: boolean = true, destroyMiddle: boolean = true): void {
        if (destroyMiddle) {
            this.DestroyTopAndMiddleBlockers(id);
        }
    
        if (this.CanMoveBlocker !== null && this.CanMoveBlocker.ID === id) {
            if (!isMatch) {
                this.CanMoveBlocker.Destroy(this);
            } else {
                // if (this.CanMoveBlocker.IsChameleon()) {
                //     const chameleonBlocker = this.CanMoveBlocker as ChameleonBlocker;
                //     if (chameleonBlocker.ChangeColorIfNeverChanged()) {
                //         this.CanMoveBlocker.MarkMatch = false;
                //         this.CanMoveBlocker.CrushState = false;
                //         this.CanMoveBlocker.CurHP += 1;
                //         this.CanMoveBlocker.DisableSameColorCrushAnim();
                //         chameleonBlocker.ChangeColorState = EnChangeColorState.Normal;
                //         return;
                //     }
                // }
    
                // if (!JellyBlocker.IsJellyBlocker(this.CanMoveBlocker.ID)) {
                //     const effectType = this.CanMoveBlocker.MatchEffectType;
                //     if (effectType !== EffectType.BaseCrush && effectType !== EffectType.SameColor) {
                //         const isLine = this.CanMoveBlocker.IsLineBlocker();
    
                //         if (isLine) {
                //             if (LineBlocker.IsVLineBlocker(this.CanMoveBlocker.ID)) {
                //                 const topTiled = this.CanMoveBlocker.SelfTiled?.GetNeighborTop();
                //                 const bottomTiled = this.CanMoveBlocker.SelfTiled?.GetNeighborBottom();
                //                 if (topTiled !== null && topTiled.CanMoveBlocker !== null && topTiled.CanMoveBlocker.IsChameleon()
                //                     || bottomTiled !== null && bottomTiled.CanMoveBlocker !== null && bottomTiled.CanMoveBlocker.IsChameleon()) {
                //                     isLine = false;
                //                 }
                //             } else {
                //                 const leftTiled = this.CanMoveBlocker.SelfTiled?.GetNeighborLeft();
                //                 const rightTiled = this.CanMoveBlocker.SelfTiled?.GetNeighborRight();
                //                 if (leftTiled !== null && leftTiled.CanMoveBlocker !== null && leftTiled.CanMoveBlocker.IsChameleon()
                //                     || rightTiled !== null && rightTiled.CanMoveBlocker !== null && rightTiled.CanMoveBlocker.IsChameleon()) {
                //                     isLine = false;
                //                 }
                //             }
                //         }
    
                //         const isChangeAll = this.CanMoveBlocker.ChangeColorState !== EnChangeColorState.NotAll;
                //         const isChangeBottom = this.CanMoveBlocker.ChangeColorState !== EnChangeColorState.NotVer
                //             && this.CanMoveBlocker.ChangeColorState !== EnChangeColorState.NotHorAndBottom
                //             && isChangeAll;
                //         const isChangeTop = this.CanMoveBlocker.ChangeColorState !== EnChangeColorState.NotVer
                //             && this.CanMoveBlocker.ChangeColorState !== EnChangeColorState.NotHorAndTop
                //             && isChangeAll;
                //         const isChangeLeft = this.CanMoveBlocker.ChangeColorState !== EnChangeColorState.NotHor
                //             && this.CanMoveBlocker.ChangeColorState !== EnChangeColorState.NotVerAndLeft
                //             && isChangeAll;
                //         const isChangeRight = this.CanMoveBlocker.ChangeColorState !== EnChangeColorState.NotHor
                //             && this.CanMoveBlocker.ChangeColorState !== EnChangeColorState.NotVerAndRight
                //             && isChangeAll;
    
                //         const leftBorder = this.GetEliminableBorder(BlockerID.left_candy);
                //         const topBorder = this.GetEliminableBorder(BlockerID.top_candy);
                //         const bottom = this.GetNeighborBottom();
    
                //         if (bottom !== null && bottom.GetEliminableBorder(BlockerID.top_candy) === null && isChangeBottom) {
                //             bottom.ChangeChameleonColor(this.CanMoveBlocker.Color, effectType, isLine);
                //         }
    
                //         const left = this.GetNeighborLeft();
                //         if (left !== null && leftBorder === null && isChangeLeft) {
                //             left.ChangeChameleonColor(this.CanMoveBlocker.Color, effectType, isLine);
                //         }
    
                //         const top = this.GetNeighborTop();
                //         if (top !== null && topBorder === null && isChangeTop) {
                //             top.ChangeChameleonColor(this.CanMoveBlocker.Color, effectType, isLine);
                //         }
    
                //         const right = this.GetNeighborRight();
                //         if (right !== null && right.GetEliminableBorder(BlockerID.left_candy) === null && isChangeRight) {
                //             right.ChangeChameleonColor(this.CanMoveBlocker.Color, effectType, isLine);
                //         }
    
                //         this.CanMoveBlocker.ChangeColorState = EnChangeColorState.Normal;
                //     }
                // }
    
                if (this.m_specialBlockerIdx <= 0) {
                    // if (!JellyBlocker.IsJellyBlocker(this.CanMoveBlocker.ID))
                    {
                        this.CanMoveBlocker.Destroy(this);
                    }
                }
            }
        } else {
            for (let i = this.m_blockerList.length - 1; i >= 0; i--) {
                const blocker = this.m_blockerList[i];
                if (blocker.ID !== id) {
                    continue;
                }
    
                if (blocker.Destroy(this) === null) {
                    if (!blocker.IsCoCo()) {
                        const index = this.m_blockerList.indexOf(blocker);
                        if (index !== -1) {
                            this.m_blockerList.splice(index, 1);
                        }
                    }
                }
    
                // if (this.CanMoveBlocker !== null) {
                //     this.CanMoveBlocker.DisableSameColorCrushAnim();
                // }
                break;
            }
        }
    }    
    
    public SwitchCanMoveBlocker(otherTiled: Tiled, setLocalPosition: boolean = true): void {
        const tempOther = otherTiled.CanMoveBlocker;
        otherTiled.CanMoveBlocker = this.CanMoveBlocker;
        if (otherTiled.CanMoveBlocker !== null) {
            otherTiled.CanMoveBlocker.SelfTiled = otherTiled;

            if (setLocalPosition) {
                otherTiled.CanMoveBlocker.LocalPosition = otherTiled.LocalPosition;
            }
        }
    
        this.CanMoveBlocker = tempOther;
        if (this.CanMoveBlocker !== null) {
            this.CanMoveBlocker.SelfTiled = this;
            
            if (setLocalPosition) {
                this.CanMoveBlocker.LocalPosition = this.LocalPosition;
            }
        }
    }

    public CanSwitch()
    {
        if (!this.IsValidTiled())
        {
            return false;
        }
        return this.CanMoveBlocker != null && !this.CanMoveBlocker.ForbidSwitch() && !this.HasForbidSwitch();
    }


    HasForbidSwitch()
    {
        for (let i = 0; i < this.m_blockerList.length; i++)
        {
            if (this.m_blockerList[i].ForbidSwitch())
            {
                return true;
            }
        }

        return false;
    }
}

export class NormalTiled extends Tiled{

    Create(idx: number, data: LevelTiledData, parent: cc.Node, row: number, col: number, name: string)
    {
        this.m_tiledTableData = data;
        this.Row = row;
        this.Col = col;
        this.Guid = idx;

        this.m_tiledRoot = new cc.Node(name);
        this.m_tiledRoot.setParent(parent);
        this.m_tiledRoot.setPosition(col * Tiled.WIDTH, -row * Tiled.HEIGHT);

        Game.LoadingAssetCount++;
        Game.LoadingAssetCount++;
        cc.resources.load("prefab/tiled/NormalTiled", (err, data: any) =>{
            this.m_tiled = cc.instantiate(data);
            this.m_tiled.setParent(this.m_tiledRoot);
            this.m_tiled.setPosition(0, 0);
            this.Bg = this.m_tiled.getChildByName("Bg");
            this.OverCastRoot = this.m_tiled.getChildByName("OverCast");
            Game.LoadingAssetCount--;

            if (this.m_tiledTableData.type == TiledType.Normal || this.m_tiledTableData.type == TiledType.Empty)
            {
                Utils.SetNodeActive(this.Bg, true);

            }
            else if (this.m_tiledTableData.type == TiledType.None)
            {
                Utils.SetNodeActive(this.Bg, false);
            }

            cc.resources.load("prefab/tiled/TiledOverCast", (err, data: any) =>{
                let com: cc.Node = cc.instantiate(data);
                this.OverCastCom = com.getComponent(TiledOverCastCom);
                this.OverCastCom.node.setParent(this.OverCastRoot);
                Game.LoadingAssetCount--;
            });

        })
    }

    GenerateBlocker()
    {
        if (!this.IsValidTiled())
        {
            return;
        }
        let isHave: boolean = !this.m_isNeedGen;
        this.m_stickyBlockerId = -1;
        let canMoveId: number = -1;

        for (let i = 0; i < this.m_tiledTableData.blockDataList.length; i++) {
            let id: number = this.m_tiledTableData.blockDataList[i].id;
            let blockdata = Game.GetBlockData(id);

            if (blockdata.HasAction(FirstActionType.Sticky)) {
                this.m_stickyBlockerId = id;
            }

            if (blockdata.HasAction(FirstActionType.Move)) {
                canMoveId = id;
            }
        }

        for (let i = 0; i < this.m_tiledTableData.blockDataList.length; i++) {
            let id: number = this.m_tiledTableData.blockDataList[i].id;

            let blockdata = Game.GetBlockData(id);

            if (blockdata.HasAction(FirstActionType.Move) && this.m_stickyBlockerId > -1) {
                continue;
            }

            if (blockdata.Data.MultiTiled)
            {
                continue;
            }

            let blocker: Blocker;
            if (blockdata.HasAction(FirstActionType.Sticky)) {
                if (canMoveId === -1) continue;
                blocker = BlockerManager.getInstance().Build(id, this, canMoveId);
            } else {
                blocker = BlockerManager.getInstance().Build(id, this);
            }

            if (blocker.CanMove() || blocker.IsSticky()) {
                if (this.m_isNeedGen) {
                    this.CanMoveBlocker = blocker;
                    isHave = true;
                }

            } else {
                this.m_blockerList.push(blocker);
            }

            if (blocker.Occupy() && blockdata.Data.Layer === BlockLayer.Middle) {
                isHave = true;
            }
        }

        if (this.CanMoveBlocker !== null) {
            this.m_stickyBlockerId = -1;
        }

        if (this.m_tiledTableData.type === TiledType.Empty) {
            isHave = true;
        }
        this.m_isNeedGen = !isHave;

    }

    GenerateCanMoveCheckMatch()
    {
        if (!this.m_isNeedGen)
        {
            return;
        }
        if (this.m_isNeedGen)
        {

            // if (this.m_stickyBlockerId > -1)
            // {
            //     //int id = LevelManager.Instance.FilterRandomID(m_row, m_col);
            //     let id;
            //     do
            //     {
            //         id = LevelManager.Instance.FilterRandomID(m_row, m_col);
            //     } while (BlockerManager.Instance.CheckNeighborId(this, id));

            //     let blk = BlockerManager.getInstance().Build(this.m_stickyBlockerId, this, id);
            //     this.CanMoveBlocker = blk;
            // }
            // else
            {
                this.CanMoveBlocker = BlockerManager.getInstance().GenerateNoMatch(this.Row, this.Col, this);
            }
            //m_canMove.localPosition = m_tieldRoot.transform.localPosition;
            this.m_stickyBlockerId = -1;
        }
        this.m_isNeedGen = false;
    }

    GenerateCanMove(id: number)
    {
        if (this.m_isNeedGen)
        {
            this.CanMoveBlocker = BlockerManager.getInstance().Build(id, this, -1, null);
            this.m_isNeedGen = false;
        }
    }

    IsNeedGen()
    {
        return this.m_isNeedGen && this.m_stickyBlockerId <= 0;
    }

    CanGenerateCanSwitchBlocker()
    {
        if (!this.IsValidTiled())
        {
            return false;
        }

        return this.m_isNeedGen && !this.HasForbidSwitch();
    }

    public CanMove(): boolean {
        if (!this.IsValidTiled()) {
            return false;
        }
    
        for (let i = 0; i < this.m_blockerList.length; i++) {
            if (this.m_blockerList[i].TableData.Data.Layer === BlockLayer.Middle) {
                return false;
            }
        }
    
        return this.CanMoveBlocker !== null && this.CanMoveBlocker.CanMove() && !this.HasForbidMove();
    }

    IsTeleportIn()
    {
        return false;
    }

    CanArrive(pre: Tiled = null)
    {
        if (!this.IsValidTiled())
        {
            return false;
        }

        if (this.Marked)
        {
            return false;
        }

        if (this.CanMoveBlocker != null)
        {
            return false;
        }

        for (let i = 0; i < this.m_blockerList.length; i++)
        {
            // if (this.m_blockerList[i].IsMagicHat() && this.TopTopBlocker() == null)
            // {
            //     //if curTiled have no Pre Tiled or preTiled have blocker is not include in {Jelly, BoxingGlove, Magician} and 
            //     if (pre == null || (pre != null && pre.CanMoveBlocker != null && !pre.CanMoveBlocker.IsJelly() && !pre.CanMoveBlocker.IsBoxingGlove() && !pre.CanMoveBlocker.IsMagician()
            //         && pre.CanMoveBlocker.Color == this.m_blockerList[i].TableData.childid && this.m_blockerList[i].CurHP > 0))
            //     {
            //         return true;
            //     }
            // }

            if (this.m_blockerList[i].Occupy())
            {
                return false;
            }
        }
        return true;
    }

    CanGoIn()
    {
        return this.CanArrive();
    }

    public GenerateMultiTiledBlocker(): void {
        for (let i = 0; i < this.m_tiledTableData.blockDataList.length; i++) {
            const id = this.m_tiledTableData.blockDataList[i].id;
            const blockdata = Game.GetBlockData(id);
            if (blockdata.Data.MultiTiled) {
                this.GenerateMultiTiledBlockerById(id);
            }
        }
    }
    
    public GenerateMultiTiledBlockerById(id: number, row: number = -1, col: number = -1): void {
        const realRow = row <= 0 ? MultiTiledBlocker.DEFAULT_AREA_ROW : row;
        const realCol = col <= 0 ? MultiTiledBlocker.DEFAULT_AREA_COL : col;
    
        const multiTiledBlocker = BlockerManager.getInstance().BuildMultiTiledBlocker(id, this, realRow, realCol) as MultiTiledBlocker;
    
        if (multiTiledBlocker) {
            // if (multiTiledBlocker.IsRomanColumn() || multiTiledBlocker.IsSawmill()) {
            //     const dataList = multiTiledBlocker.IsSawmill()
            //         ? LevelManager.Instance.Map.SawmillBlockDatas
            //         : LevelManager.Instance.Map.RomanColumnBlockDatas;
            //     let data: SawmillAndRomanBlockData = new SawmillAndRomanBlockData();
            //     for (let i = 0; i < dataList.length; i++) {
            //         if (dataList[i].Index === this.Guid) {
            //             data = dataList[i];
            //             break;
            //         }
            //     }
    
            //     switch (data.Direction) {
            //         case Direction.Left:
            //             for (let i = 0; i < data.TotalCount; i++) {
            //                 const comTiled = Map.GetTiled(multiTiledBlocker.SelfTiled.Row, multiTiledBlocker.SelfTiled.Col - i);
            //                 if (comTiled.IsValidTiled()) {
            //                     multiTiledBlocker.GenerateMultiTiledComBlocker(comTiled, i);
            //                 }
            //             }
            //             break;
            //         case Direction.Up:
            //             for (let i = 0; i < data.TotalCount; i++) {
            //                 const comTiled = Map.GetTiled(multiTiledBlocker.SelfTiled.Row - i, multiTiledBlocker.SelfTiled.Col);
            //                 if (comTiled.IsValidTiled()) {
            //                     multiTiledBlocker.GenerateMultiTiledComBlocker(comTiled, i);
            //                 }
            //             }
            //             break;
            //         case Direction.Right:
            //             for (let i = 0; i < data.TotalCount; i++) {
            //                 const comTiled = m_map.GetTiled(multiTiledBlocker.SelfTiled.Row, multiTiledBlocker.SelfTiled.Col + i);
            //                 if (comTiled.IsValidTiled()) {
            //                     multiTiledBlocker.GenerateMultiTiledComBlocker(comTiled, i);
            //                 }
            //             }
            //             break;
            //         case Direction.Down:
            //             for (let i = 0; i < data.TotalCount; i++) {
            //                 const comTiled = m_map.GetTiled(multiTiledBlocker.SelfTiled.Row + i, multiTiledBlocker.SelfTiled.Col);
            //                 if (comTiled.IsValidTiled()) {
            //                     multiTiledBlocker.GenerateMultiTiledComBlocker(comTiled, i);
            //                 }
            //             }
            //             break;
            //     }
            //     return;
            // }
    
            for (let j = 0; j < multiTiledBlocker.AreaRow; j++) {
                for (let k = 0; k < multiTiledBlocker.AreaCol; k++) {
                    const comTiled = TiledMap.getInstance().GetTiled(multiTiledBlocker.SelfTiled.Row + j, multiTiledBlocker.SelfTiled.Col + k);
                    if (comTiled.IsValidTiled()) {
                        const index = j * multiTiledBlocker.AreaCol + k;
                        multiTiledBlocker.GenerateMultiTiledComBlocker(comTiled, index);
                    }
                }
            }
        }
    }
    
}

export class EntryTiled extends Tiled {

    m_specialDropIndex: number = 0;
    m_entryBlockerRoot: cc.Node = null;

    Create(idx: number, data: LevelTiledData, parent: cc.Node, row: number, col: number, name: string)
    {
        this.m_tiledTableData = data;

        let offsetX = 0, offsetY = 0;
        switch (this.m_tiledTableData.direction)
        {
            case Direction.Down: offsetY = -1; break;
            case Direction.Left: offsetX = 1; break;
            case Direction.Right: offsetX = -1; break;
            case Direction.Up: offsetY = 1; break;
            default: offsetY = -1; break;
        }
        this.Row = row + offsetY;
        this.Col = col + offsetX;
        
        this.Guid = TiledMap.ENTRY_GUID_OFFSET + idx;

        let localPos = new cc.Vec2(this.Col * Tiled.WIDTH, -this.Row * Tiled.HEIGHT);
        this.m_tiledRoot = new cc.Node(name);
        this.m_tiledRoot.setParent(parent);
        this.m_tiledRoot.setPosition(localPos);

        Game.LoadingAssetCount++;
        cc.resources.load("prefab/tiled/EntryTiled", (err, data: any) =>{
            this.m_tiled = cc.instantiate(data);
            this.m_tiled.setParent(this.m_tiledRoot);
            this.m_tiled.setPosition(0, 0);

            Game.LoadingAssetCount--;
        });

        Game.LoadingAssetCount++;
        cc.resources.load("prefab/blocker/EntryBlockRoot", (err, data: any) =>{
            this.m_entryBlockerRoot = cc.instantiate(data);
            this.m_entryBlockerRoot.setParent(TiledMap.getInstance().m_blockerRoot);
            this.m_entryBlockerRoot.setPosition(localPos);
            this.m_entryBlockerRoot.zIndex = BlockZIndex.Special;

            Game.LoadingAssetCount--;
        });
    }

    IsEnterPoint()
    {
        return true;
    }
    CanMove()
    {
        return true;
    }
    CanGoIn()
    {
        return true;
    }

    RandomBlocker(offsetY: number = 0)
    {
        if (!this.IsValidTiled())
        {
            return false;
        }
        if (null == this.CanMoveBlocker)
        {
            let blocker : Blocker = null;
            let dropguid = this.NextTiledGuid;
            var dropdata = TiledMap.getInstance().DropSpawner.Spawner(dropguid);

            if (this.m_tiledTableData.specialDropList.length > 0 &&
                this.m_specialDropIndex < this.m_tiledTableData.specialDropList.length)
            {
                let id = this.m_tiledTableData.specialDropList[this.m_specialDropIndex++];
                blocker = BlockerManager.getInstance().Build(id, this, -1, this.m_entryBlockerRoot);
            }

            if (blocker == null)
            {
                if (null != dropdata)
                {
                    let id = dropdata.id;
                    let parent = -1;
                    // if (JellyBlocker.IsJellyBlocker(id))
                    // {
                    //     parent = m_map.DropSpawner.DropBaseColor(dropguid);
                    // }
                    blocker = BlockerManager.getInstance().Build(id, this, parent, this.m_entryBlockerRoot);
                    TiledMap.getInstance().DropSpawner.UpdateData(id, dropguid);
                }
                else
                {
                    // let id = TiledMap.getInstance().DropSpawner.DropBaseColor(dropguid);
                    let id = TiledMap.getInstance().RandomID();
                    blocker = BlockerManager.getInstance().Build(id, this, -1, this.m_entryBlockerRoot);

                    TiledMap.getInstance().DropSpawner.UpdateData(id, dropguid);
                }
            }
            
            this.CanMoveBlocker = blocker;
            // this.CanMoveBlocker.ChangeSortLayer(m_sortingLayer);
            
            return true;
        }
        return false;
    }
}
