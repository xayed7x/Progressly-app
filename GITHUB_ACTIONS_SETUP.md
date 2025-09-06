# GitHub Actions Daily Cleanup Setup Guide

## 🎯 Overview
This guide will help you set up a free, automated daily cleanup job using GitHub Actions that will call your cleanup endpoint every day at 2:00 AM UTC.

## ✅ What's Already Done
- ✅ Created `.github/workflows/daily_cleanup.yml` workflow file
- ✅ Workflow is configured to run daily at 2:00 AM UTC
- ✅ Workflow can also be triggered manually from GitHub Actions tab
- ✅ Uses your Render API URL: `https://progressly-api.onrender.com`

## 🔧 Manual Setup Required

### Step 1: Create GitHub Secret

You need to add your cleanup token as a GitHub secret so the workflow can securely access it.

#### Instructions:
1. **Go to your GitHub repository** in your web browser
2. **Click on "Settings"** tab (at the top of the repository page)
3. **In the left sidebar, click "Secrets and variables"**
4. **Click "Actions"** (under "Secrets and variables")
5. **Click "New repository secret"** button
6. **Fill in the form:**
   - **Name**: `CLEANUP_SECRET_TOKEN`
   - **Secret**: Paste the same token value you used for `CLEANUP_SECRET_TOKEN` in your Render environment variables
7. **Click "Add secret"**

### Step 2: Verify Your Render Environment Variable

Make sure your Render app has the `CLEANUP_SECRET_TOKEN` environment variable set:

1. **Go to your Render dashboard**
2. **Select your API service**
3. **Go to "Environment" tab**
4. **Verify `CLEANUP_SECRET_TOKEN` is set** with the same value you used in GitHub

### Step 3: Test the Workflow

#### Option A: Manual Trigger (Recommended for testing)
1. **Go to your GitHub repository**
2. **Click "Actions" tab**
3. **Find "Daily Activity Cleanup" workflow**
4. **Click "Run workflow" button**
5. **Click the green "Run workflow" button**
6. **Check the logs** to see if it runs successfully

#### Option B: Wait for Scheduled Run
- The workflow will automatically run at 2:00 AM UTC every day
- You can check the "Actions" tab to see the run history

## 📋 Workflow Details

### Schedule
- **Frequency**: Daily
- **Time**: 2:00 AM UTC
- **Cron Expression**: `0 2 * * *`

### What It Does
1. **Runs on Ubuntu** (latest version)
2. **Makes a POST request** to your cleanup endpoint
3. **Uses secure token** from GitHub secrets
4. **Deletes activities** older than 3 days
5. **Logs the response** for monitoring

### Manual Trigger
- You can manually run this workflow anytime from the GitHub Actions tab
- Useful for testing or immediate cleanup

## 🔍 Monitoring

### Check Workflow Status
1. **Go to GitHub Actions tab**
2. **Look for "Daily Activity Cleanup"**
3. **Click on any run** to see detailed logs
4. **Green checkmark** = Success
5. **Red X** = Failed (check logs for details)

### Expected Success Response
```json
{
  "success": true,
  "message": "Successfully deleted X activities older than 3 days.",
  "deleted_count": X,
  "cutoff_date": "2024-01-15"
}
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Unauthorized" Error
- **Cause**: GitHub secret doesn't match Render environment variable
- **Fix**: Ensure both values are identical

#### 2. "Connection Refused" Error
- **Cause**: Render app might be sleeping
- **Fix**: The first request might wake it up; subsequent requests should work

#### 3. Workflow Not Running
- **Cause**: GitHub Actions might be disabled
- **Fix**: Check repository settings → Actions → General → Allow all actions

### Debug Steps
1. **Check GitHub secret** is correctly set
2. **Verify Render environment variable** matches
3. **Test endpoint manually** with curl
4. **Check workflow logs** for specific error messages

## 🎉 Success!

Once set up, your cleanup will run automatically every day, keeping your database clean and your app performing optimally!

## 📞 Need Help?

If you encounter any issues:
1. Check the workflow logs in GitHub Actions
2. Verify your environment variables match
3. Test the endpoint manually first
4. Check that your Render app is running

The setup is now complete and ready to keep your database clean automatically! 🚀
