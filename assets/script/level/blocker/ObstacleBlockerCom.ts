// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../../Game";
import BlockerCom from "./BlockerCom";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ObstacleBlockerCom extends BlockerCom {

    @property(cc.Sprite)
    Icon: cc.Sprite = null;

    RefreshIcon(id: number)
    {
        cc.resources.load("icon/other/" + Game.GetIconName(id), cc.SpriteFrame, (err, data: any) =>
        {
            if (this.Icon == null)
            {
                return;
            }
            this.Icon.spriteFrame = data;
        });
    }
}
