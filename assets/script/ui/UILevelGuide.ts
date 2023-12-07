// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import { Direction } from "../level/data/LevelScriptableData";
import { Tiled } from "../level/tiledmap/Tiled";
import { TiledMap } from "../level/tiledmap/TiledMap";
import { CameraManager } from "../tools/CameraManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UILevelGuide extends cc.Component {

    @property(cc.Node)
    Root: cc.Node = null;

    @property(cc.Node)
    Bg: cc.Node = null;

    @property(cc.Node)
    Mask: cc.Node = null;

    @property(cc.Node)
    CommonHand: cc.Node = null;

    @property(cc.Animation)
    CommonHandAnim :cc.Animation = null;

    start () {
        this.Adpater();

        if (TiledMap.getInstance().GuideStartTiled != null && TiledMap.getInstance().GuideEndTiled != null)
        {
            let direction: Direction = TiledMap.getInstance().GetComposeDir(TiledMap.getInstance().GuideStartTiled.Guid, TiledMap.getInstance().GuideEndTiled.Guid);
            if (direction == Direction.Down)
            {
                this.Mask.width = Tiled.WIDTH * Game.m_buildConfig.TiledMapScale 
                this.Mask.height = Tiled.HEIGHT *  Game.m_buildConfig.TiledMapScale * 2;

                let localPos = this.Mask.parent.convertToNodeSpaceAR(new cc.Vec2(TiledMap.getInstance().GuideStartTiled.WorldPosition.x, TiledMap.getInstance().GuideStartTiled.WorldPosition.y - (Tiled.HEIGHT * Game.m_buildConfig.TiledMapScale) / 2));
                this.Mask.setPosition(localPos);
                this.CommonHandAnim.play("common_hand_row");
            }
            else
            {
                this.Mask.width = Tiled.WIDTH * Game.m_buildConfig.TiledMapScale * 2;
                this.Mask.height = Tiled.HEIGHT *  Game.m_buildConfig.TiledMapScale;

                let localPos = this.Mask.parent.convertToNodeSpaceAR(new cc.Vec2(TiledMap.getInstance().GuideStartTiled.WorldPosition.x + (Tiled.WIDTH * Game.m_buildConfig.TiledMapScale) / 2, TiledMap.getInstance().GuideStartTiled.WorldPosition.y));
                this.Mask.setPosition(localPos);
                this.CommonHandAnim.play("common_hand");
            }

            if (TiledMap.getInstance().GuideStartTiled.CanMoveBlocker != null)
            {
                TiledMap.getInstance().GuideStartTiled.CanMoveBlocker.PlayMatchTipsAnimation(Direction.None);
            }
            if (TiledMap.getInstance().GuideEndTiled.CanMoveBlocker != null)
            {
                TiledMap.getInstance().GuideEndTiled.CanMoveBlocker.PlayMatchTipsAnimation(Direction.None);
            }
        }

        this.Bg.setPosition(-this.Mask.position.x, -this.Mask.position.y);
        this.CommonHand.setPosition(this.Mask.position.x - Tiled.WIDTH / 2, this.Mask.position.y);
    }

    Close()
    {
        this.StopGuideTips();
        this.node.destroy();
    }

    StopGuideTips()
    {
        if (TiledMap.getInstance().GuideStartTiled != null && TiledMap.getInstance().GuideStartTiled.CanMoveBlocker != null)
        {
            TiledMap.getInstance().GuideStartTiled.CanMoveBlocker.StopAnimation();
        }
        if (TiledMap.getInstance().GuideEndTiled != null && TiledMap.getInstance().GuideEndTiled.CanMoveBlocker != null)
        {
            TiledMap.getInstance().GuideEndTiled.CanMoveBlocker.StopAnimation();
        }
    }

    Adpater()
    {
        this.Bg.scale = CameraManager.getInstance().MaxRate;
    }
}
