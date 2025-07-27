/**
 * Error and Warning Consolidation Manager
 * 
 * Implements a comprehensive system to consolidate error and warning messages
 * into summaries, reducing repetition and providing users with clear overviews
 * of issues that occurred during their session.
 */

import { Logger, createLogger } from './utils/logger';
import { DisassemblerError, DisassemblerErrorType } from './types/result-types';

// Enhanced error types for better categorization
export enum MessageSeverity {
  FATAL = 'fatal',
  ERROR = 'error', 
  WARNING = 'warning',
  INFO = 'info',
  DEBUG = 'debug'
}

export enum MessageCategory {
  ROM_PARSING = 'rom_parsing',
  INSTRUCTION_DECODE = 'instruction_decode',
  MEMORY_ACCESS = 'memory_access',
  ASSET_EXTRACTION = 'asset_extraction',
  OUTPUT_GENERATION = 'output_generation',
  VALIDATION = 'validation',
  CONFIGURATION = 'configuration',
  PERFORMANCE = 'performance',
  AUDIO_PROCESSING = 'audio_processing',
  AI_ANALYSIS = 'ai_analysis'
}

// Consolidated message interface
export interface ConsolidatedMessage {
  id: string;
  severity: MessageSeverity;
  category: MessageCategory;
  title: string;
  message: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  context: Array<{
    timestamp: Date;
    location?: string;
    address?: number;
    additionalData?: any;
  }>;
  suggestions?: string[];
  relatedMessages?: string[]; // IDs of related messages
}

// Session summary interface
export interface SessionSummary {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalMessages: number;
  severityCounts: Record<MessageSeverity, number>;
  categoryCounts: Record<MessageCategory, number>;
  consolidatedMessages: ConsolidatedMessage[];
  criticalIssues: ConsolidatedMessage[];
  recommendations: string[];
  performanceMetrics?: {
    processingTime: number;
    memoryUsage: number;
    operationsCompleted: number;
  };
}

// Pattern detection for message consolidation
interface MessagePattern {
  pattern: RegExp;
  category: MessageCategory;
  consolidationKey: (match: RegExpMatchArray) => string;
  generateTitle: (matches: RegExpMatchArray[]) => string;
  generateSummary: (count: number, matches: RegExpMatchArray[]) => string;
  suggestions?: string[];
}

// Pre-defined message patterns for common issues
const MESSAGE_PATTERNS: MessagePattern[] = [
  {
    pattern: /Invalid instruction at address 0x([0-9A-Fa-f]+)/,
    category: MessageCategory.INSTRUCTION_DECODE,
    consolidationKey: (match) => 'invalid_instruction',
    generateTitle: () => 'Invalid Instructions Detected',
    generateSummary: (count, matches) => {
      const addresses = matches.map(m => `0x${m[1]}`).slice(0, 5);
      const remaining = Math.max(0, count - 5);
      return `Found ${count} invalid instruction${count > 1 ? 's' : ''} at addresses: ${addresses.join(', ')}${remaining > 0 ? ` and ${remaining} more` : ''}`;
    },
    suggestions: [
      'Verify ROM file integrity',
      'Check if the address range is correct',
      'Consider using bank-aware addressing mode'
    ]
  },
  {
    pattern: /Memory access out of bounds at 0x([0-9A-Fa-f]+)/,
    category: MessageCategory.MEMORY_ACCESS,
    consolidationKey: (match) => 'memory_oob',
    generateTitle: () => 'Memory Access Violations',
    generateSummary: (count, matches) => `${count} memory access violation${count > 1 ? 's' : ''} detected`,
    suggestions: [
      'Review ROM mapping configuration',
      'Check memory region definitions',
      'Verify address calculation logic'
    ]
  },
  {
    pattern: /Failed to extract (graphics|audio|text) from offset 0x([0-9A-Fa-f]+)/,
    category: MessageCategory.ASSET_EXTRACTION,
    consolidationKey: (match) => `asset_extraction_${match[1]}`,
    generateTitle: (matches) => `${matches[0][1].charAt(0).toUpperCase() + matches[0][1].slice(1)} Extraction Issues`,
    generateSummary: (count) => `${count} asset extraction failure${count > 1 ? 's' : ''} occurred`,
    suggestions: [
      'Verify asset format specifications',
      'Check offset calculations',
      'Consider alternative extraction methods'
    ]
  },
  {
    pattern: /BRR decoding error: (.+)/,
    category: MessageCategory.AUDIO_PROCESSING,
    consolidationKey: (match) => 'brr_decode_error',
    generateTitle: () => 'BRR Audio Processing Issues',
    generateSummary: (count) => `${count} BRR audio processing error${count > 1 ? 's' : ''} encountered`,
    suggestions: [
      'Verify BRR file format',
      'Check sample rate configuration',
      'Review loop point settings'
    ]
  }
];

export class ErrorWarningManager {
  private logger: Logger;
  private sessionId: string;
  private sessionStartTime: Date;
  private rawMessages: Map<string, any[]> = new Map();
  private consolidatedMessages: Map<string, ConsolidatedMessage> = new Map();
  private messageCounter = 0;
  private performanceMetrics = {
    processingTime: 0,
    memoryUsage: 0,
    operationsCompleted: 0
  };

  constructor(sessionId?: string) {
    this.logger = createLogger('ErrorWarningManager');
    this.sessionId = sessionId || this.generateSessionId();
    this.sessionStartTime = new Date();
    this.logger.info('Error and Warning Manager initialized', { sessionId: this.sessionId });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a message to the manager for consolidation
   */
  addMessage(
    severity: MessageSeverity,
    category: MessageCategory,
    message: string,
    context?: {
      location?: string;
      address?: number;
      additionalData?: any;
    }
  ): void {
    const timestamp = new Date();
    const messageId = this.generateMessageId(severity, category, message);
    
    // Store raw message
    if (!this.rawMessages.has(messageId)) {
      this.rawMessages.set(messageId, []);
    }
    this.rawMessages.get(messageId)!.push({ timestamp, context });
    
    // Consolidate message
    this.consolidateMessage(messageId, severity, category, message, timestamp, context);
    
    this.messageCounter++;
    this.logger.debug('Message added for consolidation', {
      severity,
      category,
      messageId,
      totalMessages: this.messageCounter
    });
  }

  /**
   * Add an error (convenience method)
   */
  addError(category: MessageCategory, message: string, context?: any): void {
    this.addMessage(MessageSeverity.ERROR, category, message, context);
  }

  /**
   * Add a warning (convenience method)
   */
  addWarning(category: MessageCategory, message: string, context?: any): void {
    this.addMessage(MessageSeverity.WARNING, category, message, context);
  }

  /**
   * Add a fatal error (convenience method)
   */
  addFatalError(category: MessageCategory, message: string, context?: any): void {
    this.addMessage(MessageSeverity.FATAL, category, message, context);
  }

  private generateMessageId(severity: MessageSeverity, category: MessageCategory, message: string): string {
    // Try to match against known patterns first
    for (const pattern of MESSAGE_PATTERNS) {
      const match = message.match(pattern.pattern);
      if (match && pattern.category === category) {
        return pattern.consolidationKey(match);
      }
    }
    
    // Fallback to generating ID from message content
    const normalized = message.toLowerCase()
      .replace(/0x[0-9a-f]+/g, '0xXXXX')  // Normalize hex addresses
      .replace(/\d+/g, 'N')              // Normalize numbers
      .replace(/[^a-z0-9]/g, '_')        // Replace special chars
      .replace(/_+/g, '_')               // Collapse multiple underscores
      .replace(/^_|_$/g, '');            // Remove leading/trailing underscores
    
    return `${category}_${normalized}`;
  }

  private consolidateMessage(
    messageId: string,
    severity: MessageSeverity,
    category: MessageCategory,
    message: string,
    timestamp: Date,
    context?: any
  ): void {
    let consolidated = this.consolidatedMessages.get(messageId);
    
    if (!consolidated) {
      // Create new consolidated message
      const pattern = this.findMatchingPattern(message, category);
      
      consolidated = {
        id: messageId,
        severity,
        category,
        title: pattern?.generateTitle ? pattern.generateTitle([message.match(pattern.pattern)!]) : this.generateTitle(message),
        message: pattern?.generateSummary ? pattern.generateSummary(1, [message.match(pattern.pattern)!]) : message,
        count: 1,
        firstOccurrence: timestamp,
        lastOccurrence: timestamp,
        context: [{ timestamp, ...context }],
        suggestions: pattern?.suggestions || this.generateSuggestions(category, message),
        relatedMessages: []
      };
      
      this.consolidatedMessages.set(messageId, consolidated);
    } else {
      // Update existing consolidated message
      consolidated.count++;
      consolidated.lastOccurrence = timestamp;
      consolidated.context.push({ timestamp, ...context });
      
      // Update message summary if using pattern
      const pattern = this.findMatchingPattern(message, category);
      if (pattern?.generateSummary) {
        const matches = this.rawMessages.get(messageId)?.map(raw => 
          message.match(pattern.pattern)!
        ) || [];
        consolidated.message = pattern.generateSummary(consolidated.count, matches);
      }
      
      // Update severity if more severe
      if (this.getSeverityWeight(severity) > this.getSeverityWeight(consolidated.severity)) {
        consolidated.severity = severity;
      }
    }
  }

  private findMatchingPattern(message: string, category: MessageCategory): MessagePattern | undefined {
    return MESSAGE_PATTERNS.find(pattern => 
      pattern.category === category && pattern.pattern.test(message)
    );
  }

  private getSeverityWeight(severity: MessageSeverity): number {
    switch (severity) {
      case MessageSeverity.DEBUG: return 1;
      case MessageSeverity.INFO: return 2;
      case MessageSeverity.WARNING: return 3;
      case MessageSeverity.ERROR: return 4;
      case MessageSeverity.FATAL: return 5;
      default: return 0;
    }
  }

  private generateTitle(message: string): string {
    // Extract key terms for title generation
    const words = message.split(' ');
    if (words.length <= 3) return message;
    
    return words.slice(0, 3).join(' ') + '...';
  }

  private generateSuggestions(category: MessageCategory, message: string): string[] {
    const suggestions: Record<MessageCategory, string[]> = {
      [MessageCategory.ROM_PARSING]: [
        'Verify ROM file format and integrity',
        'Check file permissions and accessibility',
        'Try a different ROM dump if available'
      ],
      [MessageCategory.INSTRUCTION_DECODE]: [
        'Verify the address range being disassembled',
        'Check processor mode settings (8-bit vs 16-bit)',
        'Review memory mapping configuration'
      ],
      [MessageCategory.MEMORY_ACCESS]: [
        'Review ROM mapping settings',
        'Check memory region boundaries',
        'Verify address calculations'
      ],
      [MessageCategory.ASSET_EXTRACTION]: [
        'Verify asset format specifications',
        'Check data offset calculations',
        'Review compression settings if applicable'
      ],
      [MessageCategory.OUTPUT_GENERATION]: [
        'Check output directory permissions',
        'Verify disk space availability',
        'Review output format settings'
      ],
      [MessageCategory.VALIDATION]: [
        'Review validation rules',
        'Check input data format',
        'Verify configuration parameters'
      ],
      [MessageCategory.CONFIGURATION]: [
        'Check configuration file syntax',
        'Verify all required parameters are set',
        'Review parameter value ranges'
      ],
      [MessageCategory.PERFORMANCE]: [
        'Consider increasing memory allocation',
        'Review processing complexity',
        'Check system resources'
      ],
      [MessageCategory.AUDIO_PROCESSING]: [
        'Verify audio format specifications',
        'Check sample rate settings',
        'Review compression parameters'
      ],
      [MessageCategory.AI_ANALYSIS]: [
        'Check AI model availability',
        'Verify network connectivity if required',
        'Review analysis parameters'
      ]
    };
    
    return suggestions[category] || ['Review the error details and configuration'];
  }

  /**
   * Generate a comprehensive session summary
   */
  generateSessionSummary(): SessionSummary {
    const endTime = new Date();
    const consolidatedArray = Array.from(this.consolidatedMessages.values());
    
    // Calculate severity counts
    const severityCounts = Object.values(MessageSeverity).reduce((acc, severity) => {
      acc[severity] = consolidatedArray.filter(msg => msg.severity === severity).length;
      return acc;
    }, {} as Record<MessageSeverity, number>);
    
    // Calculate category counts
    const categoryCounts = Object.values(MessageCategory).reduce((acc, category) => {
      acc[category] = consolidatedArray.filter(msg => msg.category === category).length;
      return acc;
    }, {} as Record<MessageCategory, number>);
    
    // Identify critical issues (fatal errors and high-count errors/warnings)
    const criticalIssues = consolidatedArray.filter(msg => 
      msg.severity === MessageSeverity.FATAL || 
      (msg.severity === MessageSeverity.ERROR && msg.count >= 5) ||
      (msg.severity === MessageSeverity.WARNING && msg.count >= 10)
    );
    
    // Generate recommendations based on the issues found
    const recommendations = this.generateRecommendations(consolidatedArray);
    
    return {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      endTime,
      totalMessages: this.messageCounter,
      severityCounts,
      categoryCounts,
      consolidatedMessages: consolidatedArray.sort((a, b) => 
        this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity) ||
        b.count - a.count
      ),
      criticalIssues,
      recommendations,
      performanceMetrics: this.performanceMetrics
    };
  }

  private generateRecommendations(messages: ConsolidatedMessage[]): string[] {
    const recommendations: string[] = [];
    
    // Check for common patterns and generate recommendations
    const errorCount = messages.filter(m => m.severity === MessageSeverity.ERROR).length;
    const warningCount = messages.filter(m => m.severity === MessageSeverity.WARNING).length;
    
    if (errorCount > 0) {
      recommendations.push('Review and address the errors found during processing');
    }
    
    if (warningCount > 10) {
      recommendations.push('Consider reviewing configuration to reduce warnings');
    }
    
    // Category-specific recommendations
    const instructionErrors = messages.filter(m => 
      m.category === MessageCategory.INSTRUCTION_DECODE && 
      m.severity === MessageSeverity.ERROR
    );
    
    if (instructionErrors.length > 0) {
      recommendations.push('Verify ROM integrity and disassembly address ranges');
    }
    
    const memoryErrors = messages.filter(m => 
      m.category === MessageCategory.MEMORY_ACCESS && 
      m.severity === MessageSeverity.ERROR
    );
    
    if (memoryErrors.length > 0) {
      recommendations.push('Review memory mapping configuration');
    }
    
    const assetErrors = messages.filter(m => 
      m.category === MessageCategory.ASSET_EXTRACTION && 
      m.severity === MessageSeverity.ERROR
    );
    
    if (assetErrors.length > 0) {
      recommendations.push('Check asset extraction parameters and ROM format');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Processing completed with no major issues detected');
    }
    
    return recommendations;
  }

  /**
   * Get messages by severity
   */
  getMessagesBySeverity(severity: MessageSeverity): ConsolidatedMessage[] {
    return Array.from(this.consolidatedMessages.values())
      .filter(msg => msg.severity === severity)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get messages by category
   */
  getMessagesByCategory(category: MessageCategory): ConsolidatedMessage[] {
    return Array.from(this.consolidatedMessages.values())
      .filter(msg => msg.category === category)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get critical issues that need immediate attention
   */
  getCriticalIssues(): ConsolidatedMessage[] {
    return Array.from(this.consolidatedMessages.values())
      .filter(msg => 
        msg.severity === MessageSeverity.FATAL ||
        (msg.severity === MessageSeverity.ERROR && msg.count >= 5)
      )
      .sort((a, b) => 
        this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity) ||
        b.count - a.count
      );
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(metrics: Partial<typeof this.performanceMetrics>): void {
    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
  }

  /**
   * Clear all messages and reset the session
   */
  reset(): void {
    this.rawMessages.clear();
    this.consolidatedMessages.clear();
    this.messageCounter = 0;
    this.sessionStartTime = new Date();
    this.performanceMetrics = {
      processingTime: 0,
      memoryUsage: 0,
      operationsCompleted: 0
    };
    
    this.logger.info('Error and Warning Manager reset', { sessionId: this.sessionId });
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    sessionId: string;
    duration: number;
    totalMessages: number;
    uniqueMessages: number;
    mostCommonIssue?: ConsolidatedMessage;
  } {
    const duration = Date.now() - this.sessionStartTime.getTime();
    const consolidated = Array.from(this.consolidatedMessages.values());
    const mostCommon = consolidated.sort((a, b) => b.count - a.count)[0];
    
    return {
      sessionId: this.sessionId,
      duration,
      totalMessages: this.messageCounter,
      uniqueMessages: consolidated.length,
      mostCommonIssue: mostCommon
    };
  }
}
