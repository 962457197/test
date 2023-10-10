// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html


export class BinaryHelper {
    private m_stream: DataView;

    constructor(buff?: Uint8Array) {
        if (buff) {
            this.m_stream = new DataView(buff.buffer);
        } else {
            this.m_stream = new DataView(new ArrayBuffer(0));
        }
    }

    // public Reset(arg: Uint8Array): void;
    // public Reset(arg: BinaryHelper): void;
    // public Reset(): void;

    public Reset(arg?: Uint8Array | BinaryHelper): void {
        if (arg instanceof Uint8Array) {
            this.m_stream = new DataView(arg.buffer);
        } else if (arg instanceof BinaryHelper) {
            const data = new Uint8Array(arg.GetBytes());
            this.m_stream = new DataView(data.buffer);
        } else {
            this.m_stream = new DataView(new ArrayBuffer(0));
        }
    }

    public GetBytes(): Uint8Array {
        return new Uint8Array(this.m_stream.buffer);
    }

    public WriteByte(value: number): void {
        this.m_stream.setUint8(this.m_stream.byteLength, value);
    }

    public WriteInt(value: number): void {
        this.m_stream.setInt32(this.m_stream.byteLength, value, true);
    }

    public WriteFloat(value: number): void {
        this.m_stream.setFloat32(this.m_stream.byteLength, value, true);
    }

    public WriteBool(value: boolean): void {
        this.m_stream.setUint8(this.m_stream.byteLength, value ? 1 : 0);
    }

    public WriteDouble(value: number): void {
        this.m_stream.setFloat64(this.m_stream.byteLength, value, true);
    }

    public WriteString(value: string | null): void {
        if (value === null) {
            this.WriteInt(0);
        } else {
            const charArray = new Uint16Array(value.length);
            for (let i = 0; i < value.length; i++) {
                charArray[i] = value.charCodeAt(i);
            }
            const byteLength = charArray.byteLength;
            this.WriteInt(byteLength);
    
            for (let i = 0; i < charArray.length; i++) {
                this.m_stream.setUint8(this.m_stream.byteLength, charArray[i] & 0xFF);
                this.m_stream.setUint8(this.m_stream.byteLength, (charArray[i] >> 8) & 0xFF);
            }
        }
    }

    public WriteShort(value: number): void {
        this.m_stream.setInt16(this.m_stream.byteLength, value, true);
    }

    public WriteLong(value: number): void {
        const high = Math.floor(value / 0x100000000);
        const low = value >>> 0;
        this.WriteInt(low);
        this.WriteInt(high);
    }

    public ReadByte(): number {
        const value = this.m_stream.getUint8(0);
        this.m_stream = new DataView(this.m_stream.buffer, this.m_stream.byteOffset + 1);
        return value;
    }

    public ReadInt(): number {
        const value = this.m_stream.getInt32(0, true);
        this.m_stream = new DataView(this.m_stream.buffer, this.m_stream.byteOffset + 4);
        return value;
    }

    public ReadFloat(): number {
        const value = this.m_stream.getFloat32(0, true);
        this.m_stream = new DataView(this.m_stream.buffer, this.m_stream.byteOffset + 4);
        return value;
    }

    public ReadDouble(): number {
        const value = this.m_stream.getFloat64(0, true);
        this.m_stream = new DataView(this.m_stream.buffer, this.m_stream.byteOffset + 8);
        return value;
    }

    public ReadBool(): boolean {
        const value = this.m_stream.getUint8(0);
        this.m_stream = new DataView(this.m_stream.buffer, this.m_stream.byteOffset + 1);
        return value !== 0;
    }

    public ReadString(): string | null {
        const byteLength = this.ReadInt();
        if (byteLength === 0) {
            return null;
        }
        const charArray = new Uint16Array(byteLength / 2);
        for (let i = 0; i < byteLength; i += 2) {
            charArray[i / 2] = this.m_stream.getUint16(0, true);
            this.m_stream = new DataView(this.m_stream.buffer, this.m_stream.byteOffset + 2);
        }
        return String.fromCharCode.apply(null, charArray);
    }

    public ReadShort(): number {
        const value = this.m_stream.getInt16(0, true);
        this.m_stream = new DataView(this.m_stream.buffer, this.m_stream.byteOffset + 2);
        return value;
    }

    public ReadLong(): number {
        const low = this.ReadInt();
        const high = this.ReadInt();
        return (high * 0x100000000) + low;
    }
}
