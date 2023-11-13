// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { BlockerID } from "./BlockerManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BaseBlockDestroyCom extends cc.Component {

    @property({ type: cc.SpriteFrame})
    AllSprites: cc.SpriteFrame[] = [];

    @property(cc.Sprite)
    Icon01: cc.Sprite = null;

    @property(cc.Sprite)
    Icon02: cc.Sprite = null;

    @property(cc.Sprite)
    Icon03: cc.Sprite = null;

    @property(cc.Sprite)
    Icon04: cc.Sprite = null;

    ChangeSpriteByColor(colorId: number)
    {
        let index = colorId <= 0 ? BlockerID.baseredid : colorId - BlockerID.baseredid;
        index *= 2;
        let sprite01 = this.AllSprites[index];
        let sprite02 = this.AllSprites[index + 1];
        
        this.Icon01.spriteFrame = sprite01;
        this.Icon03.spriteFrame = sprite01;

        this.Icon02.spriteFrame = sprite02;
        this.Icon04.spriteFrame = sprite02;
    }
}
