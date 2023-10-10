import { Blocker } from "../level/blocker/Blocker";
import { BlockSubType, BlockerID } from "../level/blocker/BlockerManager";
import { NormalTiled } from "../level/tiledmap/NormalTiled";
import { Tiled } from "../level/tiledmap/Tiled";

export class MatchHelper {
    static m_blklst: Blocker[] = [];
    static m_rowBlockerList: Blocker[] = [];
    private static m_matchResultDic: Map<BlockerID, Blocker[][]> = new Map<BlockerID, Blocker[][]>();
    private static m_rowBlockerDic: Map<number, Blocker[]> = new Map<number, Blocker[]>();
    static m_columnBlockerList: Blocker[] = [];
    static m_maxCountRow: number = 0;
    static m_tempOtherBlockerList: Blocker[] = [];
    static FallingWaitCount: number = 0;

    static IsValidNeighbor(curTiled: NormalTiled, neighborTiled: NormalTiled): boolean {
        return (
            Math.abs(curTiled.Row - neighborTiled.Row) === 1 && curTiled.Col === neighborTiled.Col ||
            Math.abs(curTiled.Col - neighborTiled.Col) === 1 && curTiled.Row === neighborTiled.Row
        );
    }

    static CheckSquare(orignTiled: NormalTiled): Blocker[] {
        this.m_tempOtherBlockerList = [];
        this.m_tempOtherBlockerList.push(orignTiled.CanMoveBlocker);

        const left = orignTiled.GetNeighborLeft();
        if (this.IsSameColorNeighbor(orignTiled, left)) {
            const bottom = orignTiled.GetNeighborBottom();
            if (this.IsSameColorNeighbor(orignTiled, bottom)) {
                const leftBottom = orignTiled.GetNeighborLeftBottom();
                if (this.IsSameColorNeighbor(orignTiled, leftBottom)) {
                    this.m_tempOtherBlockerList.push(left.CanMoveBlocker);
                    this.m_tempOtherBlockerList.push(bottom.CanMoveBlocker);
                    this.m_tempOtherBlockerList.push(leftBottom.CanMoveBlocker);

                    return this.m_tempOtherBlockerList;
                }
            }

            const top = orignTiled.GetNeighborTop();
            if (this.IsSameColorNeighbor(orignTiled, top)) {
                const leftTop = orignTiled.GetNeighborLeftTop();
                if (this.IsSameColorNeighbor(orignTiled, leftTop)) {
                    this.m_tempOtherBlockerList.push(left.CanMoveBlocker);
                    this.m_tempOtherBlockerList.push(top.CanMoveBlocker);
                    this.m_tempOtherBlockerList.push(leftTop.CanMoveBlocker);

                    return this.m_tempOtherBlockerList;
                }
            }
        }

        const right = orignTiled.GetNeighborRight();
        if (this.IsSameColorNeighbor(orignTiled, right)) {
            const bottom = orignTiled.GetNeighborBottom();
            if (this.IsSameColorNeighbor(orignTiled, bottom)) {
                const rightBottom = orignTiled.GetNeighborRightBottom();
                if (this.IsSameColorNeighbor(orignTiled, rightBottom)) {
                    this.m_tempOtherBlockerList.push(right.CanMoveBlocker);
                    this.m_tempOtherBlockerList.push(bottom.CanMoveBlocker);
                    this.m_tempOtherBlockerList.push(rightBottom.CanMoveBlocker);

                    return this.m_tempOtherBlockerList;
                }
            }

            const top = orignTiled.GetNeighborTop();
            if (this.IsSameColorNeighbor(orignTiled, top)) {
                const rightTop = orignTiled.GetNeighborRightTop();
                if (this.IsSameColorNeighbor(orignTiled, rightTop)) {
                    this.m_tempOtherBlockerList.push(right.CanMoveBlocker);
                    this.m_tempOtherBlockerList.push(top.CanMoveBlocker);
                    this.m_tempOtherBlockerList.push(rightTop.CanMoveBlocker);

                    return this.m_tempOtherBlockerList;
                }
            }
        }

        return this.m_tempOtherBlockerList;
    }

    static IsSameColorNeighbor(orignTiled: NormalTiled, neighbor: NormalTiled): boolean {
        if (!neighbor || !neighbor.IsValidTiled() || !neighbor.CanMatchCrush()) {
            return false;
        }

        const toptop = orignTiled.TopTopBlocker();
        if (toptop !== null) {
            return false;
        }

        const topb = orignTiled.TopBlocker();
        if (topb !== null && topb.TableData.SubType == BlockSubType.HideMiddle) {
            return false;
        }

        if (orignTiled.CanMoveBlocker.Color === neighbor.CanMoveBlocker.Color) {
            return true;
        }
        return false;
    }

    static Distinct(srlst: Blocker[], matchItems: Blocker[]) {
        for (let i = 0; i < srlst.length; i++) {
            if (!srlst[i].MarkMatch) {
                let isAdd = false;
                for (let k = 0; k < matchItems.length; k++) {
                    if (matchItems[k].SelfTiled.Guid === srlst[i].SelfTiled.Guid) {
                        isAdd = true;
                        break;
                    }
                }
                if (!isAdd) {
                    matchItems.push(srlst[i]);
                }
            }
        }
    }

    static GetCurrentColumnBlockerList(block: Blocker, resultList: Blocker[]) {
        resultList.length = 0;

        resultList.push(block);
        let topTiled = block.SelfTiled.GetNeighborTop();
        while (topTiled != null && topTiled.IsValidTiled() && topTiled.CanMatchCrush() && topTiled.CanMoveBlocker.Color === block.Color) {
            resultList.push(topTiled.CanMoveBlocker);
            topTiled = topTiled.GetNeighborTop();
        }
        let bottomTiled = block.SelfTiled.GetNeighborBottom();
        while (bottomTiled != null && bottomTiled.IsValidTiled() && bottomTiled.CanMatchCrush() && bottomTiled.CanMoveBlocker.Color === block.Color) {
            resultList.push(bottomTiled.CanMoveBlocker);
            bottomTiled = bottomTiled.GetNeighborBottom();
        }
    }

    static GetCurrentRowBlockerList(block: Blocker, resultList: Blocker[]) {
        resultList.length = 0;

        resultList.push(block);
        let leftTiled = block.SelfTiled.GetNeighborLeft();
        while (leftTiled != null && leftTiled.IsValidTiled() && leftTiled.CanMatchCrush() && leftTiled.CanMoveBlocker.Color === block.Color) {
            resultList.push(leftTiled.CanMoveBlocker);
            leftTiled = leftTiled.GetNeighborLeft();
        }
        let rightTiled = block.SelfTiled.GetNeighborRight();
        while (rightTiled != null && rightTiled.IsValidTiled() && rightTiled.CanMatchCrush() && rightTiled.CanMoveBlocker.Color === block.Color) {
            resultList.push(rightTiled.CanMoveBlocker);
            rightTiled = rightTiled.GetNeighborRight();
        }
    }

    static FindBlockerToMatch(block: Blocker): Blocker | null {
        for (let i = 0; i < this.m_blklst.length; i++) {
            if (this.m_blklst[i].CanMatch() && this.m_blklst[i].Color === block.Color) {
                return this.m_blklst[i];
            }
        }

        return null;
    }

    static IsExistFalling(blk: Blocker): boolean {
        let frontTiled = blk.SelfTiled as NormalTiled;
        let pre = blk.SelfTiled?.GetPrevTiled();
        while (pre !== null) {
            if (pre.IsCanSwitchNoMatchBlocker()) {
                this.FallingWaitCount++;
                frontTiled = pre;
                pre = pre.GetPrevTiled();
            } else if (pre.CanMoveBlocker !== null && !pre.CanMoveBlocker.Marked && pre.CanMoveBlocker.Color === blk.Color && this.IsValidNeighbor(frontTiled, pre)
                && pre.MiddleBlocker() === null && pre.TopTopBlocker() === null) {
                if (pre.GetPrevTiled() !== null && pre.PrevTiledGuid === frontTiled.Guid) {
                    break;
                }

                let preTopBlocker = pre.TopBlocker();
                if (preTopBlocker !== null && preTopBlocker.TableData.SubType == BlockSubType.HideMiddle) {
                    break;
                }

                if (pre.CanMoveBlocker.Falling) {
                    if (pre.IsTeleportIn() && pre.GetNextTiled() !== frontTiled) {
                        let falling = pre.GetNextTiled()?.CanMoveBlocker?.Falling ?? true;
                        if (!falling) {
                            this.FallingWaitCount = 1;
                            return true;
                        }
                        break;
                    }
                    this.FallingWaitCount = 1;
                    return true;
                } else {
                    this.FallingWaitCount++;
                    frontTiled = pre;
                    pre = pre.GetPrevTiled();
                }
            } else {
                break;
            }
        }

        frontTiled = blk.SelfTiled as NormalTiled;
        let leftTiled = frontTiled?.GetNeighborLeft();
        if (leftTiled !== null && leftTiled.CanMoveBlocker !== null && !leftTiled.CanMoveBlocker.Marked && leftTiled.CanMoveBlocker.Color === blk.Color && this.IsValidNeighbor(frontTiled, leftTiled)
            && leftTiled.MiddleBlocker() === null && leftTiled.TopTopBlocker() === null &&
            !(leftTiled.GetNeighborLeft() !== null && leftTiled.GetNeighborLeft().Guid === frontTiled.Guid)) {
            if (leftTiled.CanMoveBlocker.Falling && leftTiled.CheckNextArriveTiled() === null) {
                if (!leftTiled.IsTeleportIn()) {
                    this.FallingWaitCount = 1;
                    return true;
                } else {
                    if (!(leftTiled.GetNextTiled()?.CanMoveBlocker?.Falling ?? true)) {
                        this.FallingWaitCount = 1;
                        return true;
                    }
                }
            }
        }

        let rightTiled = frontTiled?.GetNeighborRight();
        if (rightTiled !== null && rightTiled.CanMoveBlocker !== null && !rightTiled.CanMoveBlocker.Marked && rightTiled.CanMoveBlocker.Color === blk.Color && this.IsValidNeighbor(frontTiled, rightTiled)
            && rightTiled.MiddleBlocker() === null && rightTiled.TopTopBlocker() === null &&
            !(rightTiled.GetNeighborRight() !== null && rightTiled.GetNeighborRight().Guid === frontTiled.Guid)) {
            if (rightTiled.CanMoveBlocker.Falling && rightTiled.CheckNextArriveTiled() === null) {
                if (!rightTiled.IsTeleportIn()) {
                    this.FallingWaitCount = 1;
                    return true;
                } else {
                    if (!(rightTiled.GetNextTiled()?.CanMoveBlocker?.Falling ?? true)) {
                        this.FallingWaitCount = 1;
                        return true;
                    }
                }
            }
        }

        return false;
    }

    static ClearRowBlockerDic() {
        for (const key in this.m_rowBlockerDic) {
            if (this.m_rowBlockerDic.hasOwnProperty(key)) {
                this.m_rowBlockerDic[key].length = 0;
            }
        }
    }

    static ClearMatchResultDic() {
        for (const key in this.m_matchResultDic) {
            if (this.m_matchResultDic.hasOwnProperty(key)) {
                for (let i = 0; i < this.m_matchResultDic[key].length; i++) {
                    this.m_matchResultDic[key][i].length = 0;
                }
            }
        }
    }

    private static MakeSpecialBlock(blockerId: BlockerID): Blocker[] {
        let blockerListList = this.m_matchResultDic.get(blockerId);
        if (!blockerListList) {
            blockerListList = [];
            this.m_matchResultDic.set(blockerId, blockerListList);
        }

        let blockerList: Blocker[] | null = null;
        for (const item of blockerListList) {
            if (item.length <= 0) {
                blockerList = item;
                break;
            }
        }

        if (blockerList === null) {
            blockerList = [];
        }

        blockerListList.push(blockerList);
        return blockerList;
    }

    private static GetPerRowDataAndMaxCountRow() {
        this.m_maxCountRow = -1;
        this.ClearRowBlockerDic();

        for (let i = 0; i < this.m_columnBlockerList.length; i++) {
            if (this.m_maxCountRow === -1) {
                this.m_maxCountRow = this.m_columnBlockerList[i].SelfTiled.Row;
            }

            this.GetCurrentRowBlockerList(this.m_columnBlockerList[i], this.m_rowBlockerList);

            let newBlockerList: Blocker[] | undefined = this.m_rowBlockerDic.get(this.m_columnBlockerList[i].SelfTiled.Row);
            if (!newBlockerList) {
                newBlockerList = [];
                this.m_rowBlockerDic.set(this.m_columnBlockerList[i].SelfTiled.Row, newBlockerList);
            }
            newBlockerList.length = 0;
            newBlockerList.push(...this.m_rowBlockerList);

            if (this.m_rowBlockerList.length > this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0) {
                this.m_maxCountRow = this.m_columnBlockerList[i].SelfTiled.Row;
            }
        }
    }

    private static CheckPerBlocker(checkBlocker: Blocker) {
        let removeList: Blocker[] | null = null;

        if (!checkBlocker.IsAlreadyCheckMatch && checkBlocker.SelfTiled.CanMatchCrush()) {
            checkBlocker.IsAlreadyCheckMatch = true;

            this.GetCurrentColumnBlockerList(checkBlocker, this.m_columnBlockerList);
            this.GetPerRowDataAndMaxCountRow();

            if (this.m_columnBlockerList.length < 3) {
                if (this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0 >= 5) {
                    const multiColorList = this.MakeSpecialBlock(BlockerID.multicolor);
                    multiColorList.push(...this.m_rowBlockerDic.get(this.m_maxCountRow) || []);
                    removeList = multiColorList;
                } else if (this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0 >= 4) {
                    const verticalList = this.MakeSpecialBlock(BlockerID.vertical);
                    verticalList.push(...this.m_rowBlockerDic.get(this.m_maxCountRow) || []);
                    removeList = verticalList;
                } else if (this.m_columnBlockerList.length >= 2 && (this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0) >= 2) {
                    const tempSquareList = this.CheckSquare(checkBlocker.SelfTiled);
                    if (tempSquareList.length >= 4) {
                        const squareList = this.MakeSpecialBlock(BlockerID.squareid);
                        squareList.push(...tempSquareList);
                        if ((this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0) >= 3) {
                            this.Distinct(this.m_rowBlockerDic.get(this.m_maxCountRow) || [], squareList);
                        }
                        removeList = squareList;
                    } else {
                        if ((this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0) >= 3) {
                            const baseList = this.MakeSpecialBlock(BlockerID.none);
                            baseList.push(...this.m_rowBlockerDic.get(this.m_maxCountRow) || []);
                            removeList = baseList;
                        }
                    }
                } else if ((this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0) >= 3) {
                    const baseList = this.MakeSpecialBlock(BlockerID.none);
                    baseList.push(...this.m_rowBlockerDic.get(this.m_maxCountRow) || []);
                    removeList = baseList;
                }
            } else {
                if (this.m_columnBlockerList.length >= 5) {
                    const multiColorList = this.MakeSpecialBlock(BlockerID.multicolor);
                    multiColorList.push(...this.m_columnBlockerList);
                    if ((this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0) >= 3) {
                        this.Distinct(this.m_rowBlockerDic.get(this.m_maxCountRow) || [], multiColorList);
                    }
                    removeList = multiColorList;
                } else if (this.m_columnBlockerList.length >= 4) {
                    if ((this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0) >= 5) {
                        const multiColorList = this.MakeSpecialBlock(BlockerID.multicolor);
                        multiColorList.push(...this.m_columnBlockerList);
                        this.Distinct(this.m_rowBlockerDic.get(this.m_maxCountRow) || [], multiColorList);
                        removeList = multiColorList;
                    } else if ((this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0) >= 3) {
                        const packageList = this.MakeSpecialBlock(BlockerID.package);
                        packageList.push(...this.m_columnBlockerList);
                        this.Distinct(this.m_rowBlockerDic.get(this.m_maxCountRow) || [], packageList);
                        removeList = packageList;
                    } else {
                        const horizontalList = this.MakeSpecialBlock(BlockerID.horizontal);
                        horizontalList.push(...this.m_columnBlockerList);
                        removeList = horizontalList;
                    }
                } else if (this.m_columnBlockerList.length >= 3) {
                    if ((this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0) >= 5) {
                        const multiColorList = this.MakeSpecialBlock(BlockerID.multicolor);
                        multiColorList.push(...this.m_columnBlockerList);
                        this.Distinct(this.m_rowBlockerDic.get(this.m_maxCountRow) || [], multiColorList);
                        removeList = multiColorList;
                    } else if ((this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0) >= 3) {
                        const packageList = this.MakeSpecialBlock(BlockerID.package);
                        packageList.push(...this.m_columnBlockerList);
                        this.Distinct(this.m_rowBlockerDic.get(this.m_maxCountRow) || [], packageList);
                        removeList = packageList;
                    } else if (this.m_columnBlockerList.length >= 2 && (this.m_rowBlockerDic.get(this.m_maxCountRow)?.length || 0) >= 2) {
                        const tempSquareList = this.CheckSquare(checkBlocker.SelfTiled);
                        if (tempSquareList.length >= 4) {
                            const squareList = this.MakeSpecialBlock(BlockerID.squareid);
                            squareList.push(...tempSquareList);
                            if (this.m_columnBlockerList.length >= 3) {
                                this.Distinct(this.m_columnBlockerList, squareList);
                            }
                            removeList = squareList;
                        } else {
                            if (this.m_columnBlockerList.length >= 3) {
                                const baseList = this.MakeSpecialBlock(BlockerID.none);
                                baseList.push(...this.m_columnBlockerList);
                                removeList = baseList;
                            }
                        }
                    } else if (this.m_columnBlockerList.length >= 3) {
                        const baseList = this.MakeSpecialBlock(BlockerID.none);
                        baseList.push(...this.m_columnBlockerList);
                        removeList = baseList;
                    }
                }
            }

            if (removeList !== null) {
                for (let i = 0; i < removeList.length; i++) {
                    removeList[i].IsAlreadyCheckMatch = true;
                }
            }
        }
    }

    private static CheckAllBlockerMatch(originTiled: Tiled, matchItems: Blocker[], checkFalling: boolean): BlockerID {
        this.ClearMatchResultDic();
        if (checkFalling) {
            let isFalling = false;
            for (let i = 0; i < this.m_blklst.length; i++) {
                isFalling = this.IsExistFalling(this.m_blklst[i]);
                if (isFalling) {
                    (originTiled as NormalTiled).BeforeNoCheckMatch = true;
                    return BlockerID.none;
                }
            }
        }

        for (let i = 0; i < this.m_blklst.length; i++) {
            this.CheckPerBlocker(this.m_blklst[i]);
        }

        for (let i = 0; i < this.m_blklst.length; i++) {
            this.m_blklst[i].IsAlreadyCheckMatch = false;
        }

        let matchListList = this.m_matchResultDic.get(BlockerID.multicolor);
        if (matchListList) {
            this.Sort(matchListList);
            if (matchListList.length > 0 && matchListList[0].length > 0) {
                this.Distinct(matchListList[0], matchItems);
                if (this.IsAllJelly(matchItems)) {
                    return BlockerID.none;
                } else {
                    this.MatchEndCheckSquare(originTiled, matchItems);
                    return BlockerID.multicolor;
                }
            }
        }

        matchListList = this.m_matchResultDic.get(BlockerID.package);
        if (matchListList) {
            this.Sort(matchListList);
            if (matchListList.length > 0 && matchListList[0].length > 0) {
                this.Distinct(matchListList[0], matchItems);
                if (this.IsAllJelly(matchItems)) {
                    return BlockerID.none;
                } else {
                    this.MatchEndCheckSquare(originTiled, matchItems);
                    return BlockerID.package;
                }
            }
        }

        matchListList = this.m_matchResultDic.get(BlockerID.vertical);
        if (matchListList) {
            this.Sort(matchListList);
            if (matchListList.length > 0 && matchListList[0].length > 0) {
                this.Distinct(matchListList[0], matchItems);
                if (this.IsAllJelly(matchItems)) {
                    return BlockerID.none;
                } else {
                    this.MatchEndCheckSquare(originTiled, matchItems);
                    return BlockerID.vertical;
                }
            }
        }

        matchListList = this.m_matchResultDic.get(BlockerID.horizontal);
        if (matchListList) {
            this.Sort(matchListList);
            if (matchListList.length > 0 && matchListList[0].length > 0) {
                this.Distinct(matchListList[0], matchItems);
                if (this.IsAllJelly(matchItems)) {
                    return BlockerID.none;
                } else {
                    this.MatchEndCheckSquare(originTiled, matchItems);
                    return BlockerID.horizontal;
                }
            }
        }

        matchListList = this.m_matchResultDic.get(BlockerID.squareid);
        if (matchListList) {
            this.Sort(matchListList);
            if (matchListList.length > 0 && matchListList[0].length > 0) {
                this.Distinct(matchListList[0], matchItems);
                if (this.IsAllJelly(matchItems)) {
                    return BlockerID.none;
                } else {
                    return BlockerID.squareid;
                }
            }
        }

        matchListList = this.m_matchResultDic.get(BlockerID.none);
        if (matchListList) {
            if (matchListList.length > 0 && matchListList[0].length > 0) {
                this.Distinct(matchListList[0], matchItems);
                return BlockerID.none;
            }
        }

        return BlockerID.none;
    }

    private static MatchEndCheckSquare(originTiled: Tiled, matchItems: Blocker[]) {
        const squareList = this.CheckSquare(originTiled as NormalTiled);
        if (squareList.length >= 4) {
            this.Distinct(squareList, matchItems);
        }
    }

    private static Sort(matchList: Blocker[][]) {
        const count = matchList.length;
        if (count < 2) {
            return;
        }
        let maxIndex = 0;
        for (let i = 1; i < count; i++) {
            if (matchList[i].length > matchList[maxIndex].length) {
                maxIndex = i;
            }
        }
        if (maxIndex > 0) {
            const tempList = matchList[0];
            matchList[0] = matchList[maxIndex];
            matchList[maxIndex] = tempList;
        }
    }

    private static IsAllJelly(blockerList: Blocker[]): boolean {

        return false;

        // let jellyCount = 0;
        // for (const blocker of blockerList) {
        //     if (Jellythis.IsJellyBlocker(this.ID)) {
        //         jellyCount++;
        //     }
        // }

        // return jellyCount >= blockerList.length;
    }

    public static CheckMatch(orign: NormalTiled, matchItems: Blocker[], checkFalling: boolean = true): BlockerID {
        let spType: BlockerID = BlockerID.none;
        this.m_blklst = [];
        this.FallingWaitCount = 0;
        this.m_blklst = orign.FindMatchesAround(this.m_blklst);
        if (this.m_blklst.length <= 2) {
            return spType;
        }
        const blockerID = this.CheckAllBlockerMatch(orign, matchItems, checkFalling);
        if (checkFalling) {
            this.SetMatchItemsGuid(matchItems);
        }
        return blockerID;
    }

    private static MATCH_GUID_OFFSET: number = 1000;
    private static m_matchGuid: number = 0;

    public static get MatchGuid(): number {
        return this.m_matchGuid;
    }

    public static set MatchGuid(value: number) {
        this.m_matchGuid = value;
    }

    private static SetMatchItemsGuid(matchItems: Blocker[]) {
        this.m_matchGuid++;
        for (let i = 0; i < matchItems.length; i++) {
            matchItems[i].MatchGuid = this.MATCH_GUID_OFFSET + this.m_matchGuid;
        }
    }
}
