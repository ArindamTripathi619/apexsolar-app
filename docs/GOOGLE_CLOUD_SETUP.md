# Google Cloud Service Account Setup

## Creating Service Account Key for GitHub Actions

### Step 1: Create Service Account
```bash
# Set your project ID
export PROJECT_ID="apexsolar-app"

# Create service account
gcloud iam service-accounts create github-actions \
    --description="Service account for GitHub Actions deployments" \
    --display-name="GitHub Actions"
```

### Step 2: Grant Required Permissions
```bash
# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"
```

### Step 3: Create and Download Key
```bash
# Create key file
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

# Display the key content (copy this)
cat github-actions-key.json
```

### Step 4: Add Secret to GitHub

1. Copy the entire content of `github-actions-key.json`
2. Go to your GitHub repository
3. Settings → Secrets and variables → Actions
4. Click "New repository secret"
5. Name: `GOOGLE_CLOUD_SA_KEY`
6. Value: Paste the JSON content
7. Click "Add secret"

### Step 5: Clean up local key file
```bash
# Remove the local key file for security
rm github-actions-key.json
```

## Alternative: Use existing key

If you already have a service account key file (`apexsolar-storage-key.json`), you can:

```bash
# Display the content
cat apexsolar-storage-key.json
```

Then copy the JSON content and add it as the `GOOGLE_CLOUD_SA_KEY` secret in GitHub.

## Verification

After adding the secret, re-run the GitHub Actions workflow. The authentication should work.
