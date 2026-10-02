import sys, time
from playwright.sync_api import sync_playwright

url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
out = sys.argv[2] if len(sys.argv) > 2 else "/tmp/amg.png"

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"])
    pg = b.new_page(viewport={"width": 900, "height": 900}, device_scale_factor=2)
    errs = []
    pg.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type in ("error", "warning") else None)
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    pg.goto(url, wait_until="load")
    pg.wait_for_timeout(2500)
    # ocultar UI para ver la mascota limpia
    pg.evaluate("""() => { for (const id of ['hud','panel','bubble','log','controls','toolbar']) { const e=document.getElementById(id); if(e) e.style.display='none'; } document.querySelectorAll('button,.hud,.panel,.bubble').forEach(e=>e.style.display='none'); }""")
    pg.wait_for_timeout(400)
    pg.screenshot(path=out, full_page=False)
    print("SHOT", out, "errors:", len(errs))
    for e in errs[:10]:
        print("  ", e)
    b.close()
