# Ritmo App agents.md

Before making any changes, always consult the following files:

- `docs/architecture.md`: Architectural choices, layer and domain rules, etc.
- `docs/code_conventions.md`: Naming rules, formatting rules, etc.

These conventions are normative: any generated code must follow them without exception.

In addition, use the following MCPs:

- **Context7**: To look up up-to-date documentation, information about libraries, packages, services, configurations, etc.
- **Serena**: To navigate the project's codebase to locate symbols and inspect dependencies with more precision.
- **Github**: To obtain information and context about tasks.

# Setup and running

```bash
# install dependencies
npm install

# install iOS native deps (first clone / after updating native deps)
bundle install
bundle exec pod install

# start Metro bundler
npm start

# run on Android (with Metro running)
npm run android

# run on iOS (with Metro running)
npm run ios

# lint
npm run lint

# run tests
npm test
```