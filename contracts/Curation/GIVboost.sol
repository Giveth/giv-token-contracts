// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "./GIVdelegation.sol";

contract GIVboost is GIVdelegation {
    struct Preference {
      uint256 projectId;
      uint256 power;
    }

    mapping(address => Preference[10]) private _userPreferences;
    mapping(uint256 => uint256) private _projectPower;


    function initialize(uint256 _initialDate, uint256 _roundDuration, address _tokenManager, address _tokenDistribution, uint256 _duration) public initializer {
        __GIVdelegation_init(_initialDate, _roundDuration, _tokenManager, _tokenDistribution, _duration);
    }

    function validateProject(uint256 _projectId) external {
        
    }

    function boostProject(uint256 _power, uint256 _projectId) public {
        
    }

    function lockAndBoost(uint256 _amount, uint256 _rounds, uint256 _projectId) external {
        super.lock(_amount, _rounds);
        boostProject(calculatePower(_amount, _rounds), _projectId);
    }

    function unlock(address[] calldata _locks, uint256 _round) public override {
        Preference[10] storage _preferences = _userPreferences[msg.sender];
        for (uint256 i = 0; i < _preferences.length; i++) {
            
        }
        super.unlock(_locks, _round);
    }

    function boostingFor(uint256 _projectId) public view returns (uint256) {
        return 0;
    }
}