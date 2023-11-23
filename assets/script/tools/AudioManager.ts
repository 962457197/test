export class AudioManager {
    private static instance: AudioManager | null = null;

    private constructor() {
        // 防止外部实例化
    }
  
    public static get Instance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    m_loopCount: number = 0;

    AudioSource: cc.AudioSource = null;
    AudioSourceLoop: cc.AudioSource = null;

    PlaySource(clipName: string)
    {
        cc.resources.load("audio/" + clipName, cc.AudioClip, null, (err, clip: any) =>{
            // var audioSource = this.AudioSource.addComponent(cc.AudioSource);

            // setTimeout(function () {
            //     this.AudioSource.node.removeComponent(audioSource);
            //   }.bind(this), 2000);
            
            // audioSource.clip = clip;
            // audioSource.play();

            cc.audioEngine.playEffect(clip, false);
        });
    }

    PlaySourceLoop(clipName: string)
    {
        if (this.AudioSourceLoop.clip != null && this.AudioSourceLoop.clip.name == clipName)
        {
            this.m_loopCount++;
            return;
        }

        cc.resources.load("audio/" + clipName, cc.AudioClip, null, (err, clip: any) =>{
            this.AudioSourceLoop.clip = clip;
            this.AudioSourceLoop.loop = true;
            this.AudioSourceLoop.volume = 1;
            this.AudioSourceLoop.play();
        });
    }

    StopSourceLoop()
    {
        this.m_loopCount--;
        if (this.m_loopCount <= 0)
        {
            this.AudioSourceLoop.loop = false;
            this.AudioSourceLoop.clip = null;
            this.AudioSourceLoop.stop();
        }
    }
}