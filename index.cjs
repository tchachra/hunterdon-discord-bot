// ==================== index.cjs ====================
const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const bodyParser = require("body-parser");

process.on("unhandledRejection", err => console.error("Unhandled Rejection:", err));
process.on("uncaughtException", err => console.error("Uncaught Exception:", err));

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.DISCORD_API_SECRET;
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const ROLE_ID = process.env.ROLE_ID || null;

if (!DISCORD_TOKEN || !API_SECRET || !GUILD_ID) {
  console.error("Missing required environment variables!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once("ready", () => console.log(`Discord bot logged in as ${client.user.tag}`));

// Optional: assign role when member joins
client.on("guildMemberAdd", async member => {
  if (member.guild.id !== GUILD_ID) return;
  if (!ROLE_ID) return;
  try {
    await member.roles.add(ROLE_ID);
    console.log(`Assigned role to ${member.user.tag}`);
  } catch (err) {
    console.log(`Role assignment failed (safe to ignore):`, err.message);
  }
});

// Approve endpoint
app.post("/approve", async (req, res) => {
  try {
    if (req.headers.authorization !== `Bearer ${API_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = guild.channels.cache.find(
      c => c.isTextBased() && c.permissionsFor(guild.members.me).has("CreateInstantInvite")
    );
    if (!channel) return res.json({ invite: null });

    const invite = await channel.createInvite({
      maxUses: 1,
      unique: true,
      reason: `Approved applicant: ${req.body.name}`
    });

    console.log(`Generated invite for ${req.body.name}: ${invite.url}`);
    return res.json({ invite: invite.url });

  } catch (err) {
    console.error("Error in /approve:", err.message);
    return res.json({ invite: null });
  }
});

app.get("/approve", (req, res) => res.send("Approve endpoint live. Use POST JSON."));

app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
client.login(DISCORD_TOKEN);

