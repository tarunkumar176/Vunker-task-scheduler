from PIL import Image

img_path = r"H:\Vunker-task-scheduler\frontend\assets\images\favicon.png"
img = Image.open(img_path).convert("RGBA")

print(f"Original size: {img.size}")

# Let's see the top-left pixel
print(f"Top-left pixel: {img.getpixel((0,0))}")
print(f"Center pixel: {img.getpixel((img.size[0]//2, img.size[1]//2))}")

# Let's find the bounding box of the actual "V" shape (assuming it's blue)
# Blue means B > R and B > G
bbox_left = img.size[0]
bbox_right = 0
bbox_top = img.size[1]
bbox_bottom = 0

for x in range(img.size[0]):
    for y in range(img.size[1]):
        r, g, b, a = img.getpixel((x, y))
        if a > 100 and b > r + 20 and b > g + 20: # It's a blue pixel
            if x < bbox_left: bbox_left = x
            if x > bbox_right: bbox_right = x
            if y < bbox_top: bbox_top = y
            if y > bbox_bottom: bbox_bottom = y

print(f"V shape bounding box: Left={bbox_left}, Right={bbox_right}, Top={bbox_top}, Bottom={bbox_bottom}")

# Let's crop to this bounding box, with a small margin
margin = 10
crop_box = (
    max(0, bbox_left - margin),
    max(0, bbox_top - margin),
    min(img.size[0], bbox_right + margin),
    min(img.size[1], bbox_bottom + margin)
)

cropped = img.crop(crop_box)
out_path = r"H:\Vunker-task-scheduler\frontend\assets\images\logo_transparent.png"
cropped.save(out_path)
print(f"Saved cropped image to {out_path}")
