import os
import json
import threading
import asyncio
from flask import Flask, jsonify, send_from_directory
import discord

# === LOAD CONFIG ===
CONFIG_PATH = os.path.join(os.getcwd(), "config.json")

if not os.path.exists(CONFIG_PATH):
    raise FileNotFoundError("config.json not found in root folder.")

with open(CONFIG_PATH, "r") as f:
    cfg = json.load(f)

BOT_TOKEN = cfg.get("bot_token")
DISCORD_USER_ID = int(cfg.get("discord_user_id"))
FLASK_PORT = int(cfg.get("flask_port", 6430))

# === FLASK SETUP (all files served from root) ===
app = Flask(__name__, static_folder=None)

# === PRESENCE STORAGE ===
presence_data = {
    "status": "offline",
    "username": "Loading...",
    "avatar": "https://cdn.discordapp.com/embed/avatars/0.png"
}

# === DISCORD CLIENT ===
intents = discord.Intents.default()
intents.presences = True
intents.members = True

client = discord.Client(intents=intents)


@client.event
async def on_ready():
    print(f"[Discord] Logged in as {client.user} ✅")

    for guild in client.guilds:
        member = guild.get_member(DISCORD_USER_ID)
        if member:
            presence_data["username"] = member.name
            presence_data["avatar"] = member.avatar.url if member.avatar else presence_data["avatar"]
            presence_data["status"] = str(member.status)
            print(f"[Presence] Found {member.name}: {member.status}")
            break


@client.event
async def on_presence_update(before, after):
    if after.id == DISCORD_USER_ID:
        presence_data["status"] = str(after.status)
        print(f"[Presence] Updated: {after.name} is now {after.status}")


# === DISCORD BOT THREAD ===
def run_discord_bot():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    client.run(BOT_TOKEN)


# === FLASK ROUTES (all files in root) ===

@app.route("/api/discord")
def get_discord():
    return jsonify(presence_data)


@app.route("/")
def serve_home():
    return send_from_directory(os.getcwd(), "index.html")


@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(os.getcwd(), path)


# === ENTRYPOINT ===
if __name__ == "__main__":
    bot_thread = threading.Thread(target=run_discord_bot, daemon=True)
    bot_thread.start()

    print(f"[Flask] Running on port {FLASK_PORT}")
    app.run(host="0.0.0.0", port=FLASK_PORT)