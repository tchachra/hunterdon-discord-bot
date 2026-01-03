const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.DISCORD_API_SECRET;
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const ROLE_ID = process.env.ROLE_ID;

if (!DISCORD_TOKEN || !API_SECRET || !GUILD_ID || !ROLE_ID) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once("ready", () => {
  console.log(`Discord bot logged in as ${client.user.tag}`);
});

// Auto-assign role
client.on("guildMemberAdd", async member => {
  if (member.guild.id !== GUILD_ID) return;
  try {
    await member.roles.add(ROLE_ID);
    console.log(`Assigned role to ${member.user.tag}`);
  } catch (err) {
    console.log(`Role assignment failed: ${err.message}`);
  }
});

// Approve endpoint
app.post("/approve", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${API_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = guild.channels.cache.find(
      c => c.isTextBased() && c.permissionsFor(guild.members.me).has("CreateInstantInvite")
    );
    if (!channel) return res.json({ invite: null });

    const invite = await channel.createInvite({ maxUses: 1, unique: true, reason: `Approved applicant` });
    return res.json({ invite: invite.url });
  } catch (err) {
    console.error("Error generating invite:", err.message);
    return res.json({ invite: null });
  }
});

app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
client.login(DISCORD_TOKEN);

