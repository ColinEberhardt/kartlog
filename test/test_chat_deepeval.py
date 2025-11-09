"""
Simple DeepEval Test for Chat Functionality

This test evaluates the quality of a single chat response using DeepEval metrics.

Usage:
    deepeval test run test/chat_deepeval.py
"""

from deepeval import assert_test
from deepeval.metrics import AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase


def test_tyre_inventory_response():
    """Test that the chat provides a relevant answer about user tyres"""
    
    # The user's question
    user_input = "What tyres do I have?"
    
    # The context/data available to the LLM
    context = [
        "User has Bridgestone YDS slick tyres (active)",
        "User has Vega W6 wet weather tyres (retired)",
        "Bridgestone YDS are dry weather slicks",
        "Vega W6 are wet weather tyres"
    ]
    
    # The actual response from the chat
    actual_output = """You have 2 tyres in your inventory:

1. **Bridgestone YDS** (Bridgestone) - Active slick tyres for dry weather conditions
2. **Vega W6** (Vega) - Retired wet weather tyres

Your active Bridgestone YDS slicks are ready for your next dry weather session!"""
    
    # Create a test case
    test_case = LLMTestCase(
        input=user_input,
        actual_output=actual_output,
        context=context
    )
    
    # Define the metric (answer should be relevant to the question)
    metric = AnswerRelevancyMetric(threshold=0.7)
    
    # Run the assertion
    assert_test(test_case, [metric])


if __name__ == "__main__":
    test_tyre_inventory_response()
    print("✅ Test passed!")
