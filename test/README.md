# Chat LLM Testing with DeepEval

Simple test for evaluating the quality of KartLog's chat functionality using DeepEval.

## Quick Start

### 1. Install DeepEval (already done)
```bash
cd test
pip3 install -r requirements.txt
```

### 2. Set Your OpenAI API Key
DeepEval uses OpenAI to evaluate response quality:

```bash
export OPENAI_API_KEY="your-openai-api-key-here"
```

### 3. Run the Test
```bash
deepeval test run test_chat_deepeval.py
```

## What the Test Does

The test evaluates a single question/answer pair:

- **Question**: "What tyres do I have?"
- **Answer**: A response listing Bridgestone YDS and Vega W6 tyres
- **Evaluation**: Uses DeepEval's AnswerRelevancyMetric to score how relevant the answer is (threshold: 0.7 = 70%)

## Expected Output

When successful, you should see:
```
✅ Test passed!
Answer Relevancy Score: 0.89
Status: PASSED
```

If the score is below 0.7, the test will fail.

## Troubleshooting

**Error: "command not found: deepeval"**
- Run: `pip3 install -r requirements.txt`

**Error: "OPENAI_API_KEY environment variable"**
- Set the key: `export OPENAI_API_KEY="sk-..."`

**Error: "file must start with test_ prefix"**
- File must be named `test_*.py` (already correct)

## Extending the Test

Add more test cases by adding more functions:

```python
def test_session_query():
    test_case = LLMTestCase(
        input="What was my fastest lap?",
        actual_output="Your fastest lap was 45.2 seconds...",
        context=["Last session fastest lap: 45.2 seconds"]
    )
    metric = AnswerRelevancyMetric(threshold=0.7)
    assert_test(test_case, [metric])
```
