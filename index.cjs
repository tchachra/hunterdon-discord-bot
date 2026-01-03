// index.cjs
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Discord Bot
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DISCORD_ROLE_ID = process.env.DISCORD_ROLE_ID;
const DISCORD_API_SECRET = process.env.DISCORD_API_SECRET;

if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_ROLE_ID || !DISCORD_API_SECRET) {
  console.error("Missing required environment variables!");
  process.exit(1);
}

client.login(DISCORD_BOT_TOKEN);

// Simple /approve endpoint
app.post("/approve", async (req, res) => {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${DISCORD_API_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { name, email } = req.body;
  try {
    const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
    // Normally you would create an invite or add a role here
    const invite = await guild.invites.create(guild.channels.cache.first(), { maxUses: 1 });
    res.json({ invite: invite.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bot failed to generate invite" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));

