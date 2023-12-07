// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { BlockerID } from "./BlockerManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GrassDestroyCom extends cc.Component {
    @property({ type: cc.SpriteFrame})
    AllSpritesFrame: cc.SpriteFrame[] = [];

    @property({ type: cc.Sprite})
    Sprites1: cc.Sprite[] = [];

    @property({ type: cc.Sprite})
    Sprites2: cc.Sprite[] = [];

    @property({ type: cc.Sprite})
    Sprites3: cc.Sprite[] = [];

    ChangeSpriteById(blockerId: number)
    {
        let index = 0;
        if (blockerId == BlockerID.bottom_a_id)
        {
            index = 0;
        }
        else if (blockerId == BlockerID.bottom_b_id)
        {
            index = 3;
        }
        else if (blockerId == BlockerID.bottom_c_id)
        {
            index = 6;
        }
        
        for (let i = 0; i < this.Sprites1.length; i++) {
            const element = this.Sprites1[i];
            element.spriteFrame = this.AllSpritesFrame[index];
        }

        for (let i = 0; i < this.Sprites2.length; i++) {
            const element = this.Sprites2[i];
            element.spriteFrame = this.AllSpritesFrame[index + 1];
        }

        for (let i = 0; i < this.Sprites3.length; i++) {
            const element = this.Sprites3[i];
            element.spriteFrame = this.AllSpritesFrame[index + 2];
        }
    }
}
