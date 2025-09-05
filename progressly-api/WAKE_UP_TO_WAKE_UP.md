# Wake-up to Wake-up Day Cycle Documentation

## 🎯 Overview
The application now implements an intelligent "Wake-up to Wake-up" day cycle that reflects a user's true 24-hour day, rather than arbitrary calendar boundaries. This system automatically detects when a user wakes up and defines their day from that moment until they wake up the next day.

## 🔧 How It Works

### Core Algorithm
1. **Sleep Detection**: The system finds the user's "Sleep" category
2. **Wake-up Detection**: Identifies the longest sleep session that ended on the target date
3. **Day Boundary**: Defines the day as starting from wake-up time to next wake-up time
4. **Fallback**: If no sleep data exists, defaults to midnight-to-midnight boundaries

### Data Retention Policy
- **4-Day Window**: Backend retains 4 days of data to support sleep detection
- **Frontend Navigation**: Users can still navigate 3 days (Today, Yesterday, Day Before)
- **Safe Buffer**: Extra day ensures sleep data from previous night is available

## 📊 API Changes

### GET /api/activities
**New Query Parameter**: `target_date` (optional)
- **Format**: `YYYY-MM-DD`
- **Default**: Today's date if not provided
- **Example**: `/api/activities?target_date=2024-01-15`

**Response**: Activities from wake-up on target_date to wake-up on target_date+1

### Data Flow
1. **Frontend**: Passes selected date as `target_date` parameter
2. **Backend**: Fetches 4-day window of data for context
3. **Algorithm**: Finds sleep boundaries for the target date
4. **Filtering**: Returns only activities within wake-up boundaries
5. **Response**: Sorted by date and time, with nested category data

## 🛡️ Fault Tolerance

### Graceful Fallbacks
- **No Sleep Category**: Falls back to midnight-to-midnight boundaries
- **No Sleep Data**: Uses default calendar day boundaries
- **Missing Sleep Sessions**: Handles partial sleep data gracefully
- **Overnight Activities**: Properly calculates sleep duration across midnight

### Error Handling
- **Database Errors**: Proper transaction rollback
- **Invalid Dates**: Validates date parameters
- **Missing Data**: Graceful degradation to default behavior

## 🎨 User Experience

### Day Navigation
- **Today**: Shows activities from this morning's wake-up to tomorrow's wake-up
- **Yesterday**: Shows activities from yesterday's wake-up to this morning's wake-up
- **Day Before**: Shows activities from day-before's wake-up to yesterday's wake-up

### Visual Feedback
- **Dynamic Titles**: "Today's Log", "Yesterday's Log", etc.
- **Accurate Data**: Activities reflect true daily cycles
- **Seamless Navigation**: Smooth transitions between days

## 🔍 Technical Implementation

### Backend Functions
- `find_wake_up_boundaries()`: Core algorithm for boundary detection
- `calculate_duration()`: Handles overnight activity duration
- `get_activities()`: Main endpoint with wake-up logic

### Frontend Integration
- **Dynamic API Calls**: SWR key includes selected date
- **Automatic Refresh**: Re-fetches when date changes
- **State Management**: Selected date drives all data fetching

## 📈 Benefits

### For Users
- **Natural Day Cycles**: Reflects actual sleep/wake patterns
- **Accurate Data**: Activities grouped by true daily cycles
- **Intuitive Navigation**: Day boundaries make sense

### For Performance
- **Efficient Queries**: Only fetches necessary data
- **Smart Caching**: SWR caches by date
- **Optimized Storage**: 4-day retention balances data and performance

## 🚀 Deployment Notes

### Environment Variables
- **CLEANUP_SECRET_TOKEN**: For automated cleanup (4-day retention)
- **Database**: Ensure proper indexing on activity_date and category_id

### Monitoring
- **Sleep Detection**: Monitor if users have "Sleep" categories
- **Boundary Detection**: Log when fallback boundaries are used
- **Performance**: Track query execution times

## 🔧 Configuration

### Sleep Category
The system automatically detects sleep categories by name:
- **Case Insensitive**: "Sleep", "sleep", "SLEEP" all work
- **Exact Match**: Must be named "Sleep" (not "Sleeping" or "Bedtime")
- **User-Specific**: Each user's sleep category is detected individually

### Customization
- **Sleep Detection**: Can be modified to use different category names
- **Boundary Logic**: Can be adjusted for different sleep patterns
- **Fallback Behavior**: Can be customized for different use cases

This implementation provides a truly intelligent, user-centric experience that reflects how people actually live their daily lives! 🌅
