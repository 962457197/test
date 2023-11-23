import { AudioManager } from "../../tools/AudioManager";
import { TimerManager } from "../../tools/TimerManager";

export class LevelManager {
    private static instance: LevelManager | null = null;

    private constructor() {
        // 防止外部实例化
    }
  
    public static get Instance(): LevelManager {
        if (!LevelManager.instance) {
            LevelManager.instance = new LevelManager();
        }
        return LevelManager.instance;
    }

    m_IsCombo: boolean = false;
    m_combo: number = 0;
    m_CheckCombTimer: number = 0;
    m_ResetCombTime: number = 1;
    get CombCount()
    {
        return this.m_combo;
    }
    set CombCount(value: number)
    {
        this.m_combo = value;
        if (value == 0)
        {
            return;
        }
        else if (value == 1)
        {
            AudioManager.Instance.PlaySource("Audio_Match_Base1");
        }
        else if (value == 2)
        {
            AudioManager.Instance.PlaySource("Audio_Match_Base2");
        }
        else if (value == 3)
        {
            AudioManager.Instance.PlaySource("Audio_Match_Base3");
        }
        else if (value == 4)
        {
            AudioManager.Instance.PlaySource("Audio_Match_Base4");
        }
        else
        {
            AudioManager.Instance.PlaySource("Audio_Match_Base5");
        }
        this.m_IsCombo = true;
    }

    Tick()
    {
        if (this.m_IsCombo)
        {
            if (this.m_CheckCombTimer >= this.m_ResetCombTime)
            {
                this.m_CheckCombTimer = 0;
                this.m_IsCombo = false;
                this.m_combo = 0;
            }
            else
            {
                this.m_CheckCombTimer += TimerManager.Instance.GetDeltaTime();
            }
        }
    }
}