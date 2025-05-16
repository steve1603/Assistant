# Connecting to GitHub

After you've created your GitHub repository, run the following commands to connect your local repository and push the code:

```bash
# Add the remote repository (replace YOUR_USERNAME and REPO_NAME with your GitHub username and repository name)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Verify the remote was added
git remote -v

# Push your code to GitHub
git push -u origin master
```

## GitHub Authentication

You'll need to authenticate with GitHub when pushing. You can:

1. **Use GitHub CLI** (recommended):
   - Install GitHub CLI: https://cli.github.com/
   - Run `gh auth login` and follow the prompts

2. **Use HTTPS with credential caching**:
   - Configure Git to cache your credentials:
     ```
     git config --global credential.helper cache
     ```
   - When prompted, enter your GitHub username and personal access token (not password)

3. **Use SSH keys**:
   - Generate SSH keys: `ssh-keygen -t ed25519 -C "your_email@example.com"`
   - Add the public key to your GitHub account
   - Use SSH URL: `git remote set-url origin git@github.com:YOUR_USERNAME/REPO_NAME.git`

## Creating a Personal Access Token (if using HTTPS)

If using HTTPS authentication:
1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate a new token with appropriate permissions (at minimum: 'repo')
3. Copy the token (you won't be able to see it again)
4. Use this token as your password when Git prompts for authentication 