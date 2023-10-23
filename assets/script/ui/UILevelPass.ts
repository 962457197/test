// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class UILevelPass extends cc.Component {

    static SKIN_LEVEL_COMPLETE: string = "level";
    static ANIM_LEVEL_COMPLETE: string = "levelpass_victory";

    @property(sp.Skeleton)
    SpineSkeleton: sp.Skeleton = null;

    start () {
        // this.SpineSkeleton.setSkin(UILevelPass.SKIN_LEVEL_COMPLETE);
        // this.SpineSkeleton.setAnimation(0, UILevelPass.ANIM_LEVEL_COMPLETE, false);
    }
}
