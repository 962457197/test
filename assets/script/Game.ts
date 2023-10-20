// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

import { BinaryHelper} from './tools/BinaryHelper';
import { BlockTable, BlockerData, FirstActionType } from './table/BlockTable';
import { LevelScriptableData } from './level/data/LevelScriptableData';
import { TiledMap } from './level/tiledmap/TiledMap';
import { IconTable } from './table/IconTable';
import { TiledMapTouchHandler } from './tools/TiledMapTouchHandler';
import { CameraManager } from './tools/CameraManager';
import { TimerManager, TimerData, TimerType} from './tools/TimerManager';
import { Utils } from './tools/Utils';
import { FallingManager } from './level/drop/FallingManager';
import { FSM } from './level/fsm/FSBase';

export enum GameState
{
    Init,
    LoadData,
    CreateMap,
    CreateBlocker,
    Play,
}

@ccclass
export default class Game extends cc.Component {

    @property(cc.Node)
    tiledMapRoot: cc.Node = null;

    @property(cc.Node)
    tiledRoot: cc.Node = null;

    @property(cc.Node)
    blockerRoot: cc.Node = null;

    @property(cc.Node)
    effectRoot: cc.Node = null;

    @property(cc.Camera)
    MainCamera: cc.Camera = null;

    @property(cc.Node)
    CanvasNode: cc.Node = null;

    static CC_SIZE_MULTI = 100;
    // static GROUP_BLOCK = "block";

    static m_blockTable: BlockTable = new BlockTable();
    static m_iconTable: IconTable = new IconTable();
    static LoadingAssetCount: number = 0;
    static m_gameState: GameState = GameState.Init;

    m_levelData: LevelScriptableData = new LevelScriptableData();

    onLoad () {
        // cc.resources.load("texture/element_common_red", cc.SpriteFrame, (err, data: any) =>
        // {
        //     Utils.SetNodeActive(this.BG.node, true);
        //     this.BG.spriteFrame = data;
        //     cc.log("222" + err + data);
        // });
        TiledMap.getInstance().m_effectRoot = this.effectRoot;

        Game.LoadingAssetCount++;
        cc.resources.load("table/" + BlockTable.NAME, cc.JsonAsset, (err, jsonAsset: any) =>{
            if (err) {
                cc.error(`Error loading JSON file: ${err}`);
                return;
            }

            Game.m_blockTable.Load(jsonAsset.json);
            Game.LoadingAssetCount--;
        });

        Game.LoadingAssetCount++;
        cc.resources.load("table/" + IconTable.NAME, cc.JsonAsset, (err, data: any) =>{
            if (err) {
                cc.error(`Error loading JSON file: ${err}`);
                return;
            }

            Game.m_iconTable.Load(data.json);
            Game.LoadingAssetCount--;
        });
        
        Game.LoadingAssetCount++;
        cc.resources.load("level/000001", cc.JsonAsset, (err, data: any) =>{
            if (err) {
                cc.error(`Error loading JSON file: ${err}`);
                return;
            }
            this.m_levelData = data.json;
            Game.LoadingAssetCount--;

            // for (let index = 0; index < this.m_levelData.tiledData.length; index++) {
            //     for (let j = 0; j < this.m_levelData.tiledData[index].blockDataList.length; j++) {
            //         const element = this.m_levelData.tiledData[index].blockDataList[j];
            //         cc.log("tield index = " + index + " blcoker id = " + element.Id);
            //     }   
            // }
        });

        CameraManager.getInstance().MainCamera = this.MainCamera;
        CameraManager.getInstance().Adapter(this.CanvasNode);

        TiledMapTouchHandler.getInstance().Init();
        Game.m_gameState = GameState.LoadData;
    }

    static GetBlockData(id: number)
    {
        return Game.m_blockTable.Lookup(id);
    }

    static GetIconName(id: number)
    {
        return Game.m_iconTable.Lookup(id).IconName;
    }

    static IsPlayState()
    {
        return Game.m_gameState === GameState.Play && FSM.getInstance().CanOperate();
    }

    update (dt) 
    {
        if (Game.m_gameState === GameState.Init)
        {
            return;
        }
        else if (Game.m_gameState === GameState.LoadData)
        {
            if (Game.LoadingAssetCount <= 0)
            {
                TiledMap.getInstance().OnCreate(this.m_levelData, this.tiledMapRoot, this.tiledRoot, this.blockerRoot);
                Game.m_gameState = GameState.CreateMap;
            }
            return;
        }
        else if (Game.m_gameState === GameState.CreateMap)
        {
            if (Game.LoadingAssetCount <= 0)
            {
                TiledMap.getInstance().SetTiledData();
                Game.m_gameState = GameState.CreateBlocker;
            }
            return;
        }
        else if (Game.m_gameState === GameState.CreateBlocker)
        {
            if (Game.LoadingAssetCount <= 0)
            {
                Game.m_gameState = GameState.Play;
            }
            return;
        }

        TimerManager.Instance.OnUpdate(dt);
        FallingManager.Instance.OnUpdate();
    }
}
