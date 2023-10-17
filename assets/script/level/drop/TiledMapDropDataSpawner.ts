import { DropDataType, LevelDropColorData, LevelDropData } from "../data/LevelScriptableData";
import { TiledMap } from "../tiledmap/TiledMap";

export class DropDataBase {
    public type: DropDataType;
    public id: number = 0;
    public onceCount: number = 0;
    public dropCount: number = 0;
    public genMax: number = 0;
    public spawn: number = 0;
    public allowMax: number = 0;
    public allowMin: number = 0;
    public limit: number = 0;
    public start: number = 0;
    public end: number = 0;
    public steps: number = 0;
    public genedCount: number = 0;
    public enterlst: number[] = [];
}

export class CommonDropData extends DropDataBase {
    constructor() {
        super();
        this.type = DropDataType.Common;
    }
}

export class DropColorDataBase {
    public id: number = 0;
    public colorlst: number[] = [];
    public enterlst: number[] = [];
}

export class DropDataFactory {
    public static BuildLevelDropData(lvldata: LevelDropData): DropDataBase | null {
        let database: DropDataBase = new CommonDropData();
        if (database !== null) {
            database.type = lvldata.type;
            database.id = lvldata.id;
            database.allowMax = lvldata.allowMax;
            database.allowMin = lvldata.allowMin;
            database.genMax = lvldata.genMax;
            database.onceCount = lvldata.onceCount;
            database.spawn = lvldata.spawn;
            database.limit = lvldata.limit;
            database.start = lvldata.start;
            database.end = lvldata.end;
            database.enterlst.push(...lvldata.enterlst);
            if (database.limit > 0) {
                let total = database.limit * lvldata.enterlst.length;
                database.genMax = Math.min(total, database.genMax);
            }
        }
        return database;
    }

    public static BuildLevelDropColorData(lvldata: LevelDropColorData): DropColorDataBase | null {
        if (lvldata.colorlst.length > 0 && lvldata.enterlst.length > 0) {
            let database: DropColorDataBase = new DropColorDataBase();
            database.id = lvldata.id;
            database.colorlst.push(...lvldata.colorlst);
            database.enterlst.push(...lvldata.enterlst);
            return database;
        }
        return null;
    }
}

export class TiledMapDropDataSpawner {
    private _spawnerConfigs: DropDataBase[] = [];
    private _spawnerColorConfigs: DropColorDataBase[] = [];

    public Destroy(): void {
        this._spawnerConfigs = [];
        this._spawnerColorConfigs = [];
    }

    public Add(dropdata: DropDataBase | DropColorDataBase): void {
        if (dropdata instanceof DropDataBase) {
            this._spawnerConfigs.push(dropdata);
        } else if (dropdata instanceof DropColorDataBase) {
            this._spawnerColorConfigs.push(dropdata);
        }
    }

    public UpdateData(id: number, guid: number): void {
        let dropdata: DropDataBase | null = null;
        for (let i = 0; i < this._spawnerConfigs.length; i++) {
            if (this._spawnerConfigs[i].id === id) {
                dropdata = this._spawnerConfigs[i];
            }
        }

        if (dropdata !== null) {
            dropdata.genedCount++;
            if (TiledMap.getInstance().DropLimitInfo.get(guid)) {
                if (TiledMap.getInstance().DropLimitInfo.get(guid)!.has(id)) {
                    TiledMap.getInstance().DropLimitInfo.get(guid)!.set(id, (TiledMap.getInstance().DropLimitInfo.get(guid)!.get(id)! + 1));
                }
            }
            if (dropdata.dropCount > 0) {
                dropdata.dropCount--;
            }
        }
    }

    private CheckSpawer(database: DropDataBase, moved: number, existed: number): boolean {
        if (database.genMax < 0 ||
            database.onceCount < 0 ||
            (database.genMax > 0 && database.genedCount >= database.genMax) ||
            (database.allowMax > 0 && database.allowMax < database.allowMin)) {
            return false;
        }

        const commonDrop = database as CommonDropData;

        if (existed >= database.allowMax && database.allowMax > 0) {
            if (moved - commonDrop.steps >= commonDrop.spawn) {
                commonDrop.steps = moved;
                database.dropCount += database.onceCount;
            }
            return false;
        }

        if (moved - commonDrop.steps < commonDrop.spawn) {
            if (database.dropCount > 0) {
                return true;
            }
            if (existed < database.allowMin && database.allowMin > 0) {
                return true;
            }
            return false;
        }

        commonDrop.steps = moved;
        database.dropCount += database.onceCount;
        if (database.dropCount <= 0) {
            return false;
        }

        return true;
    }

    private GetExisted(id: number): number {
        let existed = 0;
        const tileds = TiledMap.getInstance().TiledArray;

        // if (JellyBlocker.IsJellyBlocker(id)) {
        //     for (let i = 0; i < tileds.length; i++) {
        //         const tiled = tileds[i];
        //         if (tiled.CanMoveBlocker?.ID === BlockerID.jelly_02 || tiled.CanMoveBlocker?.ID === BlockerID.jelly_01) {
        //             existed++;
        //         }
        //     }
        // } else 
        {
            for (let i = 0; i < tileds.length; i++) {
                const tiled = tileds[i];
                if (tiled.CanMoveBlocker?.ID === id) {
                    existed++;
                }
            }
        }

        return existed;
    }

    private IsHasGuid(list: number[], guid: number): boolean {
        return list.includes(guid);
    }

    private CheckDrop(dropData: DropDataBase, guid: number, move: number): boolean {
        if (TiledMap.getInstance().DropDataEndInfo.get(dropData.id)) {
            if (TiledMap.getInstance().DropDataEndInfo.get(dropData.id)!) {
                return false;
            }
        }

        if (move < dropData.start) {
            return false;
        }

        if (dropData.end > 0 && TiledMap.getInstance().CurrentLevelLimit <= dropData.end) {
            if (TiledMap.getInstance().DropDataEndInfo.get(dropData.id)) {
                TiledMap.getInstance().DropDataEndInfo.set(dropData.id, true);
            }
            return false;
        }

        if (dropData.limit > 0 && TiledMap.getInstance().DropLimitInfo.get(guid)) {
            if (TiledMap.getInstance().DropLimitInfo.get(guid)!.has(dropData.id)) {
                const limit = TiledMap.getInstance().DropLimitInfo.get(guid)!.get(dropData.id)!;
                if (limit >= dropData.limit) {
                    return false;
                }
            }
        }

        return true;
    }

    public DropBaseColor(guid: number): number {
        // if (LevelManager.Instance.IsTargetCompleted) {
        //     return -1;
        // }

        for (let i = 0; i < this._spawnerColorConfigs.length; i++) {
            if (this.IsHasGuid(this._spawnerColorConfigs[i].enterlst, guid)) {
                const count = this._spawnerColorConfigs[i].colorlst.length;
                if (count === 0) {
                    return -1;
                } else {
                    const idx =TiledMap.getInstance().RandomRange(0, count - 1);
                    return this._spawnerColorConfigs[i].colorlst[idx];
                }
            }
        }

        return -1;
    }

    public Spawner(guid: number): DropDataBase | null {
        // if (LevelManager.Instance.IsTargetCompleted) {
        //     return null;
        // }

        const moved = TiledMap.getInstance().TotalMoves - TiledMap.getInstance().CurrentLevelLimit;
        const validLst: DropDataBase[] = [];

        for (let i = 0; i < this._spawnerConfigs.length; i++) {
            if (this.IsHasGuid(this._spawnerConfigs[i].enterlst, guid) && this.CheckDrop(this._spawnerConfigs[i], guid, moved)) {
                const existed = this.GetExisted(this._spawnerConfigs[i].id);

                if (this.CheckSpawer(this._spawnerConfigs[i], moved, existed)) {
                    if (existed < this._spawnerConfigs[i].allowMin && this._spawnerConfigs[i].allowMin > 0) {
                        return this._spawnerConfigs[i];
                    }
                    validLst.push(this._spawnerConfigs[i]);
                }
            }
        }

        if (validLst.length > 0) {
            const idx = TiledMap.getInstance().RandomRange(0, validLst.length - 1);
            return validLst[idx];
        }

        return null;
    }

    public GetNeedDropCount(id: number): number {
        let dropdata: DropDataBase | null = null;
        for (let i = 0; i < this._spawnerConfigs.length; i++) {
            if (this._spawnerConfigs[i].id === id) {
                dropdata = this._spawnerConfigs[i];
            }
        }

        if (dropdata !== null) {
            if (dropdata.genMax < 0 ||
                dropdata.onceCount < 0 ||
                (dropdata.genMax > 0 && dropdata.genedCount >= dropdata.genMax) ||
                (dropdata.allowMax > 0 && dropdata.allowMax < dropdata.allowMin)) {
                return 0;
            }

            const count = dropdata.genMax - dropdata.genedCount;
            return count;
        }

        return 0;
    }
}