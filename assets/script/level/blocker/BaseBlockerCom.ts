// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../../Game";
import BlockerCom from "./BlockerCom";
import { BlockerID } from "./BlockerManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BaseBlockerCom extends BlockerCom {

    @property(cc.Sprite)
    Icon: cc.Sprite = null;

    RefreshIcon(id: number)
    {
        cc.resources.load("texture/" + Game.GetIconName(id), cc.SpriteFrame, (err, data: any) =>
        {
            this.Icon.spriteFrame = data;
        });
    }

    SetRotate(id: number)
    {
        if (id == BlockerID.horizontal)
        {
            this.Icon.node.angle = 0;
        }
        else if (id == BlockerID.vertical)
        {
            this.Icon.node.angle = -90;
        }
    }
}
