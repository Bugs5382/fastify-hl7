module.exports = {
  extends: '@the-rabbit-hole/semantic-release-config',
  branches: [
    'main',
    { name: 'develop', prerelease: 'beta' },
    { name: 'release', prerelease: 'rc' }
  ]
}
