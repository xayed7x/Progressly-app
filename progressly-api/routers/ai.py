import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from dependencies import get_current_user
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlmodel import Session, select, func
from database import get_session, get_db_session
from models import LoggedActivity, Conversation, Message, Goal, DailyTarget
from datetime import datetime, timedelta
from sqlalchemy.orm import selectinload
from uuid import UUID, uuid4

# Import the modern, correct Google GenAI SDK and its types module.
# FACT: Our diagnostic proved 'genai' and 'genai.types' exist.
try:
    from google import genai
    from google.genai import types
except ImportError:
    raise RuntimeError("The 'google-genai' library is not installed. Please run 'pip install -r requirements.txt'.")

# --- Configuration ---
router = APIRouter()
try:
    client = genai.Client()
except Exception as e:
    raise RuntimeError(f"Failed to initialize Google GenAI Client. Is GEMINI_API_KEY set? Error: {e}")

# --- Pydantic Models ---
class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message author, e.g., 'user' or 'ai'")
    content: str = Field(..., description="Message content")

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="Conversation history")

class ChatHistoryResponse(BaseModel):
    conversation_id: UUID
    messages: List[ChatMessage]

# --- Helper Functions ---
def format_activities_for_prompt(activities: List[LoggedActivity]) -> str:
    """
    Formats a list of LoggedActivity objects from the last 3 days into a human-readable string for the AI prompt.
    Groups activities by day (Today, Yesterday, Two Days Ago).
    """
    if not activities:
        return "The user has not logged any activities in the last three days."
    
    # Get today's date for comparison
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    two_days_ago = today - timedelta(days=2)
    
    # Group activities by day
    activities_by_day = {
        "Today": [],
        "Yesterday": [],
        "Two Days Ago": []
    }
    
    for activity in activities:
        # Extract the date from activity_date (which is a datetime)
        activity_date = activity.activity_date.date()
        
        # Format start time (e.g., "02:30 PM")
        start_time_str = activity.start_time.strftime("%I:%M %p")
        
        # Safely get category name from the relationship, with a fallback
        category_name = activity.category_rel.name if activity.category_rel else "Uncategorized"
        
        # Calculate duration if both start and end times are present
        duration_str = ""
        if activity.start_time and activity.end_time:
            # Convert time objects to datetime for calculation
            start_dt = datetime.combine(datetime.today().date(), activity.start_time)
            end_dt = datetime.combine(datetime.today().date(), activity.end_time)
            
            # Handle activities that cross midnight
            if end_dt < start_dt:
                end_dt += timedelta(days=1)
            
            duration = end_dt - start_dt
            duration_minutes = int(duration.total_seconds() / 60)
            
            if duration_minutes >= 60:
                hours = duration_minutes // 60
                minutes = duration_minutes % 60
                duration_str = f" (Duration: {hours}h {minutes}min)"
            else:
                duration_str = f" (Duration: {duration_minutes}min)"
        
        # Build the formatted line
        formatted_line = f"- {activity.activity_name} [{category_name}] at {start_time_str}{duration_str}"
        
        # Append to the correct day's list
        if activity_date == today:
            activities_by_day["Today"].append(formatted_line)
        elif activity_date == yesterday:
            activities_by_day["Yesterday"].append(formatted_line)
        elif activity_date == two_days_ago:
            activities_by_day["Two Days Ago"].append(formatted_line)
    
    # Build the final formatted string with day headers
    result_sections = []
    
    for day_label in ["Today", "Yesterday", "Two Days Ago"]:
        day_activities = activities_by_day[day_label]
        if day_activities:
            section = f"--- {day_label}'s Activities ---\n" + "\n".join(day_activities)
            result_sections.append(section)
        else:
            result_sections.append(f"--- {day_label}'s Activities ---\nNo activities logged.")
    
    return "\n\n".join(result_sections)

def format_goals_for_prompt(goals: List[Goal]) -> str:
    """
    Formats a list of Goal objects into a human-readable string for the AI prompt.
    """
    if not goals:
        return "The user has not set any goals yet."
    
    goal_lines = []
    for goal in goals:
        status_emoji = "✅" if goal.completed else "🎯"
        goal_lines.append(f"{status_emoji} {goal.title}")
    
    return "--- USER'S GOALS ---\n" + "\n".join(goal_lines)

def format_daily_targets_for_prompt(targets: List[DailyTarget]) -> str:
    """
    Formats a list of DailyTarget objects into a human-readable string for the AI prompt.
    """
    if not targets:
        return "The user has not set any daily time allocation targets yet."
    
    target_lines = []
    for target in targets:
        target_lines.append(f"- {target.category_name}: {target.target_hours} hours/day")
    
    return "--- USER'S DAILY TIME TARGETS ---\n" + "\n".join(target_lines)

# --- Streaming Logic ---
async def stream_generator(
    chat_history: List[ChatMessage], 
    activities_context: str, 
    goals_context: str,
    targets_context: str,
    conversation_id: UUID, 
    user_id: UUID
):
    """
    Stream responses from Gemini with context about user's activities, goals, and daily targets.
    Uses atomic database transactions for resilience.
    """
    full_ai_response_content = ""
    try:
        # --- New System Prompt ---
        system_prompt = """
SYSTEM PROMPT: Your Identity and Rules
1. Your Persona:
Your name is Progresso.
You are a supportive, encouraging, and insightful personal productivity coach.
Your tone is calm, positive, and data-driven. You celebrate wins and gently suggest improvements.
You have access to the user's logged activities, goals, and daily time allocation targets.

2. Your Coaching Approach:
- Analyze the user's activity patterns to identify productivity trends
- Compare actual time spent vs. daily targets to provide actionable feedback
- Help users achieve their goals by suggesting time allocation strategies
- Identify time-wasting patterns and suggest improvements
- Celebrate progress and provide encouragement
- When calculating time: CAREFULLY compute the duration between start_time and end_time for each activity
- Sum up all durations for activities in the same category to get total time spent
- Be PRECISE with your calculations - show your math when asked about hours worked

3. Your Output Formatting:
You MUST format all of your responses using Markdown.
You MUST use lists, bold text (**word**), and italics (*word*) to make your insights clear and easy to read.
You MUST tastefully use emojis to add encouragement and visual appeal. Focus on these themes: 🌱 (growth), 🎯 (focus), 💪 (achievement), ✨ (insights), 🤔 (reflection), ⏰ (time management).

4. Your Behavioral Guardrails (Non-Negotiable):
Subject Matter: You MUST refuse to answer any questions that are not directly related to the user's productivity, time management, goal setting, or the activity/goal data provided. If asked about general knowledge, history, trivia, science, etc., you MUST politely decline and steer the conversation back to their progress.
Identity: You MUST NOT reveal that you are a language model, an AI, or that you were trained by Google. You are Progresso, a personal coach.
Creator Inquiry: If a user asks who created you or who you are, you MUST respond with the exact phrase: "I was created by Zayed bin Hamid, a passionate developer focused on helping people achieve their goals."
"""
        
        # Extract the user's most recent message
        user_prompt = ""
        if chat_history:
            # Get the last message from the user
            for msg in reversed(chat_history):
                if msg.role.lower() in ("user", "human"):
                    user_prompt = msg.content
                    break
        
        # Construct the final prompt for the model
        meta_prompt = (
            f"{system_prompt}\n\n"
            f"--- USER'S ACTIVITY DATA (LAST 3 DAYS) ---\n"
            f"{activities_context}\n\n"
            f"{goals_context}\n\n"
            f"{targets_context}\n\n"
            f"--- USER'S QUESTION ---\n"
            f"{user_prompt}"
        )
        
        # Make a single, direct call to generate_content_stream with the meta-prompt
        contents = [
            types.Content(
                role="user",
                parts=[types.Part(text=meta_prompt)],
            )
        ]
        
        # Configure generation parameters for complete responses
        generation_config = types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=2048,
        )
        
        # Initiate the streaming generation call with stable model
        stream = client.models.generate_content_stream(
            model="models/gemini-2.5-flash",
            contents=contents,
            config=generation_config
        )

        # Track what we've already sent to avoid duplicates
        chunk_count = 0
        
        for chunk in stream:
            chunk_count += 1
            chunk_text = getattr(chunk, "text", None)
            if chunk_text is not None:
                full_ai_response_content += chunk_text
                yield chunk_text.encode("utf-8")
        
        print(f"DEBUG: Stream completed. Total chunks: {chunk_count}, Total length: {len(full_ai_response_content)}")

    except Exception as e:
        error_message = f"Error during streaming with Gemini API: {e}"
        print(f"DEBUG: Gemini API Error: {type(e).__name__}: {e}")
        yield error_message.encode("utf-8")
    finally:
        # Save the AI's response using a fresh, atomic database transaction
        # This prevents connection issues during long-running streams
        if full_ai_response_content:
            try:
                with get_db_session() as db:
                    ai_message = Message(
                        conversation_id=conversation_id,
                        user_id=user_id,
                        role="assistant",
                        content=full_ai_response_content
                    )
                    db.add(ai_message)
                    # Commit happens automatically in the context manager
            except Exception as save_error:
                print(f"ERROR: Failed to save AI message: {save_error}")

# --- API Endpoints ---
@router.get("/chat/history", response_model=Optional[ChatHistoryResponse])
async def get_chat_history(
    user_id: str = Depends(get_current_user)
):
    """
    Fetches the most recent chat conversation for the authenticated user.
    Uses atomic transaction for resilience.
    """
    try:
        user_uuid = UUID(user_id)
        
        with get_db_session() as db:
            # Query for the most recent conversation with eager loading
            conversation = db.exec(
                select(Conversation)
                .where(Conversation.user_id == user_uuid)
                .order_by(Conversation.created_at.desc())
                .options(selectinload(Conversation.messages))
            ).first()

            if not conversation:
                return None

            # Sort messages by created_at to ensure chronological order
            sorted_messages = sorted(conversation.messages, key=lambda msg: msg.created_at)
            
            return ChatHistoryResponse(
                conversation_id=conversation.id,
                messages=[ChatMessage(role=msg.role, content=msg.content) for msg in sorted_messages]
            )
    except Exception as e:
        print(f"ERROR in get_chat_history: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching chat history."
        )

@router.post("/chat")
async def stream_chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Receives chat history and streams back the AI's response, persisting messages.
    Uses atomic database transactions for maximum resilience.
    """
    try:
        user_uuid = UUID(user_id)
        
        # Step 1: Find or create conversation and save user message in a single atomic transaction
        conversation_id = None
        with get_db_session() as db:
            # Look for the most recent conversation within the last 3 days
            three_days_ago = datetime.utcnow() - timedelta(days=3)
            
            conversation = db.exec(
                select(Conversation)
                .where(
                    Conversation.user_id == user_uuid,
                    Conversation.created_at >= three_days_ago
                )
                .order_by(Conversation.created_at.desc())
            ).first()

            if not conversation:
                # Create a new conversation if none found
                conversation = Conversation(user_id=user_uuid)
                db.add(conversation)
                db.flush()  # Get the ID without committing yet
            
            conversation_id = conversation.id
            
            # Save user message in the same transaction
            if request.messages:
                user_message_content = request.messages[-1].content
                user_message = Message(
                    conversation_id=conversation_id,
                    user_id=user_uuid,
                    role="user",
                    content=user_message_content
                )
                db.add(user_message)
            # Transaction commits automatically here

        # Step 2: Fetch context data in a separate, read-only transaction
        with get_db_session() as db:
            now = datetime.utcnow()
            three_days_ago_datetime = now - timedelta(days=3)
            
            # Fetch activities with eager loading to prevent N+1 queries
            activities = db.exec(
                select(LoggedActivity)
                .options(selectinload(LoggedActivity.category_rel))
                .where(
                    LoggedActivity.user_id == user_id,
                    LoggedActivity.activity_date >= three_days_ago_datetime
                )
            ).all()
            
            # Fetch goals
            goals = db.exec(select(Goal).where(Goal.user_id == user_id)).all()
            
            # Fetch daily targets
            targets = db.exec(select(DailyTarget).where(DailyTarget.user_id == user_id)).all()
            
            # Format all context for the AI prompt
            activities_context = format_activities_for_prompt(activities)
            goals_context = format_goals_for_prompt(goals)
            targets_context = format_daily_targets_for_prompt(targets)
        
        # Step 3: Create streaming response (AI message saved in stream_generator's finally block)
        response = StreamingResponse(
            stream_generator(
                request.messages, 
                activities_context, 
                goals_context, 
                targets_context, 
                conversation_id, 
                user_uuid
            ), 
            media_type="text/plain; charset=utf-8"
        )
        
        # Disable proxy buffering for true streaming
        response.headers["X-Accel-Buffering"] = "no"
        response.headers["Cache-Control"] = "no-cache"
        
        return response
        
    except Exception as e:
        print(f"ERROR in stream_chat: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your chat request: {str(e)}"
        )