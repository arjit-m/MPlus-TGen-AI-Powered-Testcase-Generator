#!/usr/bin/env python3
"""
Simple Requirement Enhancement Script for Electron IPC

This script provides a simple JSON-based interface for requirement enhancement
that works well with the Electron IPC system.
"""

import argparse
import json
import logging
from pathlib import Path
import sys

# Add parent directories to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.core import chat

# Setup basic logging to stderr so it doesn't interfere with JSON output
logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

def get_enhancement_prompt(test_category: str, test_type: str, enhancement_type: str = 'improvise') -> str:
    """Get the system prompt for requirement enhancement based on test type and enhancement type."""
    
    # Grammar-only enhancement prompt
    if enhancement_type == 'fix-grammar':
        return """Your ONLY task is to fix spelling, grammar, and punctuation errors."""
    
    # Improvise enhancement prompt (original behavior)
    base_prompt = """You are an expert Business Analyst and Test Architect specializing in requirement enhancement.

Your task is to enhance requirements to make them more suitable for generating high-quality test cases. Focus on:

ENHANCEMENT PRIORITIES:
1. **Clarity & Specificity** - Remove ambiguity, add precise details
2. **Testable Acceptance Criteria** - Define clear success/failure conditions  
3. **Context & Constraints** - Add missing business rules, validations, limits
4. **Error Scenarios** - Include what should happen when things go wrong
5. **Test-Friendly Structure** - Organize information logically for testing"""

    context_guidance = {
        ("functional", "api"): """
FOR API TESTING:
- Add specific API endpoints (e.g., GET /api/users, POST /api/login)
- Include HTTP methods, request/response formats, status codes
- Define authentication requirements and error responses
- Add validation rules for request payloads and parameters
- Include rate limiting, timeout, and performance requirements""",
        
        ("functional", "unit"): """
FOR UNIT TESTING:
- Specify exact function names, parameters, and return types
- Include business logic rules, calculations, and algorithms
- Add input validation requirements and boundary conditions
- Define mock dependencies and test data requirements
- Include exception handling and error conditions""",
        
        ("functional", "smoke"): """
FOR SMOKE TESTING:
- Define critical user workflows and happy path scenarios
- Include system startup, core features, and basic integrations
- Add user authentication flows and key business operations
- Specify success criteria for basic system operability""",
        
        ("functional", "sanity"): """
FOR SANITY TESTING:
- Focus on specific features or fixes being validated
- Include before/after behavior and regression scenarios
- Add targeted testing scope and specific change validation
- Define quick verification criteria for recent changes""",
        
        ("non-functional", "api"): """
FOR API PERFORMANCE TESTING:
- Add performance thresholds, response times, and throughput limits
- Include load scenarios, concurrent user requirements
- Define security requirements and vulnerability testing needs
- Add monitoring and observability requirements""",
        
        ("non-functional", "unit"): """
FOR UNIT PERFORMANCE TESTING:
- Include performance benchmarks and resource usage limits
- Add memory consumption and execution time thresholds
- Define scalability requirements and load behavior
- Specify reliability metrics and error recovery""",
        
        ("non-functional", "smoke"): """
FOR NON-FUNCTIONAL SMOKE TESTING:
- Add basic performance and reliability thresholds
- Include system health checks and monitoring points
- Define baseline performance and availability requirements
- Add essential security and compliance validations""",
        
        ("non-functional", "sanity"): """
FOR NON-FUNCTIONAL SANITY TESTING:
- Focus on performance impact of recent changes
- Include specific non-functional regression criteria
- Add targeted performance and reliability validation
- Define acceptable degradation thresholds"""
    }
    
    specific_context = context_guidance.get(
        (test_category.lower(), test_type.lower()),
        "- Add general testing requirements, acceptance criteria, and validation rules"
    )
    
    return f"""{base_prompt}

{specific_context}

ENHANCEMENT GUIDELINES:
- Keep the original intent and scope - do not change core functionality
- Add missing details without making assumptions about implementation
- Structure information clearly with sections, bullets, and examples
- Include specific values, formats, and constraints where helpful
- Add measurable acceptance criteria and validation rules
- Include comprehensive error handling and edge case requirements
- Make all aspects testable and verifiable

OUTPUT REQUIREMENTS:
Return ONLY the enhanced requirement text. Do NOT include explanations, metadata, headers, or comments.
The output should be a well-structured, comprehensive requirement ready for test case generation."""

def enhance_requirement(requirement_text: str, test_category: str = "functional", test_type: str = "smoke", enhancement_type: str = 'improvise') -> dict:
    """
    Enhance a requirement using AI to add missing details, clarity, and structure.
    
    Args:
        requirement_text: The original requirement text to enhance
        test_category: Test category (functional/non-functional)
        test_type: Test type (smoke/sanity/unit/api)
        enhancement_type: Type of enhancement - 'improvise' or 'fix-grammar'
    
    Returns:
        Dict containing the enhanced requirement and metadata
    """
    
    try:
        logger.info(f"🔍 Enhancement Type Received: '{enhancement_type}'")
        logger.info(f"🔍 Test Category: '{test_category}', Test Type: '{test_type}'")
        
        system_prompt = get_enhancement_prompt(test_category, test_type, enhancement_type)
        
        logger.info(f"🔍 Using prompt type: {'GRAMMAR-ONLY' if enhancement_type == 'fix-grammar' else 'IMPROVISE'}")
        
        # Different user prompts based on enhancement type
        if enhancement_type == 'fix-grammar':
            logger.info("🔍 Applying GRAMMAR-ONLY enhancement")
            user_prompt = f"""Fix ONLY spelling, grammar, and punctuation errors. DO NOT add content.

ORIGINAL TEXT:
{requirement_text.strip()}

INSTRUCTIONS:
- Fix spelling errors ONLY
- Fix grammar errors ONLY  
- Fix punctuation errors ONLY
- DO NOT add new sentences
- DO NOT add new details
- DO NOT add formatting
- DO NOT expand the content
- Keep the EXACT same structure

Return the text with only language errors corrected:"""
        else:
            logger.info("🔍 Applying IMPROVISE enhancement")
            user_prompt = f"""Please enhance this requirement for {test_category} {test_type} testing:

ORIGINAL REQUIREMENT:
{requirement_text.strip()}

ENHANCEMENT TASK:
Analyze the requirement and enhance it by:
1. Adding missing details and context needed for {test_type} testing
2. Clarifying ambiguous terms and concepts  
3. Including specific, measurable acceptance criteria
4. Adding validation rules, constraints, and business rules
5. Including comprehensive error scenarios and edge cases
6. Structuring information logically for test case generation
7. Making all aspects testable and verifiable

Enhanced Requirement:"""

        # Call the LLM
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        logger.info(f"🤖 Enhancing requirement ({enhancement_type}) for {test_category} {test_type} testing...")
        enhanced_text = chat(messages)
        
        # Calculate simple metrics
        original_words = len(requirement_text.split())
        enhanced_words = len(enhanced_text.split())
        improvement_ratio = enhanced_words / original_words if original_words > 0 else 1
        
        # Count improvement areas (heuristic based on content and enhancement type)
        improvements = 0
        if enhancement_type == 'fix-grammar':
            # For grammar fixes, count differences
            if enhanced_text != requirement_text:
                improvements = 2  # Default for grammar fixes
        else:
            # For improvise, count enhancement features
            if "acceptance criteria" in enhanced_text.lower() or "success criteria" in enhanced_text.lower():
                improvements += 1
            if "error" in enhanced_text.lower() or "failure" in enhanced_text.lower():
                improvements += 1
            if "validation" in enhanced_text.lower() or "validate" in enhanced_text.lower():
                improvements += 1
            if len(enhanced_text.split('\n')) > len(requirement_text.split('\n')):
                improvements += 1
            if enhanced_words > original_words * 1.5:
                improvements += 1
            
        return {
            "success": True,
            "enhancedRequirement": enhanced_text.strip(),
            "originalLength": len(requirement_text),
            "enhancedLength": len(enhanced_text),
            "improvementsCount": max(improvements, 2),  # At least 2 improvements
            "enhancementType": enhancement_type,
            "testCategory": test_category,
            "testType": test_type,
            "wordCount": {
                "original": original_words,
                "enhanced": enhanced_words,
                "ratio": improvement_ratio
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Enhancement failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "originalRequirement": requirement_text,
            "testCategory": test_category,
            "testType": test_type
        }

def main():
    """Main entry point for the requirement enhancement script."""
    parser = argparse.ArgumentParser(description="Enhance requirement for better test case generation")
    parser.add_argument("--input", required=True, help="Path to requirement text file")
    parser.add_argument("--category", default="functional", choices=["functional", "non-functional"], help="Test category")
    parser.add_argument("--type", default="smoke", choices=["smoke", "sanity", "unit", "api"], help="Test type")
    parser.add_argument("--enhancement-type", default="improvise", choices=["improvise", "fix-grammar"], help="Type of enhancement to apply")
    
    args = parser.parse_args()
    
    try:
        # Read input requirement
        requirement_path = Path(args.input)
        if not requirement_path.exists():
            result = {
                "success": False,
                "error": f"Requirement file not found: {requirement_path}"
            }
            print(json.dumps(result))
            sys.exit(1)
        
        requirement_text = requirement_path.read_text(encoding="utf-8").strip()
        logger.info(f"📄 Loaded requirement: {len(requirement_text)} characters")
        
        # Enhance the requirement
        result = enhance_requirement(requirement_text, args.category, args.type, args.enhancement_type)
        
        # Output JSON result to stdout
        print(json.dumps(result, indent=2))
        
        if result["success"]:
            logger.info("✅ Requirement enhancement completed successfully")
        else:
            logger.error(f"❌ Enhancement failed: {result['error']}")
            sys.exit(1)
            
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        logger.error(f"❌ Fatal error: {e}")
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()