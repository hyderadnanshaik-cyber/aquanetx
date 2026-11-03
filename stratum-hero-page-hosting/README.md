# Stratum — hero page

A single-page real-estate hero site. Static HTML with inline CSS and one inline
script: no framework, no build step, no dependencies, no external requests at
runtime.

## Run

Serve the folder over HTTP, e.g.:

    npx http-server . -p 8080 -c-1
    # or
    python3 -m http.server 8080

Then open http://localhost:8080. Opening `index.html` from `file://` also works.

## Files

    index.html                     the page (inline <style> and one inline <script> IIFE)
    assets/
      fonts/inter-s-400.woff2      Inter Regular 400 subset
      fonts/inter-s-700.woff2      Inter Bold 700 subset
      fonts/chakra-s-700.woff2     Chakra Petch Bold 700 subset
      img/background.webp          hero still, 1586 x 992
      video/background.mp4         VISION scene
      video/expression.mp4         EXPRESSION scene
      video/craftsmanship.mp4      CRAFTSMANSHIP scene
      video/refinement.mp4         REFINEMENT scene
      video/balance.mp4            BALANCE scene
      video/origin.mp4             ORIGIN scene

The font subsets cover U+0020–U+007E plus U+2018/U+2019. The videos are
H.264 1920x1080 24 fps with no audio; the one-way clips are ping-ponged so
they loop without a jump.
