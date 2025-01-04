module.exports = {
  '*.{js,jsx,ts,tsx}': ['yarn prettier --write', 'yarn eslint --cache --fix'],
  '*.{yaml,yml}': ['yarn prettier --write'],
  '*.sh': ['yarn shellcheck'],
  '*.json': ['yarn prettier --write'],
  '*.md': ['yarn prettier --write'],
}
