## ✍️ Describe your changes

Explain what changed and why.

## 🔗 Related issue

Link the related issue, if one exists.

## 🧪 How to test

List the commands and manual scenarios used to verify the change.

## 📦 Data and release impact

- Database/importer impact: none / describe
- IPC contract impact: none / describe
- Packaged artifact impact: none / describe
- Documentation impact: none / describe

## ✅ Checklist

- [ ] I performed a self-review and kept the change focused.
- [ ] I added or updated tests for changed behavior.
- [ ] `yarn format:check`, `yarn lint`, and `yarn test` pass.
- [ ] The production build passes for affected projects.
- [ ] Importer changes were verified with `yarn db:build` and `yarn db:validate`.
- [ ] Renderer changes are keyboard accessible and responsive.
- [ ] Electron changes preserve sandboxing, context isolation, and narrow typed IPC.
- [ ] I updated relevant documentation.
