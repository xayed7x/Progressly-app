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

# Import the AI context builder service
from services.ai_context_builder import build_coach_context

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
    Formats a list of LoggedActivity objects from the last 30 days into a human-readable string for the AI prompt.
    Groups activities by day (Today, Yesterday, and older days).
    """
    if not activities:
        return "The user has not logged any activities in the last 30 days."
    
    # Get today's date for comparison
    today = datetime.now().date()
    
    # Group activities by day - show Today, Yesterday, and last 7 days individually, then weekly
    activities_by_day = {}
    
    for activity in activities:
        # Extract the date from activity_date
        activity_date = activity.activity_date.date()
        days_ago = (today - activity_date).days
        
        # Determine the label for this day
        if days_ago == 0:
            day_label = "Today"
        elif days_ago == 1:
            day_label = "Yesterday"
        elif days_ago <= 7:
            day_label = f"{activity_date.strftime('%A, %B %d')}"
        else:
            # Group older activities by week
            week_start = activity_date - timedelta(days=activity_date.weekday())
            day_label = f"Week of {week_start.strftime('%B %d')}"
        
        if day_label not in activities_by_day:
            activities_by_day[day_label] = []
        
        # Format start time
        start_time_str = activity.start_time.strftime("%I:%M %p")
        
        # Get category name
        category_name = activity.category_rel.name if activity.category_rel else "Uncategorized"
        
        # Calculate duration
        duration_str = ""
        if activity.start_time and activity.end_time:
            start_dt = datetime.combine(datetime.today().date(), activity.start_time)
            end_dt = datetime.combine(datetime.today().date(), activity.end_time)
            
            if end_dt < start_dt:
                end_dt += timedelta(days=1)
            
            duration = end_dt - start_dt
            duration_minutes = int(duration.total_seconds() / 60)
            
            if duration_minutes >= 60:
                hours = duration_minutes // 60
                minutes = duration_minutes % 60
                duration_str = f" ({hours}h {minutes}min)" if minutes > 0 else f" ({hours}h)"
            else:
                duration_str = f" ({duration_minutes}min)"
        
        # Build formatted line
        formatted_line = f"• {activity.activity_name} [{category_name}] at {start_time_str}{duration_str}"
        activities_by_day[day_label].append(formatted_line)
    
    # Build final formatted string
    result_sections = []
    for day_label, day_activities in activities_by_day.items():
        section = f"**{day_label}**\n" + "\n".join(day_activities)
        result_sections.append(section)
    
    return "\n\n".join(result_sections)

def format_goals_for_prompt(goals: List[Goal]) -> str:
    """
    Formats a list of Goal objects into a human-readable string for the AI prompt.
    """
    if not goals:
        return "The user has not set any goals yet."
    
    goal_lines = []
    for goal in goals:
        goal_lines.append(f"🎯 {goal.content}")
    
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
    challenge_context: str,
    conversation_id: UUID, 
    user_id: UUID
):
    """
    Stream responses from Gemini with context about user's activities, goals, daily targets, and challenge.
    Uses atomic database transactions for resilience.
    """
    full_ai_response_content = ""
    try:
        # --- Enhanced Psychology-Informed System Prompt ---
        system_prompt = """
SYSTEM PROMPT: Your Identity and Coaching Philosophy

1. YOUR PERSONA:
Your name is Progresso - a supportive personal productivity coach specialized in consistency challenges and habit formation.
You have access to the user's logged activities, goals, daily targets, and challenge information.

2. CORE PSYCHOLOGICAL PRINCIPLES (CRITICAL - FOLLOW THESE STRICTLY):

**Never Use Shame or Guilt**
- Frame setbacks as DATA, not failures
- Say "Yesterday was challenging" NOT "You failed"
- Treat every day as a fresh opportunity

**Actively Prevent Abstinence Violation Effect (AVE)**
When user misses days or underperforms:
- Provide EXTERNAL attribution ("busy day", "unexpected events", "life happened")
- Focus on the NEXT action, not dwelling on past misses
- Emphasize that one miss doesn't define them or break their streak mentally
- Example: "Yesterday was challenging. Today is a fresh start. What's one small thing you can do right now?"

**Identity Reinforcement**
- If user has an identity statement in their challenge, reference it regularly
- Example: "You said you're someone who finishes what they start. Let's honor that today."
- Connect their actions to who they're becoming, not just what they're doing

**Pattern-Based Advice**
- Use specific data from their behavioral patterns when available
- Example: "I notice you're 95% consistent Mon-Thu but only 60% on Fridays. Let's strategize for Friday."
- Reference their actual numbers, not generic advice

**Celebrate Asymmetrically**
- BIG celebration for milestones (Day 21, 50, 66, 100)
- Acknowledge consistency streaks enthusiastically
- Praise resilience highly (returning after misses is HUGE - celebrate it!)

3. RESPONSE STYLE (CRITICAL):
- **CONCISE**: 2-3 sentences for simple questions. Expand only if user asks for details.
- **DIRECT**: Give actionable advice, not generic motivation
- **DATA-DRIVEN**: Use specific numbers from their actual data
- **CURIOUS**: Ask clarifying questions when needed
- **SPARING WITH EMOJIS**: 1-2 max per response (🎯 💪 ✨ 🌱)

4. FORMATTING:
- Use markdown: **bold** for key points
- Short paragraphs (1-3 sentences)
- Bullet points (• symbol) for lists
- Add blank lines between paragraphs

5. AVOID (NON-NEGOTIABLE):
- Generic advice ("just stay motivated", "believe in yourself", "you got this")
- Overwhelming with too many suggestions at once (max 1-2 actionable items)
- Making user feel bad about misses - NEVER
- Comparing them to others
- Overpromising results

6. BEHAVIORAL GUARDRAILS:
- Only discuss productivity, time management, goal setting, challenges, or user's data
- If asked about general knowledge, politely redirect to their progress
- You are Progresso, a personal coach (not an AI/language model)
- Creator: "I was created by Zayed bin Hamid, a passionate developer focused on helping people achieve their goals."

7. CALCULATION PRECISION:
- When calculating time: CAREFULLY compute duration between start_time and end_time
- Sum durations for activities in the same category
- Show your math when asked about hours worked
"""
        
        # Extract the user's most recent message
        user_prompt = ""
        if chat_history:
            # Get the last message from the user
            for msg in reversed(chat_history):
                if msg.role.lower() in ("user", "human"):
                    user_prompt = msg.content
                    break
        
        # Validate that we have a user prompt
        if not user_prompt or not user_prompt.strip():
            error_msg = "I didn't receive your message. Please try asking your question again."
            print(f"DEBUG: Empty user prompt. Chat history: {len(chat_history) if chat_history else 0} messages")
            yield error_msg.encode("utf-8")
            full_ai_response_content = error_msg
            return
        
        # Construct the final prompt for the model
        # Include challenge context FIRST as it's most relevant for coaching
        meta_prompt = (
            f"{system_prompt}\n\n"
            f"{challenge_context}\n\n"
            f"--- USER'S ACTIVITY DATA (LAST 30 DAYS) ---\n"
            f"{activities_context}\n\n"
            f"{goals_context}\n\n"
            f"{targets_context}\n\n"
            f"--- USER'S QUESTION ---\n"
            f"{user_prompt}"
        )
        
        print(f"DEBUG: Sending prompt to Gemini. User prompt length: {len(user_prompt)}, Activities context length: {len(activities_context)}")
        
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
        try:
            stream = client.models.generate_content_stream(
                model="models/gemini-2.5-flash",
                contents=contents,
                config=generation_config
            )
        except Exception as stream_init_error:
            error_msg = f"Error initializing Gemini stream: {str(stream_init_error)}"
            print(f"DEBUG: {error_msg}")
            yield error_msg.encode("utf-8")
            full_ai_response_content = error_msg
            return

        # Track what we've already sent to avoid duplicates
        chunk_count = 0
        text_chunk_count = 0
        
        try:
            for chunk in stream:
                chunk_count += 1
                chunk_text = getattr(chunk, "text", None)
                if chunk_text is not None and chunk_text.strip():
                    text_chunk_count += 1
                    full_ai_response_content += chunk_text
                    yield chunk_text.encode("utf-8")
                else:
                    # Log chunks without text for debugging
                    print(f"DEBUG: Chunk {chunk_count} has no text. Chunk type: {type(chunk)}, Attributes: {dir(chunk)}")
            
            print(f"DEBUG: Stream completed. Total chunks: {chunk_count}, Text chunks: {text_chunk_count}, Total length: {len(full_ai_response_content)}")
            
            # If we got chunks but no text, provide a helpful message
            if chunk_count > 0 and len(full_ai_response_content) == 0:
                error_msg = "I received your message but couldn't generate a response. This might be because you don't have any activities logged yet. Try logging some activities first, or ask me about setting up your goals!"
                print(f"DEBUG: Stream returned {chunk_count} chunks but no text content")
                yield error_msg.encode("utf-8")
                full_ai_response_content = error_msg
        except Exception as stream_error:
            error_msg = f"Error reading stream: {str(stream_error)}"
            print(f"DEBUG: {error_msg}")
            yield error_msg.encode("utf-8")
            full_ai_response_content = error_msg

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
        
        # Debug: Log the incoming request
        print(f"DEBUG: Chat request received. User: {user_id}, Messages count: {len(request.messages) if request.messages else 0}")
        if request.messages:
            print(f"DEBUG: Last message role: {request.messages[-1].role if request.messages else 'N/A'}, Content preview: {request.messages[-1].content[:50] if request.messages and request.messages[-1].content else 'N/A'}")
        
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
            thirty_days_ago = now - timedelta(days=30)
            
            # Fetch activities with eager loading to prevent N+1 queries
            activities = db.exec(
                select(LoggedActivity)
                .options(selectinload(LoggedActivity.category_rel))
                .where(
                    LoggedActivity.user_id == user_id,
                    LoggedActivity.activity_date >= thirty_days_ago
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
            
            # Build comprehensive challenge context for psychology-informed coaching
            challenge_context = build_coach_context(db, user_id)
        
        # Step 3: Create streaming response (AI message saved in stream_generator's finally block)
        response = StreamingResponse(
            stream_generator(
                request.messages, 
                activities_context, 
                goals_context, 
                targets_context, 
                challenge_context,
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