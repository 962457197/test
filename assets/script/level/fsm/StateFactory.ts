import { FSAdpater, FSBase, FSCheck, FSPrepare, FSSwitch } from "./FSBase";
import { FSStateType } from "./FSM";

export class StateFactory {
    private static s_instance: StateFactory;
    public static get Instance(): StateFactory {
        if (null == StateFactory.s_instance) {
            StateFactory.s_instance = new StateFactory();
        }
        return StateFactory.s_instance;
    }

    private m_pools: Map<FSStateType, FSBase[]> = new Map<FSStateType, FSBase[]>();

    private static count: number = 0;

    public Create(stateType: FSStateType): FSBase | null {
        StateFactory.count++;
        let outLst: FSBase[] | undefined = this.m_pools.get(stateType);

        if (outLst != null) {
            if (outLst.length > 0) {
                const ret: FSBase = outLst[outLst.length - 1];
                outLst.pop();
                ret.Reset();
                // console.log("Create:" + ret.constructor.name + " this:" + ret.GetHashCode());
                return ret;
            }
        }

        switch (stateType) {
            case FSStateType.enPrepare:
                return new FSPrepare();
            case FSStateType.enSwitch:
                return new FSSwitch();
            case FSStateType.enCheck:
                return new FSCheck();
            case FSStateType.enAdpater:
                return new FSAdpater();
            default:
                return null;
        }
    }

    public Recycle(fsbase: FSBase): void {
        StateFactory.count--;
        // console.log("Recycle:" + StateFactory.count + " fsbase:" + fsbase.GetHashCode() + " :" + fsbase.constructor.name);
        let outLst: FSBase[] | undefined = this.m_pools.get(fsbase.StateType);

        if (outLst) {
            for (let i = 0; i < outLst.length; i++) {
                if (outLst[i] === fsbase) {
                    return;
                }
            }

            outLst.push(fsbase);
            return;
        }

        outLst = [fsbase];
        this.m_pools.set(fsbase.StateType, outLst);
    }
}
