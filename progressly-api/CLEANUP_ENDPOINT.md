# Cleanup Endpoint Documentation

## Overview
The cleanup endpoint provides a secure way to delete old activity data from the database. This endpoint is designed to be called by scheduled jobs or automated systems.

## Endpoint Details
- **URL**: `POST /api/jobs/cleanup-activities`
- **Security**: Protected by `X-CLEANUP-TOKEN` header
- **Purpose**: Deletes all activities older than 3 days

## Environment Variable Setup

Add the following environment variable to your deployment:

```bash
CLEANUP_SECRET_TOKEN=your_secure_random_token_here
```

### Generating a Secure Token
You can generate a secure token using:

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Usage Examples

### Using curl
```bash
curl -X POST "https://your-api-domain.com/api/jobs/cleanup-activities" \
  -H "X-CLEANUP-TOKEN: your_secure_token_here" \
  -H "Content-Type: application/json"
```

### Using Python requests
```python
import requests

headers = {
    "X-CLEANUP-TOKEN": "your_secure_token_here",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://your-api-domain.com/api/jobs/cleanup-activities",
    headers=headers
)

print(response.json())
```

## Response Format

### Success Response
```json
{
    "success": true,
    "message": "Successfully deleted 15 activities older than 3 days.",
    "deleted_count": 15,
    "cutoff_date": "2024-01-15"
}
```

### No Data Response
```json
{
    "success": true,
    "message": "No activities older than 3 days found.",
    "deleted_count": 0,
    "cutoff_date": "2024-01-15"
}
```

### Error Response
```json
{
    "detail": "Unauthorized. Invalid cleanup token."
}
```

## Scheduling Recommendations

### Using Cron (Linux/macOS)
```bash
# Run daily at 2 AM
0 2 * * * curl -X POST "https://your-api-domain.com/api/jobs/cleanup-activities" -H "X-CLEANUP-TOKEN: your_token"
```

### Using GitHub Actions
```yaml
name: Cleanup Old Activities
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cleanup Endpoint
        run: |
          curl -X POST "${{ secrets.API_URL }}/api/jobs/cleanup-activities" \
            -H "X-CLEANUP-TOKEN: ${{ secrets.CLEANUP_TOKEN }}"
```

### Using Render Cron Jobs
1. Go to your Render dashboard
2. Create a new Cron Job
3. Set the command to:
   ```bash
   curl -X POST "https://your-api-domain.com/api/jobs/cleanup-activities" -H "X-CLEANUP-TOKEN: your_token"
   ```
4. Set the schedule (e.g., daily at 2 AM)

## Security Notes
- The token should be kept secret and not committed to version control
- Use environment variables to store the token
- Consider rotating the token periodically
- Monitor the endpoint for unauthorized access attempts
