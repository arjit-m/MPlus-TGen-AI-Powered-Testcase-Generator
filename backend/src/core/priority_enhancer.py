"""
Enhanced Priority Assignment System

This module implements intelligent priority assignment for test cases using:
1. Keyword-based heuristics
2. Test type priority multipliers
3. Context-aware scoring

Phase 1: Quick Wins Implementation
"""

from typing import Dict, Tuple, List
import re


# ============================================
# Keyword Categories for Priority Detection
# ============================================

CRITICAL_KEYWORDS = [
    'payment', 'transaction', 'checkout', 'purchase', 'billing',
    'security', 'authentication', 'authorization', 'login', 'password',
    'data loss', 'crash', 'unauthorized', 'breach', 'vulnerability',
    'encryption', 'critical', 'emergency', 'backup', 'recovery',
    'corruption', 'financial', 'money', 'credit card', 'sensitive data',
    'admin access', 'root', 'privilege escalation', 'sql injection',
    'xss', 'csrf', 'malicious', 'attack'
]

HIGH_KEYWORDS = [
    'search', 'upload', 'download', 'notification', 'email',
    'integration', 'api', 'database', 'performance', 'sync',
    'workflow', 'core feature', 'main functionality', 'sign up',
    'registration', 'profile', 'account', 'session', 'timeout',
    'export', 'import', 'batch', 'bulk', 'report', 'analytics',
    'dashboard', 'error handling', 'validation', 'mandatory',
    'required field', 'user management', 'role', 'permission'
]

MEDIUM_KEYWORDS = [
    'filter', 'sort', 'sorting', 'formatting', 'display', 'layout',
    'ui', 'settings', 'preferences', 'configuration', 'customize',
    'optional', 'helper', 'tooltip', 'hint', 'placeholder',
    'pagination', 'navigation', 'breadcrumb', 'menu', 'dropdown',
    'modal', 'dialog', 'popup', 'tab', 'accordion', 'calendar',
    'date picker', 'color picker', 'toggle', 'switch'
]

LOW_KEYWORDS = [
    'cosmetic', 'aesthetic', 'styling', 'theme', 'appearance',
    'icon', 'logo', 'spacing', 'margin', 'padding', 'alignment',
    'font', 'color scheme', 'animation', 'transition', 'hover',
    'informational', 'help text', 'documentation', 'readme',
    'optional feature', 'nice to have', 'future enhancement'
]


# ============================================
# Test Type Priority Multipliers
# ============================================

TEST_TYPE_PRIORITY = {
    'smoke': {
        'base_priority': 'High',
        'multiplier': 1.3,
        'description': 'Critical path validation'
    },
    'sanity': {
        'base_priority': 'High',
        'multiplier': 1.2,
        'description': 'Recent changes validation'
    },
    'regression': {
        'base_priority': 'High',
        'multiplier': 1.15,
        'description': 'Existing functionality protection'
    },
    'integration': {
        'base_priority': 'High',
        'multiplier': 1.25,
        'description': 'System integration points'
    },
    'e2e': {
        'base_priority': 'High',
        'multiplier': 1.2,
        'description': 'End-to-end workflows'
    },
    'api': {
        'base_priority': 'High',
        'multiplier': 1.15,
        'description': 'API contract validation'
    },
    'unit': {
        'base_priority': 'Medium',
        'multiplier': 1.0,
        'description': 'Component-level testing'
    },
    'functional': {
        'base_priority': 'Medium',
        'multiplier': 1.05,
        'description': 'Feature functionality'
    },
    'exploratory': {
        'base_priority': 'Low',
        'multiplier': 0.9,
        'description': 'Exploratory scenarios'
    },
    'usability': {
        'base_priority': 'Low',
        'multiplier': 0.85,
        'description': 'User experience testing'
    }
}


# ============================================
# Priority Scoring System (3-Level: High, Medium, Low)
# ============================================

PRIORITY_SCORE_MAP = {
    'High': 8.0,
    'Medium': 5.0,
    'Low': 2.0
}

SCORE_TO_PRIORITY = [
    (6.5, 'High'),
    (3.5, 'Medium'),
    (0.0, 'Low')
]


class PriorityEnhancer:
    """
    Enhanced priority assignment using multiple factors:
    - Keyword analysis
    - Test type importance
    - Context awareness
    """
    
    def __init__(self):
        self.critical_keywords = set(CRITICAL_KEYWORDS)
        self.high_keywords = set(HIGH_KEYWORDS)
        self.medium_keywords = set(MEDIUM_KEYWORDS)
        self.low_keywords = set(LOW_KEYWORDS)
    
    def enhance_priority(
        self, 
        test_case: Dict, 
        requirement: str, 
        test_type: str,
        llm_suggested_priority: str = None
    ) -> Dict:
        """
        Calculate enhanced priority for a test case.
        
        Args:
            test_case: Test case dict with 'title', 'steps', 'expected'
            requirement: Original requirement text
            test_type: Type of test (smoke, sanity, unit, api, etc.)
            llm_suggested_priority: Original priority from LLM (optional)
            
        Returns:
            Dict with priority, confidence score, and reasoning
        """
        # Extract text for analysis
        text_to_analyze = self._extract_text(test_case, requirement)
        
        # Method 1: Keyword-based scoring
        keyword_score, keyword_priority = self._keyword_based_priority(text_to_analyze)
        
        # Method 2: Test type multiplier
        test_type_lower = test_type.lower()
        type_info = TEST_TYPE_PRIORITY.get(test_type_lower, {
            'base_priority': 'Medium',
            'multiplier': 1.0,
            'description': 'Standard testing'
        })
        
        # Method 3: LLM suggestion (if provided)
        llm_score = PRIORITY_SCORE_MAP.get(llm_suggested_priority, 5.0) if llm_suggested_priority else 5.0
        
        # Combine scores with weights
        # Keyword: 50%, Test Type: 30%, LLM: 20%
        base_score = (
            keyword_score * 0.5 +
            PRIORITY_SCORE_MAP[type_info['base_priority']] * 0.3 +
            llm_score * 0.2
        )
        
        # Apply test type multiplier
        final_score = base_score * type_info['multiplier']
        
        # Cap the score at 10.0
        final_score = min(final_score, 10.0)
        
        # Convert score to priority level
        enhanced_priority = self._score_to_priority(final_score)
        
        # Calculate confidence based on agreement
        confidence = self._calculate_confidence(
            keyword_priority, 
            type_info['base_priority'], 
            llm_suggested_priority
        )
        
        # Generate reasoning
        reasoning = self._generate_reasoning(
            enhanced_priority,
            keyword_priority,
            type_info,
            final_score,
            text_to_analyze
        )
        
        return {
            'priority': enhanced_priority,
            'confidence': confidence,
            'score': round(final_score, 2),
            'reasoning': reasoning,
            'breakdown': {
                'keyword_based': keyword_priority,
                'test_type_base': type_info['base_priority'],
                'llm_suggested': llm_suggested_priority or 'N/A',
                'keyword_score': round(keyword_score, 2),
                'type_multiplier': type_info['multiplier']
            }
        }
    
    def _extract_text(self, test_case: Dict, requirement: str) -> str:
        """Extract and combine relevant text from test case and requirement."""
        text_parts = [
            test_case.get('title', ''),
            ' '.join(test_case.get('steps', [])),
            test_case.get('expected', ''),
            requirement
        ]
        return ' '.join(text_parts).lower()
    
    def _keyword_based_priority(self, text: str) -> Tuple[float, str]:
        """
        Analyze text for priority keywords and return score + priority.
        
        Returns:
            Tuple of (score, priority_level)
        """
        # Count keyword matches
        critical_matches = sum(1 for kw in self.critical_keywords if kw in text)
        high_matches = sum(1 for kw in self.high_keywords if kw in text)
        medium_matches = sum(1 for kw in self.medium_keywords if kw in text)
        low_matches = sum(1 for kw in self.low_keywords if kw in text)
        
        # Scoring logic with emphasis on higher priority keywords
        if critical_matches >= 2:
            return 10.0, 'Critical'
        elif critical_matches >= 1:
            return 8.5, 'High'
        elif high_matches >= 3:
            return 8.0, 'High'
        elif high_matches >= 2:
            return 7.0, 'High'
        elif high_matches >= 1:
            return 6.0, 'Medium'
        elif medium_matches >= 2:
            return 5.0, 'Medium'
        elif medium_matches >= 1:
            return 4.0, 'Medium'
        elif low_matches >= 1:
            return 2.5, 'Low'
        else:
            return 4.5, 'Medium'  # Default to medium if no clear indicators
    
    def _score_to_priority(self, score: float) -> str:
        """Convert numerical score to priority level."""
        for threshold, priority in SCORE_TO_PRIORITY:
            if score >= threshold:
                return priority
        return 'Low'
    
    def _calculate_confidence(
        self, 
        keyword_priority: str, 
        type_priority: str, 
        llm_priority: str = None
    ) -> float:
        """
        Calculate confidence score based on agreement between methods.
        
        Returns:
            Confidence score between 0.0 and 1.0
        """
        priorities = [p for p in [keyword_priority, type_priority, llm_priority] if p]
        
        if not priorities:
            return 0.5
        
        # Count how many agree on the same priority
        priority_counts = {}
        for p in priorities:
            priority_counts[p] = priority_counts.get(p, 0) + 1
        
        max_agreement = max(priority_counts.values())
        total_methods = len(priorities)
        
        # Confidence = agreement ratio
        base_confidence = max_agreement / total_methods
        
        # Boost confidence if keyword and type agree
        if keyword_priority == type_priority:
            base_confidence = min(base_confidence + 0.15, 1.0)
        
        return round(base_confidence, 2)
    
    def _generate_reasoning(
        self,
        final_priority: str,
        keyword_priority: str,
        type_info: Dict,
        final_score: float,
        analyzed_text: str
    ) -> str:
        """Generate human-readable reasoning for the priority assignment."""
        reasons = []
        
        # Test type reason
        reasons.append(f"{type_info['description']} ({type_info['base_priority']} base)")
        
        # Keyword analysis reason
        critical_found = [kw for kw in self.critical_keywords if kw in analyzed_text]
        high_found = [kw for kw in self.high_keywords if kw in analyzed_text]
        
        if critical_found:
            reasons.append(f"Critical indicators: {', '.join(critical_found[:3])}")
        elif high_found:
            reasons.append(f"High-impact areas: {', '.join(high_found[:3])}")
        
        # Score-based reason
        if final_score >= 9.0:
            reasons.append("Essential for system stability")
        elif final_score >= 7.0:
            reasons.append("Important for core functionality")
        elif final_score >= 5.0:
            reasons.append("Standard feature validation")
        else:
            reasons.append("Secondary feature or enhancement")
        
        return "; ".join(reasons)
    
    def bulk_enhance_priorities(
        self,
        test_cases: List[Dict],
        requirement: str,
        test_type: str
    ) -> List[Dict]:
        """
        Enhance priorities for multiple test cases.
        
        Args:
            test_cases: List of test case dicts
            requirement: Original requirement text
            test_type: Type of test
            
        Returns:
            Updated list of test cases with enhanced priorities
        """
        enhanced_cases = []
        
        for tc in test_cases:
            # Get original LLM-suggested priority
            original_priority = tc.get('priority', 'Medium')
            
            # Calculate enhanced priority
            priority_info = self.enhance_priority(
                tc,
                requirement,
                test_type,
                original_priority
            )
            
            # Update test case with enhanced priority
            tc['priority'] = priority_info['priority']
            tc['priority_confidence'] = priority_info['confidence']
            tc['priority_score'] = priority_info['score']
            tc['priority_reasoning'] = priority_info['reasoning']
            
            enhanced_cases.append(tc)
        
        return enhanced_cases


# ============================================
# Convenience Functions
# ============================================

def enhance_test_case_priorities(
    test_cases: List[Dict],
    requirement: str,
    test_type: str
) -> List[Dict]:
    """
    Convenience function to enhance priorities for test cases.
    
    Args:
        test_cases: List of test case dicts
        requirement: Original requirement text
        test_type: Type of test
        
    Returns:
        Test cases with enhanced priorities
    """
    enhancer = PriorityEnhancer()
    return enhancer.bulk_enhance_priorities(test_cases, requirement, test_type)
