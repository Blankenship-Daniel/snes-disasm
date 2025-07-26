import { CartridgeInfo, MemoryRegion } from './cartridge-types';
export interface SNESHeader {
    title: string;
    mapMode: number;
    cartridgeType: number;
    romSize: number;
    ramSize: number;
    countryCode: number;
    licenseCode: number;
    versionNumber: number;
    checksum: number;
    complement: number;
    nativeVectors: {
        cop: number;
        brk: number;
        abort: number;
        nmi: number;
        reset: number;
        irq: number;
    };
    emulationVectors: {
        cop: number;
        brk: number;
        abort: number;
        nmi: number;
        reset: number;
        irq: number;
    };
}
export interface SNESRom {
    header: SNESHeader;
    data: Buffer;
    isHiRom: boolean;
    hasHeader: boolean;
    cartridgeInfo: CartridgeInfo;
    memoryRegions: MemoryRegion[];
}
export declare class RomParser {
    static parse(filePath: string): SNESRom;
    private static scoreHeader;
    private static parseHeader;
    private static getROMSize;
    private static getSpecialChipName;
    static getRomOffset(address: number, cartridgeInfo: CartridgeInfo, romSize?: number): number;
    private static getRomOffsetWithWrapping;
    private static calculateHiROMOffset;
    private static calculateLoROMOffset;
    static getRomOffsetLegacy(address: number, isHiRom: boolean): number;
    static getPhysicalAddress(romOffset: number, isHiRom: boolean): number;
}
//# sourceMappingURL=rom-parser.d.ts.map