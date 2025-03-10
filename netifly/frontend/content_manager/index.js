const express = require('express');
const fs = require('fs');
const path = require('path');
const translate = require('@vitalets/google-translate-api'); // Import translation package

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Utility function to read data from JSON file
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');
  }
  const rawData = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(rawData);
};

// Utility function to write data to JSON file
const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Add new content
// Expected body: { "page": "optional (defaults to main)", "section": "sectionName", "id": "idName", "content": "Some content" }
app.post('/content', (req, res) => {
  const { page = 'main', section, id, content } = req.body;
  if (!section || !id || !content) {
    return res.status(400).json({ error: 'Missing section, id, or content' });
  }
  const data = readData();
  // Ensure the page exists
  if (!data[page]) {
    data[page] = {};
  }
  // Ensure the section exists
  if (!data[page][section]) {
    data[page][section] = {};
  }
  if (data[page][section][id]) {
    return res.status(400).json({ error: 'Content with given id already exists in that section' });
  }
  data[page][section][id] = content;
  writeData(data);
  res.json({ message: 'Content added successfully', sectionData: data[page][section] });
});

// Update existing content
// URL: /content/:page/:section/:id, Body: { "content": "Updated content" }
app.put('/content/:page/:section/:id', (req, res) => {
  const { page, section, id } = req.params;
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Missing content to update' });
  }
  const data = readData();
  if (!data[page] || !data[page][section] || !data[page][section][id]) {
    return res.status(404).json({ error: 'Content not found' });
  }
  data[page][section][id] = content;
  writeData(data);
  res.json({ message: 'Content updated successfully' });
});

// Remove content
// URL: /content/:page/:section/:id
app.delete('/content/:page/:section/:id', (req, res) => {
  const { page, section, id } = req.params;
  const data = readData();
  if (!data[page] || !data[page][section] || !data[page][section][id]) {
    return res.status(404).json({ error: 'Content not found' });
  }
  delete data[page][section][id];
  // Optionally, remove empty section or page objects:
  if (Object.keys(data[page][section]).length === 0) {
    delete data[page][section];
  }
  if (Object.keys(data[page]).length === 0) {
    delete data[page];
  }
  writeData(data);
  res.json({ message: 'Content removed successfully' });
});

// Get content for a given page (default "main")
// Returns a nested JSON: { <sectionName>: { <id>: "content", ... }, ... }
app.get('/content', (req, res) => {
  const page = req.query.page || 'main';
  const data = readData();
  res.json(data[page] || {});
});

// New endpoint: Translate English content to German for a specific record
// URL: /translate/:page/:section/:id
app.post('/translate/:page/:section/:id', async (req, res) => {
  const { page, section, id } = req.params;
  const data = readData();
  if (!data[page] || !data[page][section] || !data[page][section][id]) {
    return res.status(404).json({ error: 'Content not found' });
  }
  const originalText = data[page][section][id];
  try {
    // Translate from English ('en') to German ('de')
    const result = await translate(originalText, { from: 'en', to: 'de' });
    // Update the content with the translated text (same address)
    data[page][section][id] = result.text;
    writeData(data);
    res.json({ 
      message: 'Content translated to German successfully', 
      original: originalText, 
      translated: result.text 
    });
  } catch (error) {
    res.status(500).json({ error: 'Translation error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
