import { EffectBase, EffectBaseCrush } from "./EffectBase";
import { EffectController, EffectType } from "./EffectController";

export class EffectControllerFactory {
    private static instance: EffectControllerFactory;

    private m_ControllerPool: EffectController[] = [];
    private m_EffectPool: { [key in EffectType]?: EffectBase[] } = {};

    private OnCreateEffectFuns: { [key in EffectType]?: () => EffectBase } = {};

    private constructor() {
        this.m_EffectPool = {};
        this.OnCreateEffectFuns = {};
        this.InitCreateEffectFuns();
    }

    public static get Instance(): EffectControllerFactory {
        if (this.instance == null) {
            this.instance = new EffectControllerFactory();
        }
        return this.instance;
    }

    private InitCreateEffectFuns(): void {
        this.OnCreateEffectFuns[EffectType.BaseCrush] = () => new EffectBaseCrush();

        // this.OnCreateEffectFuns[EffectType.LineCrush] = () => new EffectLineCrush();
        // this.OnCreateEffectFuns[EffectType.AreaCrush] = () => new EffectAreaCrush();
        // this.OnCreateEffectFuns[EffectType.SquareCrush] = () => new EffectSquareCrush();
        // this.OnCreateEffectFuns[EffectType.SameColorBase] = () => new EffectSameColorBase();
        // this.OnCreateEffectFuns[EffectType.SquareAreaCompose] = () => new EffectSquareAreaCompose();
        // this.OnCreateEffectFuns[EffectType.SquareAreaCrush] = () => new EffectSquareAreaCrush();
        // this.OnCreateEffectFuns[EffectType.SquareLineCompose] = () => new EffectSquareLineCompose();
        // this.OnCreateEffectFuns[EffectType.SquareLineCrush] = () => new EffectSquareLineCrush();
        // this.OnCreateEffectFuns[EffectType.SquareAndSquare] = () => new EffectSquareAndSquare();
        // this.OnCreateEffectFuns[EffectType.DirLine] = () => new EffectDirLineCrush();
        // this.OnCreateEffectFuns[EffectType.JackCrush] = () => new EffectJackCrush();
        // this.OnCreateEffectFuns[EffectType.AreaLine] = () => new EffectAreaLine();
        // this.OnCreateEffectFuns[EffectType.LineLine] = () => new EffectLineAndLine();
        // this.OnCreateEffectFuns[EffectType.AreaAndArea] = () => new EffectAreaAndArea();
        // this.OnCreateEffectFuns[EffectType.SameColorLine] = () => new EffectSameColorLine();
        // this.OnCreateEffectFuns[EffectType.SameColorArea] = () => new EffectSameColorArea();
        // this.OnCreateEffectFuns[EffectType.SameColorSquare] = () => new EffectSameColorSquare();
        // this.OnCreateEffectFuns[EffectType.SameColor] = () => new EffectSameColor();
        // this.OnCreateEffectFuns[EffectType.BoostCrossLine] = () => new EffectBoostCrossLine();
        // this.OnCreateEffectFuns[EffectType.RollingCrush] = () => new EffectRollingCrush();
        // this.OnCreateEffectFuns[EffectType.GummyBear] = () => new EffectGummyBear();
        // this.OnCreateEffectFuns[EffectType.Magician] = () => new EffectMagicianCrush();
        // this.OnCreateEffectFuns[EffectType.TntMonster] = () => new EffectTntMonster();
        // this.OnCreateEffectFuns[EffectType.JellyfishCrush] = () => new EffectJellyfishCrush();
        // this.OnCreateEffectFuns[EffectType.HammerMallet] = () => new EffectHammerMallet();
        // this.OnCreateEffectFuns[EffectType.BoostTNT] = () => new EffectBoostTNT();
    }

    public PopController(callback: () => void): EffectController {
        let controller: EffectController;
        if (this.m_ControllerPool.length > 0) {
            controller = this.m_ControllerPool[0];
            this.m_ControllerPool.splice(0, 1);
        } else {
            controller = new EffectController();
        }

        controller.Reset(callback);
        return controller;
    }

    public PushContorller(controller: EffectController): void {
        if (controller != null && !this.m_ControllerPool.includes(controller)) {
            this.m_ControllerPool.push(controller);
        }
    }

    public PopEffect(type: EffectType): EffectBase | null {
        let effect: EffectBase | null = null;
        const effectList = this.m_EffectPool[type];

        if (effectList && effectList.length > 0) {
            effect = effectList[0];
            effectList.splice(0, 1);
            return effect;
        }

        if (this.OnCreateEffectFuns[type]) {
            effect = this.OnCreateEffectFuns[type]();
        }

        if (type === EffectType.BaseCrush)
        {
            effect = new EffectBaseCrush();
        }

        return effect;
    }

    public PushEffect(type: EffectType, effect: EffectBase): void {
        if (!this.m_EffectPool[type]) {
            this.m_EffectPool[type] = [];
        }

        if (effect != null) {
            this.m_EffectPool[type].push(effect);
        }
    }
}
