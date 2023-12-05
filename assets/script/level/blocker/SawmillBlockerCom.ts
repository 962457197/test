
import BlockerCom from "./BlockerCom";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SawmillBlockerCom extends BlockerCom {
    @property(cc.Node)
    SawmillSpriteTrans: cc.Node = null;

    @property(cc.Node)
    TopRootTrans: cc.Node = null;
}