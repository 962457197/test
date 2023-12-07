import { Blocker } from "../level/blocker/Blocker";
import { BlockerID, BlockSubType } from "../level/blocker/BlockerManager";
import { Direction } from "../level/data/LevelScriptableData";
import { Tiled } from "../level/tiledmap/Tiled";
import { TiledMap } from "../level/tiledmap/TiledMap";
import { BlockerAttribute } from "../table/BlockTable";
import { MatchHelper } from "./MatchHelper";
import { TimerManager, TimerData, TimerType } from "./TimerManager";

export enum ComposeMode
{
    SameColorAndOther,
    SameColorAndSameColor,

    None,
    Comp_SameColor,
    Comp_Area,
    Comp_Line,
    Comp_Square,

    LineAndArea,
    DoubleLineOrArea,
    SquareAndOther,
    DoubleSquare,

    NormalThreeMatch,

    SpecialAndNormal,

    SingleSpecial
}

class MatchTipsData {
    m_OrignGUID: number;
    m_TargetDirection: Direction;
    m_TipsBlockers: Blocker[] = [];
}

export class MatchTipsManager {

    private static instance: MatchTipsManager;
    public static get Instance(): MatchTipsManager {
        if (this.instance == null) {
            this.instance = new MatchTipsManager();
        }
        return this.instance;
    }

    m_IsTipsing: boolean;
    m_MatchMap: { [key: number]: MatchTipsData[] } = {};
    m_MatchItems: Blocker[] = [];
    m_OperationCanMatchCount: number;
    m_AutoTimer: any;
    m_StopMatchTipsTimer: any;
    m_DirectionTipsTimer: any;
    m_TipsBlockers: Blocker[] = [];
    m_MatchTipsData: MatchTipsData = new MatchTipsData();
    m_specialTileds: Tiled[] = [];
    m_checkBlockers: Blocker[] = [];

    OnBeginCheckTiledMap(): void {
        if (this.m_IsTipsing) {
            return;
        }
        this.m_IsTipsing = true;

        this.m_MatchMap = {};
        this.m_MatchItems = [];
        this.m_TipsBlockers = [];

        for (let i = 0; i < TiledMap.getInstance().TiledArray.length; i++) {
            const orign = TiledMap.getInstance().TiledArray[i];
            if (orign == null || !orign.IsValidTiled() || orign.CanMoveBlocker == null) {
                continue;
            }
            this.OnCheckNeighborTiled(orign, Direction.Up, orign.GetNeighborTop(), Direction.Down);
            this.OnCheckNeighborTiled(orign, Direction.Down, orign.GetNeighborBottom(), Direction.Up);
            this.OnCheckNeighborTiled(orign, Direction.Left, orign.GetNeighborLeft(), Direction.Right);
            this.OnCheckNeighborTiled(orign, Direction.Right, orign.GetNeighborRight(), Direction.Left);
        }

        this.CheckSpecialComb();
        this.GetTargetTiledsAndPlayTipsAni();


        this.OnPlayTipsAnimation();
    }

    GetTargetTiledsAndPlayTipsAni(): void {
        if (Object.keys(this.m_MatchMap).length === 0) {
            return;
        }
        const firstList = this.GetFirstList().Value;
        this.m_MatchTipsData = firstList[TiledMap.getInstance().RandomRange(0, firstList.length - 1)];
    }

    OnPlayTipsAnimation(): void {

        this.m_TipsBlockers = this.m_MatchTipsData.m_TipsBlockers;
        if (this.m_TipsBlockers == null) {
            return;
        }
        for (let i = 0; i < this.m_TipsBlockers.length; i++) {
            const item = this.m_TipsBlockers[i];
            if (item != null && item.SelfTiled != null)
            {
                if (item.SelfTiled.Guid == this.m_MatchTipsData.m_OrignGUID && this.m_TipsBlockers.length > 1) {
                    item.PlayMatchTipsAnimation(this.m_MatchTipsData.m_TargetDirection);
                } else {
                    item.PlayMatchTipsAnimation();
                }
            }
        }
    }

    StopMatchTipsAnimation()
    {
        if (!this.m_IsTipsing)
        {
            return;
        }
        this.m_IsTipsing = false;

        this.m_TipsBlockers = this.m_MatchTipsData.m_TipsBlockers;
        if (this.m_TipsBlockers == null) {
            return;
        }

        for (let i = 0; i < this.m_TipsBlockers.length; i++) {
            const element = this.m_TipsBlockers[i];
            element.StopAnimation();   
        }
    }

    GetFirstList(): { Key: ComposeMode, Value: MatchTipsData[] } {
        let mode = ComposeMode.None;
        for (const key in this.m_MatchMap) {
            if (mode == ComposeMode.None) {
                mode = parseInt(key);
                continue;
            }
            if (Number(key) <= Number(mode)) {
                mode = parseInt(key);
            }
        }
        return { Key: mode, Value: this.m_MatchMap[mode] };
    }

    OnCheckNeighborTiled(orign: Tiled, orignMoveDir: Direction, neighbor: Tiled, neighborMoveDir: Direction): void {
        if (!this.IsUnlockedNormalTiled(neighbor) && !this.IsUnlockedSepeicalTiled(neighbor)) {
            return;
        }
        if (orign.CanSwitchInDirection(orignMoveDir) && neighbor.CanSwitchInDirection(neighborMoveDir)) {
            orign.SwitchCanMoveBlocker(neighbor);
            this.UpdateMatchListForNormalTiled(orign, neighbor, neighborMoveDir);
            orign.SwitchCanMoveBlocker(neighbor);
        }
    }

    UpdateMatchListForNormalTiled(m_orign: Tiled, neighbor: Tiled, neighborMoveDir: Direction): void {
        this.m_MatchItems.length = 0;
        const spType = MatchHelper.CheckMatch(m_orign, this.m_MatchItems, false);
        switch (spType) {
            case BlockerID.samecolor:
                this.AddMatchListToMap(ComposeMode.Comp_SameColor, neighbor, neighborMoveDir);
                this.m_OperationCanMatchCount += 1;
                break;
            case BlockerID.area:
                this.AddMatchListToMap(ComposeMode.Comp_Area, neighbor, neighborMoveDir);
                this.m_OperationCanMatchCount += 1;
                break;
            case BlockerID.horizontal:
            case BlockerID.vertical:
                this.AddMatchListToMap(ComposeMode.Comp_Line, neighbor, neighborMoveDir);
                this.m_OperationCanMatchCount += 1;
                break;
            case BlockerID.squareid:
                this.AddMatchListToMap(ComposeMode.Comp_Square, neighbor, neighborMoveDir);
                this.m_OperationCanMatchCount += 1;
                break;
            default:
                break;
        }
        if (spType == BlockerID.none && this.m_MatchItems.length == 3) {
            this.AddMatchListToMap(ComposeMode.NormalThreeMatch, neighbor, neighborMoveDir);
            this.m_OperationCanMatchCount += 1;
        }
    }

    SortSpecialByPriority(list: Tiled[], low: number, high: number): void {
        if (high <= low) {
            return;
        }
        let i = low;
        let j = high + 1;
        const key = this.SpecialSortPriority(list[low]);
        while (true) {
            while (this.SpecialSortPriority(list[++i]) < key) {
                if (i == high) {
                    break;
                }
            }
            while (this.SpecialSortPriority(list[--j]) > key) {
                if (j == low) {
                    break;
                }
            }
            if (i >= j) {
                break;
            }
            const vaule = list[i];
            list[i] = list[j];
            list[j] = vaule;
        }
        const temp = list[low];
        list[low] = list[j];
        list[j] = temp;
        this.SortSpecialByPriority(list, low, j - 1);
        this.SortSpecialByPriority(list, j + 1, high);
    }

    CheckSpecialComb(): void {
        this.m_specialTileds.length = 0;
        for (let i = 0; i < TiledMap.getInstance().TiledArray.length; i++) {
            if (this.IsUnlockedSepeicalTiled(TiledMap.getInstance().TiledArray[i])) {
                this.m_specialTileds.push(TiledMap.getInstance().TiledArray[i]);
            }
        }
        if (this.m_specialTileds.length > 0) {
            this.SortSpecialByPriority(this.m_specialTileds, 0, this.m_specialTileds.length - 1);
            for (let i = 0; i < this.m_specialTileds.length; i++) {
                const origion = this.m_specialTileds[i];
                this.UpdateMatchListForSpecialTiled(origion);
            }
        }
    }

    UpdateMatchListForSpecialTiled(origin: Tiled): void {
        this.m_OperationCanMatchCount += 1;
        this.CheckFireSelf(origin);
        this.CheckMoveToNeighbor(origin);
    }

    CheckFireSelf(origin: Tiled): void {
        this.CalculateMatchItemsForOne(origin);
        this.AddMatchListToMap(ComposeMode.SingleSpecial, origin, Direction.None);
    }

    CheckMoveToNeighbor(origin: Tiled): void {
        const topNeighbor = origin.GetNeighborTop();
        const bottomNeighbor = origin.GetNeighborBottom();
        const leftNeighbor = origin.GetNeighborLeft();
        const rightNeighbor = origin.GetNeighborRight();
        if (this.IsCanSwitchInDirection(origin, Direction.Up, topNeighbor, Direction.Down)) {
            this.CheckComposeWithNeighbor(origin, Direction.Up, topNeighbor);
        }
        if (this.IsCanSwitchInDirection(origin, Direction.Down, bottomNeighbor, Direction.Up)) {
            this.CheckComposeWithNeighbor(origin, Direction.Down, bottomNeighbor);
        }
        if (this.IsCanSwitchInDirection(origin, Direction.Left, leftNeighbor, Direction.Right)) {
            this.CheckComposeWithNeighbor(origin, Direction.Left, leftNeighbor);
        }
        if (this.IsCanSwitchInDirection(origin, Direction.Right, rightNeighbor, Direction.Left)) {
            this.CheckComposeWithNeighbor(origin, Direction.Right, rightNeighbor);
        }
    }

    IsCanSwitchInDirection(first: Tiled, originMoveTo: Direction, second: Tiled, neighborMoveTo: Direction): boolean {
        if (second == null) {
            return false;
        }
        if (!first.CanSwitchInDirection(originMoveTo) || !second.CanSwitchInDirection(neighborMoveTo)) {
            return false;
        }
        return true;
    }

    CheckComposeWithNeighbor(origin: Tiled, originMoveTo: Direction, neighbor: Tiled): void {
        if (neighbor.CanMoveBlocker.TableData.Data.SubType == BlockSubType.Special) {
            this.CheckSpecialComposeSpecial(origin, originMoveTo, neighbor);
        } else {
            this.CheckSpecialComposeNormal(origin, originMoveTo, neighbor);
        }
    }

    CalculateMatchItemsForTwo(origin: Tiled, neighbor: Tiled): void {
        this.m_MatchItems.length = 0;
        this.m_checkBlockers.length = 0;
        this.m_checkBlockers.push(origin.CanMoveBlocker);
        this.m_checkBlockers.push(neighbor.CanMoveBlocker);
        MatchHelper.Distinct(this.m_checkBlockers, this.m_MatchItems);
    }

    CalculateMatchItemsForOne(origin: Tiled): void {
        this.m_MatchItems.length = 0;
        this.m_checkBlockers.length = 0;
        this.m_checkBlockers.push(origin.CanMoveBlocker);
        MatchHelper.Distinct(this.m_checkBlockers, this.m_MatchItems);
    }

    CheckSpecialComposeNormal(origin: Tiled, originMoveTo: Direction, neighbor: Tiled): void {
        if (neighbor.CanMoveBlocker.TableData.IsHasAttribute(BlockerAttribute.canMoveObstacle) ||
            (neighbor.CanMoveBlocker.IsChameleon() && neighbor.CanMoveBlocker.Color == 0)) {
            return;
        }
        if (neighbor.CanMoveBlocker.TableData.Data.SubType == BlockSubType.none) {
            this.CalculateMatchItemsForTwo(origin, neighbor);
            this.AddMatchListToMap(ComposeMode.SpecialAndNormal, origin, originMoveTo);
        }
    }

    CheckSpecialComposeSpecial(origin: Tiled, originMoveTo: Direction, neighbor: Tiled): void {
        let targetMode = ComposeMode.None;
        switch (origin.CanMoveBlocker.ID) {
            case BlockerID.samecolor:
                targetMode = neighbor.CanMoveBlocker.IsSameColor() ? ComposeMode.SameColorAndSameColor : ComposeMode.SameColorAndOther;
                break;
            case BlockerID.area:
                if (neighbor.CanMoveBlocker.ID == BlockerID.horizontal ||
                    neighbor.CanMoveBlocker.ID == BlockerID.vertical) {
                    targetMode = ComposeMode.LineAndArea;
                } else if (neighbor.CanMoveBlocker.ID == BlockerID.area) {
                    targetMode = ComposeMode.DoubleLineOrArea;
                } else if (neighbor.CanMoveBlocker.ID == BlockerID.squareid) {
                    targetMode = ComposeMode.SquareAndOther;
                }
                break;
            case BlockerID.horizontal:
            case BlockerID.vertical:
                if (neighbor.CanMoveBlocker.ID == BlockerID.horizontal ||
                    neighbor.CanMoveBlocker.ID == BlockerID.vertical) {
                    targetMode = ComposeMode.DoubleLineOrArea;
                } else if (neighbor.CanMoveBlocker.ID == BlockerID.squareid) {
                    targetMode = ComposeMode.SquareAndOther;
                }
                break;
            case BlockerID.squareid:
                if (neighbor.CanMoveBlocker.ID == BlockerID.squareid) {
                    targetMode = ComposeMode.DoubleSquare;
                }
                break;
        }
        if (targetMode != ComposeMode.None) {
            this.CalculateMatchItemsForTwo(origin, neighbor);
            this.AddMatchListToMap(targetMode, origin, originMoveTo);
        }
    }

    AddMatchListToMap(composeMode: ComposeMode, neighbor: Tiled, direction: Direction): void {
        const tempData = new MatchTipsData();
        tempData.m_OrignGUID = neighbor.Guid;
        tempData.m_TargetDirection = direction;
        tempData.m_TipsBlockers.push(...this.m_MatchItems);
        if (this.m_MatchMap[composeMode]) {
            this.m_MatchMap[composeMode].push(tempData);
        } else {
            this.m_MatchMap[composeMode] = [tempData];
        }
    }

    IsNormalTiled(tiled: Tiled): boolean {
        return tiled != null && tiled.IsValidTiled() && tiled.CanMoveBlocker != null && tiled.CanMoveBlocker.TableData.Data.SubType == BlockSubType.none;
    }

    IsUnlockedSepeicalTiled(tiled: Tiled): boolean {
        return tiled != null && tiled.CanMove() && tiled.CanMoveBlocker.TableData.Data.SubType == BlockSubType.Special;
    }

    IsUnlockedNormalTiled(tiled: Tiled): boolean {
        return this.IsNormalTiled(tiled) && tiled.CanMove();
    }

    IsIngredientTiled(tiled: Tiled): boolean {
        return tiled.MatchBlocker.IsIngredient();
    }

    SpecialSortPriority(tiled: Tiled): number {
        const spType = tiled.CanMoveBlocker.ID;
        switch (spType) {
            case BlockerID.samecolor:
                return 1;
            case BlockerID.area:
                return 10;
            case BlockerID.horizontal:
            case BlockerID.vertical:
                return 20;
            case BlockerID.squareid:
                return 30;
            default:
                return 100;
        }
    }
}