import { Timer, TimerData, TimerManager, TimerType } from "../../tools/TimerManager";
import { Tiled } from "../tiledmap/Tiled";
import { EffectBase, EffectData } from "./EffectBase";
import { EffectControllerFactory } from "./EffectControllerFactory";

export enum EffectType
{
    None            = -1,
    BaseCrush       = 0,
    LineCrush       , // SpHor Ver
    AreaCrush       , //SpPack
    AreaAndArea     , 
    SameColorBase   ,
    SameColorLine   ,
    SameColorArea   ,
    SameColorSquare ,
    SameColor       , //Sp Multi
    AreaLine        ,
    LineLine        ,
    BoostPoint      ,
    BoostCrossLine  ,
    SquareCrush     ,
    SquareLineCompose   ,
    SquareLineCrush ,
    SquareAreaCompose   ,
    SquareAreaCrush ,
    SquareAndSquare ,
    SquareSameColor ,  // Use SameColorSquare Instead
    JackCrush       ,
    DirLine         ,
    RollingCrush    ,
    MagicWand       ,
    RocketLauncher  ,
    GummyBear       ,
    Magician        ,
    TntMonster      ,
    JellyfishCrush  ,
    HammerMallet    ,
    BoostTNT        ,
    BoxingGlove     ,
}

export class EffectController {
    private m_callback: (() => void) | null;
    private m_count: number = 0;
    private m_PlayTimer: Timer | null = null;
    private m_effects: EffectBase[] = [];

    constructor() {
    }

    public Reset(callback: () => void) {
        this.m_count = 0;
        this.m_effects = [];
        this.m_callback = callback;
        if (this.m_PlayTimer !== null) {
            TimerManager.Instance.ForceStopTimer(this.m_PlayTimer, this);
            this.m_PlayTimer = null;
        }
    }

    public CreateEffect(type: EffectType, orign: Tiled, check: EffectData, args: any = null) {
        const eff = EffectControllerFactory.Instance.PopEffect(type);
        if (eff != null) {
            eff.Reset(orign, this.OnEffectCallback, check, args);
            this.m_count++;
            this.m_effects.push(eff);
        }
    }

    public Execute() {
        if (this.m_effects.length > 0) {
            this.Run();
        } else if (this.m_callback) {
            this.m_callback();
        }
    }

    private Run() {
        for (let i = 0; i < this.m_effects.length; i++) {
            this.StepExecuteEffect(this.m_effects[i]);
        }
    }

    private StepExecuteEffect(effect: EffectBase) {
        effect.Start();

        let timerData = new TimerData();
        timerData.type = TimerType.enConditionOnce;
        timerData.objthis = this,
        timerData.condition = effect.ExecutePlayCondition;
        timerData.body = effect.Play;
        timerData.end = ()=>
        {
            this.m_PlayTimer = null;
            effect.OnPlayCallback();
        }
        this.m_PlayTimer = TimerManager.Instance.CreateTimer(timerData);
    }

    public OnEffectCallback(succ: boolean, effbase: EffectBase | null = null) {
        this.m_count--;
        if (this.m_count <= 0 && this.m_callback) {
            this.m_callback();

            for (let i = 0; i < this.m_effects.length; i++) {
                const effect = this.m_effects[i];
                if (effect) {
                    effect.OnRecovery();
                    EffectControllerFactory.Instance.PushEffect(effect.EffType, effect);
                }
            }
            this.m_effects = [];

            this.OnRecovery();
            EffectControllerFactory.Instance.PushContorller(this);
        }
    }

    public OnRecovery() {
        if (this.m_PlayTimer) {
            TimerManager.Instance.ForceStopTimer(this.m_PlayTimer, this);
            this.m_PlayTimer = null;
        }
    }
}
