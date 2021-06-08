import { program } from 'commander'
import { ethers, upgrades } from 'hardhat';

program
  .version('0.0.0')
  .requiredOption(
    '--totalTokens <type>',
    'Total tokens to be distributed',
  )
  .requiredOption(
    '--startTime <timestamp>',
    'timestamp to start the distribution',
  )
  .requiredOption(
    '--cliffPeriod <period>',
    'Cliff period in seconds from the beging',
  )
  .requiredOption(
    '--duration <seconds>',
    'Duration in seconds',
  )
  .requiredOption(
    '--initialPercentage <percentage>',
    'Initial unlocked percentage, two decimals precision: 13.33 == 1333',
  )
  .requiredOption(
    '--tokenAddress <address>',
    'Address of the token to be distributed',
  )
  .requiredOption(
    '--merkleRoot <bytes32>',
    'merkle root hexadecimal',
  )
program.parse(process.argv)

async function main() {
    /////////////////////////////////////////////////////////////////
    // Parameters
    /////////////////////////////////////////////////////////////////

    console.log("#######################");
    console.log("##### Parameters #####");
    console.log("#######################");
    console.log(program.opts())
    const totalTokens = program.opts().totalTokens;
    const startTime = program.opts().startTime;
    const cliffPeriod = program.opts().cliffPeriod;
    const duration = program.opts().duration;
    const initialPercentage = program.opts().initialPercentage;
    const tokenAddress = program.opts().tokenAddress;
    const merkleRoot =  program.opts().merkleRoot;

    console.log("#######################");
    console.log("##### Deployments #####");
    console.log("#######################");
    const TokenDistro = await ethers.getContractFactory("TokenDistro");
    const tokenDistro = await upgrades.deployProxy(TokenDistro,
        [
            totalTokens,
            startTime,
            cliffPeriod,
            duration,
            initialPercentage,
            tokenAddress
          ]);
    await tokenDistro.deployed();
    console.log("TokenDistro deployed to:", tokenDistro.address);

    const MerkleDistributorVested = await ethers.getContractFactory("MerkleDistributorVested");
    const merkleDistributorVested = await upgrades.deployProxy(MerkleDistributorVested, [tokenDistro.address, merkleRoot]);
    await merkleDistributorVested.deployed();
    console.log("MerkleDistributorVested deployed to:", merkleDistributorVested.address);

    // We grant permisions to the pools
    await tokenDistro.grantRole(tokenDistro.DISTRIBUTOR_ROLE(), merkleDistributorVested.address);

    // We assing the token distribution
    await tokenDistro.assign(merkleDistributorVested.address, totalTokens, { gasLimit: 100000 });

}

main();