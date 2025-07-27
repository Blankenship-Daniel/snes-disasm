"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RomParser = void 0;
const fs = __importStar(require("fs"));
const cartridge_types_1 = require("./cartridge-types");
class RomParser {
    static parse(filePath) {
        const data = fs.readFileSync(filePath);
        // Check for SMC header (512 bytes)
        const hasHeader = data.length % 1024 === 512;
        const romData = hasHeader ? data.slice(512) : data;
        // Determine ROM mapping mode
        const hiRomHeaderOffset = 0x7FC0;
        const loRomHeaderOffset = 0xFFC0;
        // Check both LoROM and HiROM headers to determine which is valid
        let headerOffset = loRomHeaderOffset;
        let isHiRom = false;
        if (romData.length > Math.max(loRomHeaderOffset, hiRomHeaderOffset) + 0x40) {
            const loRomScore = this.scoreHeader(romData, loRomHeaderOffset, false);
            const hiRomScore = this.scoreHeader(romData, hiRomHeaderOffset, true);
            if (hiRomScore > loRomScore) {
                headerOffset = hiRomHeaderOffset;
                isHiRom = true;
            }
            else {
                headerOffset = loRomHeaderOffset;
                isHiRom = false;
            }
        }
        const header = this.parseHeader(romData, headerOffset);
        // Detect cartridge type and create enhanced cartridge info
        const cartridgeType = (0, cartridge_types_1.detectCartridgeType)(header.mapMode, header.cartridgeType);
        const memorySpeed = (0, cartridge_types_1.getMemorySpeed)(header.mapMode);
        const hasBattery = (0, cartridge_types_1.hasBatteryBackup)(header.cartridgeType);
        const sramSize = (0, cartridge_types_1.getSRAMSize)(header.ramSize);
        const cartridgeInfo = {
            type: cartridgeType,
            mapMode: header.mapMode,
            romSize: this.getROMSize(header.romSize),
            ramSize: sramSize,
            hasBattery,
            hasRTC: cartridgeType === cartridge_types_1.CartridgeType.SRTC,
            speed: memorySpeed,
            regions: [],
            specialChip: this.getSpecialChipName(cartridgeType)
        };
        // Create memory layout
        const memoryRegions = (0, cartridge_types_1.createMemoryLayout)(cartridgeInfo);
        cartridgeInfo.regions = memoryRegions;
        return {
            header,
            data: romData,
            isHiRom,
            hasHeader,
            cartridgeInfo,
            memoryRegions
        };
    }
    static scoreHeader(data, offset, isHiRom) {
        let score = 0;
        // Enhanced title validity check (max 35 points)
        const title = data.slice(offset, offset + 21).toString('ascii').trim();
        const printableChars = title.split('').filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126).length;
        const titleRatio = title.length > 0 ? printableChars / title.length : 0;
        if (titleRatio >= 0.9)
            score += 35;
        else if (titleRatio >= 0.8)
            score += 25;
        else if (titleRatio >= 0.6)
            score += 15;
        else if (titleRatio >= 0.4)
            score += 5;
        // Enhanced map mode check (max 25 points)
        const mapMode = data[offset + 0x15];
        const mapType = mapMode & 0x0F;
        const speed = (mapMode & 0x30) >> 4;
        if (isHiRom) {
            if ((mapMode & 0x01) === 1)
                score += 20; // HiROM should have bit 0 set
            if (mapType === 0x01 || mapType === 0x05)
                score += 5; // Valid HiROM map types
        }
        else {
            if ((mapMode & 0x01) === 0)
                score += 20; // LoROM should have bit 0 clear
            if (mapType === 0x00 || mapType === 0x02 || mapType === 0x03)
                score += 5; // Valid LoROM map types
        }
        // ROM size validation (max 15 points)
        const romSize = data[offset + 0x17];
        if (romSize >= 0x07 && romSize <= 0x0D) {
            score += 15;
        }
        else if (romSize >= 0x05 && romSize <= 0x0F) {
            score += 8; // Extended range with lower score
        }
        // Cartridge type validation (max 10 points)
        const cartridgeType = data[offset + 0x16];
        const validCartridgeTypes = [
            0x00, 0x01, 0x02, 0x03, 0x05, 0x06, 0x09, 0x0A, 0x13, 0x14, 0x15, 0x1A,
            0x34, 0x35, 0x43, 0x45, 0x55, 0xF3, 0xF5, 0xF6, 0xF9
        ];
        if (validCartridgeTypes.includes(cartridgeType))
            score += 10;
        // Country code validation (max 8 points)
        const countryCode = data[offset + 0x19];
        if (countryCode <= 0x0D)
            score += 8;
        // Complement checksum validation (max 15 points)
        const checksum = data.readUInt16LE(offset + 0x1C);
        const complement = data.readUInt16LE(offset + 0x1E);
        if ((checksum ^ complement) === 0xFFFF)
            score += 15;
        // Reset vector validation (max 12 points)
        const resetVector = data.readUInt16LE(offset + 0x2C);
        if (resetVector >= 0x8000 && resetVector <= 0xFFFF) {
            score += 12;
        }
        else if (resetVector >= 0x4000) {
            score += 6; // Partial credit for reasonable vectors
        }
        // Additional vector validation (max 10 points)
        const nmiVector = data.readUInt16LE(offset + 0x2A);
        const irqVector = data.readUInt16LE(offset + 0x2E);
        let vectorScore = 0;
        if (nmiVector >= 0x8000 && nmiVector <= 0xFFFF)
            vectorScore += 5;
        if (irqVector >= 0x8000 && irqVector <= 0xFFFF)
            vectorScore += 5;
        score += vectorScore;
        return score;
    }
    static parseHeader(data, offset) {
        // Read title (21 bytes)
        const titleBytes = data.slice(offset, offset + 21);
        const title = titleBytes.toString('ascii').replace(/\0+$/, '');
        return {
            title,
            mapMode: data[offset + 0x15],
            cartridgeType: data[offset + 0x16],
            romSize: data[offset + 0x17],
            ramSize: data[offset + 0x18],
            countryCode: data[offset + 0x19],
            licenseCode: data[offset + 0x1A],
            versionNumber: data[offset + 0x1B],
            checksum: data.readUInt16LE(offset + 0x1C),
            complement: data.readUInt16LE(offset + 0x1E),
            nativeVectors: {
                cop: data.readUInt16LE(offset + 0x24),
                brk: data.readUInt16LE(offset + 0x26),
                abort: data.readUInt16LE(offset + 0x28),
                nmi: data.readUInt16LE(offset + 0x2A),
                reset: data.readUInt16LE(offset + 0x2C),
                irq: data.readUInt16LE(offset + 0x2E)
            },
            emulationVectors: {
                cop: data.readUInt16LE(offset + 0x34),
                brk: data.readUInt16LE(offset + 0x36),
                abort: data.readUInt16LE(offset + 0x38),
                nmi: data.readUInt16LE(offset + 0x3A),
                reset: data.readUInt16LE(offset + 0x3C),
                irq: data.readUInt16LE(offset + 0x3E)
            }
        };
    }
    static getROMSize(romSizeByte) {
        // ROM size is 2^romSizeByte KB
        return (1 << romSizeByte) * 1024;
    }
    static getSpecialChipName(cartridgeType) {
        const chipNames = {
            [cartridge_types_1.CartridgeType.SA1]: 'SA-1 Super Accelerator',
            [cartridge_types_1.CartridgeType.SuperFX]: 'SuperFX Graphics Support Unit',
            [cartridge_types_1.CartridgeType.DSP1]: 'DSP-1 Digital Signal Processor',
            [cartridge_types_1.CartridgeType.DSP2]: 'DSP-2 Digital Signal Processor',
            [cartridge_types_1.CartridgeType.DSP3]: 'DSP-3 Digital Signal Processor',
            [cartridge_types_1.CartridgeType.DSP4]: 'DSP-4 Digital Signal Processor',
            [cartridge_types_1.CartridgeType.CX4]: 'Capcom CX4 Math Coprocessor',
            [cartridge_types_1.CartridgeType.ST010]: 'Seta ST010 Graphics Processor',
            [cartridge_types_1.CartridgeType.ST011]: 'Seta ST011 Graphics Processor',
            [cartridge_types_1.CartridgeType.SPC7110]: 'SPC7110 Data Decompression',
            [cartridge_types_1.CartridgeType.SDD1]: 'S-DD1 Data Decompression',
            [cartridge_types_1.CartridgeType.SRTC]: 'S-RTC Real-Time Clock',
            [cartridge_types_1.CartridgeType.OBC1]: 'OBC-1 Metal Combat Support',
            [cartridge_types_1.CartridgeType.MSU1]: 'MSU-1 Audio Enhancement',
            [cartridge_types_1.CartridgeType.BSX]: 'BSX Satellaview',
            // Standard types with potential special chip support
            [cartridge_types_1.CartridgeType.LoROM]: 'Possible enhancement chips',
            [cartridge_types_1.CartridgeType.HiROM]: 'Possible enhancement chips',
            [cartridge_types_1.CartridgeType.ExLoROM]: 'Possible enhancement chips',
            [cartridge_types_1.CartridgeType.ExHiROM]: 'Possible enhancement chips',
            [cartridge_types_1.CartridgeType.Unknown]: undefined
        };
        return chipNames[cartridgeType];
    }
    static getRomOffset(address, cartridgeInfo, romSize) {
        const isHiRom = cartridgeInfo.type === cartridge_types_1.CartridgeType.HiROM ||
            cartridgeInfo.type === cartridge_types_1.CartridgeType.ExHiROM;
        return this.getRomOffsetWithWrapping(address, isHiRom, romSize || cartridgeInfo.romSize);
    }
    static getRomOffsetWithWrapping(address, isHiRom, romSize) {
        let romOffset;
        if (isHiRom) {
            romOffset = this.calculateHiROMOffset(address);
        }
        else {
            romOffset = this.calculateLoROMOffset(address);
        }
        // Apply bank wrapping for ROM size
        if (romOffset >= 0) {
            return romOffset % romSize;
        }
        throw new Error(`Invalid address for ROM mapping: $${address.toString(16).toUpperCase()}`);
    }
    static calculateHiROMOffset(address) {
        const bank = (address >> 16) & 0xFF;
        const offset = address & 0xFFFF;
        // Banks C0-FF: Direct ROM mapping (64KB per bank)
        if (bank >= 0xC0) {
            return ((bank - 0xC0) * 0x10000) + offset;
        }
        // Banks 40-7F: Direct ROM mapping (64KB per bank)
        if (bank >= 0x40 && bank <= 0x7F) {
            return ((bank - 0x40) * 0x10000) + offset;
        }
        // Banks 80-BF: Mirror of 00-3F at $8000-$FFFF
        if (bank >= 0x80 && bank <= 0xBF && offset >= 0x8000) {
            return ((bank - 0x80) * 0x8000) + (offset - 0x8000);
        }
        // Banks 00-3F: ROM at $8000-$FFFF
        if (bank <= 0x3F && offset >= 0x8000) {
            return (bank * 0x8000) + (offset - 0x8000);
        }
        // Bank 00: Direct mapping for low addresses
        if (bank === 0x00 && offset < 0x8000) {
            return offset;
        }
        return -1; // Invalid mapping
    }
    static calculateLoROMOffset(address) {
        const bank = (address >> 16) & 0xFF;
        const offset = address & 0xFFFF;
        // Banks 80-FF: FastROM mirror at $8000-$FFFF
        if (bank >= 0x80 && offset >= 0x8000) {
            return ((bank - 0x80) * 0x8000) + (offset - 0x8000);
        }
        // Banks 00-7F: ROM at $8000-$FFFF
        if (bank <= 0x7F && offset >= 0x8000) {
            return (bank * 0x8000) + (offset - 0x8000);
        }
        // Bank 00: Direct mapping for low addresses
        if (bank === 0x00 && offset < 0x8000) {
            return offset;
        }
        return -1; // Invalid mapping
    }
    // Legacy method for backward compatibility
    static getRomOffsetLegacy(address, isHiRom) {
        return this.getRomOffsetWithWrapping(address, isHiRom, 0x400000); // Default 4MB
    }
    static getPhysicalAddress(romOffset, isHiRom) {
        if (isHiRom) {
            return 0xC00000 + romOffset;
        }
        else {
            const bank = Math.floor(romOffset / 0x8000) + 0x80;
            const offset = (romOffset % 0x8000) + 0x8000;
            return (bank << 16) | offset;
        }
    }
    /**
     * Detect and handle split ROM files (multi-part dumps)
     * Based on file naming conventions and size analysis
     */
    static detectSplitRom(filePath) {
        const splitParts = [filePath];
        // Common split ROM naming patterns
        const patterns = [
            /(.+)\.part(\d+)\.smc$/i,
            /(.+)\.(\d+)\.smc$/i,
            /(.+)_(\d+)\.smc$/i,
            /(.+)-(\d+)\.smc$/i
        ];
        for (const pattern of patterns) {
            const match = filePath.match(pattern);
            if (match) {
                const baseName = match[1];
                const partNum = parseInt(match[2]);
                // Look for other parts
                for (let i = 1; i <= 8; i++) { // Reasonable limit
                    if (i === partNum)
                        continue;
                    const testPath = `${baseName}.part${i}.smc`;
                    if (fs.existsSync(testPath)) {
                        splitParts.push(testPath);
                    }
                }
                break;
            }
        }
        return splitParts.sort();
    }
    /**
     * Combine split ROM parts into single buffer
     */
    static combineSplitRom(splitParts) {
        const buffers = [];
        for (const part of splitParts) {
            const data = fs.readFileSync(part);
            buffers.push(data);
        }
        return Buffer.concat(buffers);
    }
    /**
     * Detect interleaved ROM format
     * Common in older ROM dumps where odd/even bytes are swapped
     */
    static detectInterleavedFormat(data) {
        // Check for interleaving by analyzing header patterns
        // Interleaved ROMs often have garbled headers at standard locations
        // Try standard header locations
        const possibleOffsets = [0x7FC0, 0xFFC0, 0x81C0, 0x101C0];
        for (const offset of possibleOffsets) {
            if (offset + 0x20 >= data.length)
                continue;
            // Check if header makes sense when de-interleaved
            const deInterleavedData = this.deInterleaveRom(data);
            const score = this.scoreHeader(deInterleavedData, offset, false);
            const originalScore = this.scoreHeader(data, offset, false);
            if (score > originalScore + 2) { // Significant improvement
                return true;
            }
        }
        return false;
    }
    /**
     * De-interleave ROM data (swap odd/even bytes)
     */
    static deInterleaveRom(data) {
        const deInterleaved = Buffer.alloc(data.length);
        for (let i = 0; i < data.length - 1; i += 2) {
            deInterleaved[i] = data[i + 1]; // Even positions get odd bytes
            deInterleaved[i + 1] = data[i]; // Odd positions get even bytes
        }
        return deInterleaved;
    }
    /**
     * Detect overdumped ROMs (ROMs with extra data beyond the actual ROM size)
     * Common in older dumps where ROMs were padded to standard sizes
     */
    static detectOverdump(data, expectedSize) {
        if (data.length <= expectedSize) {
            return { isOverdumped: false, originalSize: data.length };
        }
        // Check if extra data is just padding (zeros or repeated pattern)
        const extraData = data.slice(expectedSize);
        // Check for zero padding
        const isZeroPadded = extraData.every(byte => byte === 0x00);
        // Check for FF padding
        const isFFPadded = extraData.every(byte => byte === 0xFF);
        // Check for repeated pattern
        let isRepeatedPattern = false;
        if (extraData.length >= 4) {
            const pattern = extraData.slice(0, 4);
            isRepeatedPattern = true;
            for (let i = 4; i < extraData.length; i += 4) {
                const chunk = extraData.slice(i, i + 4);
                if (!chunk.equals(pattern.slice(0, chunk.length))) {
                    isRepeatedPattern = false;
                    break;
                }
            }
        }
        const isOverdumped = isZeroPadded || isFFPadded || isRepeatedPattern;
        return {
            isOverdumped,
            originalSize: isOverdumped ? expectedSize : data.length
        };
    }
    /**
     * Remove overdump padding from ROM data
     */
    static removeOverdump(data, originalSize) {
        return data.slice(0, originalSize);
    }
    /**
     * Enhanced ROM parsing with support for special formats
     */
    static parseAdvanced(filePath) {
        // Check for split ROM files
        const splitParts = this.detectSplitRom(filePath);
        const isSplitRom = splitParts.length > 1;
        // Load ROM data (combine if split)
        let data = isSplitRom ? this.combineSplitRom(splitParts) : fs.readFileSync(filePath);
        // Check for interleaved format
        const isInterleaved = this.detectInterleavedFormat(data);
        if (isInterleaved) {
            data = this.deInterleaveRom(data);
        }
        // Parse basic ROM structure
        const basicRom = this.parse(filePath);
        // Check for overdump
        const expectedSize = this.getROMSize(basicRom.header.romSize);
        const overdumpInfo = this.detectOverdump(data, expectedSize);
        if (overdumpInfo.isOverdumped) {
            data = this.removeOverdump(data, overdumpInfo.originalSize);
        }
        return {
            ...basicRom,
            data,
            isInterleaved,
            isSplitRom,
            isOverdumped: overdumpInfo.isOverdumped,
            originalSize: overdumpInfo.originalSize
        };
    }
}
exports.RomParser = RomParser;
//# sourceMappingURL=rom-parser.js.map