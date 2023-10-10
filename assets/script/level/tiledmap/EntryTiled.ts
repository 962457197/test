// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../../Game";
import { LevelTiledData } from "../data/LevelScriptableData";
import { Tiled } from "./Tiled";
import { TiledMap } from "./TiledMap";

export class EntryTiled extends Tiled {

    Create(idx: number, data: LevelTiledData, parent: cc.Node, row: number, col: number, name: string)
    {
        this.m_tiledTableData = data;
        this.Row = row;
        this.Col = col;
        this.Guid = TiledMap.ENTRY_GUID_OFFSET + idx;

        this.m_tiledRoot = new cc.Node(name);
        this.m_tiledRoot.setParent(parent);
        this.m_tiledRoot.setPosition(col * Tiled.WIDTH, -row * Tiled.HEIGHT);

        Game.LoadingAssetCount++;
        cc.resources.load("prefab/tiled/EntryTiled", (err, data: any) =>{
            this.m_tiled = cc.instantiate(data);
            Game.LoadingAssetCount--;
        });
    }
}
