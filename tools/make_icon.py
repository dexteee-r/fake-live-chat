"""Generate the Fake Chat app icon (a chat bubble) as a multi-size .ico + a PNG
preview. Pure Pillow, no external assets."""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # fake-chat/
ASSETS = os.path.join(HERE, "assets")
os.makedirs(ASSETS, exist_ok=True)

S = 256
PURPLE = (145, 71, 255, 255)   # Twitch purple
WHITE = (255, 255, 255, 255)

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# Rounded-square purple background.
d.rounded_rectangle([0, 0, S - 1, S - 1], radius=52, fill=PURPLE)

# White speech bubble + tail (drawn as one combined white shape).
d.rounded_rectangle([40, 56, 216, 160], radius=30, fill=WHITE)
d.polygon([(78, 152), (78, 202), (124, 158)], fill=WHITE)

# Three purple "chat lines" inside the bubble.
d.rounded_rectangle([64, 80, 192, 96], radius=8, fill=PURPLE)
d.rounded_rectangle([64, 106, 168, 122], radius=8, fill=PURPLE)
d.rounded_rectangle([64, 132, 184, 148], radius=8, fill=PURPLE)

ico_path = os.path.join(ASSETS, "fake-chat.ico")
png_path = os.path.join(ASSETS, "fake-chat-preview.png")
img.save(ico_path, sizes=[(16, 16), (24, 24), (32, 32), (48, 48),
                          (64, 64), (128, 128), (256, 256)])
img.save(png_path)
print("wrote", ico_path)
print("wrote", png_path)
