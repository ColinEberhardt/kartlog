import subprocess
import os
from deepeval import assert_test
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def run_chat(user_message):
    """Run the chat.js implementation via Node.js script"""
    # Get API key from environment
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable must be set")
    
    # Get the directory of this test file
    test_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(test_dir, 'run_chat.js')
    
    # Run the Node.js script
    result = subprocess.run(
        ['node', script_path, user_message, api_key],
        capture_output=True,
        text=True,
        cwd=test_dir
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"Chat script failed: {result.stderr}")
    
    # The script outputs just the response text
    return result.stdout.strip()


def test_karting_sport_identification():
    """Test that the chat correctly identifies karting/go-kart racing as its sport"""
    
    # The user's question
    user_input = "What sport can you help me with?"
    
    # Get the actual response from the real chat implementation
    actual_output = run_chat(user_input)
    
    # Create a test case
    test_case = LLMTestCase(
        input=user_input,
        actual_output=actual_output
    )
    
    # Define G-Eval metric with custom criteria
    correctness_metric = GEval(
        name="Karting Sport Correctness",
        criteria="The response must clearly indicate that the application is for karting, go-kart racing, or go-karting. It should not mention other sports.",
        evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT],
        threshold=0.8
    )
    
    # Run the assertion
    assert_test(test_case, [correctness_metric])
