# Run locally
```
yarn install
yarn dev:firefox
```

Nodemon will update content in `/dist_firefox` when changes occur to local files.
Next click load temporary add-on at [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox).
Select `/dist_firefox/manifest.json`.

You will see add-on with the dev banner custom icon.

# Publishing
```
yarn version
yarn build:firefox
yarn zip:firefox
yarn publish-extension --firefox-zip dist_zip/chord-transposer-firefox.zip --firefox-sources-zip dist_zip/chord-transposer-src.zip
```