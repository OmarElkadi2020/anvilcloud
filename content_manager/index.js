const express = require('express');
const fs = require('fs');
const path = require('path');
const translator = require('@vitalets/google-translate-api');
const { JSDOM } = require("jsdom");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'content', 'data.json');      // English content file
const DATA_FILE_DE = path.join(__dirname, 'content', 'data_de.json');  // German translations file
const logger = console;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Utility functions for English data
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');
  }
  const rawData = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(rawData);
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Utility functions for German data
const readGermanData = () => {
  if (!fs.existsSync(DATA_FILE_DE)) {
    fs.writeFileSync(DATA_FILE_DE, JSON.stringify({}), 'utf8');
  }
  const rawData = fs.readFileSync(DATA_FILE_DE, 'utf8');
  return JSON.parse(rawData);
};

const writeGermanData = (data) => {
  fs.writeFileSync(DATA_FILE_DE, JSON.stringify(data, null, 2), 'utf8');
};

// Helper function to update an HTML file based on a flattened JSON lookup.
// It reads the corresponding JSON data (for page 'main'), then updates the HTML file at targetPath.
function updateHtmlFile(lang) {
  logger.info(`Updating HTML file for ${lang}...`);
  let jsonData, htmlFilePath;
  if (lang === 'en') {
    jsonData = readData();
    htmlFilePath = path.join(__dirname, '..', 'netifly', 'frontend', 'en', 'index.html');
  } else if (lang === 'de') {
    jsonData = readGermanData();
    htmlFilePath = path.join(__dirname, '..', 'netifly', 'frontend', 'de', 'index.html');
  } else {
    return;
  }

  sourceHtmlFilePath = path.join(__dirname, 'content', 'index.html');

  // We assume we're updating the "main" page content
  const pageData = jsonData['main'] || {};
  // Flatten the nested JSON: { section: { id: content } } => { id: content }
  const lookup = {};
  for (const section in pageData) {
    Object.assign(lookup, pageData[section]);
  }
  if (!fs.existsSync(sourceHtmlFilePath)) {
    logger.error(`HTML file not found at ${sourceHtmlFilePath}`);
    return;
  }
  const htmlContent = fs.readFileSync(sourceHtmlFilePath, 'utf8');
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  // For every element with an id attribute, if a matching key is found, update its innerHTML.
  document.querySelectorAll('[id]').forEach(el => {
    const key = el.id;
    if (lookup[key] !== undefined) {
      el.innerHTML = lookup[key];
    }
  });
  const updatedHtml = dom.serialize();
  try {
    fs.writeFileSync(htmlFilePath, updatedHtml, 'utf8');
    logger.info(`Updated ${lang.toUpperCase()} HTML file at ${htmlFilePath}`);
  } catch (error) {
    logger.error(`Error updating ${lang.toUpperCase()} HTML file:`, error.message);
  }
}

// Add new English content
app.post('/content', (req, res) => {
  const { page = 'main', section, id, content } = req.body;
  if (!section || !id || !content) {
    logger.error('Missing section, id, or content');
    return res.status(400).json({ error: 'Missing section, id, or content' });
  }
  const data = readData();
  if (!data[page]) {
    data[page] = {};
    logger.info('New page created');
  }
  if (!data[page][section]) {
    data[page][section] = {};
    logger.info('New section created');
  }
  if (data[page][section][id]) {
    logger.error('Content with given id already exists in that section');
    return res.status(400).json({ error: 'Content with given id already exists in that section' });
  }
  data[page][section][id] = content;
  writeData(data);
  // Update the English HTML file
  updateHtmlFile('en');
  res.json({ message: 'English content added successfully', sectionData: data[page][section] });
  logger.info('English content added successfully');
});

// Update English content
app.put('/content/:page/:section/:id', (req, res) => {
  const { page, section, id } = req.params;
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Missing content to update' });
  }
  const data = readData();
  if (!data[page] || !data[page][section] || !data[page][section][id]) {
    return res.status(404).json({ error: 'English content not found' });
  }
  data[page][section][id] = content;
  writeData(data);
  // Update the English HTML file
  updateHtmlFile('en');
  res.json({ message: 'English content updated successfully' });
  logger.info('English content updated successfully');
});

// Remove English content (and corresponding German translation)
app.delete('/content/:page/:section/:id', (req, res) => {
  const { page, section, id } = req.params;
  const data = readData();
  if (!data[page] || !data[page][section] || !data[page][section][id]) {
    logger.error('English content not found');
    return res.status(404).json({ error: 'English content not found' });
  }
  delete data[page][section][id];
  if (Object.keys(data[page][section]).length === 0) {
    delete data[page][section];
  }
  if (Object.keys(data[page]).length === 0) {
    delete data[page];
  }
  writeData(data);
  // Also delete corresponding German translation
  const germanData = readGermanData();
  if (germanData[page] && germanData[page][section] && germanData[page][section][id]) {
    delete germanData[page][section][id];
    if (Object.keys(germanData[page][section]).length === 0) {
      delete germanData[page][section];
    }
    if (Object.keys(germanData[page]).length === 0) {
      delete germanData[page];
    }
    writeGermanData(germanData);
    // Update German HTML file as well
    updateHtmlFile('de');
  }
  // Update English HTML file
  updateHtmlFile('en');
  res.json({ message: 'Content removed successfully' });
  logger.info('English content removed successfully');
});

// Get English content for a given page
app.get('/content', (req, res) => {
  const page = req.query.page || 'main';
  const data = readData();
  res.json(data[page] || {});
  logger.info('English content fetched successfully');
});

// Get German content for a given page
app.get('/content_de', (req, res) => {
  const page = req.query.page || 'main';
  const data = readGermanData();
  res.json(data[page] || {});
  logger.info('German content fetched successfully');
});

// Translate English to German and update German JSON
app.post('/translate/:page/:section/:id', async (req, res) => {
  const { page, section, id } = req.params;
  const data = readData();
  if (!data[page] || !data[page][section] || !data[page][section][id]) {
    logger.error('English content not found');
    return res.status(404).json({ error: 'English content not found' });
  }
  const originalText = data[page][section][id];
  try {
    const result = await translator.translate(originalText, { from: 'en', to: 'de' });
    const germanData = readGermanData();
    if (!germanData[page]) {
      logger.info('New page created');
      germanData[page] = {};
    }
    if (!germanData[page][section]) {
      logger.info('New section created');
      germanData[page][section] = {};
    }
    germanData[page][section][id] = result.text;
    writeGermanData(germanData);
    // Update German HTML file
    updateHtmlFile('de');
    res.json({
      message: 'Content translated to German successfully',
      original: originalText,
      translated: result.text
    });
    logger.info('Content translated to German successfully');
  } catch (error) {
    logger.error('Translation error:', error.message);
    res.status(500).json({ error: 'Translation error', details: error.message });
  }
});

// Update German translation manually (or via auto-update on blur)
app.put('/translate/:page/:section/:id', (req, res) => {
  const { page, section, id } = req.params;
  const { content } = req.body; // updated German text
  if (!content) {
    logger.error('Missing German content to update');
    return res.status(400).json({ error: 'Missing German content to update' });
  }
  const germanData = readGermanData();
  if (!germanData[page]) {
    germanData[page] = {};
  }
  if (!germanData[page][section]) {
    germanData[page][section] = {};
  }
  germanData[page][section][id] = content;
  writeGermanData(germanData);
  // Update German HTML file
  updateHtmlFile('de');
  res.json({ message: 'German content updated successfully' });
  logger.info('German content updated successfully');
});




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('You can access the frontend at http://localhost:3000');
    // Watch the source HTML file for modifications and update German HTML accordingly.
    const sourceHtmlFilePath = path.join(__dirname, 'content', 'index.html');
    fs.watchFile(sourceHtmlFilePath, (curr, prev) => {
      logger.info(`Source HTML file ${sourceHtmlFilePath} has been modified.`);
      updateHtmlFile('de');
      updateHtmlFile('en');
    });
});
