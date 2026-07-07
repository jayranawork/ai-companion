function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

export function classifyCommandText(commandText) {
  const normalized = commandText.trim().replace(/\s+/g, " ").toLowerCase();

  if (!normalized) {
    return {
      category: "unknown",
      isLongRunningCandidate: false,
      label: "unknown command",
    };
  }

  const buildPatterns = [
    /\b(build|compile|bundle|transpile)\b/,
    /\b(tsc|vite build|webpack|rollup|esbuild|cargo build|go build|mvn package|gradle build)\b/,
    /\b(npm run build|pnpm build|yarn build)\b/,
  ];
  const testPatterns = [
    /\b(test|jest|vitest|mocha|ava|pytest|cargo test|go test|npm test|pnpm test|yarn test)\b/,
  ];
  const gitPatterns = [
    /\b(git|gh)\b.*\b(commit|push|pull|merge|rebase|checkout|branch|status|diff)\b/,
    /\b(commit|push|pull|merge|rebase|checkout|branch|status|diff)\b/,
  ];
  const debugPatterns = [
    /\b(debug|inspect|breakpoint|node --inspect|pdb|gdb)\b/,
  ];
  const installPatterns = [
    /\b(install|add)\b/,
    /\b(npm i|npm install|pnpm i|pnpm install|yarn add|yarn install|pip install|poetry install|cargo install)\b/,
  ];
  const runPatterns = [
    /\b(run|start|serve|watch|dev|preview)\b/,
    /\b(npm run dev|npm run start|pnpm dev|pnpm start|yarn dev|yarn start|vite|electron)\b/,
  ];

  if (hasAny(normalized, gitPatterns)) {
    return {
      category: "git",
      isLongRunningCandidate: false,
      label: "git command",
    };
  }

  if (hasAny(normalized, buildPatterns)) {
    return {
      category: "build",
      isLongRunningCandidate: true,
      label: "build command",
    };
  }

  if (hasAny(normalized, testPatterns)) {
    return {
      category: "test",
      isLongRunningCandidate: true,
      label: "test command",
    };
  }

  if (hasAny(normalized, debugPatterns)) {
    return {
      category: "debug",
      isLongRunningCandidate: false,
      label: "debug command",
    };
  }

  if (hasAny(normalized, installPatterns)) {
    return {
      category: "install",
      isLongRunningCandidate: true,
      label: "install command",
    };
  }

  if (hasAny(normalized, runPatterns)) {
    const isWatch = /\bwatch\b/.test(normalized);
    const isServe = /\b(dev|serve|preview)\b/.test(normalized);
    return {
      category: isWatch ? "watch" : isServe ? "serve" : "run",
      isLongRunningCandidate: true,
      label: isWatch ? "watch command" : isServe ? "serve command" : "run command",
    };
  }

  return {
    category: "unknown",
    isLongRunningCandidate: false,
    label: "terminal command",
  };
}
