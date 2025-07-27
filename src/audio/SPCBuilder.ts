/**
 * SPC File Format Builder
 *
 * Creates SPC (SNES-SPC700 Sound File Data) files with proper structure
 * based on the format used in snes9x smp_state.cpp
 *
 * SPC File Structure:
 * - 33-byte header with "SNES-SPC700 Sound File Data v0.30"
 * - SPC700 CPU state (PC, registers, PSW, SP)
 * - 64KB APU RAM allocation
 * - 128 DSP register configuration
 * - Sample directory setup at 0x200 (DIR register)
 * - Voice configuration for each sample
 */

import {
  VoiceConfig,
  SampleDirectoryEntry,
  DSP_REGISTERS
} from '../types/audio-types';

/**
 * Configuration for CPU state
 */
export interface CPUState {
  /** Program Counter */
  pc: number;
  /** Accumulator register */
  a: number;
  /** X index register */
  x: number;
  /** Y index register */
  y: number;
  /** Processor Status Word */
  psw: number;
  /** Stack Pointer */
  sp: number;
}

/**
 * Sample data for loading into SPC
 */
export interface SPCSample {
  /** BRR-encoded sample data */
  brrData: Uint8Array;
  /** Starting address in APU RAM */
  startAddress: number;
  /** Loop address (where to restart when looping) */
  loopAddress: number;
}

/**
 * Echo configuration settings
 */
export interface EchoSettings {
  /** Voice enable mask for echo */
  enableMask: number;
  /** Left channel echo volume */
  volumeLeft: number;
  /** Right channel echo volume */
  volumeRight: number;
  /** Echo feedback amount */
  feedback: number;
  /** Echo buffer start address */
  startAddress: number;
  /** Echo delay (buffer size) */
  delay: number;
}

/**
 * Builder class for creating SPC files from SNES audio data
 */
export class SPCBuilder {
  // SPC file constants
  private static readonly SPC_FILE_SIZE = 66048;
  private static readonly HEADER_SIZE = 33;
  private static readonly APURAM_SIZE = 65536;
  private static readonly DSP_REGISTERS_SIZE = 128;
  private static readonly IPLROM_SIZE = 64;

  // DSP register offsets (using constants from types)
  private static readonly DSP_MVOLL = DSP_REGISTERS.MAIN_LEFT_VOL;    // Main volume left
  private static readonly DSP_MVOLR = DSP_REGISTERS.MAIN_RIGHT_VOL;   // Main volume right
  private static readonly DSP_EVOLL = DSP_REGISTERS.ECHO_LEFT_VOL;    // Echo volume left
  private static readonly DSP_EVOLR = DSP_REGISTERS.ECHO_RIGHT_VOL;   // Echo volume right
  private static readonly DSP_KON = DSP_REGISTERS.KEY_ON;             // Key on
  private static readonly DSP_KOFF = DSP_REGISTERS.KEY_OFF;           // Key off
  private static readonly DSP_FLG = DSP_REGISTERS.FLAGS;              // DSP flags
  private static readonly DSP_ENDX = DSP_REGISTERS.ENDX;              // Voice end flags
  private static readonly DSP_EFB = DSP_REGISTERS.ECHO_FEEDBACK;      // Echo feedback
  private static readonly DSP_PMON = DSP_REGISTERS.PITCH_MOD;         // Pitch modulation
  private static readonly DSP_NON = DSP_REGISTERS.NOISE_ON;           // Noise on
  private static readonly DSP_EON = DSP_REGISTERS.ECHO_ON;            // Echo on
  private static readonly DSP_DIR = DSP_REGISTERS.SOURCE_DIR;         // Sample directory page
  private static readonly DSP_ESA = DSP_REGISTERS.ECHO_START;         // Echo start address
  private static readonly DSP_EDL = DSP_REGISTERS.ECHO_DELAY;         // Echo delay
  private static readonly DSP_FIR = DSP_REGISTERS.FIR_C0;             // FIR coefficients

  // Voice register offsets (per voice, 0x10 bytes apart)
  private static readonly VOICE_VOLL = DSP_REGISTERS.VOICE_LEFT_VOL;   // Volume left
  private static readonly VOICE_VOLR = DSP_REGISTERS.VOICE_RIGHT_VOL;  // Volume right
  private static readonly VOICE_PITCHL = DSP_REGISTERS.VOICE_PITCH_LOW; // Pitch low
  private static readonly VOICE_PITCHH = DSP_REGISTERS.VOICE_PITCH_HIGH; // Pitch high
  private static readonly VOICE_SRCN = DSP_REGISTERS.VOICE_SRC_NUM;    // Sample source number
  private static readonly VOICE_ADSR0 = DSP_REGISTERS.VOICE_ADSR1;     // ADSR envelope 0
  private static readonly VOICE_ADSR1 = DSP_REGISTERS.VOICE_ADSR2;     // ADSR envelope 1
  private static readonly VOICE_GAIN = DSP_REGISTERS.VOICE_GAIN;       // Gain
  private static readonly VOICE_ENVX = DSP_REGISTERS.VOICE_ENV_VAL;    // Current envelope value
  private static readonly VOICE_OUTX = DSP_REGISTERS.VOICE_OUT_VAL;    // Current sample output

  // SPC700 CPU state
  private cpuState!: CPUState;

  // APU RAM (64KB)
  private apuRam!: Uint8Array;

  // DSP registers (128 bytes)
  private dspRegisters!: Uint8Array;

  // IPL ROM (64 bytes) - SPC700 boot ROM
  private iplRom!: Uint8Array;

  /**
   * Initialize SPC builder with default values
   */
  constructor() {
    this.reset();
  }

  /**
   * Reset builder to default state
   */
  public reset(): void {
    // SPC700 CPU state
    this.cpuState = {
      pc: 0x0000,
      a: 0x00,
      x: 0x00,
      y: 0x00,
      psw: 0x02,  // Default PSW value
      sp: 0xEF    // Default stack pointer
    };

    // APU RAM (64KB)
    this.apuRam = new Uint8Array(SPCBuilder.APURAM_SIZE);

    // DSP registers (128 bytes)
    this.dspRegisters = new Uint8Array(SPCBuilder.DSP_REGISTERS_SIZE);

    // IPL ROM (64 bytes) - SPC700 boot ROM
    this.iplRom = new Uint8Array([
      0xCD, 0xEF, 0xBD, 0xE8, 0x00, 0xC6, 0x1D, 0xD0,
      0xFC, 0x8F, 0xAA, 0xF4, 0x8F, 0xBB, 0xF5, 0x78,
      0xCC, 0xF4, 0xD0, 0xFB, 0x2F, 0x19, 0xEB, 0xF4,
      0xD0, 0xFC, 0x7E, 0xF4, 0xD0, 0x0B, 0xE4, 0xF5,
      0xCB, 0xF4, 0xD7, 0x00, 0xFC, 0xD0, 0xF3, 0xAB,
      0x01, 0x10, 0xEF, 0x7E, 0xF4, 0x10, 0xEB, 0xBA,
      0xF6, 0xDA, 0x00, 0xBA, 0xF4, 0xC4, 0xF4, 0xDD,
      0x5D, 0xD0, 0xDB, 0x1F, 0x00, 0x00, 0xC0, 0xFF
    ]);

    // Initialize default DSP settings
    this.setupDefaultDSP();
  }

  /**
   * Setup default DSP register values
   */
  private setupDefaultDSP(): void {
    // Set sample directory to page 2 (0x0200)
    this.dspRegisters[SPCBuilder.DSP_DIR] = 0x02;

    // Default main volume
    this.dspRegisters[SPCBuilder.DSP_MVOLL] = 0x7F;
    this.dspRegisters[SPCBuilder.DSP_MVOLR] = 0x7F;

    // Clear voice end flags
    this.dspRegisters[SPCBuilder.DSP_ENDX] = 0x00;

    // Setup default FIR filter coefficients (simple pass-through)
    const firCoeffs = [0x7F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    for (let i = 0; i < firCoeffs.length; i++) {
      this.dspRegisters[SPCBuilder.DSP_FIR + (i * 0x10)] = firCoeffs[i] & 0xFF;
    }
  }

  /**
   * Set SPC700 CPU state
   */
  public setCPUState(state: Partial<CPUState>): void {
    if (state.pc !== undefined) this.cpuState.pc = state.pc & 0xFFFF;
    if (state.a !== undefined) this.cpuState.a = state.a & 0xFF;
    if (state.x !== undefined) this.cpuState.x = state.x & 0xFF;
    if (state.y !== undefined) this.cpuState.y = state.y & 0xFF;
    if (state.psw !== undefined) this.cpuState.psw = state.psw & 0xFF;
    if (state.sp !== undefined) this.cpuState.sp = state.sp & 0xFF;
  }

  /**
   * Set APU RAM data at specified offset
   */
  public setAPURAM(data: Uint8Array, offset: number = 0): void {
    if (offset + data.length > SPCBuilder.APURAM_SIZE) {
      throw new Error(`Data exceeds APU RAM bounds: ${offset + data.length} > ${SPCBuilder.APURAM_SIZE}`);
    }
    this.apuRam.set(data, offset);
  }

  /**
   * Set individual DSP register
   */
  public setDSPRegister(register: number, value: number): void {
    if (register >= SPCBuilder.DSP_REGISTERS_SIZE) {
      throw new Error(`DSP register out of range: ${register} >= ${SPCBuilder.DSP_REGISTERS_SIZE}`);
    }
    this.dspRegisters[register] = value & 0xFF;
  }

  /**
   * Configure a DSP voice (0-7)
   */
  public setupVoice(
    voice: number,
    sampleNum: number = 0,
    volumeLeft: number = 0x7F,
    volumeRight: number = 0x7F,
    pitch: number = 0x1000,
    adsr0: number = 0x8F,
    adsr1: number = 0xE0
  ): void {
    if (voice >= 8) {
      throw new Error(`Voice number out of range: ${voice} >= 8`);
    }

    const base = voice * 0x10;

    // Set voice parameters
    this.dspRegisters[base + SPCBuilder.VOICE_VOLL] = volumeLeft & 0xFF;
    this.dspRegisters[base + SPCBuilder.VOICE_VOLR] = volumeRight & 0xFF;
    this.dspRegisters[base + SPCBuilder.VOICE_PITCHL] = pitch & 0xFF;
    this.dspRegisters[base + SPCBuilder.VOICE_PITCHH] = (pitch >> 8) & 0x3F;
    this.dspRegisters[base + SPCBuilder.VOICE_SRCN] = sampleNum & 0xFF;
    this.dspRegisters[base + SPCBuilder.VOICE_ADSR0] = adsr0 & 0xFF;
    this.dspRegisters[base + SPCBuilder.VOICE_ADSR1] = adsr1 & 0xFF;
    this.dspRegisters[base + SPCBuilder.VOICE_GAIN] = 0x00; // Use ADSR
    this.dspRegisters[base + SPCBuilder.VOICE_ENVX] = 0x00;
    this.dspRegisters[base + SPCBuilder.VOICE_OUTX] = 0x00;
  }

  /**
   * Setup sample directory at specified page (default 0x200)
   */
  public setupSampleDirectory(samples: SampleDirectoryEntry[], dirPage: number = 0x02): void {
    // Set DIR register
    this.dspRegisters[SPCBuilder.DSP_DIR] = dirPage & 0xFF;

    // Calculate directory address
    const dirAddr = dirPage * 0x100;

    if (dirAddr + samples.length * 4 > SPCBuilder.APURAM_SIZE) {
      throw new Error('Sample directory exceeds APU RAM bounds');
    }

    if (samples.length > 256) {
      throw new Error('Too many samples (max 256)');
    }

    // Each sample entry is 4 bytes: start_addr (2 bytes) + loop_addr (2 bytes)
    for (let i = 0; i < samples.length; i++) {
      const offset = dirAddr + (i * 4);
      const startAddr = samples[i].startAddress;
      const loopAddr = samples[i].loopAddress;

      // Store as little-endian 16-bit values
      this.apuRam[offset] = startAddr & 0xFF;
      this.apuRam[offset + 1] = (startAddr >> 8) & 0xFF;
      this.apuRam[offset + 2] = loopAddr & 0xFF;
      this.apuRam[offset + 3] = (loopAddr >> 8) & 0xFF;
    }
  }

  /**
   * Load BRR sample data into APU RAM
   * @returns End address after sample data
   */
  public loadBRRSample(brrData: Uint8Array, startAddr: number): number {
    if (startAddr + brrData.length > SPCBuilder.APURAM_SIZE) {
      throw new Error('BRR sample exceeds APU RAM bounds');
    }

    this.apuRam.set(brrData, startAddr);
    return startAddr + brrData.length;
  }

  /**
   * Enable voices using KON register
   */
  public enableVoices(voiceMask: number): void {
    this.dspRegisters[SPCBuilder.DSP_KON] = voiceMask & 0xFF;
  }

  /**
   * Set main output volume
   */
  public setMainVolume(left: number = 0x7F, right: number = 0x7F): void {
    this.dspRegisters[SPCBuilder.DSP_MVOLL] = left & 0xFF;
    this.dspRegisters[SPCBuilder.DSP_MVOLR] = right & 0xFF;
  }

  /**
   * Configure echo settings
   */
  public setEchoSettings(settings: Partial<EchoSettings>): void {
    if (settings.enableMask !== undefined) {
      this.dspRegisters[SPCBuilder.DSP_EON] = settings.enableMask & 0xFF;
    }
    if (settings.volumeLeft !== undefined) {
      this.dspRegisters[SPCBuilder.DSP_EVOLL] = settings.volumeLeft & 0xFF;
    }
    if (settings.volumeRight !== undefined) {
      this.dspRegisters[SPCBuilder.DSP_EVOLR] = settings.volumeRight & 0xFF;
    }
    if (settings.feedback !== undefined) {
      this.dspRegisters[SPCBuilder.DSP_EFB] = settings.feedback & 0xFF;
    }
    if (settings.startAddress !== undefined) {
      this.dspRegisters[SPCBuilder.DSP_ESA] = (settings.startAddress >> 8) & 0xFF;
    }
    if (settings.delay !== undefined) {
      this.dspRegisters[SPCBuilder.DSP_EDL] = settings.delay & 0x0F;
    }
  }

  /**
   * Build complete SPC file data
   */
  public build(): Uint8Array {
    const spcData = new Uint8Array(SPCBuilder.SPC_FILE_SIZE);
    let offset = 0;

    // Header (33 bytes)
    const header = new TextEncoder().encode('SNES-SPC700 Sound File Data v0.30');
    spcData.set(header, offset);
    offset += SPCBuilder.HEADER_SIZE;

    // ID tag and version (4 bytes)
    spcData[offset] = 26;     // ID tag 0
    spcData[offset + 1] = 26; // ID tag 1
    spcData[offset + 2] = 27; // ID tag 2
    spcData[offset + 3] = 30; // Version minor
    offset += 4;

    // SPC700 CPU state (8 bytes)
    spcData[offset] = this.cpuState.pc & 0xFF;          // PC low
    spcData[offset + 1] = (this.cpuState.pc >> 8) & 0xFF; // PC high
    spcData[offset + 2] = this.cpuState.a;              // A register
    spcData[offset + 3] = this.cpuState.x;              // X register
    spcData[offset + 4] = this.cpuState.y;              // Y register
    spcData[offset + 5] = this.cpuState.psw;            // PSW
    spcData[offset + 6] = this.cpuState.sp;             // SP
    spcData[offset + 7] = 0;                            // Unused
    offset += 8;

    // ID666 tag (210 bytes) - song metadata, zero-filled
    offset += 210;

    // APU RAM (65536 bytes)
    spcData.set(this.apuRam, offset);

    // Copy current MMIO registers to APU RAM
    for (let i = 0xF2; i <= 0xF9; i++) {
      spcData[offset + i] = this.apuRam[i];
    }
    for (let i = 0xFD; i < 0x100; i++) {
      spcData[offset + i] = this.apuRam[i];
    }

    offset += SPCBuilder.APURAM_SIZE;

    // DSP registers (128 bytes)
    spcData.set(this.dspRegisters, offset);
    offset += SPCBuilder.DSP_REGISTERS_SIZE;

    // Unused area (64 bytes)
    offset += 64;

    // IPL ROM (64 bytes)
    spcData.set(this.iplRom, offset);

    return spcData;
  }

  /**
   * Save SPC file to binary data (for use with file system APIs)
   */
  public save(): Uint8Array {
    return this.build();
  }

  /**
   * Create a simple SPC file with samples and voice configuration
   */
  public static createSimpleSPC(
    samples: SPCSample[],
    voices?: Partial<VoiceConfig>[]
  ): SPCBuilder {
    const builder = new SPCBuilder();

    // Load samples into APU RAM and setup directory
    const sampleDir: SampleDirectoryEntry[] = [];
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      const startAddr = sample.startAddress ?? (0x0400 + (i * 0x1000));
      const loopAddr = sample.loopAddress ?? startAddr;

      builder.loadBRRSample(sample.brrData, startAddr);
      sampleDir.push({ startAddress: startAddr, loopAddress: loopAddr });
    }

    builder.setupSampleDirectory(sampleDir);

    // Configure voices
    if (voices) {
      for (let i = 0; i < Math.min(voices.length, 8); i++) {
        const voiceCfg = voices[i];
        builder.setupVoice(
          i,
          voiceCfg.sourceNumber ?? 0,
          voiceCfg.leftVolume ?? 0x7F,
          voiceCfg.rightVolume ?? 0x7F,
          voiceCfg.pitch ?? 0x1000,
          voiceCfg.adsr?.attack !== undefined ?
            ((voiceCfg.adsr.attack & 0xF) << 4) | (voiceCfg.adsr.decay & 0x7) : 0x8F,
          voiceCfg.adsr?.sustain !== undefined ?
            ((voiceCfg.adsr.sustain & 0x7) << 5) | (voiceCfg.adsr.release & 0x1F) : 0xE0
        );
      }
    }

    // Enable configured voices
    if (voices) {
      const voiceMask = (1 << voices.length) - 1;
      builder.enableVoices(voiceMask);
    }

    return builder;
  }

  /**
   * Get current CPU state
   */
  public getCPUState(): CPUState {
    return { ...this.cpuState };
  }

  /**
   * Get APU RAM copy
   */
  public getAPURAM(): Uint8Array {
    return new Uint8Array(this.apuRam);
  }

  /**
   * Get DSP registers copy
   */
  public getDSPRegisters(): Uint8Array {
    return new Uint8Array(this.dspRegisters);
  }
}

