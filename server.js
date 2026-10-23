const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(cors());

app.use(express.json());

app.get('/api/test', (req, res) => {
    res.json({ message: "Hello from your backend server!" });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'home.html'));
});

app.use(express.static('src'));
app.listen(PORT, () => {
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
});
