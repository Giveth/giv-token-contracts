# Upgrades

This directory contrains **upgrade test** mock contracts.

The contracts placed here **must** follow a pattern (in order to be properly picked up by the upgrade test harness):

- Test contract names **must** match an existing upgradeable contract **exactly**
- Test contract names **must** end in `V2`
  - eg. `Foo` -> `FooV2`
- Test contracts **must** imlement a `checkUpgrade()` function that **must** return at least a confitrmation string (default expected value being `"OK"`)
- Test contractss **should** reference all state in the contract, in the order is declared in the contract (including base contracts)

If properly implemented, the test harness will be able to check if the upgraded contract retains state integrity after the upgrade.