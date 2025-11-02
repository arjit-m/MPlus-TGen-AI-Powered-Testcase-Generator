"""
Test Case Quality Scoring Module
===============================

This module provides AI-powered quality assessment for generated test cases.
It evaluates various quality metrics and provides actionable insights.
"""

import logging
from typing import List, Dict, Any, Tuple
from pathlib import Path
import re
import json

from .llm_client import chat
from .utils import write_json

logger = logging.getLogger(__name__)


def format_test_type(test_type: str) -> str:
    """Format test type for display, handling special cases like API.
    
    Args:
        test_type: Test type string (e.g., 'api', 'smoke', 'unit')
        
    Returns:
        Properly formatted test type (e.g., 'API', 'Smoke', 'Unit')
    """
    if test_type.lower() == 'api':
        return 'API'
    return test_type.title()


# Quality scoring prompts
QUALITY_SYSTEM_PROMPT = """You are an expert QA quality assessor. Evaluate test cases based on industry best practices and provide detailed scoring with actionable feedback.

Return your assessment as JSON with this exact structure:
{
  "overall_score": 8.5,
  "individual_scores": [
    {
      "test_id": "TC-001",
      "scores": {
        "clarity": 9.0,
        "completeness": 8.5,
        "specificity": 8.0,
        "testability": 9.0,
        "coverage": 7.5
      },
      "total_score": 8.4,
      "strengths": ["Clear step descriptions", "Specific expected results"],
      "weaknesses": ["Missing error handling", "No boundary value tests"],
      "suggestions": ["Add negative test scenarios", "Include edge cases for input validation"]
    }
  ],
  "quality_insights": {
    "coverage_gaps": ["Error handling scenarios", "Performance edge cases"],
    "missing_categories": ["Security tests", "Integration tests"],
    "recommendations": ["Add boundary value analysis", "Include negative test scenarios"],
    "strengths": ["Good happy path coverage", "Clear test descriptions"],
    "overall_feedback": "Test suite covers basic functionality well but needs more comprehensive error handling and edge case coverage."
  }
}

Quality Criteria:
- Clarity (1-10): How clear and understandable are the test steps?
- Completeness (1-10): Does the test cover all aspects of the requirement?
- Specificity (1-10): Are expected results specific and measurable?
- Testability (1-10): Can the test be executed reliably?
- Coverage (1-10): How well does it cover different scenarios?
"""

QUALITY_USER_TEMPLATE = """Assess the quality of these test cases against the given requirement:

REQUIREMENT:
{requirement_text}

TEST CASES:
{test_cases_json}

Provide detailed quality scoring and actionable improvement suggestions."""


class TestCaseQualityScorer:
    """Evaluates test case quality using AI-powered analysis."""
    
    def __init__(self, output_dir: Path = None):
        self.output_dir = output_dir or Path("outputs/quality_reports")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def score_test_cases(self, test_cases: List[Dict], requirement_text: str, 
                        test_category: str = "functional", test_type: str = "smoke") -> Dict[str, Any]:
        """
        Score test cases for quality and provide improvement suggestions.
        
        Args:
            test_cases: List of test case dictionaries
            requirement_text: Original requirement text
            test_category: Test category (functional/non-functional)
            test_type: Test type (smoke/sanity/unit/api)
            
        Returns:
            Quality assessment dictionary with scores and suggestions
        """
        logger.info("🔍 Starting test case quality assessment...")
        
        try:
            # Prepare input for LLM
            user_prompt = QUALITY_USER_TEMPLATE.format(
                requirement_text=requirement_text,
                test_cases_json=json.dumps(test_cases, indent=2)
            )
            
            messages = [
                {"role": "system", "content": QUALITY_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
            
            # Get quality assessment from LLM
            logger.info("📡 Calling LLM for quality assessment...")
            raw_response = chat(messages)
            
            # Parse the quality assessment
            quality_report = self._parse_quality_response(raw_response)
            
            # Add context-aware recommendations
            quality_report = self._enhance_with_contextual_recommendations(
                quality_report, test_category, test_type, requirement_text
            )
            
            # Add metadata
            quality_report["metadata"] = {
                "total_test_cases": len(test_cases),
                "requirement_length": len(requirement_text),
                "test_category": test_category,
                "test_type": test_type,
                "assessment_timestamp": "2025-10-27T17:15:00Z"
            }
            
            # Save detailed report
            report_file = self.output_dir / "quality_assessment.json"
            write_json(quality_report, report_file)
            logger.info(f"📊 Quality report saved to {report_file}")
            
            # Log summary
            overall_score = quality_report.get("overall_score", 0)
            logger.info(f"✅ Quality assessment complete. Overall score: {overall_score}/10")
            
            return quality_report
            
        except Exception as e:
            logger.error(f"❌ Quality assessment failed: {e}")
            return self._get_fallback_quality_report(test_cases, test_category, test_type)
    
    def _parse_quality_response(self, raw_response: str) -> Dict[str, Any]:
        """Parse LLM response into structured quality report."""
        try:
            # Try direct JSON parsing
            return json.loads(raw_response.strip())
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            # If all parsing fails, create a basic structure
            logger.warning("⚠️ Could not parse quality response, using fallback")
            return self._get_fallback_quality_report([])
    
    def _enhance_with_contextual_recommendations(self, quality_report: Dict[str, Any], 
                                               test_category: str, test_type: str, 
                                               requirement_text: str) -> Dict[str, Any]:
        """Add contextual recommendations based on test category, type, and quality scores."""
        
        individual_scores = quality_report.get("individual_scores", [])
        if not individual_scores:
            return quality_report
        
        # Calculate average scores for each metric
        avg_scores = {}
        metrics = ["clarity", "completeness", "specificity", "testability", "coverage"]
        for metric in metrics:
            scores = [score.get("scores", {}).get(metric, 0) for score in individual_scores]
            avg_scores[metric] = sum(scores) / len(scores) if scores else 0
        
        # Generate contextual recommendations
        recommendations = self._generate_contextual_recommendations(
            avg_scores, test_category, test_type, requirement_text, len(individual_scores)
        )
        
        # Update quality insights
        quality_insights = quality_report.get("quality_insights", {})
        quality_insights.update({
            "contextual_recommendations": recommendations,
            "test_context": f"{test_category.title()} {format_test_type(test_type)} Testing",
            "improvement_focus": recommendations.get("priority_areas", [])
        })
        
        quality_report["quality_insights"] = quality_insights
        return quality_report
    
    def _analyze_requirement_content(self, requirement_text: str, test_type: str, test_category: str) -> Dict[str, Any]:
        """Analyze requirement content to provide specific recommendations."""
        req_lower = requirement_text.lower()
        
        analysis = {
            "has_specific_details": False,
            "missing_elements": [],
            "specific_suggestions": [],
            "technical_gaps": [],
            "business_gaps": []
        }
        
        # Check for specific technical details based on test type
        if test_type == "api":
            api_keywords = ['endpoint', 'api', 'http', 'get', 'post', 'put', 'delete', 'json', 'xml', 'response', 'status code', 'authentication']
            analysis["has_specific_details"] = any(keyword in req_lower for keyword in api_keywords)
            
            if 'endpoint' not in req_lower and 'api' not in req_lower:
                analysis["missing_elements"].append("API endpoints")
                analysis["specific_suggestions"].append(f"Add specific API endpoints like '/api/users' or '/api/bookings' to make testing more concrete")
            
            if not any(method in req_lower for method in ['get', 'post', 'put', 'delete', 'patch']):
                analysis["missing_elements"].append("HTTP methods")
                analysis["specific_suggestions"].append(f"Specify HTTP methods (GET, POST, PUT, DELETE) for each API operation")
            
            if 'response' not in req_lower and 'return' not in req_lower:
                analysis["missing_elements"].append("Response format")
                analysis["specific_suggestions"].append(f"Define expected response formats (JSON structure, status codes, error messages)")
                
        elif test_type == "unit":
            unit_keywords = ['function', 'method', 'class', 'parameter', 'return', 'calculate', 'validate', 'process']
            analysis["has_specific_details"] = any(keyword in req_lower for keyword in unit_keywords)
            
            if not any(keyword in req_lower for keyword in ['function', 'method', 'class']):
                analysis["missing_elements"].append("Function/method names")
                analysis["specific_suggestions"].append(f"Specify exact function names like 'calculatePrice()' or 'validateEmail()'")
            
            if 'parameter' not in req_lower and 'input' not in req_lower:
                analysis["missing_elements"].append("Input parameters")
                analysis["specific_suggestions"].append(f"Define input parameters with data types and validation rules")
            
            if 'return' not in req_lower and 'output' not in req_lower:
                analysis["missing_elements"].append("Return values")
                analysis["specific_suggestions"].append(f"Specify expected return values and data types")
                
        elif test_type in ["smoke", "sanity"]:
            ui_keywords = ['page', 'button', 'field', 'form', 'click', 'enter', 'select', 'navigate']
            analysis["has_specific_details"] = any(keyword in req_lower for keyword in ui_keywords)
            
            if not any(keyword in req_lower for keyword in ['page', 'screen', 'form']):
                analysis["missing_elements"].append("UI elements")
                analysis["specific_suggestions"].append(f"Identify specific pages, forms, or UI components to be tested")
            
            if not any(keyword in req_lower for keyword in ['click', 'enter', 'select', 'navigate', 'submit']):
                analysis["missing_elements"].append("User actions")
                analysis["specific_suggestions"].append(f"Define specific user interactions like 'click Login button' or 'enter email address'")
        
        # Check for business logic details
        business_keywords = ['rule', 'condition', 'validation', 'calculation', 'workflow', 'process']
        if not any(keyword in req_lower for keyword in business_keywords):
            analysis["business_gaps"].append("Business rules not clearly defined")
            analysis["specific_suggestions"].append(f"Add business rules and validation logic to guide test scenario creation")
        
        # Check for error handling
        error_keywords = ['error', 'exception', 'fail', 'invalid', 'wrong']
        if not any(keyword in req_lower for keyword in error_keywords):
            analysis["business_gaps"].append("Error scenarios not mentioned")
            analysis["specific_suggestions"].append(f"Include error handling requirements (invalid inputs, system failures)")
        
        # Check for acceptance criteria
        if 'acceptance' not in req_lower and 'criteria' not in req_lower:
            analysis["business_gaps"].append("No acceptance criteria")
            analysis["specific_suggestions"].append(f"Add specific acceptance criteria to define when the requirement is satisfied")
        
        return analysis
    
    def _generate_contextual_recommendations(self, avg_scores: Dict[str, float], 
                                           test_category: str, test_type: str,
                                           requirement_text: str, num_tests: int) -> Dict[str, Any]:
        """Generate specific recommendations based on context and quality metrics."""
        
        recommendations = {
            "priority_areas": [],
            "clarity_improvements": [],
            "completeness_improvements": [],
            "specificity_improvements": [],
            "testability_improvements": [],
            "coverage_improvements": [],
            "requirement_enhancement_suggestions": []
        }
        
        # Analyze requirement content for specific insights
        req_analysis = self._analyze_requirement_content(requirement_text, test_type, test_category)
        req_length = len(requirement_text)
        req_words = len(requirement_text.split())
        
        # Priority areas based on lowest scores
        weak_areas = [(metric, score) for metric, score in avg_scores.items() if score < 7.0]
        weak_areas.sort(key=lambda x: x[1])  # Sort by score, lowest first
        recommendations["priority_areas"] = [area[0] for area in weak_areas[:3]]
        
        # Add requirement-specific suggestions first
        recommendations["requirement_enhancement_suggestions"].extend(req_analysis["specific_suggestions"])
        
        # Context-specific recommendations
        test_context = f"{test_category}_{test_type}"
        
        # Clarity improvements based on requirement analysis
        if avg_scores["clarity"] < 7.0:
            # Add requirement-specific clarity suggestions
            if "API endpoints" in req_analysis["missing_elements"]:
                recommendations["clarity_improvements"].append("Define specific API endpoints in the requirement (e.g., '/api/users/{id}')")
            
            if "HTTP methods" in req_analysis["missing_elements"]:
                recommendations["clarity_improvements"].append("Specify HTTP methods for each API operation (GET, POST, PUT, DELETE)")
            
            if "Function/method names" in req_analysis["missing_elements"]:
                recommendations["clarity_improvements"].append("Include exact function or method names in the requirement")
            
            if "UI elements" in req_analysis["missing_elements"]:
                recommendations["clarity_improvements"].append("Specify UI elements like form fields, buttons, and page names")
            
            # Generic clarity tips by context
            clarity_tips = {
                "functional_api": [
                    "Use consistent API terminology and naming conventions",
                    "Include request/response examples with actual data",
                    "Define authentication and authorization requirements clearly"
                ],
                "functional_unit": [
                    "Use precise technical language for function behavior",
                    "Include example inputs and outputs with actual values",
                    "Define edge cases and boundary conditions clearly"
                ],
                "functional_smoke": [
                    "Focus on end-to-end user workflows with clear navigation steps",
                    "Use business language that stakeholders can understand",
                    "Include specific UI elements and user actions"
                ],
                "functional_sanity": [
                    "Clearly state what specific functionality is being regression tested",
                    "Reference the recent changes or fixes being validated",
                    "Include before/after behavior expectations"
                ]
            }
            recommendations["clarity_improvements"] = clarity_tips.get(test_context, [
                "Use more descriptive test step language",
                "Include specific element names and actions",
                "Avoid ambiguous terms like 'click something' or 'verify result'"
            ])
        
        # Completeness improvements based on requirement analysis
        if avg_scores["completeness"] < 7.0:
            # Add requirement-specific completeness suggestions
            if "Response format" in req_analysis["missing_elements"]:
                recommendations["completeness_improvements"].append("Define expected API response formats and data structures")
            
            if "Input parameters" in req_analysis["missing_elements"]:
                recommendations["completeness_improvements"].append("Specify all input parameters with validation rules and constraints")
            
            if "Return values" in req_analysis["missing_elements"]:
                recommendations["completeness_improvements"].append("Define expected return values and their data types")
            
            if "User actions" in req_analysis["missing_elements"]:
                recommendations["completeness_improvements"].append("Include all user interaction steps and navigation flows")
            
            if "Error scenarios not mentioned" in req_analysis["business_gaps"]:
                recommendations["completeness_improvements"].append("Add error handling scenarios and failure conditions")
            
            if "Business rules not clearly defined" in req_analysis["business_gaps"]:
                recommendations["completeness_improvements"].append("Include business validation rules and constraints")
            
            # Generic completeness tips by context
            completeness_tips = {
                "functional_api": [
                    "Include authentication/authorization requirements",
                    "Add request/response validation scenarios",
                    "Cover different payload sizes and edge cases"
                ],
                "functional_unit": [
                    "Add boundary value and edge case testing",
                    "Include null, empty, and invalid input scenarios",
                    "Cover exception handling and error conditions"
                ],
                "functional_smoke": [
                    "Include end-to-end critical path workflows", 
                    "Add basic CRUD operations verification",
                    "Cover system startup and core functionality"
                ],
                "functional_sanity": [
                    "Focus on recently changed functionality",
                    "Include regression scenarios for modified areas",
                    "Cover integration points affected by changes"
                ]
            }
            recommendations["completeness_improvements"].extend(completeness_tips.get(test_context, [
                "Add prerequisite and setup steps",
                "Include teardown and cleanup procedures", 
                "Test both positive and negative scenarios"
            ]))
        
        # Specificity improvements based on requirement analysis  
        if avg_scores["specificity"] < 7.0:
            # Add requirement-specific specificity suggestions
            if "No acceptance criteria" in req_analysis["business_gaps"]:
                recommendations["specificity_improvements"].append("Add measurable acceptance criteria with specific success/failure conditions")
            
            # Analyze requirement content for vague terms
            vague_terms = ['maybe', 'should', 'could', 'might', 'appropriate', 'suitable', 'proper', 'good', 'bad']
            found_vague = [term for term in vague_terms if term in requirement_text.lower()]
            if found_vague:
                recommendations["specificity_improvements"].append(f"Replace vague terms ({', '.join(found_vague)}) with specific, measurable criteria")
            
            # Generic specificity tips by context
            specificity_tips = {
                "functional_api": [
                    "Include exact JSON schema structures with field names and types",
                    "Specify precise HTTP status codes (200, 201, 400, 401, 404, 500)",
                    "Define exact response time thresholds (e.g., < 200ms)"
                ],
                "functional_unit": [
                    "Include exact expected return values with sample data",
                    "Specify precise error messages and exception class names", 
                    "Define exact computational formulas and algorithms"
                ],
                "functional_smoke": [
                    "Define measurable pass/fail criteria for each workflow step",
                    "Specify exact system response benchmarks (load time, availability)",
                    "Include quantifiable performance and stability thresholds"
                ],
                "functional_sanity": [
                    "Specify exact expected behavior changes from previous version",
                    "Define precise validation criteria with before/after comparisons",
                    "Include specific test inputs and their expected outputs"
                ]
            }
            recommendations["specificity_improvements"].extend(specificity_tips.get(test_context, [
                "Replace vague terms with specific, measurable criteria",
                "Include exact expected values and error messages", 
                "Add quantifiable success/failure conditions"
            ]))
        
        # Testability improvements  
        if avg_scores["testability"] < 7.0:
            testability_tips = {
                "functional_api": [
                    "Include sample request payloads and cURL commands",
                    "Provide test data setup scripts and database states",
                    "Add API client configuration and authentication setup"
                ],
                "functional_unit": [
                    "Include mock object setup and test fixture creation",
                    "Provide sample input data and expected outputs",
                    "Add test environment configuration details"
                ],
                "functional_smoke": [
                    "Include test user credentials and baseline data setup",
                    "Provide system configuration and deployment environment details",
                    "Add health check endpoints and system status validation"
                ],
                "functional_sanity": [
                    "Include specific change details and affected components",
                    "Provide before/after comparison data for validation",
                    "Add focused test data that targets the modified functionality"
                ]
            }
            recommendations["testability_improvements"] = testability_tips.get(test_context, [
                "Add detailed setup and prerequisite information",
                "Include test data and environment configuration",
                "Provide clear execution steps that can be automated"
            ])
        
        # Coverage improvements
        if avg_scores["coverage"] < 7.0:
            coverage_tips = {
                "functional_api": [
                    "Add performance testing under different load conditions",
                    "Include security testing for injection and authentication",
                    "Test API versioning and backward compatibility"
                ],
                "functional_unit": [
                    "Add concurrent execution and thread safety tests",
                    "Include memory usage and performance benchmarks",
                    "Test integration with external dependencies and services"
                ],
                "functional_smoke": [
                    "Add cross-platform and browser compatibility validation",
                    "Include basic performance and load threshold checks",
                    "Test core integrations and third-party service connections"
                ],
                "functional_sanity": [
                    "Add boundary testing around the specific change area",
                    "Include related functionality that might be impacted",
                    "Test edge cases specific to the modified component"
                ]
            }
            recommendations["coverage_improvements"] = coverage_tips.get(test_context, [
                "Add edge cases and boundary conditions",
                "Include error scenarios and exception handling",
                "Test integration points and dependencies"
            ])
        
        # Requirement enhancement suggestions
        if req_length < 200:
            recommendations["requirement_enhancement_suggestions"].append(
                "Requirement is quite brief. Consider adding more specific details about expected behavior, constraints, and acceptance criteria."
            )
        
        if req_words < 30:
            recommendations["requirement_enhancement_suggestions"].append(
                "Add more context about user roles, business rules, and system interactions."
            )
        
        if not req_analysis["has_specific_details"] and test_type == "api":
            recommendations["requirement_enhancement_suggestions"].append(
                "For API testing, include specific endpoints, HTTP methods, request/response formats, and authentication requirements."
            )
        
        if not req_analysis["has_specific_details"] and test_type == "unit":
            recommendations["requirement_enhancement_suggestions"].append(
                "For unit testing, specify function names, input/output parameters, data types, and business logic rules."
            )
        
        if "error" not in requirement_text.lower() and "exception" not in requirement_text.lower():
            recommendations["requirement_enhancement_suggestions"].append(
                "Include error handling requirements and expected system behavior during failure scenarios."
            )
        
        return recommendations

    def _get_fallback_quality_report(self, test_cases: List[Dict], 
                                   test_category: str = "functional", 
                                   test_type: str = "smoke") -> Dict[str, Any]:
        """Generate a basic quality report when LLM assessment fails."""
        individual_scores = []
        
        for i, test_case in enumerate(test_cases):
            test_id = test_case.get("id", f"TC-{i+1:03d}")
            
            # Simple heuristic scoring
            clarity_score = self._score_clarity(test_case)
            completeness_score = self._score_completeness(test_case)
            specificity_score = self._score_specificity(test_case)
            testability_score = self._score_testability(test_case)
            coverage_score = 7.0  # Default coverage score
            
            total_score = (clarity_score + completeness_score + specificity_score + 
                          testability_score + coverage_score) / 5
            
            individual_scores.append({
                "test_id": test_id,
                "scores": {
                    "clarity": clarity_score,
                    "completeness": completeness_score,
                    "specificity": specificity_score,
                    "testability": testability_score,
                    "coverage": coverage_score
                },
                "total_score": round(total_score, 1),
                "strengths": ["Basic test structure present"],
                "weaknesses": ["Limited assessment available"],
                "suggestions": ["Review test completeness", "Add more specific assertions"]
            })
        
        overall_score = sum(score["total_score"] for score in individual_scores) / len(individual_scores) if individual_scores else 6.0
        
        # Generate contextual recommendations for fallback
        avg_scores = {
            "clarity": sum(s["scores"]["clarity"] for s in individual_scores) / len(individual_scores) if individual_scores else 6.0,
            "completeness": sum(s["scores"]["completeness"] for s in individual_scores) / len(individual_scores) if individual_scores else 6.0,
            "specificity": sum(s["scores"]["specificity"] for s in individual_scores) / len(individual_scores) if individual_scores else 6.0,
            "testability": sum(s["scores"]["testability"] for s in individual_scores) / len(individual_scores) if individual_scores else 6.0,
            "coverage": sum(s["scores"]["coverage"] for s in individual_scores) / len(individual_scores) if individual_scores else 6.0,
        }
        
        contextual_recs = self._generate_contextual_recommendations(
            avg_scores, test_category, test_type, "Basic requirement", len(individual_scores)
        )
        
        return {
            "overall_score": round(overall_score, 1),
            "individual_scores": individual_scores,
            "quality_insights": {
                "coverage_gaps": ["Detailed analysis not available"],
                "missing_categories": ["Assessment limited"],
                "recommendations": ["Run full quality assessment", "Review test coverage"],
                "strengths": ["Basic test structure"],
                "overall_feedback": "Basic quality assessment completed. For detailed analysis, ensure LLM service is available.",
                "contextual_recommendations": contextual_recs,
                "test_context": f"{test_category.title()} {format_test_type(test_type)} Testing"
            }
        }
    
    def _score_clarity(self, test_case: Dict) -> float:
        """Score test case clarity based on step descriptions."""
        steps = test_case.get("steps", [])
        if not steps:
            return 3.0
        
        total_length = sum(len(str(step)) for step in steps)
        avg_length = total_length / len(steps)
        
        # Longer, more descriptive steps generally indicate better clarity
        if avg_length > 50:
            return 8.5
        elif avg_length > 30:
            return 7.0
        elif avg_length > 15:
            return 6.0
        else:
            return 4.0
    
    def _score_completeness(self, test_case: Dict) -> float:
        """Score test case completeness based on required fields."""
        required_fields = ["title", "steps", "expected"]
        present_fields = sum(1 for field in required_fields if test_case.get(field))
        
        base_score = (present_fields / len(required_fields)) * 10
        
        # Bonus for additional fields
        if test_case.get("priority"):
            base_score += 0.5
        if test_case.get("preconditions"):
            base_score += 0.5
        
        return min(base_score, 10.0)
    
    def _score_specificity(self, test_case: Dict) -> float:
        """Score test case specificity based on expected results."""
        expected = test_case.get("expected", "")
        if not expected:
            return 2.0
        
        # Look for specific assertions
        specific_indicators = [
            "should display", "should show", "should redirect",
            "error message", "success message", "specific value",
            "status code", "response contains"
        ]
        
        specificity_count = sum(1 for indicator in specific_indicators 
                               if indicator.lower() in expected.lower())
        
        base_score = min(specificity_count * 2 + 5, 10.0)
        return base_score
    
    def _score_testability(self, test_case: Dict) -> float:
        """Score how easily the test can be executed."""
        steps = test_case.get("steps", [])
        if not steps:
            return 3.0
        
        # Look for actionable verbs
        actionable_verbs = [
            "click", "enter", "select", "navigate", "verify",
            "check", "validate", "confirm", "submit", "open"
        ]
        
        actionable_count = 0
        for step in steps:
            step_str = str(step).lower()
            actionable_count += sum(1 for verb in actionable_verbs if verb in step_str)
        
        # Higher ratio of actionable steps = better testability
        testability_ratio = actionable_count / len(steps) if steps else 0
        return min(testability_ratio * 10 + 5, 10.0)
    
    def get_quality_summary(self, quality_report: Dict[str, Any]) -> str:
        """Generate a human-readable quality summary."""
        overall_score = quality_report.get("overall_score", 0)
        individual_scores = quality_report.get("individual_scores", [])
        insights = quality_report.get("quality_insights", {})
        
        summary_lines = [
            f"📊 Overall Quality Score: {overall_score}/10",
            f"📝 Total Test Cases: {len(individual_scores)}",
            ""
        ]
        
        # Score distribution
        if individual_scores:
            high_quality = sum(1 for score in individual_scores if score["total_score"] >= 8.0)
            medium_quality = sum(1 for score in individual_scores if 6.0 <= score["total_score"] < 8.0)
            low_quality = sum(1 for score in individual_scores if score["total_score"] < 6.0)
            
            summary_lines.extend([
                "🎯 Quality Distribution:",
                f"  🟢 High Quality (8.0+): {high_quality} tests",
                f"  🟡 Medium Quality (6.0-7.9): {medium_quality} tests", 
                f"  🔴 Low Quality (<6.0): {low_quality} tests",
                ""
            ])
        
        # Key insights
        recommendations = insights.get("recommendations", [])
        if recommendations:
            summary_lines.extend([
                "💡 Key Recommendations:",
                *[f"  • {rec}" for rec in recommendations[:3]],
                ""
            ])
        
        # Coverage gaps
        coverage_gaps = insights.get("coverage_gaps", [])
        if coverage_gaps:
            summary_lines.extend([
                "⚠️ Coverage Gaps:",
                *[f"  • {gap}" for gap in coverage_gaps[:3]],
                ""
            ])
        
        return "\n".join(summary_lines)


def score_test_cases(test_cases: List[Dict], requirement_text: str, 
                    output_dir: Path = None, test_category: str = "functional",
                    test_type: str = "smoke") -> Dict[str, Any]:
    """
    Convenience function to score test cases.
    
    Args:
        test_cases: List of test case dictionaries
        requirement_text: Original requirement text
        output_dir: Directory to save quality reports
        test_category: Test category (functional/non-functional)
        test_type: Test type (smoke/sanity/unit/api)
        
    Returns:
        Quality assessment dictionary
    """
    scorer = TestCaseQualityScorer(output_dir)
    return scorer.score_test_cases(test_cases, requirement_text, test_category, test_type)