import express from "express";
import { Client, GatewayIntentBits } from "discord.js";

const app = express();
app.use(express.json());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const {
  DISCORD_TOKEN,
  GUILD_ID,
  INVITE_CHANNEL_ID,
  ADMIN_CHANNEL_ID,
  API_SECRET
} = process.env;

client.once("ready", () => console.log(`🤖 Logged in as ${client.user.tag}`));
client.login(DISCORD_TOKEN);

app.post("/approve", async (req, res) => {
  if (req.headers.authorization !== `Bearer ${API_SECRET}`) {
    return res.status(401).send("Unauthorized");
  }

  const { name, callsign, email } = req.body;

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = await guild.channels.fetch(INVITE_CHANNEL_ID);

    const invite = await channel.createInvite({
      maxUses: 1,
      maxAge: 86400,
      unique: true
    });

    const adminChannel = await guild.channels.fetch(ADMIN_CHANNEL_ID);
    adminChannel.send(
      `✅ Approved\nName: ${name}\nCallsign: ${callsign}\nEmail: ${email}\nInvite: ${invite.url}`
    );

    res.json({ invite: invite.url });
  } catch (err) {
    console.error(err);
    res.status(500).send("Discord error");
  }
});

app.get("/", (_, res) => res.send("Bot running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Bot API listening on port ${PORT}`));

