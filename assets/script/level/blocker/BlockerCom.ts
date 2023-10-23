// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class BlockerCom extends cc.Component {

    @property(cc.Node)
    RootBone: cc.Node = null;

    @property(cc.Node)
    DynamicNode: cc.Node = null;

    @property(cc.Animation)
    Anim: cc.Animation = null;

    PlayAnim(animName: string)
    {
        this.Anim.play(animName);
    }
}
