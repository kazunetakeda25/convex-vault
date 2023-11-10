import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { time, mine } from "@nomicfoundation/hardhat-network-helpers";

describe("Vault", function () {
    let lpToken: Contract;
    let cvxToken: Contract;
    let crvToken: Contract;
    let vault: Contract;

    let signer: Signer;
    let alice: Signer, bob: Signer, cat: Signer;

    before("Deploy Vault and prepare accounts", async function () {
        const crvTokenAddress = "0xD533a949740bb3306d119CC777fa900bA034cd52";
        const cvxTokenAddress = "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B";
        const boosterAddress = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31";
        const lpTokenAddress = "0xC25a3A3b969415c80451098fa907EC722572917F"; // Curve.fi DAI/USDC/USDT/sUSD (crvPlain3andSUSD)
        const pid = 4;

        const Vault = await ethers.getContractFactory("Vault");
        vault = await Vault.deploy(crvTokenAddress, cvxTokenAddress, boosterAddress, lpTokenAddress, pid);

        await vault.deployed();

        console.log(`Vault deployed to ${vault.address}`);

        crvToken = await ethers.getContractAt("MockERC20", crvTokenAddress);
        cvxToken = await ethers.getContractAt("MockERC20", cvxTokenAddress);
        lpToken = await ethers.getContractAt("MockERC20", lpTokenAddress);

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x9E51BE7071F086d3A1fD5Dc0016177473619b237"],
        });
        signer = await ethers.getSigner("0x9E51BE7071F086d3A1fD5Dc0016177473619b237");

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x593BB01936918C0Fa656EbAa03a961a1Dd132bbC"],
        });
        alice = await ethers.getSigner("0x593BB01936918C0Fa656EbAa03a961a1Dd132bbC");

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x9793fE3ce47d7f0939353E4e731d57b9C0BB623a"],
        });
        bob = await ethers.getSigner("0x9793fE3ce47d7f0939353E4e731d57b9C0BB623a");

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xD2e10CfC63d1e48850849B4EE6977Ca359cAa7ce"],
        });
        cat = await ethers.getSigner("0xD2e10CfC63d1e48850849B4EE6977Ca359cAa7ce");
    });

    it('[Deposit] Should Alice deposit 100', async () => {
        const balance = BigNumber.from(await lpToken.balanceOf(alice.getAddress()));
        console.log("Alice balance before deposit: ", balance);

        const depositAmount = ethers.utils.parseEther("100");
        console.log("Alice deposit amount: ", depositAmount);

        await lpToken.connect(alice).approve(vault.address, depositAmount);
        await vault.connect(alice).deposit(depositAmount);

        const balanceAfterDeposit = await lpToken.balanceOf(alice.getAddress());
        console.log("Alice balance after deposit: ", balanceAfterDeposit);

        expect(balanceAfterDeposit).to.be.eq(balance.sub(depositAmount));
    });

    // it('[Deposit] Should Bob deposit 200', async () => {
    //     const balance = BigNumber.from(await lpToken.balanceOf(bob.getAddress()));
    //     console.log("Bob balance before deposit: ", balance);

    //     const depositAmount = ethers.utils.parseEther("200");
    //     console.log("Bob deposit amount: ", depositAmount);

    //     await lpToken.connect(bob).approve(vault.address, depositAmount);
    //     await vault.connect(bob).deposit(depositAmount);

    //     const balanceAfterDeposit = await lpToken.balanceOf(bob.getAddress());
    //     console.log("Bob balance after deposit: ", balanceAfterDeposit);

    //     expect(balanceAfterDeposit).to.be.eq(balance.sub(depositAmount));
    // });

    // it('[Deposit] Should Cat deposit 300', async () => {
    //     const balance = BigNumber.from(await lpToken.balanceOf(cat.getAddress()));
    //     console.log("Cat balance before deposit: ", balance);

    //     const depositAmount = ethers.utils.parseEther("300");
    //     console.log("Cat deposit amount: ", depositAmount);

    //     await lpToken.connect(cat).approve(vault.address, depositAmount);
    //     await vault.connect(cat).deposit(depositAmount);

    //     const balanceAfterDeposit = await lpToken.balanceOf(cat.getAddress());
    //     console.log("Cat balance after deposit: ", balanceAfterDeposit);

    //     expect(balanceAfterDeposit).to.be.eq(balance.sub(depositAmount));
    // });

    it("[Withdraw] Should Alice withdraw and reward calculated correctly", async function () {
        const x = await vault.getPendingRewards(alice.getAddress());
        console.log("Alice pending rewards: ", x);

        await time.increase(24 * 3600);

        const balance = BigNumber.from(await lpToken.balanceOf(alice.getAddress()));
        console.log("Alice balance before withdraw: ", balance);

        const withdrawAmount = ethers.utils.parseEther("100");
        console.log("Alice withdraw amount: ", withdrawAmount);

        const pendingRewards = await vault.getPendingRewards(alice.getAddress());
        console.log("Alice pending rewards: ", pendingRewards);

        await vault.connect(alice).withdraw(withdrawAmount);

        const balanceAfterWithdraw = await lpToken.balanceOf(alice.getAddress());
        expect(balanceAfterWithdraw).to.be.eq(balance.add(withdrawAmount));

        const crvBalance = await crvToken.balanceOf(alice.getAddress());
        const cvxBalance = await cvxToken.balanceOf(alice.getAddress());
        console.log(`Alice (CRV, CVX) rewards: (${ crvBalance }, ${ cvxBalance })`);
    });

    // it("[Withdraw] Should Bob withdraw and reward calculated correctly", async function () {
    //     // await mine(7151.00 * 1);
    //     // await time.increase(24 * 3600);

    //     const balance = BigNumber.from(await lpToken.balanceOf(bob.getAddress()));
    //     console.log("Bob balance before withdraw: ", balance);

    //     const withdrawAmount = ethers.utils.parseEther("200");
    //     console.log("Bob withdraw amount: ", withdrawAmount);

    //     const pendingRewards = await vault.getPendingRewards(bob.getAddress());
    //     console.log("Bob pending rewards: ", pendingRewards);

    //     await vault.connect(bob).withdraw(withdrawAmount);

    //     const balanceAfterWithdraw = await lpToken.balanceOf(bob.getAddress());
    //     expect(balanceAfterWithdraw).to.be.eq(balance.add(withdrawAmount));

    //     const crvBalance = await crvToken.balanceOf(bob.getAddress());
    //     const cvxBalance = await cvxToken.balanceOf(bob.getAddress());
    //     console.log(`Bob (CRV, CVX) rewards: (${ crvBalance }, ${ cvxBalance })`);
    // });

    // it("[Withdraw] Should Cat withdraw and reward calculated correctly", async function () {
    //     // await mine(7151.00 * 1);
    //     // await time.increase(24 * 3600);

    //     const balance = BigNumber.from(await lpToken.balanceOf(cat.getAddress()));
    //     console.log("Cat balance before withdraw: ", balance);

    //     const withdrawAmount = ethers.utils.parseEther("300");
    //     console.log("Cat withdraw amount: ", withdrawAmount);

    //     const pendingRewards = await vault.getPendingRewards(cat.getAddress());
    //     console.log("Cat pending rewards: ", pendingRewards);

    //     await vault.connect(cat).withdraw(withdrawAmount);

    //     const balanceAfterWithdraw = await lpToken.balanceOf(cat.getAddress());
    //     expect(balanceAfterWithdraw).to.be.eq(balance.add(withdrawAmount));

    //     const crvBalance = await crvToken.balanceOf(cat.getAddress());
    //     const cvxBalance = await cvxToken.balanceOf(cat.getAddress());
    //     console.log(`Cat (CRV, CVX) rewards: (${ crvBalance }, ${ cvxBalance })`);
    // });

    // it('Should calculate rewards correctly', async () => {
    //     const pid = 0;
    //     const amount = ethers.utils.parseEther("10");
    //     const signerAddress = await signer.getAddress();

    //     // Approve tokens
    //     await lpToken.connect(signer).approve(vault.address, amount);
    //     console.log("Approved LP tokens for staking");
    //     // Deposit tokens && Stake
    //     await vault.connect(signer).deposit(pid, amount, false, true);
    //     console.log("Deposited into Vault and stake in the BaseRewardPool: ", ethers.utils.formatEther(amount));

    //     // Get calculated rewards
    //     const rewards = await vault.calculateRewardsEarned(signerAddress, pid);
    //     expect(rewards[0]).to.be.equal((0));
    //     expect(rewards[1]).to.be.equal((0));

    //     await time.increase(3600);
    //     // Update rewards
    //     await vault.connect(signer).getVaultRewards(pid);

    //     // Get updated rewards
    //     const updatedRewards = await vault.calculateRewardsEarned(signerAddress, pid);
    //     expect(updatedRewards[0]).to.be.not.equal(0);
    //     expect(updatedRewards[1]).to.be.not.equal(0);

    //     console.log("Confirmed rewards were genereated");
    // });


    // it('Should claim rewards correctly', async () => {
    //     const pid = 0;
    //     const amount = ethers.utils.parseEther("10");
    //     const signerAddress = await signer.getAddress();

    //     // Approve tokens
    //     await lpToken.connect(signer).approve(vault.address, amount);
    //     console.log("Approved LP tokens for staking");
    //     // Deposit tokens && Stake
    //     await vault.connect(signer).deposit(pid, amount, false, true);
    //     console.log("Deposited into Vault and stake in the BaseRewardPool: ", ethers.utils.formatEther(amount));

    //     // Get calculated rewards
    //     const rewards = await vault.calculateRewardsEarned(signerAddress, pid);
    //     expect(rewards[0]).to.be.equal((0));
    //     expect(rewards[1]).to.be.equal((0));

    //     // Increaes 1 month
    //     await time.increase(3600 * 24 * 30);
    //     await vault.connect(signer).getVaultRewards(pid);

    //     // Claim rewards
    //     await vault.connect(signer).claim(pid, signerAddress, true);
    //     const crvReward = await crvToken.balanceOf(signerAddress);
    //     const cvxReward = await cvxToken.balanceOf(signerAddress);

    //     console.log("CRV Token Reward: ", ethers.utils.formatEther(crvReward));
    //     console.log("CVX Token Reward: ", ethers.utils.formatEther(cvxReward));
    // });
});
