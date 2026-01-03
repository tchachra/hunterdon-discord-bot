const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DISCORD_ROLE_ID = process.env.DISCORD_ROLE_ID; // optional
const DISCORD_API_SECRET = process.env.DISCORD_API_SECRET;

if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_API_SECRET) {
  console.error("Missing required environment variables!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`Discord bot logged in as ${client.user.tag}`);
});

client.login(DISCORD_BOT_TOKEN);

app.post("/approve", async (req, res) => {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${DISCORD_API_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { name, email, callsign } = req.body;

  try {
    const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
    const channel = guild.channels.cache.find(c => c.isTextBased());
    if (!channel) return res.status(500).json({ error: "No text channel available" });

    const invite = await channel.createInvite({
      maxUses: 1,
      unique: true,
      reason: `Approved applicant: ${name} (${callsign})`
    });

    res.json({ invite: invite.url });
  } catch (err) {
    console.error("Failed to create invite:", err);
    res.status(500).json({ error: "Bot failed to generate invite" });
  }
});

app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));

