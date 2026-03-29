---
name: linkedin-poster
description: Compose and publish LinkedIn posts (text, articles, images) via the LinkedIn API. Use when user wants to draft, preview, or publish content to LinkedIn.
---

# LinkedIn Poster

Post content to LinkedIn directly from Claude Code. Supports text posts, article shares, and image posts.

## Prerequisites

Before first use, the user needs:

1. **LinkedIn Developer App** at https://developer.linkedin.com/
2. **Products enabled**: "Share on LinkedIn" + "Sign In with LinkedIn using OpenID Connect"
3. **App verification** completed (required for `w_member_social` scope)
4. **Environment variables** set:
   - `LINKEDIN_ACCESS_TOKEN` — OAuth2 Bearer token
   - `LINKEDIN_PERSON_ID` — User's LinkedIn person URN ID (numeric, from `/v2/userinfo`)

### Getting Your Person ID

```bash
curl -s -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  https://api.linkedin.com/v2/userinfo | jq -r '.sub'
```

### Getting an Access Token

Use the 3-legged OAuth2 flow:
1. Direct user to: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT&scope=openid%20profile%20w_member_social`
2. User authorizes, LinkedIn redirects with `?code=AUTH_CODE`
3. Exchange code for token:
```bash
curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
  -d "grant_type=authorization_code&code=AUTH_CODE&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&redirect_uri=REDIRECT_URI"
```
4. Token expires in 60 days. Refresh before expiry.

## Capabilities

### 1. Text Post

Simple text update to the user's LinkedIn feed.

```bash
curl -s -X POST https://api.linkedin.com/v2/posts \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "LinkedIn-Version: 202503" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -d '{
    "author": "urn:li:person:'"$LINKEDIN_PERSON_ID"'",
    "commentary": "Your post text here",
    "visibility": "PUBLIC",
    "distribution": {
      "feedDistribution": "MAIN_FEED",
      "targetEntities": [],
      "thirdPartyDistributionChannels": []
    },
    "lifecycleState": "PUBLISHED"
  }'
```

### 2. Article Share

Share a URL with commentary.

```bash
curl -s -X POST https://api.linkedin.com/v2/posts \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "LinkedIn-Version: 202503" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -d '{
    "author": "urn:li:person:'"$LINKEDIN_PERSON_ID"'",
    "commentary": "Check out this article!",
    "visibility": "PUBLIC",
    "distribution": {
      "feedDistribution": "MAIN_FEED",
      "targetEntities": [],
      "thirdPartyDistributionChannels": []
    },
    "content": {
      "article": {
        "source": "https://example.com/article",
        "title": "Article Title",
        "description": "Brief description of the article"
      }
    },
    "lifecycleState": "PUBLISHED"
  }'
```

### 3. Image Post

Upload an image then post it. Two-step process.

**Step 1 — Initialize upload:**
```bash
curl -s -X POST https://api.linkedin.com/v2/images?action=initializeUpload \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "LinkedIn-Version: 202503" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -d '{
    "initializeUploadRequest": {
      "owner": "urn:li:person:'"$LINKEDIN_PERSON_ID"'"
    }
  }'
```

Response gives `uploadUrl` and `image` URN. Save both.

**Step 2 — Upload binary:**
```bash
curl -s -X PUT "$UPLOAD_URL" \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  --upload-file /path/to/image.jpg
```

**Step 3 — Create post with image:**
```bash
curl -s -X POST https://api.linkedin.com/v2/posts \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "LinkedIn-Version: 202503" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -d '{
    "author": "urn:li:person:'"$LINKEDIN_PERSON_ID"'",
    "commentary": "Image caption here",
    "visibility": "PUBLIC",
    "distribution": {
      "feedDistribution": "MAIN_FEED",
      "targetEntities": [],
      "thirdPartyDistributionChannels": []
    },
    "content": {
      "media": {
        "id": "'"$IMAGE_URN"'"
      }
    },
    "lifecycleState": "PUBLISHED"
  }'
```

## Process — When User Says "Post to LinkedIn"

1. **Check env vars**: Verify `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_PERSON_ID` are set. If not, guide setup.
2. **Draft content**: Help user compose the post. Offer to refine tone, add hashtags, optimize length.
3. **Preview**: Show the user exactly what will be posted. Include post type, text, any URLs/images.
4. **Confirm**: ALWAYS ask for explicit confirmation before publishing. Never auto-post.
5. **Publish**: Execute the appropriate curl command.
6. **Report**: Show success/failure, post URN if successful.

## Content Guidelines

- **Character limit**: 3,000 characters for post text
- **Hashtags**: 3-5 relevant hashtags, placed at end of post
- **Best engagement**: Posts with 1,200-1,500 characters perform best
- **Line breaks**: Use `\n` for formatting. Short paragraphs improve readability.
- **Emojis**: Use sparingly and only if user's style includes them
- **Images**: JPG/PNG, max 10MB, 1200x627px recommended for article thumbnails

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Token expired or invalid | Guide user to refresh token |
| 403 | Missing scope or unverified app | Check app products and verification |
| 422 | Invalid post content | Check field formats, character limits |
| 429 | Rate limited | Wait and retry with backoff |

## Visibility Options

- `PUBLIC` — visible to everyone
- `CONNECTIONS` — visible to 1st-degree connections only

Pass as the `visibility` field value.

## Rate Limits

LinkedIn does not publish exact numbers. General guidance:
- Stay under ~100 API calls/day
- Space posts at least 10 minutes apart
- Monitor via Developer Portal analytics tab
- Handle 429 responses with exponential backoff
