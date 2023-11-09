import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Vault", function () {
    let signer: Signer;
    let lpToken: Contract;
    let cvxToken: Contract;
    let crvToken: Contract;
    let vault: Contract;

    beforeEach(async function () {
        const lpTokenAddress = "0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2"; // Curve.fi cDAI/cUSDC (cDAI+cUSDC)
        const cvxTokenAddress = "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B";
        const crvTokenAddress = "0xD533a949740bb3306d119CC777fa900bA034cd52";
        const boosterAddress = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31";
        const claimZapAddress = "0x3f29cB4111CbdA8081642DA1f75B3c12DECf2516";

        const Vault = await ethers.getContractFactory("Vault");
        // address _cvx,
        // address _crv,
        // address _booster,
        // address _claimZap
        vault = await Vault.deploy(cvxTokenAddress, crvTokenAddress, boosterAddress, claimZapAddress);

        await vault.deployed();

        console.log(`Vault deployed to ${vault.address}`);

        await vault.addPool(100, lpTokenAddress, 0);

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x48CDB2914227fbc7F0259a5EA6De28e0b7f7B473"],
        });
        signer = await ethers.getSigner("0x48CDB2914227fbc7F0259a5EA6De28e0b7f7B473");

        console.log("Added the cDAI/cUSD pool: ", lpTokenAddress);
        lpToken = await ethers.getContractAt("MockERC20", lpTokenAddress);
        crvToken = await ethers.getContractAt("MockERC20", crvTokenAddress);
        cvxToken = await ethers.getContractAt("MockERC20", cvxTokenAddress);

        console.log("cDAI/cUSD LP BaseReward Pool: ", "0xf34DFF761145FF0B05e917811d488B441F33a968");
    });

    it('Should deposit and withdraw tokens', async () => {
        const pid = 0;
        const amount = ethers.utils.parseEther("10");
        const signerAddress = await signer.getAddress();

        // Approve tokens
        await lpToken.connect(signer).approve(vault.address, amount);
        console.log("Approved LP tokens for staking");
        // Deposit tokens & Stake
        await vault.connect(signer).deposit(pid, amount, false, true);
        console.log("Deposited into Vault and stake in the BaseRewardPool: ", ethers.utils.formatEther(amount));
        // Check if the tokens were deposited
        const userInfo = await vault.userInfo(pid, signerAddress);
        expect(userInfo.amount.toString()).to.be.equal(amount.toString());

        await vault.connect(signer).withdraw(pid, amount, true);
        console.log("Withdrawn from Vault: ", ethers.utils.formatEther(amount));
        // Check if the tokens were withdrawn
        const userInfoAfterWithdraw = await vault.userInfo(pid, signerAddress);
        expect(userInfoAfterWithdraw.amount).to.be.equal(0);
    }).timeout(300000);

    it('Should calculate rewards correctly', async () => {
        const pid = 0;
        const amount = ethers.utils.parseEther("10");
        const signerAddress = await signer.getAddress();

        // Approve tokens
        await lpToken.connect(signer).approve(vault.address, amount);
        console.log("Approved LP tokens for staking");
        // Deposit tokens && Stake
        await vault.connect(signer).deposit(pid, amount, false, true);
        console.log("Deposited into Vault and stake in the BaseRewardPool: ", ethers.utils.formatEther(amount));

        // Get calculated rewards
        const rewards = await vault.calculateRewardsEarned(signerAddress, pid);
        expect(rewards[0]).to.be.equal((0));
        expect(rewards[1]).to.be.equal((0));

        await time.increase(3600);
        // Update rewards
        await vault.connect(signer).getVaultRewards(pid);

        // Get updated rewards
        const updatedRewards = await vault.calculateRewardsEarned(signerAddress, pid);
        expect(updatedRewards[0]).to.be.not.equal(0);
        expect(updatedRewards[1]).to.be.not.equal(0);

        console.log("Confirmed rewards were genereated");
    });


    it('Should claim rewards correctly', async () => {
        const pid = 0;
        const amount = ethers.utils.parseEther("10");
        const signerAddress = await signer.getAddress();

        // Approve tokens
        await lpToken.connect(signer).approve(vault.address, amount);
        console.log("Approved LP tokens for staking");
        // Deposit tokens && Stake
        await vault.connect(signer).deposit(pid, amount, false, true);
        console.log("Deposited into Vault and stake in the BaseRewardPool: ", ethers.utils.formatEther(amount));

        // Get calculated rewards
        const rewards = await vault.calculateRewardsEarned(signerAddress, pid);
        expect(rewards[0]).to.be.equal((0));
        expect(rewards[1]).to.be.equal((0));

        // Increaes 1 month
        await time.increase(3600 * 24 * 30);
        await vault.connect(signer).getVaultRewards(pid);

        // Claim rewards
        await vault.connect(signer).claim(pid, signerAddress, true);
        const crvReward = await crvToken.balanceOf(signerAddress);
        const cvxReward = await cvxToken.balanceOf(signerAddress);

        console.log("CRV Token Reward: ", ethers.utils.formatEther(crvReward));
        console.log("CVX Token Reward: ", ethers.utils.formatEther(cvxReward));
    });
});
