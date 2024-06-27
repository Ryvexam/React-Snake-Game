const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Read the best score from file
let bestScore = 0;
try {
    bestScore = parseInt(fs.readFileSync('bestScore.txt', 'utf8'));
} catch (error) {
    console.log('No best score file found. Starting with 0.');
}

app.get('/api/bestScore', (req, res) => {
    res.json({ bestScore });
});

app.post('/api/bestScore', (req, res) => {
    const { score } = req.body;
    if (score > bestScore) {
        bestScore = score;
        fs.writeFileSync('bestScore.txt', bestScore.toString());
        res.json({ success: true, newBestScore: bestScore });
    } else {
        res.json({ success: false, bestScore });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});