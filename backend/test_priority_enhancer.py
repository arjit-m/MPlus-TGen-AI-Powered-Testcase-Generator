"""
Test Priority Enhancer

Quick test to verify the priority enhancement system works correctly.
"""

from src.core.priority_enhancer import PriorityEnhancer, enhance_test_case_priorities


def test_critical_priority():
    """Test that payment/security tests get Critical priority"""
    enhancer = PriorityEnhancer()
    
    test_case = {
        'id': 'TC-001',
        'title': 'Test payment transaction processing',
        'steps': ['Navigate to checkout', 'Enter credit card details', 'Complete payment'],
        'expected': 'Payment processed successfully',
        'priority': 'Medium'  # LLM suggested Medium
    }
    
    requirement = 'Process secure payment transactions for user purchases'
    
    result = enhancer.enhance_priority(test_case, requirement, 'smoke', 'Medium')
    
    print("=" * 60)
    print("TEST: Critical Priority Detection")
    print("=" * 60)
    print(f"Original Priority: {test_case['priority']}")
    print(f"Enhanced Priority: {result['priority']}")
    print(f"Confidence: {result['confidence']}")
    print(f"Score: {result['score']}")
    print(f"Reasoning: {result['reasoning']}")
    print(f"Breakdown: {result['breakdown']}")
    print()
    
    assert result['priority'] in ['Critical', 'High'], f"Expected Critical/High but got {result['priority']}"
    print("✅ Test passed: Payment test correctly prioritized as Critical/High\n")


def test_high_priority():
    """Test that core features get High priority"""
    enhancer = PriorityEnhancer()
    
    test_case = {
        'id': 'TC-002',
        'title': 'Test user search functionality',
        'steps': ['Enter search term', 'Click search button', 'View results'],
        'expected': 'Search results displayed correctly',
        'priority': 'Low'  # LLM suggested Low
    }
    
    requirement = 'Users should be able to search for products and view relevant results'
    
    result = enhancer.enhance_priority(test_case, requirement, 'functional', 'Low')
    
    print("=" * 60)
    print("TEST: High Priority Detection")
    print("=" * 60)
    print(f"Original Priority: {test_case['priority']}")
    print(f"Enhanced Priority: {result['priority']}")
    print(f"Confidence: {result['confidence']}")
    print(f"Score: {result['score']}")
    print(f"Reasoning: {result['reasoning']}")
    print(f"Breakdown: {result['breakdown']}")
    print()
    
    assert result['priority'] in ['High', 'Medium'], f"Expected High/Medium but got {result['priority']}"
    print("✅ Test passed: Search test correctly prioritized as High/Medium\n")


def test_smoke_type_boost():
    """Test that smoke tests get priority boost"""
    enhancer = PriorityEnhancer()
    
    test_case = {
        'id': 'TC-003',
        'title': 'Verify application launches',
        'steps': ['Open application', 'Check homepage loads'],
        'expected': 'Homepage displayed',
        'priority': 'Medium'
    }
    
    requirement = 'Application should launch and display homepage'
    
    # Smoke test should boost priority
    result_smoke = enhancer.enhance_priority(test_case, requirement, 'smoke', 'Medium')
    
    # Regular functional test
    result_functional = enhancer.enhance_priority(test_case, requirement, 'functional', 'Medium')
    
    print("=" * 60)
    print("TEST: Test Type Priority Boost")
    print("=" * 60)
    print(f"Smoke Test Priority: {result_smoke['priority']} (Score: {result_smoke['score']})")
    print(f"Functional Test Priority: {result_functional['priority']} (Score: {result_functional['score']})")
    print()
    
    assert result_smoke['score'] > result_functional['score'], "Smoke test should have higher score"
    print("✅ Test passed: Smoke tests get higher priority than functional\n")


def test_bulk_enhancement():
    """Test bulk enhancement of multiple test cases"""
    
    # Use separate requirements for each test case for better accuracy
    test_cases_with_requirements = [
        {
            'test_case': {
                'id': 'TC-001',
                'title': 'Login with valid credentials',
                'steps': ['Enter username', 'Enter password', 'Click login'],
                'expected': 'User logged in successfully',
                'priority': 'Medium'
            },
            'requirement': 'User should be able to log in with username and password'
        },
        {
            'test_case': {
                'id': 'TC-002',
                'title': 'Change button color on hover',
                'steps': ['Hover over button'],
                'expected': 'Button color changes',
                'priority': 'Medium'
            },
            'requirement': 'Button should change color when user hovers over it'
        },
        {
            'test_case': {
                'id': 'TC-003',
                'title': 'Process credit card payment',
                'steps': ['Enter card details', 'Submit payment'],
                'expected': 'Payment successful',
                'priority': 'Medium'
            },
            'requirement': 'System should process credit card payments securely'
        }
    ]
    
    enhancer = PriorityEnhancer()
    
    print("=" * 60)
    print("TEST: Bulk Enhancement")
    print("=" * 60)
    
    enhanced = []
    for item in test_cases_with_requirements:
        tc = item['test_case']
        req = item['requirement']
        result = enhancer.enhance_priority(tc, req, 'smoke', tc['priority'])
        
        tc['priority'] = result['priority']
        tc['priority_score'] = result['score']
        tc['priority_confidence'] = result['confidence']
        tc['priority_reasoning'] = result['reasoning']
        
        enhanced.append(tc)
        
        print(f"{tc['id']}: {tc['title']}")
        print(f"  Priority: {tc['priority']} (Score: {tc['priority_score']})")
        print(f"  Confidence: {tc['priority_confidence']}")
        print(f"  Reasoning: {tc['priority_reasoning']}")
        print()
    
    # Login should be high priority (authentication)
    assert enhanced[0]['priority'] == 'High', f"Login should be high priority, got {enhanced[0]['priority']}"
    
    # Button color should be lower priority than login (cosmetic)
    assert enhanced[1]['priority_score'] < enhanced[0]['priority_score'], "Cosmetic change should have lower score than login"
    
    # Payment should be high priority (financial transaction)
    assert enhanced[2]['priority'] == 'High', f"Payment should be high priority, got {enhanced[2]['priority']}"
    
    print("✅ Test passed: Bulk enhancement correctly prioritizes different scenarios\n")


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("PRIORITY ENHANCER TEST SUITE")
    print("=" * 60 + "\n")
    
    try:
        test_critical_priority()
        test_high_priority()
        test_smoke_type_boost()
        test_bulk_enhancement()
        
        print("=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        print("\nPriority enhancement system is working correctly.")
        print("The system uses:")
        print("  • Keyword analysis (50% weight)")
        print("  • Test type multipliers (30% weight)")
        print("  • LLM suggestions (20% weight)")
        print("\nConfidence scores indicate agreement between methods.")
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
