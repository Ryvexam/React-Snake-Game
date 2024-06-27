const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 80;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SCOREBOARD_FILE = 'scoreboard.json';
const MAX_SCORES = 10;

async function readScoreboard() {
    try {
        const data = await fs.readFile(SCOREBOARD_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('No scoreboard file found. Starting with an empty scoreboard.');
        return [];
    }
}

async function writeScoreboard(scoreboard) {
    await fs.writeFile(SCOREBOARD_FILE, JSON.stringify(scoreboard));
}

app.get('/api/scoreboard', async (req, res) => {
    try {
        const scoreboard = await readScoreboard();
        res.json(scoreboard);
    } catch (error) {
        console.error('Error reading scoreboard:', error);
        res.status(500).json({ error: 'Failed to read scoreboard' });
    }
});

app.post('/api/score', async (req, res) => {
    try {
        const { username, score } = req.body;
        if (!username || typeof score !== 'number') {
            return res.status(400).json({ error: 'Invalid input' });
        }

        let scoreboard = await readScoreboard();

        const existingScoreIndex = scoreboard.findIndex(entry => entry.username === username);

        if (existingScoreIndex !== -1) {
            if (score > scoreboard[existingScoreIndex].score) {
                scoreboard[existingScoreIndex].score = score;
            }
        } else {
            scoreboard.push({ username, score });
        }

        scoreboard.sort((a, b) => b.score - a.score);
        scoreboard = scoreboard.slice(0, MAX_SCORES);

        await writeScoreboard(scoreboard);
        res.json({ success: true, scoreboard });
    } catch (error) {
        console.error('Error updating scoreboard:', error);
        res.status(500).json({ error: 'Failed to update scoreboard' });
    }
});

app.post('/api/scoreboard/reset', async (req, res) => {
    try {
        await writeScoreboard([]);
        res.json({ success: true, message: 'Scoreboard reset successfully' });
    } catch (error) {
        console.error('Error resetting scoreboard:', error);
        res.status(500).json({ error: 'Failed to reset scoreboard' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});