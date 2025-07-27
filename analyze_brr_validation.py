#!/usr/bin/env python3
"""
Comprehensive BRR Sample Validation Analysis and Improvement Script

This script tests BRR sample validation across multiple SNES ROM files to identify
common issues and edge cases that might lead to valid samples being rejected.

Focus areas:
1. Header validation (shift, filter, loop, end flags)
2. Block structure validation 
3. Sample directory detection
4. Edge case handling
5. False positive/negative reduction
"""

import os
import struct
import json
from typing import List, Dict, Tuple, Optional
from collections import defaultdict
from BRRDecoder import BRRDecoder

class BRRValidationAnalyzer:
    """Analyzes BRR validation logic across multiple ROM files."""
    
    def __init__(self):
        self.stats = {
            'total_roms': 0,
            'roms_with_brr': 0,
            'total_potential_samples': 0,
            'valid_samples': 0,
            'header_issues': defaultdict(int),
            'validation_failures': defaultdict(int),
            'sample_lengths': [],
            'filter_usage': defaultdict(int),
            'shift_usage': defaultdict(int),
            'loop_patterns': defaultdict(int)
        }
        
    def analyze_brr_header(self, header_byte: int) -> Dict:
        """Analyze a BRR header byte and return detailed information."""
        shift = (header_byte >> 4) & 0x0F
        filter_type = (header_byte >> 2) & 0x03
        loop_flag = (header_byte >> 1) & 0x01
        end_flag = header_byte & 0x01
        
        # Check for various header issues
        issues = []
        
        # Valid shift range is 0-12 according to SNES specifications
        if shift > 12:
            issues.append('invalid_shift')
            
        # Valid filter range is 0-3
        if filter_type > 3:
            issues.append('invalid_filter')
            
        # Reserved bits (bits 6-7) should typically be 0
        reserved = (header_byte >> 6) & 0x03
        if reserved != 0:
            issues.append('reserved_bits_set')
            
        # Both loop and end shouldn't typically be set simultaneously
        if loop_flag and end_flag:
            issues.append('loop_and_end_both_set')
            
        return {
            'shift': shift,
            'filter': filter_type,
            'loop': bool(loop_flag),
            'end': bool(end_flag),
            'reserved': reserved,
            'issues': issues,
            'raw': header_byte
        }
    
    def is_likely_brr_block(self, data: bytes, offset: int) -> Tuple[bool, str]:
        """
        Enhanced BRR block detection with detailed reasoning.
        Returns (is_valid, reason)
        """
        if offset + 9 > len(data):
            return False, "insufficient_data"
            
        header = data[offset]
        header_info = self.analyze_brr_header(header)
        
        # Reject blocks with severe header issues
        if 'invalid_shift' in header_info['issues']:
            return False, "invalid_shift"
        if 'invalid_filter' in header_info['issues']:
            return False, "invalid_filter"
            
        # Check data bytes for patterns that suggest non-BRR data
        data_bytes = data[offset + 1:offset + 9]
        
        # All zeros might be padding or silence (allow but flag)
        if all(b == 0 for b in data_bytes):
            return True, "silence_block"
            
        # All 0xFF might be invalid/uninitialized data
        if all(b == 0xFF for b in data_bytes):
            return False, "all_ff_pattern"
            
        # Check for highly repetitive patterns that suggest non-audio data
        unique_bytes = set(data_bytes)
        if len(unique_bytes) == 1 and header_info['shift'] == 0:
            return False, "monotone_pattern"
            
        # Look for ASCII text patterns (common false positive)
        if all(0x20 <= b <= 0x7E for b in data_bytes):
            return False, "ascii_text_pattern"
            
        return True, "valid"
    
    def find_brr_samples_in_rom(self, rom_data: bytes, rom_name: str) -> List[Dict]:
        """Find BRR samples in ROM data with enhanced validation."""
        samples = []
        offset = 0
        
        # Common BRR sample locations in SNES ROMs
        search_regions = [
            (0x8000, min(len(rom_data), 0x20000)),    # HiROM audio region
            (0x40000, min(len(rom_data), 0x80000)),   # LoROM audio region  
            (0x200000, min(len(rom_data), 0x400000)), # Extended regions
        ]
        
        for start, end in search_regions:
            offset = start
            while offset + 9 <= end:
                is_valid, reason = self.is_likely_brr_block(rom_data, offset)
                
                if is_valid:
                    sample_info = self.analyze_brr_sample(rom_data, offset, rom_name)
                    if sample_info:
                        samples.append(sample_info)
                        offset += sample_info['size']
                    else:
                        offset += 9
                else:
                    # Track why blocks were rejected
                    self.stats['validation_failures'][reason] += 1
                    offset += 1 if reason != "insufficient_data" else 9
                    
        return samples
    
    def analyze_brr_sample(self, data: bytes, start_offset: int, rom_name: str) -> Optional[Dict]:
        """Analyze a complete BRR sample starting at the given offset."""
        blocks = []
        offset = start_offset
        has_end = False
        has_loop = False
        loop_start_block = -1
        
        # Parse all blocks for this sample
        max_blocks = 500  # Safety limit
        while offset + 9 <= len(data) and len(blocks) < max_blocks:
            header_info = self.analyze_brr_header(data[offset])
            
            # Track statistics
            self.stats['filter_usage'][header_info['filter']] += 1
            self.stats['shift_usage'][header_info['shift']] += 1
            
            for issue in header_info['issues']:
                self.stats['header_issues'][issue] += 1
            
            block_info = {
                'offset': offset,
                'header': header_info,
                'data': data[offset + 1:offset + 9]
            }
            blocks.append(block_info)
            
            # Check flags
            if header_info['loop'] and loop_start_block == -1:
                loop_start_block = len(blocks) - 1
                has_loop = True
                
            if header_info['end']:
                has_end = True
                offset += 9
                break
                
            offset += 9
        
        # Must have at least one block and end flag
        if not blocks or not has_end:
            return None
            
        sample_size = offset - start_offset
        
        # Record loop pattern
        loop_pattern = "none"
        if has_loop and has_end:
            loop_pattern = "loop_and_end"
        elif has_loop:
            loop_pattern = "loop_only"
        elif has_end:
            loop_pattern = "end_only"
            
        self.stats['loop_patterns'][loop_pattern] += 1
        
        return {
            'rom': rom_name,
            'offset': start_offset,
            'size': sample_size,
            'blocks': len(blocks),
            'has_loop': has_loop,
            'has_end': has_end,
            'loop_start_block': loop_start_block,
            'validation_issues': sum(len(block['header']['issues']) for block in blocks),
            'filter_types_used': list(set(block['header']['filter'] for block in blocks)),
            'shift_range': (
                min(block['header']['shift'] for block in blocks),
                max(block['header']['shift'] for block in blocks)
            )
        }
    
    def analyze_rom(self, rom_path: str) -> Dict:
        """Analyze a single ROM file for BRR samples."""
        rom_name = os.path.basename(rom_path)
        
        try:
            with open(rom_path, 'rb') as f:
                rom_data = f.read()
                
            self.stats['total_roms'] += 1
            
            samples = self.find_brr_samples_in_rom(rom_data, rom_name)
            
            if samples:
                self.stats['roms_with_brr'] += 1
                self.stats['valid_samples'] += len(samples)
                self.stats['sample_lengths'].extend([s['size'] for s in samples])
                
            return {
                'rom': rom_name,
                'size': len(rom_data),
                'samples_found': len(samples),
                'samples': samples[:10]  # Limit to first 10 for output
            }
            
        except Exception as e:
            return {
                'rom': rom_name,
                'error': str(e),
                'samples_found': 0,
                'samples': []
            }
    
    def test_brr_decoder_compatibility(self, sample_data: bytes) -> Dict:
        """Test sample with the existing BRRDecoder for compatibility."""
        try:
            decoder = BRRDecoder(sample_data)
            decoded_samples = decoder.decode()
            
            return {
                'compatible': True,
                'decoded_samples': len(decoded_samples),
                'error': None
            }
        except Exception as e:
            return {
                'compatible': False,
                'decoded_samples': 0,
                'error': str(e)
            }
    
    def generate_report(self) -> Dict:
        """Generate comprehensive analysis report."""
        if self.stats['sample_lengths']:
            avg_length = sum(self.stats['sample_lengths']) / len(self.stats['sample_lengths'])
        else:
            avg_length = 0
            
        return {
            'summary': {
                'total_roms_analyzed': self.stats['total_roms'],
                'roms_with_brr_samples': self.stats['roms_with_brr'],
                'total_samples_found': self.stats['valid_samples'],
                'average_sample_size': avg_length,
                'brr_detection_rate': (self.stats['roms_with_brr'] / max(1, self.stats['total_roms'])) * 100
            },
            'validation_issues': {
                'header_issues': dict(self.stats['header_issues']),
                'validation_failures': dict(self.stats['validation_failures']),
                'loop_patterns': dict(self.stats['loop_patterns'])
            },
            'usage_patterns': {
                'filter_usage': dict(self.stats['filter_usage']),
                'shift_usage': dict(self.stats['shift_usage'])
            },
            'recommendations': self.generate_recommendations()
        }
    
    def generate_recommendations(self) -> List[str]:
        """Generate recommendations for improving BRR validation."""
        recommendations = []
        
        # Check for common validation failures
        failures = self.stats['validation_failures']
        
        if failures.get('invalid_shift', 0) > 0:
            recommendations.append(
                "Consider allowing shift values up to 15 as some games may use extended range"
            )
            
        if failures.get('ascii_text_pattern', 0) > 0:
            recommendations.append(
                "ASCII text pattern detection is working - continue rejecting these false positives"
            )
            
        if failures.get('all_ff_pattern', 0) > 0:
            recommendations.append(
                "All-0xFF pattern detection is working - these are likely uninitialized data"
            )
            
        # Check header issues
        header_issues = self.stats['header_issues']
        
        if header_issues.get('reserved_bits_set', 0) > 0:
            recommendations.append(
                "Some samples have reserved bits set - consider treating as warning rather than error"
            )
            
        if header_issues.get('loop_and_end_both_set', 0) > 0:
            recommendations.append(
                "Some samples have both loop and end flags set - validate this is intentional"
            )
            
        # Check usage patterns
        filter_usage = self.stats['filter_usage']
        if len(filter_usage) > 0:
            unused_filters = set(range(4)) - set(filter_usage.keys())
            if unused_filters:
                recommendations.append(
                    f"Filter types {unused_filters} were not found - validation may be too strict"
                )
                
        return recommendations


def main():
    """Main analysis function."""
    analyzer = BRRValidationAnalyzer()
    
    games_dir = './snes_games/'
    output_dir = './output/'
    os.makedirs(output_dir, exist_ok=True)
    
    results = []
    
    print("Starting comprehensive BRR validation analysis...")
    
    # Analyze a subset of ROMs for detailed testing
    test_roms = [
        'Chrono_Trigger.sfc',
        'Secret_of_Mana.sfc', 
        'Super_Metroid.sfc',
        'Donkey_Kong_Country.sfc',
        'Final_Fantasy_III.sfc',
        'Legend_of_Zelda_The_A_Link_to_the_Past.sfc',
        'Super_Castlevania_IV.sfc',
        'Contra_III_The_Alien_Wars.sfc',
        'Street_Fighter_II.sfc',
        'Kirby_Super_Star.sfc'
    ]
    
    for rom_name in test_roms:
        rom_path = os.path.join(games_dir, rom_name)
        if os.path.exists(rom_path):
            print(f"Analyzing {rom_name}...")
            result = analyzer.analyze_rom(rom_path)
            results.append(result)
            print(f"  Found {result['samples_found']} potential BRR samples")
        else:
            print(f"  ROM not found: {rom_name}")
    
    # Generate comprehensive report
    report = analyzer.generate_report()
    
    # Save detailed results
    with open(os.path.join(output_dir, 'brr_analysis_detailed.json'), 'w') as f:
        json.dump({
            'analysis_report': report,
            'rom_results': results
        }, f, indent=2)
    
    # Print summary
    print("\n" + "="*60)
    print("BRR VALIDATION ANALYSIS SUMMARY")
    print("="*60)
    
    summary = report['summary']
    print(f"ROMs analyzed: {summary['total_roms_analyzed']}")
    print(f"ROMs with BRR samples: {summary['roms_with_brr_samples']}")
    print(f"Total samples found: {summary['total_samples_found']}")
    print(f"Average sample size: {summary['average_sample_size']:.1f} bytes")
    print(f"BRR detection rate: {summary['brr_detection_rate']:.1f}%")
    
    print(f"\nValidation Issues:")
    for issue, count in report['validation_issues']['header_issues'].items():
        print(f"  {issue}: {count}")
        
    print(f"\nValidation Failures:")
    for failure, count in report['validation_issues']['validation_failures'].items():
        print(f"  {failure}: {count}")
    
    print(f"\nRecommendations:")
    for i, rec in enumerate(report['recommendations'], 1):
        print(f"  {i}. {rec}")
    
    print(f"\nDetailed results saved to: {output_dir}brr_analysis_detailed.json")


if __name__ == "__main__":
    main()
