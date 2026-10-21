from PIL import Image
import io, hashlib
def sniff_mime(data:bytes):
    if data.startswith(b"\x89PNG\r\n\x1a\n"): return "image/png"
    if data.startswith(b"\xff\xd8\xff"): return "image/jpeg"
    if data[:4]==b"RIFF" and data[8:12]==b"WEBP": return "image/webp"
    return None
def validate_and_strip(data:bytes, max_bytes:int):
    if len(data)>max_bytes: raise ValueError("Image exceeds 10 MB limit")
    mime=sniff_mime(data)
    if not mime: raise ValueError("Unsupported image type. Use PNG, JPEG or WebP.")
    try:
        im=Image.open(io.BytesIO(data)); im.verify()
        im=Image.open(io.BytesIO(data))
        out=io.BytesIO(); fmt={"image/png":"PNG","image/jpeg":"JPEG","image/webp":"WEBP"}[mime]
        if fmt=="JPEG" and im.mode in ("RGBA","P"): im=im.convert("RGB")
        im.save(out, format=fmt)  # re-encode drops EXIF/metadata
        cleaned=out.getvalue()
    except Exception as e: raise ValueError(f"Invalid image: {e}")
    return mime, cleaned, hashlib.sha256(cleaned).hexdigest()
