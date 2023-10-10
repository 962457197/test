// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../../Game";
import { Utils } from "../../tools/Utils";
import { Blocker } from "../blocker/Blocker";
import { BlockLayer, BlockSubType, BlockerID, BlockerManager } from "../blocker/BlockerManager";
import { FirstActionType } from "../../table/BlockTable";
import { Direction, LevelTiledData, TiledType } from "../data/LevelScriptableData";
import { Tiled } from "./Tiled";
import { TiledMap } from "./TiledMap";

export class NormalTiled extends Tiled{

    EnterPoint: Tiled;
    Bg: cc.Node;
    m_isNeedGen: boolean = true;
    m_stickyBlockerId: number;
    m_blockerList: Blocker[] = [];
    BeforeNoCheckMatch: boolean = false;
    
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
        cc.resources.load("prefab/tiled/NormalTiled", (err, data: any) =>{
            this.m_tiled = cc.instantiate(data);
            this.m_tiled.setParent(this.m_tiledRoot);
            this.m_tiled.setPosition(0, 0);
            this.Bg = this.m_tiled.getChildByName("Bg");
            Game.LoadingAssetCount--;

            if (this.m_tiledTableData.type == TiledType.Normal || this.m_tiledTableData.type == TiledType.Empty)
            {
                Utils.SetNodeActive(this.Bg, true);

            }
            else if (this.m_tiledTableData.type == TiledType.None)
            {
                Utils.SetNodeActive(this.Bg, false);
            }
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
            this.CanMoveBlocker = BlockerManager.getInstance().Build(id, this);
            this.m_isNeedGen = false;
        }
    }

    IsNeedGen()
    {
        return this.m_isNeedGen && this.m_stickyBlockerId <= 0;
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

    CanGenerateCanSwitchBlocker()
    {
        if (!this.IsValidTiled())
        {
            return false;
        }

        return this.m_isNeedGen && !this.HasForbidSwitch();
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

    private HasForbidMove(): boolean {
        for (let i = 0; i < this.m_blockerList.length; i++) {
            if (this.m_blockerList[i].ForbidMove()) {
                return true;
            }
        }
    
        return false;
    }

    IsLocked() {
        return false;
    }
    
    SetSpecialID(spType: BlockerID)
    {

    }

    public GetIsMatchAround(id: number): boolean {
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

    IsTeleportIn()
    {
        return false;
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

    IsCanCrushBottomBlocker()
    {
        let matchBlocker = this.MatchBlocker;
        if (null != matchBlocker)
        {
            return matchBlocker.IsCanCrushBottomBlocker();
        }
        return true;
    }

    DestroyBlocker(id: number, isMatch: boolean, destroyMiddle: boolean)
    {
        if (this.CanMoveBlocker != null)
        {
            this.CanMoveBlocker.Destroy();
        }
    }
}
