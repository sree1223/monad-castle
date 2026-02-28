# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:import-analysis] Failed to resolve import \"@privy-io/react-auth\" from \"src/context/PrivyWrapper.jsx\". Does the file exist?"
  - generic [ref=e5]: D:/A_Projects/moncastle/frontend/src/context/PrivyWrapper.jsx:41:30
  - generic [ref=e6]: "45 | import( 46 | /* @vite-ignore */ 47 | \"@privy-io/react-auth\" | ^ 48 | ).then((m) => { 49 | setProvider(() => m.PrivyProvider);"
  - generic [ref=e7]: at TransformPluginContext._formatLog (file:///D:/A_Projects/moncastle/frontend/node_modules/vite/dist/node/chunks/node.js:30096:39) at TransformPluginContext.error (file:///D:/A_Projects/moncastle/frontend/node_modules/vite/dist/node/chunks/node.js:30093:14) at normalizeUrl (file:///D:/A_Projects/moncastle/frontend/node_modules/vite/dist/node/chunks/node.js:27894:18) at async file:///D:/A_Projects/moncastle/frontend/node_modules/vite/dist/node/chunks/node.js:27957:30 at async Promise.all (index 3) at async TransformPluginContext.transform (file:///D:/A_Projects/moncastle/frontend/node_modules/vite/dist/node/chunks/node.js:27925:4) at async EnvironmentPluginContainer.transform (file:///D:/A_Projects/moncastle/frontend/node_modules/vite/dist/node/chunks/node.js:29885:14) at async loadAndTransform (file:///D:/A_Projects/moncastle/frontend/node_modules/vite/dist/node/chunks/node.js:24534:26)
  - generic [ref=e8]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e9]: server.hmr.overlay
    - text: to
    - code [ref=e10]: "false"
    - text: in
    - code [ref=e11]: vite.config.js
    - text: .
```