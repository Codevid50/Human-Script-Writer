import openai
from openai import OpenAI

# Check the OpenAI version and APIStatusError
print("OpenAI version:", openai.__version__)
print("APIStatusError MRO:", openai.APIStatusError.__mro__)

# Check if there's an issue with model specification
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-whatever",  # dummy key
)

# Try to see what happens with model parameter
try:
    response = client.chat.completions.create(
        model="openrouter/free",
        messages=[{"role": "user", "content": "test"}],
        max_tokens=10,
    )
except Exception as e:
    print(f"Error type: {type(e).__name__}")
    print(f"Error: {e}")
    print(f"MRO: {type(e).__mro__}")