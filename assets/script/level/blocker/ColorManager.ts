import { BlockerID } from "./BlockerManager";

export class ColorManager {
    static MaxColorLimit: number = 5;

    static IsBaseColor(id: number): boolean {
        const offset: number = id - BlockerID.baseredid;
        return offset >= 0 && offset <= 5;
    }

    static GetAllBaseColorIds(): number[] {
        const all: number[] = [];
        for (let i = 0; i < ColorManager.MaxColorLimit; i++) {
            all.push(BlockerID.baseredid + i);
        }
        return all;
    }
}