/**
 * SNES Audio Type Definitions
 *
 * This file contains TypeScript interfaces and types for SNES audio-related
 * data structures including BRR samples, SPC files, DSP registers, and
 * voice configurations used in audio processing and conversion.
 */

// =============================================================================
// BRR (Bit Rate Reduction) Sample Structures
// =============================================================================

/**
 * BRR block header containing compression and loop information
 */
export interface BRRBlockHeader {
  /** Compression range (0-12, determines shift amount) */
  range: number;
  /** Compression filter (0-3, affects how samples are decoded) */
  filter: number;
  /** End flag - indicates if this is the last block */
  end: boolean;
  /** Loop flag - indicates if playback should loop back */
  loop: boolean;
}

/**
 * A single BRR compressed audio block (9 bytes total)
 */
export interface BRRBlock {
  /** Block header (1 byte) */
  header: BRRBlockHeader;
  /** Compressed sample data (8 bytes, 16 4-bit samples) */
  samples: number[];
}

/**
 * Complete BRR sample with metadata
 */
interface BRRSample {
  /** Array of BRR blocks making up the sample */
  blocks: BRRBlock[];
  /** Loop start point (in blocks) */
  loopStart?: number;
  /** Sample rate hint (not stored in BRR, but useful for playback) */
  sampleRate?: number;
  /** Original length in samples (before compression) */
  originalLength: number;
  /** Total size in bytes */
  sizeInBytes: number;
}

/**
 * BRR conversion parameters
 */
interface BRRConversionParams {
  /** Target compression filter preference */
  preferredFilter?: number;
  /** Enable loop point detection */
  detectLoop?: boolean;
  /** Maximum compression range to use */
  maxRange?: number;
  /** Quality vs size tradeoff (0-100) */
  quality?: number;
}

// =============================================================================
// SPC File Format Structures
// =============================================================================

/**
 * SPC file header (standard SPC format)
 */
export interface SPCHeader {
  /** File signature "SNES-SPC700 Sound File Data" */
  signature: string;
  /** Version marker (26-27) */
  version: number;
  /** PC register value */
  pc: number;
  /** A register value */
  a: number;
  /** X register value */
  x: number;
  /** Y register value */
  y: number;
  /** PSW (Processor Status Word) */
  psw: number;
  /** Stack pointer */
  sp: number;
  /** Song title (32 bytes) */
  title: string;
  /** Game title (32 bytes) */
  game: string;
  /** Dumper name (16 bytes) */
  dumper: string;
  /** Comments (32 bytes) */
  comments: string;
  /** Date dumped (11 bytes) */
  date: string;
  /** Seconds to play before fading */
  playTime: number;
  /** Fade length in milliseconds */
  fadeLength: number;
  /** Artist name (32 bytes) */
  artist: string;
  /** Default channel disabled flags */
  channelDisabled: number;
  /** Emulator used for dumping */
  emulator: number;
}

/**
 * Complete SPC file structure
 */
export interface SPCFile {
  /** SPC file header */
  header: SPCHeader;
  /** 64KB SPC700 RAM dump */
  ram: Uint8Array;
  /** 128 bytes of DSP register data */
  dspRegisters: Uint8Array;
  /** Extended ID666 tag data (optional) */
  extendedTags?: Record<string, string>;
}

/**
 * SPC playback state
 */
interface SPCState {
  /** Current PC (Program Counter) */
  pc: number;
  /** Current CPU registers */
  registers: {
    a: number;
    x: number;
    y: number;
    sp: number;
    psw: number;
  };
  /** Current DSP register values */
  dspState: DSPState;
  /** Playback time in samples */
  playbackTime: number;
}

// =============================================================================
// DSP (Digital Signal Processor) Structures
// =============================================================================

/**
 * DSP register constants for the Sony SPC700 DSP
 */
export const DSP_REGISTERS = {
  // Voice-specific registers (8 voices, each using 16 bytes)
  VOICE_LEFT_VOL: 0x00,      // VxVOLL - Left volume
  VOICE_RIGHT_VOL: 0x01,     // VxVOLR - Right volume
  VOICE_PITCH_LOW: 0x02,     // VxPITCHL - Pitch (low byte)
  VOICE_PITCH_HIGH: 0x03,    // VxPITCHH - Pitch (high byte)
  VOICE_SRC_NUM: 0x04,       // VxSRCN - Source number
  VOICE_ADSR1: 0x05,         // VxADSR1 - ADSR settings (attack/decay)
  VOICE_ADSR2: 0x06,         // VxADSR2 - ADSR settings (sustain/release)
  VOICE_GAIN: 0x07,          // VxGAIN - Gain
  VOICE_ENV_VAL: 0x08,       // VxENVX - Current envelope value
  VOICE_OUT_VAL: 0x09,       // VxOUTX - Current sample value

  // Global registers
  MAIN_LEFT_VOL: 0x0C,       // MVOLL - Main volume left
  MAIN_RIGHT_VOL: 0x1C,      // MVOLR - Main volume right
  ECHO_LEFT_VOL: 0x2C,       // EVOLL - Echo volume left
  ECHO_RIGHT_VOL: 0x3C,      // EVOLR - Echo volume right
  KEY_ON: 0x4C,              // KON - Key on
  KEY_OFF: 0x5C,             // KOFF - Key off
  FLAGS: 0x6C,               // FLG - Reset, mute, echo-write flags
  ENDX: 0x7C,                // ENDX - End flag for each voice

  // Echo registers
  ECHO_FEEDBACK: 0x0D,       // EFB - Echo feedback
  PITCH_MOD: 0x2D,           // PMON - Pitch modulation
  NOISE_ON: 0x3D,            // NON - Noise enable
  ECHO_ON: 0x4D,             // EON - Echo enable
  SOURCE_DIR: 0x5D,          // DIR - Source directory
  ECHO_START: 0x6D,          // ESA - Echo buffer start address
  ECHO_DELAY: 0x7D,          // EDL - Echo delay

  // FIR filter coefficients
  FIR_C0: 0x0F, FIR_C1: 0x1F, FIR_C2: 0x2F, FIR_C3: 0x3F,
  FIR_C4: 0x4F, FIR_C5: 0x5F, FIR_C6: 0x6F, FIR_C7: 0x7F
} as const;

/**
 * ADSR (Attack, Decay, Sustain, Release) envelope parameters
 */
export interface ADSREnvelope {
  /** Attack rate (0-15) */
  attack: number;
  /** Decay rate (0-7) */
  decay: number;
  /** Sustain level (0-7) */
  sustain: number;
  /** Release rate (0-31) */
  release: number;
  /** Enable ADSR mode (vs GAIN mode) */
  enabled: boolean;
}

/**
 * Alternative GAIN envelope parameters (when ADSR disabled)
 */
interface GainEnvelope {
  /** Gain mode (0=direct, 1=linear decrease, 2=exponential decrease, 3=linear increase, 4=bent increase) */
  mode: number;
  /** Gain value (0-127) */
  value: number;
}

/**
 * Voice configuration for a single DSP voice
 */
export interface VoiceConfig {
  /** Voice number (0-7) */
  voiceNumber: number;
  /** Left channel volume (0-127, can be negative for phase inversion) */
  leftVolume: number;
  /** Right channel volume (0-127, can be negative for phase inversion) */
  rightVolume: number;
  /** Pitch value (0-16383, determines playback frequency) */
  pitch: number;
  /** Source number (index into sample directory) */
  sourceNumber: number;
  /** ADSR envelope settings */
  adsr: ADSREnvelope;
  /** GAIN envelope settings (used when ADSR disabled) */
  gain: GainEnvelope;
  /** Current envelope value (read-only) */
  envelopeValue?: number;
  /** Current output value (read-only) */
  outputValue?: number;
}

/**
 * Complete DSP state
 */
export interface DSPState {
  /** Configuration for all 8 voices */
  voices: VoiceConfig[];
  /** Main output volume (left/right) */
  mainVolume: { left: number; right: number };
  /** Echo output volume (left/right) */
  echoVolume: { left: number; right: number };
  /** Key on flags (which voices to start) */
  keyOn: number;
  /** Key off flags (which voices to stop) */
  keyOff: number;
  /** Solo flags (which voices to solo) */
  solo: number;
  /** Noise enable flags */
  noiseEnable: number;
  /** Echo enable flags */
  echoEnable: number;
  /** Pitch modulation enable flags */
  pitchModEnable: number;
  /** Source directory address */
  sourceDirectory: number;
  /** Echo buffer start address */
  echoStartAddress: number;
  /** Echo delay (buffer size) */
  echoDelay: number;
  /** Echo feedback amount */
  echoFeedback: number;
  /** FIR filter coefficients for echo */
  firCoefficients: number[];
  /** Global flags (reset, mute, echo write disable) */
  flags: number;
  /** End flags for each voice (read-only) */
  endFlags?: number;
}

// =============================================================================
// Sample Metadata and Directory Structures
// =============================================================================

/**
 * Sample directory entry (4 bytes each)
 */
export interface SampleDirectoryEntry {
  /** Start address of BRR sample */
  startAddress: number;
  /** Loop address (where to restart when looping) */
  loopAddress: number;
}

/**
 * Sample metadata for organizing and managing samples
 */
interface SampleMetadata {
  /** Unique identifier for the sample */
  id: string;
  /** Human-readable name */
  name: string;
  /** Sample directory index */
  directoryIndex: number;
  /** Start address in SPC RAM */
  startAddress: number;
  /** Loop start address */
  loopAddress: number;
  /** Estimated base pitch (C4 = 8192) */
  basePitch: number;
  /** Root key for pitch calculations */
  rootKey: number;
  /** Fine tuning offset */
  fineTune: number;
  /** Sample length in BRR blocks */
  lengthInBlocks: number;
  /** Whether sample loops */
  loops: boolean;
  /** Sample category/group */
  category?: string;
  /** Additional notes or description */
  notes?: string;
}

/**
 * Complete sample bank containing multiple samples
 */
interface SampleBank {
  /** Bank name/identifier */
  name: string;
  /** Sample directory (up to 256 entries) */
  directory: SampleDirectoryEntry[];
  /** Sample metadata */
  samples: SampleMetadata[];
  /** Raw BRR sample data */
  sampleData: Uint8Array;
  /** Total size of all samples */
  totalSize: number;
}

// =============================================================================
// Audio Processing and Conversion Types
// =============================================================================

/**
 * Audio conversion options
 */
interface AudioConversionOptions {
  /** Target sample rate */
  sampleRate?: number;
  /** Target bit depth */
  bitDepth?: number;
  /** Number of channels */
  channels?: number;
  /** Interpolation method for resampling */
  interpolation?: 'none' | 'linear' | 'gaussian' | 'cubic' | 'sinc';
  /** Apply anti-aliasing filter */
  antiAlias?: boolean;
  /** Normalize output levels */
  normalize?: boolean;
  /** Echo/reverb processing */
  processEcho?: boolean;
}

/**
 * Playback configuration
 */
interface PlaybackConfig {
  /** Master volume (0.0 - 1.0) */
  masterVolume?: number;
  /** Individual channel volumes */
  channelVolumes?: number[];
  /** Channel mute states */
  channelMutes?: boolean[];
  /** Playback speed multiplier */
  speed?: number;
  /** Enable echo processing */
  echoEnabled?: boolean;
  /** Echo wet/dry mix */
  echoMix?: number;
}

/**
 * Audio analysis results
 */
interface AudioAnalysis {
  /** Peak amplitude levels per channel */
  peakLevels: number[];
  /** RMS levels per channel */
  rmsLevels: number[];
  /** Frequency spectrum data */
  frequencySpectrum?: number[];
  /** Detected fundamental frequency */
  fundamentalFreq?: number;
  /** Dynamic range */
  dynamicRange: number;
  /** Signal-to-noise ratio */
  snr?: number;
}

