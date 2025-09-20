const express = require("express");
const { nanoid } = require("nanoid");
const { urlStore } = require("./store");
const { log } = require("./logger");

const router = express.Router();

// 1. Create Short URL
router.post("/shorturls", (req, res) => {
  const { url, validity, shortcode } = req.body;

  // Validate input
  if (!url || !/^https?:\/\/.+/i.test(url)) {
    return res.status(400).json({ error: "Invalid or missing URL" });
  }

  let code = shortcode || nanoid(6);
  if (!/^[a-zA-Z0-9]{3,20}$/.test(code)) {
    return res.status(400).json({ error: "Invalid shortcode format" });
  }
  if (urlStore.has(code)) {
    return res.status(409).json({ error: "Shortcode already in use" });
  }

  const now = new Date();
  const duration = (validity && Number.isInteger(validity)) ? validity : 30;
  const expiry = new Date(now.getTime() + duration * 60000);

  urlStore.set(code, {
    url,
    createdAt: now,
    expiry,
    clicks: []
  });

  const shortLink = `${req.protocol}://${req.get("host")}/${code}`;

  return res.status(201).json({
    shortLink,
    expiry: expiry.toISOString()
  });
});

// 2. Retrieve Short URL Statistics
router.get("/shorturls/:code", (req, res) => {
  const { code } = req.params;
  const record = urlStore.get(code);

  if (!record) {
    return res.status(404).json({ error: "Shortcode not found" });
  }

  return res.json({
    originalUrl: record.url,
    createdAt: record.createdAt.toISOString(),
    expiry: record.expiry.toISOString(),
    totalClicks: record.clicks.length,
    clicks: record.clicks
  });
});

// 3. Redirect Short URL
router.get("/:code", (req, res) => {
  const { code } = req.params;
  const record = urlStore.get(code);

  if (!record) {
    return res.status(404).json({ error: "Shortcode not found" });
  }

  if (new Date() > record.expiry) {
    return res.status(410).json({ error: "Link expired" });
  }

  // Record click data
  const click = {
    timestamp: new Date().toISOString(),
    referrer: req.get("referer") || "direct",
    location: req.ip // simple coarse location
  };
  record.clicks.push(click);

  log(`Shortcode ${code} clicked. Redirecting to ${record.url}`);

  return res.redirect(record.url);
});

module.exports = router;
