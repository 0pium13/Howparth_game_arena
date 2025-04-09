const express = require('express');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// GitHub configuration
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const REPO_OWNER = 'your-github-username';
const REPO_NAME = 'howparth-game-arena';
const DATA_FILE = 'player-data.json';

app.use(express.json());
app.use(express.static('public'));

// Get all player data
app.get('/api/players', async (req, res) => {
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: DATA_FILE
    });
    
    const content = Buffer.from(data.content, 'base64').toString();
    res.json(JSON.parse(content));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

// Update player data
app.post('/api/players', async (req, res) => {
  try {
    const { username, points } = req.body;
    
    // Get current data
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: DATA_FILE
    });
    
    const currentContent = Buffer.from(data.content, 'base64').toString();
    const players = JSON.parse(currentContent);
    
    // Update player data
    players[username] = {
      points: points,
      lastUpdated: new Date().toISOString()
    };
    
    // Commit changes to GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: DATA_FILE,
      message: `Update player data for ${username}`,
      content: Buffer.from(JSON.stringify(players, null, 2)).toString('base64'),
      sha: data.sha
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update player data' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: DATA_FILE
    });
    
    const content = Buffer.from(data.content, 'base64').toString();
    const players = JSON.parse(content);
    
    // Convert to array and sort by points
    const leaderboard = Object.entries(players)
      .map(([username, data]) => ({
        username,
        points: data.points,
        lastUpdated: data.lastUpdated
      }))
      .sort((a, b) => b.points - a.points);
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 