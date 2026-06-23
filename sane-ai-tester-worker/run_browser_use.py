import asyncio
import os
import sys
import json
from browser_use import Agent, Browser, ChatOpenAI


# Set OpenAI API Key
# Usually this will be in the environment variables, or passed directly.
if "OPENAI_API_KEY" not in os.environ:
    os.environ["OPENAI_API_KEY"] = "YOUR_OPENAI_API_KEY" # The user should set this in their .env

async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No instruction provided"}))
        sys.exit(1)

    task_instruction = sys.argv[1]
    
    video_dir = os.path.abspath("./recordings/videos")
    os.makedirs(video_dir, exist_ok=True)

    browser = Browser(
        headless=False,
        record_video_dir=video_dir # Enabled video recording
    )

    llm = ChatOpenAI(model="gpt-4o")

    agent = Agent(
        task=task_instruction,
        llm=llm,
        browser=browser
    )

    try:
        result = await agent.run()
        
        final_result = result.final_result() if hasattr(result, 'final_result') else str(result)
        
        print(json.dumps({
            "success": True,
            "result": final_result
        }))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
    finally:
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
