// This file previously contained configureAgentsMd() and patchCommandFiles()
// which patched optimization markers into AGENTS.md and command files.
// Tool guidance (RTK, codegraph, basic-memory, caveman) now lives in the
// ob-generic-guardrails skill as self-adaptive rules, so marker patching
// is no longer needed. The file is kept as an empty module to avoid breaking
// imports that may still reference it during the transition.
