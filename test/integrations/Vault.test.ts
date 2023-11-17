import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { time, mine } from "@nomicfoundation/hardhat-network-helpers";

describe("Vault", function () {
    let cvxToken: Contract;
    let crvToken: Contract;
    let wethToken: Contract;
    let vault: Contract;

    let signer: Signer;
    let alice: Signer, bob: Signer, cat: Signer;

    before("Deploy Vault and prepare accounts", async function () {
        const crvTokenAddress = "0xD533a949740bb3306d119CC777fa900bA034cd52";
        const cvxTokenAddress = "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B";
        const wETHTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        const boosterAddress = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31";
        const swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
        const curveSwapAddress = "0xA5407eAE9Ba41422680e2e00537571bcC53efBfD";
        const pid = 4;

        const Vault = await ethers.getContractFactory("Vault");
        vault = await Vault.deploy(crvTokenAddress, cvxTokenAddress, boosterAddress, swapRouterAddress, curveSwapAddress, pid);

        await vault.deployed();

        console.log(`Vault deployed to ${vault.address}`);

        crvToken = await ethers.getContractAt("MockERC20", crvTokenAddress);
        cvxToken = await ethers.getContractAt("MockERC20", cvxTokenAddress);
        wethToken = await ethers.getContractAt("MockERC20", wETHTokenAddress);

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

    it("[Deposit] Should revert if the deposit amount is zero", async () => {
        await expect(vault.connect(alice).deposit(0)).to.be.revertedWith('Vault: Invalid deposit amount');
    });

    it("[Deposit] Should revert if not enough allowance for deposit", async () => {
        const depositAmount = ethers.utils.parseEther("100");
        await expect(vault.connect(alice).deposit(depositAmount)).to.be.revertedWithoutReason();
    });

    it('[Deposit] Should Alice deposit 100', async () => {
        const balance = BigNumber.from(await wethToken.balanceOf(alice.getAddress()));
        console.log("Alice balance before deposit: ", balance);

        const depositAmount = ethers.utils.parseEther("100");
        console.log("Alice deposit amount: ", depositAmount);

        await wethToken.connect(alice).approve(vault.address, depositAmount);
        await vault.connect(alice).deposit(depositAmount);

        const balanceAfterDeposit = await wethToken.balanceOf(alice.getAddress());
        console.log("Alice balance after deposit: ", balanceAfterDeposit);

        expect(balanceAfterDeposit).to.be.eq(balance.sub(depositAmount));
    });

    // it("[Withdraw] Should revert if withdraw amount is zero", async () => {
    //     await expect(vault.connect(alice).withdraw(0)).to.be.revertedWith("Vault: Invalid withdraw amount");
    // });

    // it("[Withdraw] Should revert if trying to withdraw more than the deposited amount", async () => {
    //     await time.increase(24 * 3600); // 1 day

    //     const excessWithdrawAmount = ethers.utils.parseEther("10000");

    //     await expect(vault.connect(alice).withdraw(excessWithdrawAmount)).to.be.revertedWith('Vault: Invalid withdraw amount');
    // });

    // it("[Withdraw] Should Alice withdraw and reward calculated correctly", async function () {
    //     await time.increase(24 * 3600); // 1 day

    //     const balance = BigNumber.from(await lpToken.balanceOf(alice.getAddress()));
    //     // console.log("Alice balance before withdraw: ", balance);

    //     const crvBalanceBeforeWithdraw = await crvToken.balanceOf(alice.getAddress());
    //     const cvxBalanceBeforeWithdraw = await cvxToken.balanceOf(alice.getAddress());
    //     // console.log(`Alice (CRV, CVX) rewards before withdraw: (${ crvBalanceBeforeWithdraw }, ${ cvxBalanceBeforeWithdraw })`);

    //     const withdrawAmount = ethers.utils.parseEther("100");
    //     // console.log("Alice withdraw amount: ", withdrawAmount);

    //     const pendingRewards = await vault.getPendingRewards(alice.getAddress());
    //     // console.log("Alice pending rewards: ", pendingRewards);

    //     await vault.connect(alice).withdraw(withdrawAmount);

    //     const balanceAfterWithdraw = await lpToken.balanceOf(alice.getAddress());
    //     expect(balanceAfterWithdraw).to.be.eq(balance.add(withdrawAmount));

    //     const crvBalanceAfterWithdraw = await crvToken.balanceOf(alice.getAddress());
    //     const cvxBalanceAfterWithdraw = await cvxToken.balanceOf(alice.getAddress());
    //     // console.log(`Alice (CRV, CVX) rewards after withdraw: (${ crvBalanceAfterWithdraw }, ${ cvxBalanceAfterWithdraw })`);

    //     const crvRewardEarned = crvBalanceAfterWithdraw - crvBalanceBeforeWithdraw;
    //     const cvxRewardEarned = cvxBalanceAfterWithdraw - cvxBalanceBeforeWithdraw;
    //     // console.log(`Alice (CRV, CVX) rewards: (${ crvRewardEarned }, ${ cvxRewardEarned })`);

    //     // console.log(crvRewardEarned - pendingRewards.crvPending);
    //     // console.log(cvxRewardEarned - pendingRewards.cvxPending);

    //     const crvDifferencePercentage = Math.abs((crvRewardEarned - pendingRewards.crvPending) / pendingRewards.crvPending) * 100;
    //     expect(crvDifferencePercentage).to.be.closeTo(0, 1);

    //     const cvxDifferencePercentage = Math.abs((cvxRewardEarned - pendingRewards.cvxPending) / pendingRewards.cvxPending) * 100;
    //     expect(cvxDifferencePercentage).to.be.closeTo(0, 1);
    // });

    // it("[Withdraw] Should transfer CRV rewards if crvPending is greater than 0", async () => {
    //     const depositAmount = ethers.utils.parseEther("100");
    //     await lpToken.connect(cat).approve(vault.address, depositAmount);
    //     await vault.connect(cat).deposit(depositAmount);

    //     // Fast-forward time to accumulate some rewards
    //     await time.increase(24 * 3600);

    //     const crvBalanceBeforeWithdraw = await crvToken.balanceOf(cat.getAddress());

    //     // Withdraw and claim rewards
    //     await vault.connect(cat).withdraw(depositAmount);
    //     await vault.connect(cat).claim();

    //     const crvBalanceAfterWithdraw = await crvToken.balanceOf(cat.getAddress());

    //     // Ensure CRV balance increases after withdrawing and claiming
    //     expect(crvBalanceAfterWithdraw).to.be.gt(crvBalanceBeforeWithdraw);
    // });

    // it("[Claim] Should successfully claim rewards", async () => {
    //     const balance = BigNumber.from(await lpToken.balanceOf(bob.getAddress()));
    //     // console.log("Bob balance before withdraw: ", balance);

    //     const crvBalanceBeforeWithdraw = await crvToken.balanceOf(bob.getAddress());
    //     const cvxBalanceBeforeWithdraw = await cvxToken.balanceOf(bob.getAddress());
    //     // console.log(`Bob (CRV, CVX) rewards before withdraw: (${ crvBalanceBeforeWithdraw }, ${ cvxBalanceBeforeWithdraw })`);

    //     const pendingRewards = await vault.getPendingRewards(bob.getAddress());
    //     // console.log("Bob pending rewards: ", pendingRewards);

    //     await vault.connect(bob).claim();

    //     const crvBalanceAfterWithdraw = await crvToken.balanceOf(bob.getAddress());
    //     const cvxBalanceAfterWithdraw = await cvxToken.balanceOf(bob.getAddress());
    //     // console.log(`Bob (CRV, CVX) rewards after withdraw: (${ crvBalanceAfterWithdraw }, ${ cvxBalanceAfterWithdraw })`);

    //     const crvRewardEarned = crvBalanceAfterWithdraw - crvBalanceBeforeWithdraw;
    //     const cvxRewardEarned = cvxBalanceAfterWithdraw - cvxBalanceBeforeWithdraw;
    //     // console.log(`Bob (CRV, CVX) rewards: (${ crvRewardEarned }, ${ cvxRewardEarned })`);

    //     // console.log(crvRewardEarned - pendingRewards.crvPending);
    //     // console.log(cvxRewardEarned - pendingRewards.cvxPending);

    //     const crvDifferencePercentage = Math.abs((crvRewardEarned - pendingRewards.crvPending) / pendingRewards.crvPending) * 100;
    //     expect(crvDifferencePercentage).to.be.closeTo(0, 1);

    //     const cvxDifferencePercentage = Math.abs((cvxRewardEarned - pendingRewards.cvxPending) / pendingRewards.cvxPending) * 100;
    //     expect(cvxDifferencePercentage).to.be.closeTo(0, 1);
    // });
});
