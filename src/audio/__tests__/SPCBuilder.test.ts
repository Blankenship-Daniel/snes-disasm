/**
 * SPCBuilder Test Suite
 *
 * Tests for the TypeScript SPCBuilder class to verify proper SPC file creation,
 * CPU state management, sample loading, and DSP register configuration.
 */

import { SPCBuilder, CPUState, SPCSample, EchoSettings } from '../SPCBuilder';
import { SampleDirectoryEntry, VoiceConfig } from '../../types/audio-types';

describe('SPCBuilder', () => {
  let builder: SPCBuilder;

  beforeEach(() => {
    builder = new SPCBuilder();
  });

  describe('Constructor and Reset', () => {
    it('should initialize with default values', () => {
      const cpuState = builder.getCPUState();
      expect(cpuState.pc).toBe(0x0000);
      expect(cpuState.a).toBe(0x00);
      expect(cpuState.x).toBe(0x00);
      expect(cpuState.y).toBe(0x00);
      expect(cpuState.psw).toBe(0x02);
      expect(cpuState.sp).toBe(0xEF);
    });

    it('should reset to default state', () => {
      // Modify some values
      builder.setCPUState({ pc: 0x1234, a: 0x55 });
      builder.setMainVolume(0x40, 0x40);

      // Reset and check
      builder.reset();
      const cpuState = builder.getCPUState();
      expect(cpuState.pc).toBe(0x0000);
      expect(cpuState.a).toBe(0x00);
    });

    it('should have proper size constants', () => {
      const spcData = builder.build();
      expect(spcData.length).toBe(66048); // SPCBuilder.SPC_FILE_SIZE
    });
  });

  describe('CPU State Management', () => {
    it('should set CPU state correctly', () => {
      const newState: Partial<CPUState> = {
        pc: 0x1234,
        a: 0xAB,
        x: 0xCD,
        y: 0xEF,
        psw: 0x42,
        sp: 0x80
      };

      builder.setCPUState(newState);
      const cpuState = builder.getCPUState();

      expect(cpuState.pc).toBe(0x1234);
      expect(cpuState.a).toBe(0xAB);
      expect(cpuState.x).toBe(0xCD);
      expect(cpuState.y).toBe(0xEF);
      expect(cpuState.psw).toBe(0x42);
      expect(cpuState.sp).toBe(0x80);
    });

    it('should mask values to proper bit widths', () => {
      builder.setCPUState({
        pc: 0x12345,    // Should be masked to 16-bit
        a: 0x1AB,       // Should be masked to 8-bit
        psw: 0x142      // Should be masked to 8-bit
      });

      const cpuState = builder.getCPUState();
      expect(cpuState.pc).toBe(0x2345);
      expect(cpuState.a).toBe(0xAB);
      expect(cpuState.psw).toBe(0x42);
    });
  });

  describe('APU RAM Management', () => {
    it('should set APU RAM data correctly', () => {
      const testData = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      builder.setAPURAM(testData, 0x1000);

      const apuRam = builder.getAPURAM();
      expect(apuRam[0x1000]).toBe(0x01);
      expect(apuRam[0x1001]).toBe(0x02);
      expect(apuRam[0x1002]).toBe(0x03);
      expect(apuRam[0x1003]).toBe(0x04);
    });

    it('should throw error when data exceeds bounds', () => {
      const largeData = new Uint8Array(1000);
      expect(() => {
        builder.setAPURAM(largeData, 65000); // Would exceed 65536 limit
      }).toThrow('Data exceeds APU RAM bounds');
    });
  });

  describe('DSP Register Management', () => {
    it('should set DSP registers correctly', () => {
      builder.setDSPRegister(0x0C, 0x7F); // Main volume left
      builder.setDSPRegister(0x1C, 0x60); // Main volume right

      const dspRegs = builder.getDSPRegisters();
      expect(dspRegs[0x0C]).toBe(0x7F);
      expect(dspRegs[0x1C]).toBe(0x60);
    });

    it('should throw error for invalid register addresses', () => {
      expect(() => {
        builder.setDSPRegister(128, 0x00); // Beyond 128 registers
      }).toThrow('DSP register out of range');
    });

    it('should mask values to 8-bit', () => {
      builder.setDSPRegister(0x0C, 0x1FF); // Should be masked to 0xFF
      const dspRegs = builder.getDSPRegisters();
      expect(dspRegs[0x0C]).toBe(0xFF);
    });
  });

  describe('Voice Configuration', () => {
    it('should configure voice parameters correctly', () => {
      builder.setupVoice(0, 1, 0x60, 0x70, 0x2000, 0x8F, 0xE0);

      const dspRegs = builder.getDSPRegisters();
      expect(dspRegs[0x00]).toBe(0x60);  // Left volume
      expect(dspRegs[0x01]).toBe(0x70);  // Right volume
      expect(dspRegs[0x02]).toBe(0x00);  // Pitch low (0x2000 & 0xFF)
      expect(dspRegs[0x03]).toBe(0x20);  // Pitch high (0x2000 >> 8)
      expect(dspRegs[0x04]).toBe(0x01);  // Sample number
      expect(dspRegs[0x05]).toBe(0x8F);  // ADSR0
      expect(dspRegs[0x06]).toBe(0xE0);  // ADSR1
    });

    it('should throw error for invalid voice numbers', () => {
      expect(() => {
        builder.setupVoice(8, 0); // Voice 8 is out of range (0-7)
      }).toThrow('Voice number out of range');
    });

    it('should configure multiple voices', () => {
      builder.setupVoice(0, 0, 0x7F, 0x7F, 0x1000);
      builder.setupVoice(1, 1, 0x60, 0x60, 0x1200);

      const dspRegs = builder.getDSPRegisters();
      // Voice 0
      expect(dspRegs[0x00]).toBe(0x7F);
      expect(dspRegs[0x04]).toBe(0x00);
      // Voice 1 (offset by 0x10)
      expect(dspRegs[0x10]).toBe(0x60);
      expect(dspRegs[0x14]).toBe(0x01);
    });
  });

  describe('Sample Directory Management', () => {
    it('should setup sample directory correctly', () => {
      const samples: SampleDirectoryEntry[] = [
        { startAddress: 0x0400, loopAddress: 0x0450 },
        { startAddress: 0x0500, loopAddress: 0x0520 }
      ];

      builder.setupSampleDirectory(samples, 0x02); // Page 2 (0x0200)

      const apuRam = builder.getAPURAM();

      // First sample entry at 0x0200
      expect(apuRam[0x0200]).toBe(0x00); // Start address low
      expect(apuRam[0x0201]).toBe(0x04); // Start address high
      expect(apuRam[0x0202]).toBe(0x50); // Loop address low
      expect(apuRam[0x0203]).toBe(0x04); // Loop address high

      // Second sample entry at 0x0204
      expect(apuRam[0x0204]).toBe(0x00); // Start address low
      expect(apuRam[0x0205]).toBe(0x05); // Start address high
      expect(apuRam[0x0206]).toBe(0x20); // Loop address low
      expect(apuRam[0x0207]).toBe(0x05); // Loop address high
    });

    it('should throw error for too many samples', () => {
      const samples: SampleDirectoryEntry[] = [];
      for (let i = 0; i < 257; i++) {
        samples.push({ startAddress: i * 16, loopAddress: i * 16 });
      }

      expect(() => {
        builder.setupSampleDirectory(samples);
      }).toThrow('Too many samples (max 256)');
    });
  });

  describe('BRR Sample Loading', () => {
    it('should load BRR sample data correctly', () => {
      const brrData = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);
      const endAddr = builder.loadBRRSample(brrData, 0x0400);

      expect(endAddr).toBe(0x0400 + brrData.length);

      const apuRam = builder.getAPURAM();
      for (let i = 0; i < brrData.length; i++) {
        expect(apuRam[0x0400 + i]).toBe(brrData[i]);
      }
    });

    it('should throw error when sample exceeds RAM bounds', () => {
      const largeSample = new Uint8Array(1000);
      expect(() => {
        builder.loadBRRSample(largeSample, 65000); // Would exceed bounds
      }).toThrow('BRR sample exceeds APU RAM bounds');
    });
  });

  describe('Voice and Volume Control', () => {
    it('should enable voices correctly', () => {
      builder.enableVoices(0x07); // Enable voices 0, 1, 2

      const dspRegs = builder.getDSPRegisters();
      expect(dspRegs[0x4C]).toBe(0x07); // KON register
    });

    it('should set main volume correctly', () => {
      builder.setMainVolume(0x60, 0x70);

      const dspRegs = builder.getDSPRegisters();
      expect(dspRegs[0x0C]).toBe(0x60); // Main volume left
      expect(dspRegs[0x1C]).toBe(0x70); // Main volume right
    });
  });

  describe('Echo Settings', () => {
    it('should configure echo settings correctly', () => {
      const echoSettings: EchoSettings = {
        enableMask: 0x03,
        volumeLeft: 0x40,
        volumeRight: 0x50,
        feedback: 0x60,
        startAddress: 0x8000,
        delay: 0x0A
      };

      builder.setEchoSettings(echoSettings);

      const dspRegs = builder.getDSPRegisters();
      expect(dspRegs[0x4D]).toBe(0x03); // Echo on
      expect(dspRegs[0x2C]).toBe(0x40); // Echo volume left
      expect(dspRegs[0x3C]).toBe(0x50); // Echo volume right
      expect(dspRegs[0x0D]).toBe(0x60); // Echo feedback
      expect(dspRegs[0x6D]).toBe(0x80); // Echo start address (high byte)
      expect(dspRegs[0x7D]).toBe(0x0A); // Echo delay
    });
  });

  describe('SPC File Building', () => {
    it('should build valid SPC file data', () => {
      builder.setCPUState({ pc: 0x0400, a: 0xAB });
      const spcData = builder.build();

      expect(spcData.length).toBe(66048);

      // Check header
      const headerText = new TextDecoder().decode(spcData.slice(0, 33));
      expect(headerText).toContain('SNES-SPC700 Sound File Data v0.30');

      // Check CPU state (after header + ID tags)
      const cpuOffset = 33 + 4;
      expect(spcData[cpuOffset]).toBe(0x00);     // PC low
      expect(spcData[cpuOffset + 1]).toBe(0x04); // PC high
      expect(spcData[cpuOffset + 2]).toBe(0xAB); // A register
    });

    it('should produce deterministic output', () => {
      builder.setCPUState({ pc: 0x1234 });
      const spcData1 = builder.build();
      const spcData2 = builder.build();

      expect(spcData1).toEqual(spcData2);
    });
  });

  describe('Static Factory Method', () => {
    it('should create simple SPC with samples and voices', () => {
      const samples: SPCSample[] = [
        {
          brrData: new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]),
          startAddress: 0x0400,
          loopAddress: 0x0400
        }
      ];

      const voices: Partial<VoiceConfig>[] = [
        {
          sourceNumber: 0,
          leftVolume: 0x7F,
          rightVolume: 0x7F,
          pitch: 0x1000
        }
      ];

      const testBuilder = SPCBuilder.createSimpleSPC(samples, voices);

      // Verify sample was loaded
      const apuRam = testBuilder.getAPURAM();
      expect(apuRam[0x0400]).toBe(0x00);
      expect(apuRam[0x0401]).toBe(0x11);

      // Verify voice was configured
      const dspRegs = testBuilder.getDSPRegisters();
      expect(dspRegs[0x00]).toBe(0x7F); // Left volume
      expect(dspRegs[0x01]).toBe(0x7F); // Right volume
      expect(dspRegs[0x04]).toBe(0x00); // Sample number
    });
  });

  describe('Data Access Methods', () => {
    it('should return copies of internal data', () => {
      const apuRam = builder.getAPURAM();
      const dspRegs = builder.getDSPRegisters();

      // Modify returned arrays
      apuRam[0] = 0xFF;
      dspRegs[0] = 0xFF;

      // Original data should be unchanged
      const apuRam2 = builder.getAPURAM();
      const dspRegs2 = builder.getDSPRegisters();
      expect(apuRam2[0]).toBe(0x00);
      expect(dspRegs2[0]).not.toBe(0xFF);
    });
  });
});
